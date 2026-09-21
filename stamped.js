// Audio with the time Chrome says each piece of it was captured: the input passive tuning needs.
//
// An AudioContext is the wrong clock for this. The tab's sound and the microphone read into one
// context lag each other by a different amount every time a context opens -- 7.4 to 10.5 ms over
// five (extension/test/k-const.cjs) -- which the tune never sees, because its reference
// round cancels it, and passive tuning has no reference round. MediaStreamTrackProcessor hands
// over each chunk with the capture timestamp Chrome gave it instead, and by those the same two
// streams lag each other by the same amount in every context, to 0.05 ms, across browser launches
// (cs.cjs). Chrome only: Firefox and Safari have no MediaStreamTrackProcessor on a page.
//
// A chunk's timestamp is microseconds on the capturing document's performance clock; it is kept
// here as epoch milliseconds (+ performance.timeOrigin), so streams read in different documents --
// the tab in the card, the microphone in the room host -- compare directly.

/** Whether this browser can stamp audio at all. */
export const canStamp = () => typeof globalThis.MediaStreamTrackProcessor === "function";

/**
 * Keep everything `track` delivers, from now until `stop()`, as a stamped stream for
 * `web/passive.js`: `{ pcm: Float32Array, index: [[sampleIndex, epochMs, sampleRate], ...] }`.
 *
 * `take()` hands over what has arrived since the last `take()`, with sample indices counted from
 * the start of the take, so a caller can pass it on in pieces. `all()` is everything so far.
 */
export function stamp(track) {
  const reader = new MediaStreamTrackProcessor({ track }).readable.getReader();
  const origin = performance.timeOrigin;
  const chunks = [];
  let taken = 0;
  let stopped = false;
  (async () => {
    try {
      while (!stopped) {
        const { value, done } = await reader.read();
        if (done) break;
        const pcm = new Float32Array(value.numberOfFrames);
        // One channel is enough: the film's channels are one sound, and a microphone has one.
        value.copyTo(pcm, { planeIndex: 0, format: "f32-planar" });
        chunks.push({ ms: origin + value.timestamp / 1000, rate: value.sampleRate, pcm });
        value.close();
      }
    } catch {
      // The track ended under us: whatever arrived is kept.
    }
  })();
  const join = (from) => {
    const part = chunks.slice(from);
    const pcm = new Float32Array(part.reduce((n, c) => n + c.pcm.length, 0));
    const index = [];
    let at = 0;
    for (const c of part) {
      pcm.set(c.pcm, at);
      index.push([at, c.ms, c.rate]);
      at += c.pcm.length;
    }
    return { pcm, index };
  };
  return {
    take() {
      const from = taken;
      taken = chunks.length;
      return join(from);
    },
    all: () => join(0),
    /** Seconds of sound kept so far. */
    seconds: () => chunks.reduce((s, c) => s + c.pcm.length / c.rate, 0),
    stop() {
      stopped = true;
      reader.cancel().catch(() => {});
      track.stop();
    },
  };
}

/** Put pieces from `take()` back together, in order: the receiving end of a stream passed on. */
export function joinStreams(pieces) {
  const pcm = new Float32Array(pieces.reduce((n, p) => n + p.pcm.length, 0));
  const index = [];
  let at = 0;
  for (const p of pieces) {
    pcm.set(p.pcm, at);
    for (const [i, ms, rate] of p.index) index.push([at + i, ms, rate]);
    at += p.pcm.length;
  }
  return { pcm, index };
}

/**
 * A stamped stream as plain JSON-safe data, for a runtime port: the samples as 16-bit PCM in
 * base64, which is a quarter of the size of the floats as a JSON array and loses nothing the
 * measurement can see (the film is 16-bit or less to begin with).
 */
export function pack({ pcm, index }) {
  const ints = new Int16Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) ints[i] = Math.max(-32768, Math.min(32767, Math.round(pcm[i] * 32767)));
  const bytes = new Uint8Array(ints.buffer);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return { pcm: btoa(s), index };
}

/** The other half of `pack`. */
export function unpack({ pcm, index }) {
  const s = atob(pcm);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  const ints = new Int16Array(bytes.buffer, 0, bytes.length >> 1);
  const out = new Float32Array(ints.length);
  for (let i = 0; i < ints.length; i++) out[i] = ints[i] / 32767;
  return { pcm: out, index };
}

/**
 * The tuning probe as a stamped stream: one starting exactly at each epoch time in `startsMs`,
 * silence between. It is what the microphone should have heard if the sound were on time, so
 * measuring the microphone against it says how late the sound was by the microphone's own stamps
 * (see `micErrorMs` in tune.js). The probe is `together_core::tune::probe`: 0.7 s, a rising log
 * sweep from 400 Hz to 6 kHz with 20 ms raised-cosine ends, drawn at each exact start rather than
 * rounded to a sample.
 */
export function probeStream(startsMs, rate = 48000) {
  const t0 = startsMs[0] - 1000;
  const n = Math.ceil(((startsMs.at(-1) + 2000 - t0) / 1000) * rate);
  const pcm = new Float32Array(n);
  const [f0, f1, secs, fade] = [400, 6000, 0.7, 0.02];
  const k = Math.log(f1 / f0);
  for (const start of startsMs) {
    const from = ((start - t0) / 1000) * rate;
    for (let i = Math.ceil(from); i < from + secs * rate && i < n; i++) {
      const t = (i - from) / rate;
      const edge = Math.max(0, Math.min(t, secs - t) / fade);
      const window = edge < 1 ? 0.5 - 0.5 * Math.cos(Math.PI * edge) : 1;
      pcm[i] += window * Math.sin(((2 * Math.PI * f0 * secs) / k) * (Math.exp((t / secs) * k) - 1));
    }
  }
  return { pcm, index: [[0, t0, rate]] };
}
