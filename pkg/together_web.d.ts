/* tslint:disable */
/* eslint-disable */
/**
 * The `ReadableStreamType` enum.
 *
 * *This API requires the following crate features to be activated: `ReadableStreamType`*
 */

export type ReadableStreamType = "bytes";

export interface SessionOptions {
    /** The element to keep in sync. Load the media into it first. */
    video: HTMLVideoElement;
    /** Shown to the others in the room. */
    name: string;
    /** Usually the file name. */
    title: string;
    /** Seconds, if already known; the element reports it otherwise. */
    duration?: number;
    /** Bytes. */
    size?: number;
}

export interface Person { id: string; name: string; initials: string; hue: number }
export interface SyncBadge { level: "good" | "fair" | "poor" | "unknown"; label: string; detail: string }
export interface PeerView { who: Person; rttMs: number | null; offsetMs: number | null; sync: SyncBadge; sameMedia: boolean }

export type SessionEvent =
| { type: "peerJoined"; who: Person; message: string }
| { type: "peerLeft"; who: Person; message: string }
| { type: "changed"; who: Person; local: boolean; action: "play" | "pause" | "seek"; position: number; message: string }
| { type: "mediaMismatch"; who: Person; title: string; duration: number | null; message: string }
| { type: "status"; me: Person; peers: PeerView[]; offsetMs: number | null; sync: SyncBadge; position: number; paused: boolean; title: string; duration: number | null }
| { type: "playback"; blocked: boolean }
| { type: "stopped"; error: string | null; message: string };



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
    readonly __wbg_intounderlyingbytesource_free: (a: number, b: number) => void;
    readonly __wbg_intounderlyingsink_free: (a: number, b: number) => void;
    readonly __wbg_intounderlyingsource_free: (a: number, b: number) => void;
    readonly __wbg_session_free: (a: number, b: number) => void;
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
    readonly session_host: (a: number) => number;
    readonly session_join: (a: number, b: number, c: number) => number;
    readonly session_leave: (a: number) => number;
    readonly session_onEvent: (a: number, b: number) => void;
    readonly session_pause: (a: number) => void;
    readonly session_play: (a: number) => void;
    readonly session_resumePlayback: (a: number) => void;
    readonly session_seek: (a: number, b: number) => void;
    readonly session_ticket: (a: number, b: number) => void;
    readonly start: () => void;
    readonly ring_core_0_17_14__bn_mul_mont: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly __wasm_bindgen_func_elem_18224: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_18226: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_400: (a: number, b: number, c: number) => void;
    readonly __wasm_bindgen_func_elem_5601: (a: number, b: number, c: number) => void;
    readonly __wasm_bindgen_func_elem_8160: (a: number, b: number, c: number) => void;
    readonly __wasm_bindgen_func_elem_9855: (a: number, b: number, c: number) => void;
    readonly __wasm_bindgen_func_elem_18066: (a: number, b: number) => void;
    readonly __wasm_bindgen_func_elem_7954: (a: number, b: number) => void;
    readonly __wasm_bindgen_func_elem_9061: (a: number, b: number) => void;
    readonly __wasm_bindgen_func_elem_9116: (a: number, b: number) => void;
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
