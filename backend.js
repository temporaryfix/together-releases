// The page's one way into a room: session commands go in, room events come out.
//
// Everything the screens need from the room goes through the object this module exports, so the
// page doesn't care what runs the room. In a browser that's WebAssembly (`pkg/together_web.js`).
// A desktop shell can swap in its own backend of the same shape, over native IPC, by setting
// `window.togetherBackend` before `app.js` loads.
//
// Backend {
//   ready: Promise<void>                   resolves once the backend can be used; rejects if it can't load
//   host(options): Promise<RoomSession>    start a room
//   join(invite, options): Promise<RoomSession>
//   inspectInvite(text): InviteInfo        synchronous; throws an Error whose message is for the user
//   formatTime(seconds): string            "0:05", "1:02:03"; synchronous
//   tuneTrack(chirps?): Uint8Array          the tuning chirps as a WAV file (see tune.js)
//   tunePlay(video, url, lead, chirps?): Promise<number[]>
//                                           play them, and when the readings put each playing
//   tuneMeasure(samples, rate, anchorIndex, anchorMs, expectedMs)
//                                           { delayMs, spreadMs, chirps } or { error, … }
//   tuneProbeTrack(): Uint8Array            the tuning probe, one sweep, as a WAV file
//   tuneProbePlay(video, url, lead): Promise<number[]>
//                                           play it, and when the readings put it playing
//   tuneHear(samples, rate, anchorIndex, anchorMs, expectedMs)
//                                           { offsetMs, prominence, splitMs } or { error, … }
//   RemoteTune(send)                        a <video> in another document to tune, through the
//                                           same bridge as SessionOptions.remote: .input(report),
//                                           .play(lead, chirps?): Promise<number[]> (epoch ms)
// }
//
// options: { video, name, stream?, relay?, title?, duration?, size?, file?, outputDelay? }
//          (see SessionOptions; outputDelay: ms, what tuning measured)
// InviteInfo: { ticket: string, relay: string | null }   relay: the room's own relay host, if the invite names one
//
// RoomSession {
//   ticket: string                          what others join with
//   relay: string | null                    the relay the invite carries, if any
//   onEvent(listener)                       every room event (see SessionEvent), backlog first
//   play() pause() seek(seconds) setReady(ready) resumePlayback()
//                                           call from the click or key handler: browsers only start
//                                           sound from a user gesture
//   clockMs(): number                       the room clock that `startsAt` is on; synchronous
//   leave(): Promise<void>                  say goodbye and shut down
//   close(): void                           free everything; the session is unusable afterwards
//   streamHead?(hash, range) streamBody?(start, end)
//                                           only where the page itself streams the room's film
// }

/** The WebAssembly backend: the room runs in this page. Loaded only when it's the one in use. */
function wasmBackend() {
  let pkg;
  const ready = import("./pkg/together_web.js").then(async (module) => {
    await module.default();
    pkg = module;
  });
  const wrap = (session) => {
    // The wasm `Session` already has the interface's shape; only `free` is called `close`. Its
    // `relay` is a getter (undefined for none), so it can't be assigned to.
    session.close = () => session.free();
    return session;
  };
  return {
    ready,
    host: async (options) => wrap(await pkg.Session.host(options)),
    join: async (invite, options) => wrap(await pkg.Session.join(invite, options)),
    inspectInvite: (text) => {
      const info = pkg.inspectInvite ? pkg.inspectInvite(text) : { ticket: pkg.parseInvite(text), relay: null };
      return { ticket: info.ticket, relay: info.relay ?? null };
    },
    formatTime: (seconds) => pkg.formatTime(seconds),
    tuneTrack: (chirps) => pkg.tuneTrack(chirps),
    tunePlay: (video, url, lead, chirps) => pkg.tunePlay(video, url, lead, chirps),
    tuneMeasure: (samples, rate, anchorIndex, anchorMs, expectedMs) =>
      pkg.tuneMeasure(samples, rate, anchorIndex, anchorMs, expectedMs),
    tuneProbeTrack: () => pkg.tuneProbeTrack(),
    tuneProbePlay: (video, url, lead) => pkg.tuneProbePlay(video, url, lead),
    tuneHear: (samples, rate, anchorIndex, anchorMs, expectedMs) =>
      pkg.tuneHear(samples, rate, anchorIndex, anchorMs, expectedMs),
    get RemoteTune() {
      return pkg.RemoteTune;
    },
  };
}

export const backend = window.togetherBackend ?? wasmBackend();
