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
    video: HTMLVideoElement;
    /** Shown to the others in the room. */
    name: string;
    /** Usually the file name. Left out when streaming: the room never says what is playing. */
    title?: string;
    /** Seconds, if already known; the element reports it otherwise. */
    duration?: number;
    /** Bytes. */
    size?: number;
    /** Join with no copy of your own and stream the room's, over `Session.streamHead`/`streamBody`. */
    stream?: boolean;
    /** A relay server of your own. Films never go through the public relays, and a browser has no
     *  direct path to anyone, so this is what makes streaming possible. */
    relay?: string;
}

export interface StreamHead {
    status: number;
    contentType: string;
    contentRange: string | null;
    contentLength: number;
    start: number;
    end: number;
}

export interface Person { id: string; name: string; initials: string; hue: number }
export interface SyncBadge { level: "good" | "fair" | "poor" | "unknown"; label: string; detail: string }
/** How we reach a peer. `null` until a connection is established. */
export type LinkView =
| { type: "direct" }
| { type: "relayed"; relay: string };

export interface PeerView { who: Person; rttMs: number | null; offsetMs: number | null; sync: SyncBadge; sameMedia: boolean; ready: boolean; stalled: boolean; link: LinkView | null }

/** The ready check from your side. `open` is whether saying so would do anything. */
export interface ReadyView { mine: boolean; count: number; total: number; open: boolean; label: string }

/** What the room is waiting for. `startsAt` is on the room clock: see `Session.clockMs`. */
export type WaitingView =
| { type: "nobody" }
| { type: "ready"; who: string[]; message: string }
| { type: "stalled"; who: string[]; local: boolean; message: string }
| { type: "starting"; startsAt: number; remainingMs: number; resuming: boolean; message: string };

export type SessionEvent =
| { type: "peerJoined"; who: Person; message: string }
| { type: "peerLeft"; who: Person; message: string }
| { type: "changed"; who: Person; local: boolean; action: "play" | "pause" | "seek"; position: number; message: string }
| { type: "mediaMismatch"; who: Person; message: string }
| { type: "ready"; who: Person; local: boolean; ready: boolean; message: string }
| { type: "holding"; who: Person; local: boolean; message: string }
| { type: "starting"; startsAt: number; resuming: boolean; message: string }
| { type: "gaveUp"; who: Person; local: boolean; message: string }
| { type: "streaming"; hash: string; title: string; size: number }
| { type: "status"; me: Person; peers: PeerView[]; offsetMs: number | null; sync: SyncBadge; position: number; paused: boolean; title: string; duration: number | null; ready: ReadyView; waiting: WaitingView }
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
     * Play for everyone.
     */
    play(): void;
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
 * Validate an invite (a ticket or a link containing one) and return the bare ticket.
 */
export function parseInvite(invite: string): string;

export function start(): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_body_free: (a: number, b: number) => void;
    readonly __wbg_intounderlyingbytesource_free: (a: number, b: number) => void;
    readonly __wbg_intounderlyingsink_free: (a: number, b: number) => void;
    readonly __wbg_intounderlyingsource_free: (a: number, b: number) => void;
    readonly __wbg_session_free: (a: number, b: number) => void;
    readonly body_cancel: (a: number) => void;
    readonly body_next: (a: number) => number;
    readonly formatTime: (a: number, b: number) => void;
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
    readonly session_clockMs: (a: number) => number;
    readonly session_host: (a: number) => number;
    readonly session_join: (a: number, b: number, c: number) => number;
    readonly session_leave: (a: number) => number;
    readonly session_onEvent: (a: number, b: number) => void;
    readonly session_pause: (a: number) => void;
    readonly session_play: (a: number) => void;
    readonly session_resumePlayback: (a: number) => void;
    readonly session_seek: (a: number, b: number) => void;
    readonly session_setReady: (a: number, b: number) => void;
    readonly session_streamBody: (a: number, b: number, c: number, d: number) => void;
    readonly session_streamHead: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly session_ticket: (a: number, b: number) => void;
    readonly start: () => void;
    readonly ring_core_0_17_14__bn_mul_mont: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly __wasm_bindgen_func_elem_21882: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_21884: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_11768: (a: number, b: number, c: number) => void;
    readonly __wasm_bindgen_func_elem_13470: (a: number, b: number, c: number) => void;
    readonly __wasm_bindgen_func_elem_626: (a: number, b: number, c: number) => void;
    readonly __wasm_bindgen_func_elem_9192: (a: number, b: number, c: number) => void;
    readonly __wasm_bindgen_func_elem_11563: (a: number, b: number) => void;
    readonly __wasm_bindgen_func_elem_12681: (a: number, b: number) => void;
    readonly __wasm_bindgen_func_elem_12753: (a: number, b: number) => void;
    readonly __wasm_bindgen_func_elem_21722: (a: number, b: number) => void;
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
