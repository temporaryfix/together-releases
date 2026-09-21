// Passive tuning: how far the microphone hears the film behind the moment the page played it,
// measured from the film's own soundtrack, with no chirp played at all.
//
// Two stamped streams go in: the reference (the film's sound, digital, read from the page) and the
// microphone (the same sound after the speaker and the air). One number comes out, or a refusal.
// The method is the one RESEARCH/PASSIVE_FILM_DELAY_2026-09-21.md measured on the laptop rig
// against the shipped chirps, ported from extension/test/fft.cjs:
//
// - GCC-PHAT, not plain correlation. Plain correlation was 2 to 31 ms out on every window: it is
//   decided by the bass, which a laptop speaker cannot reproduce and the room smears. PHAT divides
//   each bin by its own magnitude, so only phase decides.
// - Band-limited to 1-6 kHz: the band where the speaker and the microphone both work.
// - The *first* peak above half the tallest, not the tallest. The rig's room answered 1.46 ms
//   behind the direct path, and in the 1-6 kHz band that reflection was the taller of the two.
//   Unlike the prototype, "peak" means one of the tallest's own sign (see firstArrival).
// - A confidence gate: the peak against the median |correlation| away from it. At 20x it kept 81 of
//   90 windows, every one within 0.74 ms of the chirps, and threw away exactly the nine that would
//   have been wrong (38 to 239 ms out, all under 20x). So below the gate this says nothing.
//
// Stream shape: `{ pcm: Float32Array, index: Array<[sampleIndex, tsMs, sampleRate]> }`. Chunk k
// starts at pcm[sampleIndex], stamped tsMs on a clock both streams share.

const DEFAULTS = {
  minLagMs: -150,
  maxLagMs: 450,
  windowMs: 1000,
  hopMs: 500,
  band: [1000, 6000],
  minRatio: 20,
  agreeMs: 0.5,
  minWindows: 3,
  sampleRate: 48000,
  // How far before the tallest peak the direct path may be. A reflection that out-shouts the
  // direct path is a near one (1.46 ms on the rig); 20 ms is 7 m of extra path. Without a limit, a
  // film with a steady pitch puts peaks one period apart all along the lag range and "first above
  // half" walks off to the earliest of them.
  lookbackMs: 20,
  // Below this RMS the reference is silence, not film: correlating it would only measure noise.
  quietRms: 1e-4,
};

/** The smallest power of two at least `n`. */
export function nextPow2(n) {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

// ---------------------------------------------------------------------------------------------
// FFT. Radix-2, in place, with the bit reversal and twiddles computed once per size: a window here
// is a 2^17 transform, and the prototype's cos/sin recurrence per butterfly is where its time went.

const fftTables = new Map();

function tablesFor(n) {
  let t = fftTables.get(n);
  if (t) return t;
  const rev = new Uint32Array(n);
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    rev[i] = j;
  }
  const cos = new Float64Array(n >> 1), sin = new Float64Array(n >> 1);
  for (let k = 0; k < n >> 1; k++) {
    cos[k] = Math.cos((2 * Math.PI * k) / n);
    sin[k] = Math.sin((2 * Math.PI * k) / n);
  }
  t = { rev, cos, sin };
  fftTables.set(n, t);
  return t;
}

/** In-place FFT of `re`/`im` (Float64Array, power-of-two length). `inverse` includes the 1/n. */
export function fft(re, im, inverse = false) {
  const n = re.length;
  const { rev, cos, sin } = tablesFor(n);
  for (let i = 1; i < n; i++) {
    const j = rev[i];
    if (i < j) {
      let t = re[i]; re[i] = re[j]; re[j] = t;
      t = im[i]; im[i] = im[j]; im[j] = t;
    }
  }
  const sign = inverse ? 1 : -1;
  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1, step = n / len;
    for (let i = 0; i < n; i += len) {
      for (let k = 0, w = 0; k < half; k++, w += step) {
        const wr = cos[w], wi = sign * sin[w];
        const a = i + k, b = a + half;
        const br = re[b] * wr - im[b] * wi, bi = re[b] * wi + im[b] * wr;
        re[b] = re[a] - br; im[b] = im[a] - bi;
        re[a] += br; im[a] += bi;
      }
    }
  }
  if (inverse) for (let i = 0; i < n; i++) (re[i] /= n), (im[i] /= n);
}

