// Tuning: how far this browser's sound lags what the room reads of its video, measured with the
// microphone, kept, and handed to every room as its output delay.
//
// Something plays the probe and says when its readings put it playing, in epoch ms
// (performance.timeOrigin + performance.now(), the same in every document): the backend, in a
// <video> here (`tune`), or an extension through its bridge to a tab (`measure` with its own
// `play`). This records the microphone meanwhile and stamps every block of samples with when it
// reached the microphone, on that clock. The backend hears the probe and measures.
//
// Stamping: an AudioWorklet sees each block at a context time, which getOutputTimestamp() maps to
// performance time. The capture path's own delay isn't reported truly (Chrome, 2026-09-19: 2.7 ms
// said, 38 ms more measured), so it is measured: the probe of our own through Web Audio at a
// context time whose output the browser knows, heard through the same path, and its delay taken off.
//
// The reference must leave by a *different* device from the one being listened on: a built-in
// output, whose reported latency can be trusted (PLANS/TUNING.md:40). Out through the same device,
// it absorbs exactly the error we are here to measure — a Bluetooth headset's unreported 100-250 ms
// would cancel itself out and the tune would report the sound on time. That is what this used to
// do, and it is why tuning never worked on headphones.

import { t } from "./copy.js";
import { backend } from "./backend.js";
import { chooseTune, currentInput, currentOutput, outputNow, referenceDevice } from "./tune-device.js";

export { outputNow };
import { meterLevel, micVerdict } from "./tune-level.js";
import { canStamp, stamp } from "./stamped.js";

const KEY = "together.tune";
/** Every tune kept, by the name of the output it was measured on: `{ [label]: result }`. */
const KEY_BY_DEVICE = "together.tunes";
// The reference round is 8.4 s of every tune and measures one number, the microphone path's own
// delay, so keeping it per input device is the obvious way to make tuning quick. It is wrong, and
// measured to be wrong: the capture path belongs to the AudioContext, not to the device. Three
// tunes in one browser session, each measuring it afresh, gave 95.50, 64.21 and 62.46 ms -- a
// 32 ms step after the first context -- and gave the same answer every time, 0.691, 0.686 and
// 0.688 ms. Remembering the first run's 98.55 ms instead put the next two out by 33.8 and 34.6 ms.
//
// So this stays measured every time. The 8.4 s is load-bearing, and time has to come from
// somewhere else.
//
// Each round is one probe, a 0.7 s rising sweep (together-core `tune::probe`), where to 0.9.0 it
// was a train of 14 and 20 identical 40 ms marks: what measures an output's delay elsewhere is one sweep
// (RESEARCH/wiki/syntheses/acoustic-delay-measurement.md), and a sweep that is never repeated
// can't be taken for its neighbour. It checks itself instead, its low and high halves heard apart.
/** Where the probe starts in its track, seconds (`PROBE_LEAD` in crates/web/src/tune.rs). */
const LEAD = 2.5;
/** How long the probe is, and how late after it we keep listening, seconds. */
const PROBE = 0.7;
const TAIL = 0.8;
/** At most this many rounds of the reference, until one is heard. */
const REF_ROUNDS = 3;
/** How long one round of the reference takes, from starting it to having measured it. */
const REF_MS = (0.3 + 0.5 + PROBE + TAIL) * 1000;
/** How long the microphone is watched before anything is played, to see that it is alive. */
const PREFLIGHT_MS = 1200;

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
}

/** What was measured last, if anything: { delayMs, spreadMs, when, referenceOn, on, … }. */
export function tuned() {
  return read(KEY, null);
}

/** Every tune kept, by the name of the output it was measured on. */
export function tunedByDevice() {
  return read(KEY_BY_DEVICE, {});
}

export function forget() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(KEY_BY_DEVICE);
}

/**
 * The tune a room should use now: the one measured on the output the sound is going out of.
 *
 * Every speaker and headset is late by its own amount, so a tune belongs to a device and not to a
 * browser. Where the device is known and has never been tuned, that is 0 and not somebody else's
 * number — using the speakers' tune on a Bluetooth headset is worse than using none. Where the
 * device can't be known at all, the last tune is still the best guess there is, and saying which
 * of the two happened is left to `matched`.
 */
export async function tuneNow() {
  return chooseTune(await outputNow(), tunedByDevice(), tuned());
}

/** The output delay a room should use, ms: what `tuneNow` found, or none. */
export async function outputDelayMs() {
  return (await tuneNow()).tune?.delayMs ?? 0;
}


