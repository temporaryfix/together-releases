/* tslint:disable */
/* eslint-disable */
/**
 * The `ReadableStreamType` enum.
 *
 * *This API requires the following crate features to be activated: `ReadableStreamType`*
 */

export type ReadableStreamType = "bytes";

export interface SessionOptions {
    /** The element to keep in sync. Load the media into it first, unless `stream` is set. */
    video?: HTMLVideoElement;
    /** Instead of `video`: an element in another document, such as a browser extension's tab.
     *  Called with every command for it; feed what it reports to `Session.playerInput`. */
    remote?: (command: RemoteCommand) => void;
    /** Shown to the others in the room. */
    name: string;
    /** Usually the file name. Left out when streaming: the room never says what is playing. */
    title?: string;
    /** Seconds, if already known; the element reports it otherwise. */
    duration?: number;
    /** Bytes. */
    size?: number;
    /** Seconds: where a room you start begins, when its video is already part way through (a page
     *  the viewer was watching). Ignored when joining. */
    position?: number;
    /** The file loaded into `video`. It's hashed so the room can name it: a room you start then opens
     *  it on every joiner, from their own copy or, through a relay of your own, streamed from you. */
    file?: File;
    /** Join with no copy of your own and stream the room's, over `Session.streamHead`/`streamBody`. */
    stream?: boolean;
    /** A relay server of your own. Films never go through the public relays, and a browser has no
     *  direct path to anyone, so this is what makes streaming possible. */
    relay?: string;
}

/** What to do to a remote element (`SessionOptions.remote`). After `play`, report how `play()`
 *  settled with a `played` input carrying the same `attempt`. `rate` goes with `preservesPitch`
 *  off, so small corrections are resampled rather than time-stretched. */
export type RemoteCommand =
| { type: "play"; attempt: number }
| { type: "pause" }
| { type: "seek"; position: number }
| { type: "rate"; rate: number };

/** What a remote element reports, for `Session.playerInput`: a `reading` every 50 ms, and the rest
 *  as it happens. `ageMs` is how long ago it happened, on this page's clock. A reading with `ad`
 *  is of an ad the site is showing in the element; the room waits for it. */
export type PlayerInput =
| { type: "reading"; position: number; paused: boolean; seeking: boolean; ended: boolean; readyState: number; duration: number | null; ad?: boolean; ageMs: number }
| { type: "signal"; signal: "seeked" | "waiting" | "stalled" | "canplay" | "playing" }
| { type: "played"; attempt: number; started: boolean }
| { type: "visibility"; hidden: boolean }
| { type: "gesture"; ageMs: number }
| { type: "resumed" }
| { type: "detached" };

export interface StreamHead {
    status: number;
    contentType: string;
    contentRange: string | null;
    contentLength: number;
    start: number;
    end: number;
}

export interface Person { id: string; name: string; initials: string; hue: number }
/** The sync meter: `gapMs` from the room (+ ahead) give or take `errMs`, and words for it. */
export interface SyncBadge { level: "good" | "fair" | "poor" | "unknown" | "off" | "none"; label: string; detail: string; gapMs: number | null; errMs: number | null }
/** How we reach a peer. `null` until a connection is established. */
export type LinkView =
| { type: "direct" }
| { type: "relayed"; relay: string }
| { type: "indirect" };
export type Role = "viewer" | "screen" | "remote";
/** Whether a player is on the room's video. */
export type Following = "yes" | "loading" | "off";

export interface PeerView { who: Person; role: Role; following: Following; rttMs: number | null; offsetMs: number | null; sync: SyncBadge; sameMedia: boolean; ready: boolean; stalled: boolean; link: LinkView | null }

/** A checked invite, and the room's own relay if it names one. */
export interface InviteInfo { ticket: string; relay: string | null }

/** The ready check from your side. `open` is whether saying so would do anything. */
export interface ReadyView { mine: boolean; count: number; total: number; open: boolean; label: string }

/** What the room is waiting for. `startsAt` is on the room clock: see `Session.clockMs`. */
export type WaitingView =
| { type: "nobody" }
| { type: "ready"; who: string[]; message: string }
| { type: "stalled"; who: string[]; local: boolean; message: string }
| { type: "ad"; who: string[]; local: boolean; message: string }
| { type: "loading"; message: string }
| { type: "starting"; startsAt: number; remainingMs: number; resuming: boolean; message: string };