// ---------------------------------------------------------------------------------------------
// Stamps to a grid. The two streams arrive at different native rates (measured: the page 48000 or
// 44100, the microphone 96000) in chunks of different sizes, so before anything can be compared
// both are put on one uniform grid of times.

/**
 * The stream's chunks, grouped into runs of contiguous samples: `{ s0, s1, a, slope, rate }`, where
 * sample s in [s0, s1) was at `a + (s - s0) * slope` ms.
 *
 * A run is broken where a chunk's stamp is not where the previous chunk's samples said it would be
 * (by more than 1 ms or half a chunk, whichever is less): that is dropped audio, and the samples
 * either side of it are not neighbours in time even though they are neighbours in `pcm`.
 *
 * Within a run the stamps are fitted with a line rather than trusted one by one. Each stamp
 * carries its own jitter; the samples between stamps do not, because they came off one clock. A
 * line through a second of stamps averages the jitter away, and its slope follows the audio clock
 * if it runs a little fast or slow against the shared one. Under a second, the slope is too
 * sensitive to jitter to be worth fitting, and the nominal rate is used with a fitted offset.
 */
export function runsOf(stream) {
  const { pcm, index } = stream;
  const runs = [];
  let cur = null;
  for (let k = 0; k < index.length; k++) {
    const [s, ts, rate] = index[k];
    const end = k + 1 < index.length ? index[k + 1][0] : pcm.length;
    if (end <= s) continue;
    const durMs = ((end - s) * 1000) / rate;
    if (cur) {
      const expected = cur.lastTs + ((s - cur.lastS) * 1000) / cur.rate;
      const tol = Math.min(1, durMs / 2, cur.lastDur / 2);
      if (rate !== cur.rate || s !== cur.s1 || Math.abs(ts - expected) > tol) cur = null;
    }
    if (!cur) {
      cur = { s0: s, s1: s, rate, points: [], lastS: s, lastTs: ts, lastDur: durMs };
      runs.push(cur);
    }
    cur.points.push([s, ts]);
    cur.s1 = end;
    cur.lastS = s;
    cur.lastTs = ts;
    cur.lastDur = durMs;
  }
  return runs.map(({ s0, s1, rate, points }) => {
    const nominal = 1000 / rate;
    let slope = nominal;
    const n = points.length;
    let mx = 0, my = 0;
    for (const [s, ts] of points) (mx += s - s0), (my += ts);
    mx /= n;
    my /= n;
    if ((s1 - s0) * nominal >= 1000 && n >= 4) {
      let sxy = 0, sxx = 0;
      for (const [s, ts] of points) {
        const dx = s - s0 - mx;
        sxy += dx * (ts - my);
        sxx += dx * dx;
      }
      if (sxx > 0) slope = sxy / sxx;
    }
    return { s0, s1, rate, slope, a: my - slope * mx };
  });
}

/** `[startMs, endMs)` of the time the stream has samples for, gaps included. */
export function spanOf(runs) {
  if (!runs.length) return null;
  const last = runs[runs.length - 1];
  return [runs[0].a, last.a + (last.s1 - last.s0) * last.slope];
}