/**
 * Tune this page's own <video>. Call from a click: `video` is played with sound, and the
 * microphone is asked for. `onStep(text)` hears what's happening, and `onProgress(state)` hears it
 * about twelve times a second while it runs (see `measure`). Resolves to the measurement, kept;
 * rejects with an Error whose message is for the user.
 */
export async function tune(video, onStep = () => {}, onProgress = () => {}) {
  await backend.ready;
  // Allowed to play sound only from the click: start it now, on the track itself.
  const url = URL.createObjectURL(new Blob([backend.tuneProbeTrack()], { type: "audio/wav" }));
  video.src = url;
  video.muted = false;
  const primed = video.play().then(() => video.pause());
  try {
    const result = await measure({
      ready: primed.catch(() => {
        throw new Error(t("tune-play-denied"));
      }),
      play: () => backend.tuneProbePlay(video, url, LEAD),
      onStep,
      onProgress,
    });
    localStorage.setItem(KEY, JSON.stringify(result));
    // Kept under the output it was measured on as well, so plugging headphones in doesn't hand
    // them the speakers' number. By name: the ids rotate between sessions (tune-device.js).
    if (result.on) {
      localStorage.setItem(KEY_BY_DEVICE, JSON.stringify({ ...tunedByDevice(), [result.on]: result }));
    }
    return result;
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

/**
 * Record while `play()` plays the tuning probe (a second in) and resolves to when its readings put
 * it playing (epoch ms, a one-element array), and measure. `ready` is awaited once the
 * microphone is granted. Resolves to { delayMs, spreadMs, when, … }; rejects with an Error
 * whose message is for the user. Keeps nothing: the caller decides where the result lives.
 *
 * `onStep(text)` is called once per phase. `onProgress({ phase, label, fraction, level, hot })` is
 * called about twelve times a second throughout, so a page can show that something is happening
 * rather than thirty silent seconds: `phase` is "microphone", "reference" or "video", `fraction`
 * is how far through that phase we are (0 to 1, and it sticks at 1 if a phase runs long rather
 * than pretending to know better), `level` is the microphone's loudest sample since the last call
 * on a decibel scale, and `hot` says the input was clipping when it was checked.
 */
export async function measure({ play, ready = Promise.resolve(), onStep = () => {}, onProgress = () => {} }) {
  await backend.ready;
  onStep(t("tune-asking-microphone"));
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
  } catch {
    throw new Error(t("tune-microphone-denied"));
  }
  try {
    await ready;
  } catch (error) {
    stream.getTracks().forEach((t) => t.stop());
    throw error;
  }
  const ctx = new AudioContext();
  // Out here, not in the `try`: the `finally` has to be able to stop it, and a `const` inside the
  // try block is not in scope there.
  let beat;
  // The microphone again, as Chrome stamps it (stamped.js): a tune also learns how far this
  // microphone's stamps are from the truth, which is what lets the film tune every later output
  // with nothing played at all (`micErrorMs` below, and extension/listen.js).
  const stamped = canStamp() ? stamp(stream.getAudioTracks()[0].clone()) : null;
  try {
    await ctx.audioWorklet.addModule(new URL("tune-worklet.js", import.meta.url));
    const node = new AudioWorkletNode(ctx, "together-recorder");
    const source = ctx.createMediaStreamSource(stream);
    source.connect(node);
    // A silent path to the destination keeps the graph running in every engine.
    const mute = ctx.createGain();
    mute.gain.value = 0;
    node.connect(mute).connect(ctx.destination);

    // Context time → performance time at the output, sampled throughout (the two clocks drift).
    const pairs = [];
    const sample = () => {
      const s = ctx.getOutputTimestamp?.();
      if (s && s.contextTime > 0) pairs.push([s.contextTime, performance.timeOrigin + s.performanceTime]);
    };
    const sampler = setInterval(sample, 50);
    const blocks = [];
    // The loudest sample since the meter last looked, reset on reading so a single loud block
    // can't hold the bar up: the point of the meter is that it moves.
    let peak = 0;
    // When set, every block's peak is also collected here, exactly one entry per block — the
    // pre-flight reads this rather than the meter's `peak`, which the meter keeps resetting.
    let collect = null;
    node.port.onmessage = (e) => {
      blocks.push(e.data);
      if (e.data.peak > peak) peak = e.data.peak;
      collect?.push(e.data.peak);
    };
    const takePeak = () => {
      const p = peak;
      peak = 0;
      return p;
    };
    await ctx.resume();

    // Send the reference out of a device whose reported latency can be trusted. Device ids exist
    // only once the microphone has been granted, which is why this is here rather than earlier.
    // `setSinkId`, never the constructor: awaiting it is the only way to be told the device has
    // gone, and a context pinned to a device that is not there is silent while `sinkId` still
    // reads as the default (RESEARCH/raw/measured/browser-output-device-2026-09-20.md). Where
    // there is no such device, or no `setSinkId` at all (Firefox, Safari), the reference stays on
    // the default and `referenceOn` is null: the number is then only as good as that device.
    let referenceOn = null;
    let on = null;
    let capturedOn = null;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      capturedOn = currentInput(devices.filter((d) => d.kind === "audioinput"));
      const outputs = devices.filter((d) => d.kind === "audiooutput");
      // Which output the video's own sound is going out of: the one this tune belongs to.
      on = currentOutput(outputs);
      const id = typeof ctx.setSinkId === "function" ? referenceDevice(outputs) : null;
      if (id !== null) {
        await ctx.setSinkId(id);
        referenceOn = outputs.find((d) => d.deviceId === id)?.label ?? null;
      }
    } catch (error) {
      console.debug("tune reference device", error);
    }

    // Say what is happening, and keep saying it: a page with no sign of life is the whole complaint.
    let phase = null;
    let hot = false;
    const enter = (name, label, ms) => {
      phase = { name, label, start: performance.now(), ms };
      onStep(label);
    };
    beat = setInterval(() => {
      if (!phase) return;
      const through = (performance.now() - phase.start) / phase.ms;
      onProgress({ phase: phase.name, label: phase.label, fraction: Math.min(1, Math.max(0, through)), level: meterLevel(takePeak()), hot });
    }, 80);

    // The recording so far, the probe heard in it where `expected` (epoch ms) says it played. One line through the pairs
    // from context time `from` on: the two clocks only drift, and a single pair is coarse
    // (Firefox's jitter by milliseconds, 2026-09-19), which a line averages away. Only those from
    // `from`: Safari's pairs are off while its output settles (Safari 26.5, 2026-09-19: a line
    // through them all ran 0.13% steep, 26 ms over the video's run).
    const measureNow = (expected, from) => {
      sample();
      const fit = pairs.filter(([c]) => c >= from);
      if (fit.length < 2 || blocks.length === 0) throw new Error(t("tune-no-samples"));
      const n = fit.length;
      const mc = fit.reduce((a, [c]) => a + c, 0) / n;
      const mp = fit.reduce((a, [, p]) => a + p, 0) / n;
      const cov = fit.reduce((a, [c, p]) => a + (c - mc) * (p - mp), 0);
      const varc = fit.reduce((a, [c]) => a + (c - mc) ** 2, 0);
      const slope = varc > 0 ? cov / varc : 1000;
      const toPerformance = (t) => mp + (t - mc) * slope;
      const total = blocks.reduce((n, b) => n + b.samples.length, 0);
      const samples = new Float32Array(total);
      const anchorIndex = new Uint32Array(blocks.length);
      const anchorMs = new Float64Array(blocks.length);
      let at = 0;
      blocks.forEach((b, k) => {
        samples.set(b.samples, at);
        anchorIndex[k] = at;
        anchorMs[k] = toPerformance(b.t0);
        at += b.samples.length;
      });
      const when = typeof expected === "function" ? expected(toPerformance) : expected;
      return backend.tuneHear(samples, ctx.sampleRate, anchorIndex, anchorMs, when);
    };

    // The reference: the same probe, through Web Audio, at a known context time, in rounds until
    // one is heard. Safari's microphone path takes seconds to settle after capture starts
    // (Safari 26.5, 2026-09-19: the first ~5 s of 0.9.0's marks scattered over 330 ms, then six in
    // a row within 0.2 ms), so an early round may not be; Chrome and Firefox hear the first.
    const track = await ctx.decodeAudioData(backend.tuneProbeTrack().buffer);

    // Before playing anything, see that the microphone is delivering samples at
    // all. Digital zero throughout is a muted or absent input and nothing played will change it, so
    // say that now instead of at the end. A quiet room is not a fault: only exact silence stops us.
    enter("microphone", t("tune-checking-microphone"), PREFLIGHT_MS);
    collect = [];
    await new Promise((r) => setTimeout(r, PREFLIGHT_MS));
    const heard = collect;
    collect = null;
    const verdict = micVerdict(heard);
    if (verdict === "silent") {
      throw new Error(t("tune-silent-microphone"));
    }
    hot = verdict === "hot";

    let reference;
    for (let round = 0; round < REF_ROUNDS && !(reference && !reference.error); round++) {
      enter("reference", round === 0 ? t("tune-listening-reference") : t("tune-listening-again"), REF_MS);
      const refWhen = ctx.currentTime + 0.3;
      const ref = ctx.createBufferSource();
      ref.buffer = track;
      ref.connect(ctx.destination);
      // Web Audio plays at the time it is told from its first sample, so the reference skips all
      // but half a second of the lead the video needs to settle.
      ref.start(refWhen, LEAD - 0.5);
      await new Promise((r) => setTimeout(r, REF_MS));
      reference = measureNow((toPerformance) => toPerformance(refWhen + 0.5), refWhen);
      if (reference.error) console.debug("tune reference", round, reference);
    }
    if (reference.error) {
      throw new Error(referenceOn
        ? t("tune-reference-unheard", { output: referenceOn })
        : t("tune-computer-unheard"));
    }

    // The reader stops 1.2 s past the probe's start (PROBE_AFTER in crates/web/src/tune.rs), which
    // is already later than the latest it is listened for.
    enter("video", t("tune-listening-video"), (LEAD + PROBE + 1.2) * 1000);
    const played = ctx.currentTime;
    const expected = await play();
    // When the readings put the probe playing, for anything that wants to hold another clock
    // against them (extension/test/tab-reading.cjs measures listen.js's constant this way).
    globalThis.dispatchEvent?.(new CustomEvent("together:tune-expected", { detail: Array.from(expected) }));
    await new Promise((r) => setTimeout(r, 100));
    clearInterval(sampler);
    clearInterval(beat);
    phase = null;
    if (!Number.isFinite(expected[0])) throw new Error(t("tune-video-stopped"));
    const video = measureNow(expected[0], played);
    if (video.error) console.debug("tune", { reference, video, expected });
    if (video.error === "quiet") throw new Error(t("tune-video-unheard"));
    if (video.error === "split") throw new Error(t("tune-noisy-room"));
    const delayMs = video.offsetMs - reference.offsetMs;
    const micErrorMs = stamped ? microphoneError(stamped.all(), expected[0], delayMs) : null;
    // `captureMs` is what the reference round found: the microphone path's own delay, already
    // taken off `delayMs`. Kept because it is a property of the machine rather than of the take,
    // and whether it holds still across sessions decides whether it can stop being measured
    // every time (it is 8.4 s of the wait).
    return {
      delayMs,
      // How much the probe's low and high halves disagree between the two rounds. Each round's
      // own split is mostly the speaker being later at low pitches than high (1.7 ms on a MacBook
      // Air's), which is the same in both when both go out of one speaker; what doesn't cancel is
      // the take's own measure of how much to trust it.
      spreadMs: Math.abs(video.splitMs - reference.splitMs),
      // What the reference round found and `delayMs` already has taken off, and the input it was
      // heard on. Kept because it is the number that says whether a tune is trustworthy, and
      // because it is what showed that it cannot be remembered between runs (see the note above).
      captureMs: reference.offsetMs,
      capturedOn,
      when: new Date().toISOString(),
      referenceOn,
      on,
      // How far the microphone's own stamps put the sound from where the probe says it was: the
      // film's tune adds it back (extension/listen.js). Null where the browser can't stamp audio.
      micErrorMs,
    };
  } finally {
    stamped?.stop();
    clearInterval(beat);
    stream.getTracks().forEach((t) => t.stop());
    await ctx.close();
  }
}

/**
 * How far this microphone's capture stamps are from the truth, ms, or null if that can't be told.
 *
 * The tune has just measured how late the sound is, `delayMs`, the careful way. The same probe,
 * heard by the microphone as Chrome stamps it, says `lag`: when the stamps put it, against when the
 * video's readings put it playing (`expectedMs`). If the stamps were true the two would be equal.
 * They are not -- on a MacBook Air's own microphone the stamps run about 19 ms early, steady to a
 * tenth of a millisecond across browser launches (extension/test/cs.cjs) -- and the difference is
 * a property of the microphone, so it is kept by its name and measured once.
 */
export function microphoneError(mic, expectedMs, delayMs) {
  if (!Number.isFinite(expectedMs) || !mic.pcm.length) return null;
  const heard = backend.tuneHear(
    mic.pcm,
    mic.index[0][2],
    Uint32Array.from(mic.index, ([at]) => at),
    Float64Array.from(mic.index, ([, ms]) => ms),
    expectedMs,
  );
  if (heard.error) {
    console.debug("tune: couldn't read the microphone's stamps", heard);
    return null;
  }
  return delayMs - heard.offsetMs;
}
