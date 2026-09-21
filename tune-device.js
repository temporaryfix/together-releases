// Which output device tuning is about: the one the reference leaves by, the one the video's sound
// is going out of, and which kept tune therefore applies. Its own module, with nothing imported,
// so `web/tune.test.mjs` can put device lists through these without a browser or the wasm backend,
// and so the extension's service worker and its host document can share them without dragging the
// wasm in. `outputNow` is the one part that needs a browser, and nothing in the tests calls it.

/**
 * Which output device the reference chirps should leave by, given what `enumerateDevices()`
 * returned for kind `audiooutput`. A built-in output is the only one whose reported latency can be
 * trusted; through the device the user is listening on, the reference cancels the very delay we
 * are measuring (PLANS/TUNING.md:40).
 *
 * The concrete device behind the `default` entry shares its `groupId`, and that is where the
 * video's sound goes, so a built-in device in another group is the one to reach for. When the
 * built-in output *is* the default — no headphones, no TV — pinning to it changes nothing, and
 * saying so explicitly is better than leaving it to chance.
 *
 * Returns a deviceId, or null when there is no output we can trust, in which case the reference
 * stays where it is and the result records that it was not trustworthy.
 */
export function referenceDevice(devices) {
  const builtIn = devices.filter((d) => d.deviceId && d.deviceId !== "default" && /built-?in/i.test(d.label ?? ""));
  if (builtIn.length === 0) return null;
  const defaultGroup = devices.find((d) => d.deviceId === "default")?.groupId;
  return (builtIn.find((d) => d.groupId !== defaultGroup) ?? builtIn[0]).deviceId;
}

/**
 * Which output the video's sound is actually going out of, by label, given what
 * `enumerateDevices()` returned for kind `audiooutput` — the device a tune belongs to, and the one
 * to look a remembered tune up under.
 *
 * By label, never by id: the ids rotate between browser sessions. The same built-in speakers were
 * `0a79bfc0…` in one session and `e74f7181…` in the next, same profile, measured in
 * RESEARCH/raw/measured/browser-output-device-2026-09-20.md. A tune keyed by id would be thrown
 * away every time the browser restarted.
 *
 * The `default` entry is an alias, and its own label is decorated ("Default - MacBook Air
 * Speakers"), so the concrete device sharing its `groupId` is the one named. Returns null when
 * there is nothing to go on: no devices, or no labels because the microphone was never granted.
 */
export function currentOutput(devices) {
  const alias = devices.find((d) => d.deviceId === "default");
  const real = devices.find((d) => d.deviceId && d.deviceId !== "default" && d.groupId && d.groupId === alias?.groupId);
  return real?.label || alias?.label || null;
}

/**
 * Which kept tune applies, given the output the sound is going out of now (`currentOutput`, or
 * null when the browser won't say), everything kept by output name, and the last tune measured.
 *
 * Every speaker and headset is late by its own amount, so a tune belongs to a device rather than
 * to a browser:
 *
 *   - the device is known and has been tuned  -> that tune, `matched`
 *   - the device is known and has not         -> nothing. Not the speakers' number on a Bluetooth
 *                                                headset: a wrong correction is worse than none
 *   - the device cannot be known at all       -> the last tune, `matched` false. No labels means
 *                                                no microphone grant, which means no tune of this
 *                                                browser's either, so this is a machine that was
 *                                                tuned in some other document
 */
export function chooseTune(on, byDevice, last) {
  if (!on) return { on: null, matched: false, tune: last ?? null };
  return { on, matched: Boolean(byDevice?.[on]), tune: byDevice?.[on] ?? null };
}

/**
 * Which output the sound is going out of right now, by name, or null when the browser won't say:
 * no `enumerateDevices` at all (a service worker has no `navigator.mediaDevices`, measured in
 * RESEARCH/raw/measured/browser-output-device-2026-09-20.md), or no labels because the microphone
 * was never granted.
 */
/**
 * Which input the microphone is listening on, by name, the same way as `currentOutput`. What the
 * reference round measures -- the capture path's own delay -- belongs to this device, not to the
 * browser, so it is what a kept capture delay is filed under.
 */
export function currentInput(devices) {
  const alias = devices.find((d) => d.deviceId === "default");
  const real = devices.find((d) => d.deviceId && d.deviceId !== "default" && d.groupId && d.groupId === alias?.groupId);
  return real?.label || alias?.label || null;
}

export async function outputNow() {
  const devices = await devicesNow();
  return devices ? currentOutput(devices.filter((d) => d.kind === "audiooutput")) : null;
}

/** Which input the microphone is listening on right now, by name, or null (see `outputNow`). */
export async function inputNow() {
  const devices = await devicesNow();
  return devices ? currentInput(devices.filter((d) => d.kind === "audioinput")) : null;
}

/** `enumerateDevices()`, or null if it fails or doesn't answer within `ms`. Firefox holds the answer
 *  until the document has focus, and its extension background page never has: there it never
 *  settles (Firefox 145, measured 2026-09-21), and the room waiting on it never opened. */
async function devicesNow(ms = 1000) {
  let timer;
  try {
    return await Promise.race([
      navigator.mediaDevices.enumerateDevices(),
      new Promise((resolve) => (timer = setTimeout(() => resolve(null), ms))),
    ]);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