export type SessionEvent =
| { type: "peerJoined"; who: Person; message: string }
| { type: "peerLeft"; who: Person; message: string }
| { type: "changed"; who: Person; local: boolean; action: "play" | "pause" | "seek" | "load"; position: number; message: string }
| { type: "mediaMismatch"; who: Person; message: string }
| { type: "ready"; who: Person; local: boolean; ready: boolean; message: string }
| { type: "holding"; who: Person; local: boolean; message: string }
| { type: "starting"; startsAt: number; resuming: boolean; message: string }
| { type: "gaveUp"; who: Person; local: boolean; message: string }
| { type: "streaming"; hash: string; title: string; size: number }
| { type: "refused"; who: Person | null; reason: "newer" | "notMember" | "roomFull" | "other"; message: string }
| { type: "program"; loading: boolean; offProgram: boolean; unsupported: boolean; message: string | null }
| { type: "status"; me: Person; role: Role; following: Following; peers: PeerView[]; offsetMs: number | null; sync: SyncBadge; position: number; paused: boolean; title: string; duration: number | null; ready: ReadyView; waiting: WaitingView }
| { type: "playback"; blocked: boolean }
| { type: "relayBlocked"; blocked: boolean }
| { type: "stopped"; error: string | null; message: string };



/**
 * One response body, read a piece at a time.
 */
export class Body {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Stop reading: the player seeked away, or the room closed. Ends a `next()` that is still
     * waiting for a piece that may never come, and drops the fetching behind it.
     */
    cancel(): void;
    /**
     * The next piece, or `undefined` once the body is complete or cancelled.
     */
    next(): Promise<any>;
}

export class IntoUnderlyingByteSource {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    cancel(): void;
    pull(controller: ReadableByteStreamController): Promise<any>;
    start(controller: ReadableByteStreamController): void;
    readonly autoAllocateChunkSize: number;
    readonly type: ReadableStreamType;
}

export class IntoUnderlyingSink {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    abort(reason: any): Promise<any>;
    close(): Promise<any>;
    write(chunk: any): Promise<any>;
}

export class IntoUnderlyingSource {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    cancel(): void;
    pull(controller: ReadableStreamDefaultController): Promise<any>;
}

/**
 * Tuning a `<video>` in another document, through the extension's bridge ([`bridge`]): the tab
 * has the tuning video open (its chirps timed as [`tune_track`]'s), the host feeds this what the
 * tab reports, and [`RemoteTune::play`] plays it from the start and says when each chirp played.
 */
export class RemoteTune {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Something the tab reported: a `PlayerInput`, as `Session.playerInput` takes.
     */
    input(input: any): void;
    /**
     * `send` is called with each command for the tab, as `SessionOptions.remote` is.
     */
    constructor(send: Function);
    /**
     * Play from the start, and say when the readings put each chirp playing, in epoch ms. Once.
     */
    play(lead: number): Promise<Float64Array>;
}

export class Session {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * The room's clock in milliseconds: the same clock `startsAt` is on.
     *
     * A countdown is an instant, not a duration, so read it from here rather than starting a
     * timer when the event arrives — otherwise the last second drifts by however long the
     * message took to be delivered and handled.
     */
    clockMs(): number;
    /**
     * Start a new room.
     */
    static host(options: SessionOptions): Promise<Session>;
    /**
     * Join a room from an invite: a `watch…` ticket or a link containing one.
     */
    static join(invite: string, options: SessionOptions): Promise<Session>;
    /**
     * Leave the room. Resolves once everything is shut down.
     */
    leave(): Promise<void>;
    /**
     * Listen to everything that happens in the room. Events that happened before the first
     * listener was added are delivered to it straight away.
     */
    onEvent(callback: (event: SessionEvent) => void): void;
    /**
     * Pause for everyone.
     */
    pause(): void;
    /**
     * Play for everyone. Call it from the click or key handler, so this browser may start the
     * video when the room does.
     */
    play(): void;
    /**
     * Something a remote element (`SessionOptions.remote`) reported: a `PlayerInput`.
     */
    playerInput(input: PlayerInput): void;
    /**
     * Start playback after the browser blocked it (a `playback` event with `blocked: true`).
     * Call it directly from a click or key handler.
     */
    resumePlayback(): void;
    /**
     * Move everyone to `seconds`.
     */
    seek(seconds: number): void;
    /**
     * Say whether we're ready to start, or take it back. Once everyone in the room is ready,
     * playback is scheduled for a shared instant and every screen starts on the same frame.
     *
     * Call it from the click or key handler: the countdown ends seconds later, and Safari only
     * starts a video with sound then if it was played during a click.
     */
    setReady(ready: boolean): void;
    /**
     * The body for a `StreamHead`, read a piece at a time. Cancel it to stop downloading for a
     * response the browser has abandoned.
     */
    streamBody(start: number, end: number): Body;
    /**
     * What to answer a Service Worker request for `hash` of the streamed film, as a
     * `StreamHead`. Anything but the film we are streaming gets a 404.
     */
    streamHead(hash: string, range?: string | null): any;
    /**
     * The host of the relay our invite names, which joiners use unless they have their own.
     */
    readonly relay: string | undefined;
    /**
     * The ticket others join with. Anyone in a room can invite; it keeps working after the
     * original host leaves, as long as this session is open.
     */
    readonly ticket: string;
}

/**
 * `0:05`, `12:31`, `1:02:03`.
 */
export function formatTime(seconds: number): string;

/**
 * Check an invite and say what's in it: an `InviteInfo`. Invites from older and newer versions
 * of together are refused with what to do about it.
 */