// The interpolator: a Blackman-windowed sinc with 16 zero crossings each side, tabulated at 512
// points per crossing and read with linear interpolation between table points.
//
// Nearest-neighbour would put up to half an input sample (5 us at 96 kHz, 11 us at 44.1 kHz) of
// jitter on every output sample and is not band-limited; linear interpolation is a low-pass that
// dulls the top of the 1-6 kHz band. A symmetric sinc kernel has zero phase, so it adds no timing
// bias at all, and its cutoff at 0.46 of the lower Nyquist is the anti-aliasing filter the
// 96 kHz -> 48 kHz step needs. Blackman's sidelobes are near -58 dB; a 44.1 kHz source costs 32
// multiplies per output sample and a 96 kHz one about 70, which for 12 s is tens of milliseconds.
const ZEROS = 16;
const PER_ZERO = 512;
const CUTOFF = 0.92;
const SINC = (() => {
  const t = new Float64Array(ZEROS * PER_ZERO + 2);
  for (let j = 0; j < t.length; j++) {
    const u = j / PER_ZERO;
    if (u >= ZEROS) continue;
    const x = u / ZEROS;
    const w = 0.42 + 0.5 * Math.cos(Math.PI * x) + 0.08 * Math.cos(2 * Math.PI * x);
    t[j] = (u === 0 ? 1 : Math.sin(Math.PI * u) / (Math.PI * u)) * w;
  }
  return t;
})();

/**
 * The stream's sound at `n` instants `t0Ms + i / rate` seconds, band-limited to the lower of the
 * two Nyquists. Instants the stream has no samples for (before, after, in a gap) are 0.
 *
 * @param stream a stamped stream, or the runs `runsOf` made of it (with `pcm`)
 */
