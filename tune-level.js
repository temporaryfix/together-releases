// What the microphone's level means, as a meter and as a verdict. Its own module, with nothing
// imported, so `web/tune.test.mjs` can put levels through it without a browser or the wasm backend.

/** Quietest sample the meter shows at all. Below this the bar is empty. */
const FLOOR_DB = -60;

/**
 * Where a block's loudest sample sits on the meter, 0 to 1. Decibels, not amplitude: a room that
 * is merely quiet reads as a tenth of full scale in amplitude and would pin the bar to nothing,
 * while in decibels it is half way up and visibly alive. Silence is 0 exactly.
 */
export function meterLevel(peak) {
  if (!(peak > 0)) return 0;
  const db = 20 * Math.log10(Math.min(peak, 1));
  return Math.min(1, Math.max(0, (db - FLOOR_DB) / -FLOOR_DB));
}

/**
 * What a run of block peaks says about the microphone, before thirty seconds are spent on it.
 *
 *   "silent" — every sample was zero. Not "quiet": digital zero. A microphone that is muted in the
 *              system, or a stream with no input behind it, gives exactly this, and no amount of
 *              chirping will change it. Worth stopping for.
 *   "hot"    — something reached full scale, so the chirps will land on top of clipping.
 *   "ok"     — anything else. A quiet room is not a fault and is not reported as one: the only
 *              thing that proves the microphone can hear this computer is the reference round,
 *              which happens next either way.
 */
export function micVerdict(peaks) {
  if (peaks.length === 0) return "silent";
  if (peaks.every((p) => p === 0)) return "silent";
  if (peaks.some((p) => p >= 0.99)) return "hot";
  return "ok";
}