export function inspectInvite(invite: string): InviteInfo;

/**
 * Validate an invite (a ticket or a link containing one) and return the bare ticket.
 */
export function parseInvite(invite: string): string;

export function start(): void;

/**
 * Measure a recording: `samples` (mono, at `rate`), whose sample `anchor_index[k]` reached the
 * microphone at `anchor_ms[k]` (epoch ms), against `expected_ms`, when the readings
 * put each chirp playing. Gives `{ delayMs, spreadMs, chirps }`, or `{ error, delayMs?, spreadMs? }`
 * saying why it doesn't count.
 */
export function tuneMeasure(samples: Float32Array, rate: number, anchor_index: Uint32Array, anchor_ms: Float64Array, expected_ms: Float64Array): any;

/**
 * Play `url` (a tuning track with its first chirp `lead` seconds in: [`tune_track`]) in `video`,
 * read it as a room would, and say when its readings put each chirp playing, in epoch ms. The
 * element must already be allowed to play sound (the page primes it in the click that started
 * tuning).
 */
export function tunePlay(video: HTMLVideoElement, url: string, lead: number): Promise<Float64Array>;

/**
 * The tuning track: chirps as a WAV file, for the page to hand the element as a blob.
 */
export function tuneTrack(): Uint8Array;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_body_free: (a: number, b: number) => void;
    readonly __wbg_intounderlyingbytesource_free: (a: number, b: number) => void;
    readonly __wbg_intounderlyingsink_free: (a: number, b: number) => void;
    readonly __wbg_intounderlyingsource_free: (a: number, b: number) => void;
    readonly __wbg_remotetune_free: (a: number, b: number) => void;
    readonly __wbg_session_free: (a: number, b: number) => void;
    readonly body_cancel: (a: number) => void;
    readonly body_next: (a: number) => number;
    readonly formatTime: (a: number, b: number) => void;
    readonly inspectInvite: (a: number, b: number, c: number) => void;
    readonly intounderlyingbytesource_autoAllocateChunkSize: (a: number) => number;
    readonly intounderlyingbytesource_cancel: (a: number) => void;
    readonly intounderlyingbytesource_pull: (a: number, b: number) => number;
    readonly intounderlyingbytesource_start: (a: number, b: number) => void;
    readonly intounderlyingbytesource_type: (a: number) => number;
    readonly intounderlyingsink_abort: (a: number, b: number) => number;
    readonly intounderlyingsink_close: (a: number) => number;
    readonly intounderlyingsink_write: (a: number, b: number) => number;
    readonly intounderlyingsource_cancel: (a: number) => void;
    readonly intounderlyingsource_pull: (a: number, b: number) => number;
    readonly parseInvite: (a: number, b: number, c: number) => void;
    readonly remotetune_input: (a: number, b: number, c: number) => void;
    readonly remotetune_new: (a: number) => number;
    readonly remotetune_play: (a: number, b: number) => number;
    readonly session_clockMs: (a: number) => number;
    readonly session_host: (a: number) => number;
    readonly session_join: (a: number, b: number, c: number) => number;
    readonly session_leave: (a: number) => number;
    readonly session_onEvent: (a: number, b: number) => void;
    readonly session_pause: (a: number) => void;
    readonly session_play: (a: number) => void;
    readonly session_playerInput: (a: number, b: number, c: number) => void;
    readonly session_relay: (a: number, b: number) => void;
    readonly session_resumePlayback: (a: number) => void;
    readonly session_seek: (a: number, b: number) => void;
    readonly session_setReady: (a: number, b: number) => void;
    readonly session_streamBody: (a: number, b: number, c: number, d: number) => void;
    readonly session_streamHead: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly session_ticket: (a: number, b: number) => void;
    readonly start: () => void;
    readonly tuneMeasure: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => number;
    readonly tunePlay: (a: number, b: number, c: number, d: number) => number;
    readonly tuneTrack: (a: number) => void;
    readonly ring_core_0_17_14__bn_mul_mont: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly __wasm_bindgen_func_elem_21468: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_21470: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_11258: (a: number, b: number, c: number) => void;
    readonly __wasm_bindgen_func_elem_12946: (a: number, b: number, c: number) => void;
    readonly __wasm_bindgen_func_elem_8676: (a: number, b: number, c: number) => void;
    readonly __wasm_bindgen_func_elem_876: (a: number, b: number, c: number) => void;
    readonly __wasm_bindgen_func_elem_11053: (a: number, b: number) => void;
    readonly __wasm_bindgen_func_elem_12160: (a: number, b: number) => void;
    readonly __wasm_bindgen_func_elem_12242: (a: number, b: number) => void;
    readonly __wasm_bindgen_func_elem_21306: (a: number, b: number) => void;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export3: (a: number) => void;
    readonly __wbindgen_export4: (a: number, b: number, c: number) => void;
    readonly __wbindgen_export5: (a: number, b: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