export function toGrid(stream, t0Ms, n, rate = DEFAULTS.sampleRate, out = new Float32Array(n), runs = runsOf(stream)) {
  const { pcm } = stream;
  out.fill(0, 0, n);
  const msPerOut = 1000 / rate;
  for (const run of runs) {
    // r: the kernel's zero crossings are 1/r input samples apart, so the cutoff is at r times the
    // input's Nyquist: 0.92 of it when upsampling, 0.92 of the output's when downsampling.
    const r = CUTOFF * Math.min(1, rate / run.rate);
    const reach = ZEROS / r;
    const scale = r * PER_ZERO;
    const tEnd = run.a + (run.s1 - run.s0) * run.slope;
    const iLo = Math.max(0, Math.ceil((run.a - t0Ms) / msPerOut));
    const iHi = Math.min(n - 1, Math.ceil((tEnd - t0Ms) / msPerOut) - 1);
    for (let i = iLo; i <= iHi; i++) {
      const p = run.s0 + (t0Ms + i * msPerOut - run.a) / run.slope;
      const lo = Math.max(run.s0, Math.ceil(p - reach));
      const hi = Math.min(run.s1 - 1, Math.floor(p + reach));
      let acc = 0;
      for (let m = lo; m <= hi; m++) {
        const u = Math.abs(m - p) * scale;
        const j = u | 0;
        const w = SINC[j] + (u - j) * (SINC[j + 1] - SINC[j]);
        acc += pcm[m] * w;
      }
      out[i] = acc * r;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// The correlator.

/**
 * GCC-PHAT of `ref` against the longer `mic`: `c[j]` for j = 0 .. mic.length - ref.length, peaking
 * where mic[i + j] matches ref[i].
 *
 * One transform is enough for both inputs: ref goes in the real part and mic in the imaginary, and
 * the two spectra are separated by symmetry. The size need only hold `mic`: at the lags asked for,
 * i + j never passes mic.length, so the circular correlation never wraps into them.
 *
 * `band` zeroes every bin outside [lo, hi] Hz before PHAT: a laptop speaker has no bass to give
 * and the microphone has none to hear, so the reference's low end is all mismatch and no
 * information, and whatever PHAT is given it weighs equally.
 *
 * @param opts { band = [1000, 6000], sampleRate = 48000, work, out } — `work` is { re, im } scratch
 *        of length nextPow2(mic.length), `out` a Float64Array to fill; both reused across windows.
 */
export function gccPhat(ref, mic, opts = {}) {
  const { band = DEFAULTS.band, sampleRate = DEFAULTS.sampleRate } = opts;
  const n = nextPow2(mic.length);
  const lags = mic.length - ref.length + 1;
  let { work, out } = opts;
  if (!work || work.re.length !== n) work = { re: new Float64Array(n), im: new Float64Array(n) };
  if (!out || out.length < lags) out = new Float64Array(lags);
  const { re, im } = work;
  re.fill(0);
  im.fill(0);
  re.set(ref);
  im.set(mic);
  fft(re, im);
  const lo = band ? Math.ceil((band[0] / sampleRate) * n) : 0;
  const hi = band ? Math.floor((band[1] / sampleRate) * n) : n >> 1;
  const mask = n - 1;
  // Bins are written back in place, k and n - k together, so both are read before either is written.
  for (let k = 0; k <= n >> 1; k++) {
    const q = (n - k) & mask;
    if (k < lo || k > hi) {
      re[k] = im[k] = re[q] = im[q] = 0;
      continue;
    }
    const zr = re[k], zi = im[k], yr = re[q], yi = im[q];
    const rr = (zr + yr) / 2, ri = (zi - yi) / 2; // REF[k]
    const mr = (zi + yi) / 2, mi = (yr - zr) / 2; // MIC[k]
    let gr = rr * mr + ri * mi, gi = rr * mi - ri * mr; // conj(REF) * MIC
    const mag = Math.hypot(gr, gi);
    if (mag > 0) (gr /= mag), (gi /= mag);
    else gr = gi = 0;
    re[k] = gr; im[k] = gi;
    re[q] = gr; im[q] = -gi;
  }
  fft(re, im, true);
  for (let j = 0; j < lags; j++) out[j] = re[j];
  return lags === out.length ? out : out.subarray(0, lags);
}

/**
 * The direct path in a correlation: `{ index, height, ratio, late }`, `index` to a fraction of a
 * sample.
 *
 * The first local peak above `frac` of the tallest, of the same sign as it, looking back no more than `lookback`
 * samples from it — not the tallest itself. A room answers more than once and the reflection can
 * be the taller (on the rig, 1.46 ms behind, 1.00 to 0.97); sound does not arrive early, so the
 * first clear peak is the direct path. `late` is how many samples behind it the tallest was.
 *
 * `ratio` is the tallest |c| over the median |c| more than `guard` samples from it: whether there
 * is an answer here at all, or just the loudest patch of noise. The sub-sample position is the
 * vertex of the parabola through the three samples at the top.
 */
export function firstArrival(c, { frac = 0.5, guard = 5, lookback = Infinity, scratch } = {}) {
  const len = c.length;
  let mx = 0;
  for (let i = 1; i < len; i++) if (Math.abs(c[i]) > Math.abs(c[mx])) mx = i;
  const top = Math.abs(c[mx]);
  const rest = scratch && scratch.length >= len ? scratch : new Float64Array(len);
  let m = 0;
  for (let i = 0; i < len; i++) if (Math.abs(i - mx) > guard) rest[m++] = Math.abs(c[i]);
  const sorted = rest.subarray(0, m).sort();
  const median = m ? sorted[m >> 1] : 0;
  const ratio = top / (median || 1e-300);
  // The search is in the tallest peak's own polarity, not in |c|. Band-limiting to 1-6 kHz rings:
  // every peak has a lobe of the opposite sign 0.125 ms (6 samples) before it, measured here at
  // 0.47 to 0.51 of the peak on synthetic film, right on the threshold. Searched in |c|, one window
  // in ten took that lobe for an earlier arrival and came out 117 us early. A reflection has the
  // polarity of the direct path; the lobe has the other one.
  const sign = c[mx] < 0 ? -1 : 1;
  const th = frac * top;
  const from = Math.max(1, mx - (Number.isFinite(lookback) ? lookback : len));
  let at = mx;
  for (let i = from; i <= mx && i < len - 1; i++) {
    const b = sign * c[i];
    if (b >= th && b >= sign * c[i - 1] && b >= sign * c[i + 1]) {
      at = i;
      break;
    }
  }
  let index = at;
  if (at > 0 && at < len - 1) {
    const a = sign * c[at - 1], b = sign * c[at], d = sign * c[at + 1];
    const den = a - 2 * b + d;
    const sub = den === 0 ? 0 : (0.5 * (a - d)) / den;
    if (Math.abs(sub) < 1) index += sub;
  }
  return { index, height: Math.abs(c[at]), ratio, late: mx - at };
}

// ---------------------------------------------------------------------------------------------

/**
 * @param ref  stamped stream (the film, digital)
 * @param mic  stamped stream (the microphone)
 * @param opts { minLagMs = -150, maxLagMs = 450, windowMs = 1000, hopMs = 500, band = [1000, 6000],
 *               minRatio = 20, agreeMs = 0.5, minWindows = 3, sampleRate = 48000 }
 * @returns { lagMs, spreadMs, windows, tried, ratio } on success, where lagMs = (time the mic heard it) - (time the ref stamped it),
 *          or { error: "quiet" | "unsure" | "short", tried, windows } — never a guess.
 */
export function measureLag(ref, mic, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const rate = o.sampleRate;
  const msPer = 1000 / rate;
  const W = Math.round(o.windowMs / msPer);
  const hop = Math.max(1, Math.round(o.hopMs / msPer));
  const jMin = Math.floor(o.minLagMs / msPer);
  const jMax = Math.ceil(o.maxLagMs / msPer);
  const L = jMax - jMin;
  const refRuns = runsOf(ref), micRuns = runsOf(mic);
  const rs = spanOf(refRuns), ms = spanOf(micRuns);
  const short = { error: "short", tried: 0, windows: 0 };
  if (!rs || !ms) return short;

  // Window k is the reference over [t0 + k hop, + W) and the microphone over that extended by the
  // lag range; every one must lie inside both streams. Gaps inside are allowed (they grid to 0).
  const t0 = Math.max(rs[0], ms[0] - jMin * msPer);
  const tLast = Math.min(rs[1], ms[1] - jMax * msPer) - W * msPer;
  const count = tLast >= t0 ? Math.floor((tLast - t0) / (hop * msPer) + 1e-9) + 1 : 0;
  if (count < o.minWindows) return short;

  const span = (count - 1) * hop + W;
  const refGrid = toGrid(ref, t0, span, rate, undefined, refRuns);
  const micGrid = toGrid(mic, t0 + jMin * msPer, span + L, rate, undefined, micRuns);

  const n = nextPow2(W + L);
  const work = { re: new Float64Array(n), im: new Float64Array(n) };
  const out = new Float64Array(L + 1);
  const scratch = new Float64Array(L + 1);
  const lookback = Math.round(o.lookbackMs / msPer);
  const kept = [];
  let tried = 0;
  for (let k = 0; k < count; k++) {
    const r = refGrid.subarray(k * hop, k * hop + W);
    let e = 0;
    for (let i = 0; i < W; i++) e += r[i] * r[i];
    if (Math.sqrt(e / W) < o.quietRms) continue;
    tried++;
    const c = gccPhat(r, micGrid.subarray(k * hop, k * hop + W + L), { band: o.band, sampleRate: rate, work, out });
    const fa = firstArrival(c, { lookback, scratch });
    // A peak on the very edge of the range is a lag outside it, not a measurement of one.
    if (fa.ratio < o.minRatio || fa.index < 1 || fa.index > L - 1) continue;
    kept.push({ lagMs: (jMin + fa.index) * msPer, ratio: fa.ratio });
  }

  if (tried < o.minWindows) return { error: "quiet", tried, windows: 0 };
  if (kept.length < o.minWindows) return { error: "unsure", tried, windows: kept.length };
  const median = (xs) => {
    const s = [...xs].sort((a, b) => a - b);
    return s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  };
  const mid = median(kept.map((w) => w.lagMs));
  const agree = kept.filter((w) => Math.abs(w.lagMs - mid) <= o.agreeMs);
  if (agree.length < o.minWindows) return { error: "unsure", tried, windows: agree.length };
  const lagMs = agree.reduce((s, w) => s + w.lagMs, 0) / agree.length;
  const spreadMs = Math.sqrt(agree.reduce((s, w) => s + (w.lagMs - lagMs) ** 2, 0) / agree.length);
  return { lagMs, spreadMs, windows: agree.length, tried, ratio: median(agree.map((w) => w.ratio)) };
}
