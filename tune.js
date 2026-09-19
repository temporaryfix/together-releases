// Tuning: how far this browser's sound lags what the room reads of its video, measured with the
// microphone, kept, and handed to every room as its output delay.
//
// Something plays the chirps and says when its readings put each one playing, in epoch ms
// (performance.timeOrigin + performance.now(), the same in every document): the backend, in a
// <video> here (`tune`), or an extension through its bridge to a tab (`measure` with its own
// `play`). This records the microphone meanwhile and stamps every block of samples with when it
// reached the microphone, on that clock. The backend finds the chirps and measures.
//
// Stamping: an AudioWorklet sees each block at a context time, which getOutputTimestamp() maps to
// performance time. The capture path's own delay isn't reported truly (Chrome, 2026-09-19: 2.7 ms
// said, 38 ms more measured), so it is measured: chirps of our own through Web Audio at context
// times whose output the browser knows, heard through the same path, and their delay taken off.
// That reference goes out through the same device, so a delay the system doesn't report for the
// device itself (some Bluetooth) cancels too: a browser can't see that; `together tune` can.

import { backend } from "./backend.js";

const KEY = "together.tune";
/** Chirps of the reference, played through Web Audio before the video's. */
const REF_CHIRPS = 14;
/** At most this many rounds of the reference, until one agrees. */
const REF_ROUNDS = 3;

/** What was measured last, if anything: { delayMs, spreadMs, chirps, when, output }. */
export function tuned() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null");
  } catch {
    return null;
  }
}

export function forget() {
  localStorage.removeItem(KEY);
}

/** The output delay a room should use: the tune's, or none. */
export function outputDelayMs() {
  return tuned()?.delayMs ?? 0;
}


/**
 * Tune this page's own <video>. Call from a click: `video` is played with sound, and the
 * microphone is asked for. `onStep(text)` hears what's happening. Resolves to the measurement,
 * kept; rejects with an Error whose message is for the user.
 */
export async function tune(video, onStep = () => {}) {
  await backend.ready;
  // Allowed to play sound only from the click: start it now, on the track itself.
  const url = URL.createObjectURL(new Blob([backend.tuneTrack()], { type: "audio/wav" }));
  video.src = url;
  video.muted = false;
  const primed = video.play().then(() => video.pause());
  try {
    const result = await measure({
      ready: primed.catch(() => {
        throw new Error("The browser didn't let the video play. Click Tune again.");
      }),
      play: () => backend.tunePlay(video, url, 1.0),
      onStep,
    });
    localStorage.setItem(KEY, JSON.stringify(result));
    return result;
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

/**
 * Record while `play()` plays the tuning chirps (its first chirp a second in) and resolves to
 * when its readings put each one playing (epoch ms), and measure. `ready` is awaited once the
 * microphone is granted. Resolves to { delayMs, spreadMs, chirps, when }; rejects with an Error
 * whose message is for the user. Keeps nothing: the caller decides where the result lives.
 */
export async function measure({ play, ready = Promise.resolve(), onStep = () => {} }) {
  await backend.ready;
  onStep("Asking for the microphone…");
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
  } catch {
    throw new Error("Tuning needs the microphone. Allow it, then try again.");
  }
  try {
    await ready;
  } catch (error) {
    stream.getTracks().forEach((t) => t.stop());
    throw error;
  }
  const ctx = new AudioContext();
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
    node.port.onmessage = (e) => blocks.push(e.data);
    await ctx.resume();

    onStep("Listening. Keep the sound where you watch, and the room quiet…");
    // The recording so far, measured against `expected` (epoch ms). One line through the pairs
    // from context time `from` on: the two clocks only drift, and a single pair is coarse
    // (Firefox's jitter by milliseconds, 2026-09-19), which a line averages away. Only those from
    // `from`: Safari's pairs are off while its output settles (Safari 26.5, 2026-09-19: a line
    // through them all ran 0.13% steep, 26 ms over the video's chirps).
    const measureNow = (expected, from) => {
      sample();
      const fit = pairs.filter(([c]) => c >= from);
      if (fit.length < 2 || blocks.length === 0) throw new Error("The microphone gave nothing. Try again.");
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
      const times = typeof expected === "function" ? expected(toPerformance) : expected;
      return backend.tuneMeasure(samples, ctx.sampleRate, anchorIndex, anchorMs, Float64Array.from(times));
    };

    // The reference: the same chirps, through Web Audio, at known context times, in rounds until
    // a round agrees. Safari's microphone path takes seconds to settle after capture starts
    // (Safari 26.5, 2026-09-19: the first ~5 s of chirps scattered over 330 ms, then six in a row
    // within 0.2 ms), so an early round can't be trusted; Chrome and Firefox agree on the first.
    const track = await ctx.decodeAudioData(backend.tuneTrack().buffer);
    let reference;
    for (let round = 0; round < REF_ROUNDS && !(reference && !reference.error); round++) {
      const refWhen = ctx.currentTime + 0.3;
      const ref = ctx.createBufferSource();
      ref.buffer = track;
      ref.connect(ctx.destination);
      ref.start(refWhen);
      ref.stop(refWhen + REF_CHIRPS * 0.5 + 0.6);
      await new Promise((r) => setTimeout(r, (REF_CHIRPS * 0.5 + 1.4) * 1000));
      reference = measureNow((toPerformance) => Array.from({ length: REF_CHIRPS }, (_, i) => toPerformance(refWhen + 1.0 + i * 0.5)), refWhen);
      if (reference.error) console.debug("tune reference", round, reference);
    }
    if (reference.error) throw new Error("The microphone didn't hear this computer's own chirps. Turn the sound up and try again.");

    const played = ctx.currentTime;
    const expected = await play();
    await new Promise((r) => setTimeout(r, 600));
    clearInterval(sampler);
    const m = measureNow(expected, played);
    if (!m.error) m.delayMs -= reference.delayMs;
    if (m.error === "tooFewChirps") {
      throw new Error(`Heard ${m.heard} of ${expected.length} chirps. Turn the sound up and try again.`);
    }
    if (m.error) console.debug("tune", { reference, m, expected });
    if (m.error === "scattered") {
      throw new Error("The chirps didn't agree. Try again somewhere quieter.");
    }
    return { delayMs: m.delayMs, spreadMs: m.spreadMs, chirps: m.chirps, when: new Date().toISOString() };
  } finally {
    stream.getTracks().forEach((t) => t.stop());
    await ctx.close();
  }
}
