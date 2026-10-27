/* tslint:disable */
/* eslint-disable */
/**
 * The `ReadableStreamType` enum.
 *
 * *This API requires the following crate features to be activated: `ReadableStreamType`*
 */

export type ReadableStreamType = "bytes";

/** What the page reports or asks (`Voice.send`). `output.route` counts the page's output routes
 *  from 1, newest highest. */
export type VoiceReport =
| { type: "permission"; granted: boolean }
| { type: "device"; lost: boolean }
| { type: "output"; ready: boolean; route: number }
| { type: "captureStarted"; generation: number }
| { type: "captureStopped"; generation: number }
| { type: "captureLost"; generation: number }
| { type: "renewCapture"; generation: number }
| { type: "join" } | { type: "leave" } | { type: "mute"; muted: boolean };

/** `code` 0 accepted, 1 full (retry; nothing changed), 2 closed (never retry), -1 invalid.
 *  `receipt`: an accepted report's place in the queue (consumed once `Voice.consumed()` reaches
 *  it), or a leave's departure number (its `departed` command comes once it is done). */
export interface VoiceSent { code: number; receipt: number }

/** What the page must do, in order (`Voice.poll`). Polling `startCapture` arms its generation,
 *  which opens once the page reports `captureStarted`; polling `stopCapture` fences its frames at
 *  once. `retired` is final: the room's voice is gone. */
export type VoiceCommand =
| { type: "requestPermission" }
| { type: "startCapture"; generation: number }
| { type: "stopCapture"; generation: number }
| { type: "departed"; departure: number; capture: number | null }
| { type: "retired"; consumed: number; receipts: number; capture: number | null };

/** One admitted voice link's 20 ms (`Voice.pull`). A decoder belongs to one `link`: drop the
 *  decoders of links no longer listed. `recover` carries the next packet (Opus FEC isn't exposed
 *  by WebCodecs: conceal); `conceal` has none. */
export interface VoiceTalker { peer: string; link: number; kind: "play" | "recover" | "conceal" | "silence"; packet: Uint8Array | null }

export interface VoiceView {
    phase: "off" | "joining" | "joined";
    mic: "live" | "muted" | "unavailable" | null;
    captureLive: boolean;
    advertised: boolean;
    retirement: { capture: number | null; links: number } | null;
    peers: { id: string; joined: boolean; linked: boolean; muted: boolean; micUnavailable: boolean; speaking: boolean }[];
}



export interface SessionOptions {
    /** The element to keep in sync. Load the media into it first, unless `stream` is set. */
    video?: HTMLVideoElement;
    /** Instead of `video`: an element in another document, such as a browser extension's tab.
     *  Called with every command for it; feed what it reports to `Session.playerInput`. */
    remote?: (command: RemoteCommand) => void;
    /** Prepared PCM renderer. Mutually exclusive with video and remote. */
    scheduled?: (command: ScheduledCommand) => void;
    /** Shown to the others in the room. */
    name: string;
    /** Usually the file name. Left out when streaming: the room never says what is playing. */
    title?: string;
    /** Seconds, if already known; the element reports it otherwise. */
    duration?: number;
    /** Bytes. */
    size?: number;
    /** Measured extra output delay, in milliseconds. */
    outputDelay?: number;
    /** Seconds: where a room you start begins, when its video is already part way through (a page
     *  the viewer was watching). Ignored when joining. */
    position?: number;
    /** The file loaded into `video`. It's hashed so the room can name it: a room you start then opens
     *  it on every joiner, from their own copy or, through a relay of your own, streamed from you. */
    file?: File;
    /** Join with no copy of your own and stream the room's, over `Session.streamHead`/`streamBody`. */
    stream?: boolean;
    /** Bounded local diagnostics only. Does not qualify executed cold seeks. Default false. */
    seekEvidence?: boolean;
    /** A transport relay. Media requires separate reviewed permission, and a browser has no
     *  direct path to anyone. Choosing a URL alone does not enable film sharing. */
    relay?: string;
    /** Voice (`Session.voice`). Set only once this browser can capture, and encode and decode Opus
     *  with WebCodecs (check `AudioEncoder.isConfigSupported` and `AudioDecoder.isConfigSupported`
     *  for `opus`, 48 kHz mono). Unset, the room advertises no voice and accepts no voice links. */
    voice?: boolean;
    /** Explicit H264 capture/decode/display adapter provision. Unset keeps camera capability off. */
    camera?: boolean;
    /** Trusted owner of actual JS callback, DOM, media and pending Promise disposal. */
    conversationHost?: (host: ConversationHost) => void;
}

/** What to do to a remote element (`SessionOptions.remote`). After `play`, report how `play()`
 *  settled with a `played` input carrying the same `attempt`. `rate` goes with `preservesPitch`
 *  off, so small corrections are resampled rather than time-stretched. */
export type RemoteCommand =
| { type: "observeSource"; sourceEpoch: string }
| { type: "play"; attempt: number }
| { type: "pause" }
| { type: "seek"; position: number }
| { type: "rate"; rate: number };

/** What a remote element reports, for `Session.playerInput`: a `reading` every 50 ms, and the rest
 *  as it happens. `ageMs` is how long ago it happened, on this page's clock. A reading with `ad`
 *  is of an ad the site is showing in the element; the room waits for it. */
export type PlayerInput =
| { type: "reading"; sourceEpoch?: string; buffered?: { start: number; end: number } | null; position: number; paused: boolean; seeking: boolean; ended: boolean; readyState: number; duration: number | null; ad?: boolean; ageMs: number }
| { type: "presentedFrame"; sourceEpoch: string; position: number; ageMs: number }
| { type: "sourceLost"; sourceEpoch: string; ageMs: number }
| { type: "signal"; signal: "seeked" | "waiting" | "stalled" | "canplay" | "playing" }
| { type: "played"; attempt: number; started: boolean }
| { type: "visibility"; hidden: boolean }
| { type: "gesture"; ageMs: number }
| { type: "session"; ageMs: number }
| { type: "resumed" }
| { type: "detached" };

export type ScheduledCommand =
| ({ type: "prepareShared"; epoch: string; program: number[] | null; cutoffMs: number; minCoverageUs: number; maxPcmBytes: number; assessedAtMs: number; clockUncertaintyUs: number; clockDriftPpm: number } & ScheduledAnchor & PreparationReference)
| { type: "rendererClosed" }
| { type: "realization"; effect: unknown }
| { type: "present"; preparation: PreparationReference | null; epoch: number; revision: number; acquire: boolean; program: number[] | null; beforeRunning: boolean; position: number; rate: number; paused: boolean; atMs: number; assessedAtMs: number; clockUncertaintyUs: number; clockDriftPpm: number; prior: ScheduledAnchor | null }
| ({ type: "prepare"; epoch: number; program: number[] | null; cutoffMs: number; minCoverageUs: number; maxPcmBytes: number; assessedAtMs: number; clockUncertaintyUs: number; clockDriftPpm: number } & ScheduledAnchor & PreparationReference)
| ({ type: "abortPreparation" } & PreparationReference)
| { type: "cancel"; epoch: number }
| { type: "play" } | { type: "pause" } | { type: "seek"; position: number }
| { type: "rate"; rate: number } | { type: "resume" }
| { type: "load"; media: string; title: string; position: number; paused: boolean }
| { type: "openOwn" };
export interface PreparationReference { id: string; digest: string }
export interface ScheduledAnchor { beforeRunning: boolean; position: number; rate: number; paused: boolean; atMs: number }
/** Renderer observations, never HTMLMediaElement estimates. Ready enables scheduling only after
 * the renderer has prepared its clock and buffers; it does not certify calibrated sound. */
export type ScheduledInput =
| { type: "realization"; feedback: unknown }
| { type: "policy"; policy: "compatibility" | "requirePrepared" }
| { type: "ready"; ready: true; rateEvidence: "physicalApplied"; rateTiming: { outputTailUs: number; deliveryMarginUs: number } }
| { type: "ready"; ready: false }
| { type: "reading"; position: number; paused: boolean; ageMs: number; uncertaintyUs: number; buffering: boolean; ended?: boolean; duration?: number | null }
| ({ type: "prepared"; revision: number; outputEpoch: number; issuedAtMs: number } & PreparationReference & (
{ status: "ready"; coverageUs: number; pcmBytes: number; validUntilMs: number } | { status: "rejected" | "revoked" }))
| { type: "failed"; message: string };

/** One Rust projection shared by every room surface. Person and Screen IDs are opaque and room scoped.
 * colour is a CSS hex RGB colour assigned by Rust; photoId is null until photos ship.
 * revision is an exact decimal string; repeated unchanged statuses retain it.
 * status.me.id selects Device.id and Screen.endpointId for this room endpoint;
 * it is never a DeviceControl identity or a roomPeople Person.id. */
export interface RoomPeople { version: 1; revision: string; people: RoomPerson[]; screens: RoomScreen[]; devices: RoomDevice[]; controlGrants: RoomControlGrant[] }
export interface RoomPerson { id: string; name: string; colour: string; photoId: string | null; host: boolean; deviceIds: string[]; screenIds: string[]; primaryScreenId: string | null; readiness: "ready" | "waiting" | "notWatching"; speaking: boolean }
export type RoomDeviceKind = "tv" | "phone" | "tablet" | "computer" | "browser" | "other";
export interface RoomScreen { id: string; endpointId: string; name: string; kind: RoomDeviceKind; personIds: string[]; connection: "connected" | "reconnecting"; playback: { programId: string | null; required: boolean; state: "ready" | "loading" | "held" | "unavailable" } }
export interface RoomDevice { id: string; personId: string | null; name: string; kind: RoomDeviceKind; connection: "connected" | "reconnecting"; functions: { playback: boolean; talk: boolean; remote: boolean } }
export interface RoomControlGrant { receiverId: string; requesterId: string; lifetime: "tonight" | "always" }

export interface Person { id: string; name: string; initials: string; hue: number; named: boolean }
/** The sync meter: `gapMs` from the room (+ ahead) give or take `errMs`, words for it, and `timing`, the figures short ("+3 ms ±1 ms"), for Show timings. */
export interface SyncBadge { level: "good" | "fair" | "poor" | "unknown" | "off" | "none"; label: string; detail: string; gapMs: number | null; errMs: number | null; timing: string | null }
/** How we reach a peer. `null` until a connection is established. */
export type LinkView =
| { type: "direct" }
| { type: "relayed"; relay: string }
| { type: "indirect" };
export type Role = "viewer" | "screen" | "remote";
/** Whether a player is on the room's video. */
export type Following = "yes" | "loading" | "off";

export interface InterruptionView { pauseSequence: string; pauseOrigin: number[]; by: Person; reason: "audioInterrupted" | "headphonesDisconnected"; votes: number; needed: number; message: string }

export interface PeerView { who: Person; away: boolean; role: Role; following: Following; rttMs: number | null; offsetMs: number | null; sync: SyncBadge; sameMedia: boolean; ready: boolean; stalled: boolean; link: LinkView | null }

/** A checked invite, and the room's own relay if it names one. */
export interface InviteInfo { ticket: string; relay: string | null; page: string | null; link: string }


/** Holds and source loading. Start phases and deadlines live only in EngineSnapshot. */
export type WaitingView =
| { type: "nobody" }
| { type: "stalled"; who: string[]; local: boolean; message: string }
| { type: "ad"; who: string[]; local: boolean; message: string }
| { type: "loading"; message: string };

export type RoomConnectionState = "connecting" | "connected" | "reconnecting" | "ended";
export type RoomNoticeData =
| { kind: "changed"; name: string | null; action: "play" | "pause" | "seek" | "load"; position_us: string }
| { kind: "memberJoined"; name: string; role: Role }
| { kind: "memberLeft"; name: string; left: boolean }
| { kind: "holding"; name: string | null; ad: boolean }
| { kind: "starting"; resuming: boolean }
| { kind: "gaveUp"; name: string | null };
export type SessionEvent =
| { type: "screenSeatOffered"; owner: string; transaction: string; offer: string; offerRevision: string }
| { type: "screenSeatFull"; offer: string }
| { type: "roomNotice"; notice: RoomNoticeData }
| { type: "peerJoined"; who: Person; message: string }
| { type: "peerLeft"; who: Person; message: string }
| { type: "changed"; who: Person; local: boolean; action: "play" | "pause" | "seek" | "load"; position: number; message: string }
| { type: "mediaMismatch"; who: Person; message: string }
| { type: "holding"; who: Person; local: boolean; message: string }
| { type: "gaveUp"; who: Person; local: boolean; message: string }
| { type: "streaming"; owner: string; hash: string; title: string; size: number }
| { type: "refused"; who: Person | null; reason: "newer" | "notMember" | "roomFull" | "other"; message: string }
| { type: "program"; loading: boolean; offProgram: boolean; unsupported: boolean; message: string | null }
| { type: "status"; engineSnapshot: import("../engine-view.js").EngineSnapshot; connection: RoomConnectionState; roomPeople: RoomPeople; away: boolean; interruption: InterruptionView | null; interruptionDeparted: string | null; me: Person; role: Role; following: Following; peers: PeerView[]; offsetMs: number | null; sync: SyncBadge; position: number; paused: boolean; title: string; duration: number | null; waiting: WaitingView }
| { type: "playback"; blocked: boolean }
| { type: "relayBlocked"; blocked: boolean }
| { type: "stopped"; error: string | null; message: string };


/** Canonical base-10 integer 1..18446744073709551615. */
export type CameraId = string;
/** Canonical base-10 integer 0..18446744073709551615. */
export type CameraSequence = string;
/** Canonical base-10 integer 0..9223372036854775807. */
export type CameraMicros = string;
/** Exactly 64 lowercase hexadecimal characters; authenticated endpoint member ID. */
export type CameraPeer = string;
export interface CameraProfile { height: number; fps: number; kbps: number }
export type CameraMessage =
| { type: "enable"; on: boolean }
| { type: "preview"; height: number }
| { type: "watch"; peer: CameraPeer; height: number }
| { type: "permission"; request: CameraId; granted: boolean }
| { type: "device"; available: boolean }
| { type: "started"; generation: CameraId }
| { type: "stopped"; generation: CameraId }
| { type: "lost"; generation: CameraId }
| { type: "decodeFailed"; link: CameraId; group: CameraId };
export type CameraCommand =
| { type: "permission"; request: CameraId }
| { type: "start"; generation: CameraId; profile: CameraProfile }
| { type: "reconfigure"; generation: CameraId; profile: CameraProfile }
| { type: "stop"; generation: CameraId }
| { type: "keyframe"; generation: CameraId };
export type CameraPoll =
| { state: "command"; command: CameraCommand }
| { state: "empty" }
| { state: "closed" };
export type CameraSendCode = -1 | 0 | 1 | 2;
export type CameraCaptureCode = -1 | 0 | 1 | 2;
export interface CameraPicture {
    peer: CameraPeer; link: CameraId; group: CameraId;
    captureUs: CameraMicros; keyframe: boolean; payload: Uint8Array;
}
export interface CameraPeerView {
    peer: CameraPeer; link: CameraId | null;
    on: boolean; unavailable: boolean; full: boolean; watching: number; live: boolean; relayBlocked: boolean;
}
export interface CameraView {
    /** Existing net request receiver has closed; not a hardware-release receipt. */
    closed: boolean;
    /** Shared local terminal admission fence. */
    ended: boolean;
    state: "off" | "asking" | "on" | "unavailable";
    captureLive: boolean; advertised: boolean;
    capturing: { generation: CameraId; profile: CameraProfile } | null;
    peers: CameraPeerView[];
    retirement: { captures: CameraId[]; links: number } | null;
}


// Generated from together_entry::Candidate. Do not edit manually.
export type EntryCandidate = { "type": "invite", ticket: string, link: string, lab: boolean, } | { "type": "pairing", url: string, } | { "type": "url", url: string, };


// Generated from together_web::tune_input. Do not edit manually.
export type TuneMiss = { "error": "quiet", prominence?: number, } | { "error": "split", prominence: number, splitMs: number, };
export type TuneResult = { offsetMs: number, prominence: number, splitMs: number, } | TuneMiss;


// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.

export type BodyAdmission = { owner: string, start: number, end: number, };

/**
 * Everything `sw.js` needs to build a `Response`, worked out in Rust.
 */
export type StreamHead = { admission: BodyAdmission | null, status: number, contentType: string,
/**
 * Set on 206 and 416.
 */
contentRange: string | null, contentLength: number,
/**
 * The bytes of the blob to send, empty when there is no body.
 */
start: number, end: number, };



/**
 * One response body, read a piece at a time.
 */
export class Body {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Refuse new chunks and drop an idle reader. An active original read is joined separately.
     */
    cancel(): void;
    /**
     * The same Promise API, backed by the original supervisor-owned read when attached.
     */
    next(): Promise<Uint8Array | undefined>;
}

/**
 * The page's side of a Session camera. No detached/public constructor and no membership
 * injection. One hardware owner polls commands; UI clones share this queue and gate.
 */
export class Camera {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Complete H264 Annex B access unit. Full consumes sequence; retrying it is invalid.
     * Check JS kinds and byte length before copying any payload into WASM-owned memory.
     */
    capture(generation: CameraId, sequence: CameraSequence, captureUs: CameraMicros, keyframe: boolean, payload: Uint8Array): CameraCaptureCode;
    /**
     * Seal local admissions; hardware still needs its owned cleanup and stop reports.
     */
    end(): void;
    fence(generation: CameraId): boolean;
    nowUs(): CameraMicros;
    permits(peer: CameraPeer, link: CameraId, group: CameraId): boolean;
    picture(): CameraPicture | null;
    poll(): CameraPoll;
    send(message: CameraMessage): CameraSendCode;
    view(): CameraView;
}

/**
 * Typed capability for the SAME admitted host owner. Only its trusted JS scope may
 * acknowledge retirement after its actual callback/output/read bodies have drained.
 */
export class ConversationHost {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    close(): void;
    retired(): boolean;
}

export class ConversationView {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Terminal fence; does not itself leave the room or alter playback.
     */
    close(): void;
    /**
     * Synchronous loss fence. The page must also clear already-rendered text in the same turn.
     * A later known-context update is admitted only by the owning Rust session.
     */
    invalidate(): void;
    snapshot(): string;
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

export class Plan {
    free(): void;
    [Symbol.dispose](): void;
    cancel(root_hmac: Uint8Array): void;
    static create(invite: string, id: Uint8Array, root_hmac: Uint8Array, profile: string, editors: string, draft: string): Plan;
    static creationChallenge(invite: string): Uint8Array;
    diagnostics(): string;
    editNotes(root_hmac: Uint8Array, text?: string | null): string;
    edit(root_hmac: Uint8Array, draft: string): void;
    importReply(fragment: string): PlanReply;
    invite(): string;
    keyChallenge(): Uint8Array;
    makerEpoch(root_hmac: Uint8Array, editors: string, reinstate: boolean): void;
    merge(fragment: string): void;
    constructor(fragment: string);
    occurrences(after_ms: string, limit: number): string;
    permissions(root_hmac: Uint8Array): string;
    personId(root_hmac: Uint8Array): string;
    presenceSnapshot(now_ms: string): string;
    replyFragments(): string;
    reply(root_hmac: Uint8Array, profile: string, going: boolean, previous?: string | null): PlanReply;
    retainReply(fragment: string): void;
    roomInvite(): string;
    snapshot(): string;
    summary(now_ms: string): string;
}

export class PlanReply {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    fragment(): string;
    merge(other: PlanReply): void;
    snapshot(): string;
}

export class Session {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * A receiver confirms the exact signed offer from screenSeatOffered, never its latest alias.
     */
    acceptScreenSeat(offer: string, transaction: string): void;
    /**
     * Acquire authority for exactly the installed owner the caller already observed.
     * Synchronous metadata only; no reader, observation, fetch or store clone.
     */
    acquireStreamLease(expected: string): StreamLease;
    /**
     * Ask the room to take the copy `takeOwnCopy` answered `"adopt"` for as ours, for the film it
     * was judged against. The driver asks again, at that moment, whether the room still has that
     * film open under the same binding and whether the copy policy takes the copy for it; only
     * then does our media change. Resolves `"adopted"`: our copy now answers for the open film,
     * nothing new is fetched, and the stream already installed stays readable for the renderer
     * still playing it until `retireStream`. Otherwise `"stale"`, and nothing changed.
     */
    adoptOwnCopy(): Promise<"adopted" | "stale">;
    /**
     * Stop checking a copy of our own: the check reads no more of its file and never answers.
     */
    cancelOwnCopyCheck(): void;
    /**
     * Cancel the exact displayed operation, retaining the source captured by this press.
     */
    cancelStart(occurrence: string, operation: string): void;
    /**
     * Check `file`, a copy of our own, against the film the room has open, changing nothing here:
     * our place in the room and what we play stay as they are. `duration` is the file's, in
     * seconds, if the browser knows it. Resolves to `"matching"` only when the room's copy policy
     * takes it for that film, `"other"` for a different film, and `"unknown"` when the room has no
     * film open that a copy could be. Rejects when the file can't be read, and once the check is
     * cancelled, replaced by another or its session ends; it then reads no more of the file.
     */
    checkOwnCopy(file: File, duration?: number | null): Promise<"matching" | "other" | "unknown">;
    /**
     * Explicit watching-here choice, independent of screen-control grants.
     */
    chooseScreenSeat(screen: string, transaction: string, watching: boolean, primary: boolean): void;
    /**
     * The room's clock in milliseconds: the same clock `startsAt` is on.
     *
     * A countdown is an instant, not a duration, so read it from here rather than starting a
     * timer when the event arrives — otherwise the last second drifts by however long the
     * message took to be delivered and handled.
     */
    clockMs(): number;
    /**
     * Current source/renderer identity only. The caller must separately prove a fresh actual
     * frame against the loaded source. Unknown never means an empty/no-video room.
     */
    conversationContext(): string;
    /**
     * Bounded conversation command; unavailable until the platform/transport gate is qualified.
     */
    conversationRequest(command: string): string;
    /**
     * Start a new room.
     */
    static host(options: SessionOptions): Promise<Session>;
    /**
     * Join a room from an invite: a `watch…` ticket or a link containing one.
     */
    static join(invite: string, options: SessionOptions): Promise<Session>;
    /**
     * Leave the room. Resolves when the original room owner stops.
     * The camera adapter separately owns its physical cleanup and joins.
     */
    leave(): Promise<void>;
    /**
     * One fresh, post-consumption validated-range observation. Arbitrary byte ranges remain
     * unqualified for executed cold seek: the actual decoder has no validated packet map.
     */
    observeSeek(action: string, start: number, end: number): Promise<string>;
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
     * Begin taking the scheduled renderer off the output, for a copy of our own adopted in place:
     * its generation, for `transferScheduledRenderer` once the page has closed it (its output
     * context closed). Until then it stays attached and nothing else replaces it, and its silence
     * while it closes is waited out, within the renderer's retirement bound, rather than failing
     * the room.
     */
    retireScheduledRenderer(): number;
    /**
     * The renderer has moved off the room's copy, after `adoptOwnCopy`: stop serving its stream
     * and let go of what it held. False when there is no such stream to retire.
     */
    retireStream(): boolean;
    /**
     * An observation or readiness change from the scheduled renderer.
     */
    scheduledInput(input: ScheduledInput): void;
    /**
     * Immutable JSON text for automation: exact integer identities never cross as JS Numbers.
     * Polling does not seek or observe storage. Pending consumption expires independently in 5s.
     */
    seekEvidence(action: string): string;
    /**
     * One ordinary seek, optionally returning its diagnostic action ID. None means evidence
     * unavailable (or a nonfinite input), never permission to retry the action.
     */
    seekWithEvidence(seconds: number): string | undefined;
    /**
     * Move everyone to `seconds`.
     */
    seek(seconds: number): void;
    /**
     * Say how late this browser's sound runs, in milliseconds, while the room is running: a tune
     * that finished after the room started. Replaces the `outputDelay` it was opened with.
     */
    setOutputDelay(ms: number): void;
    /**
     * Replace a local media element with its decoded per-program renderer while preserving
     * this room and its stream owner. Unsupported decoding must be detected before calling.
     */
    setScheduledRenderer(callback: Function): void;
    /**
     * Start this occurrence without adding a scheduled-plan policy in the browser.
     */
    startNow(occurrence: string): void;
    /**
     * Override the exact displayed start operation; Core decides whether it is still current.
     */
    startWithout(occurrence: string, operation: string): void;
    /**
     * The body for a `StreamHead`, read a piece at a time. Cancel it to stop downloading for a
     * response the browser has abandoned.
     */
    streamBody(admission: BodyAdmission): Body;
    /**
     * Guard every future decoder head against same-hash reinstallation and binding changes.
     */
    streamHeadOwned(hash: string, range: string | null | undefined, expected: string): StreamHead;
    /**
     * What to answer a Service Worker request for `hash` of the streamed film, as a
     * `StreamHead`. Anything but the film we are streaming gets a 404.
     */
    streamHead(hash: string, range?: string | null): StreamHead;
    /**
     * Take the copy the last matching `checkOwnCopy` accepted, if the room still has the film it
     * was judged against open. `"local"`: it is the very bytes of the stream we play, and they are
     * read from it from now on, with nothing else changing. `"elsewhere"`: the film is still open,
     * but taking it would change what we play, which this session can't do in place; nothing
     * changes. `"stale"`: the room's film or our stream of it changed since the check, or nothing
     * was accepted; nothing changes. Answers once for each acceptance.
     *
     * `"adopt"` stands for `"elsewhere"` in a session streaming the room's copy: nothing has changed
     * yet, and `adoptOwnCopy` asks the room to take the copy as ours, in place.
     */
    takeOwnCopy(): "local" | "adopt" | "elsewhere" | "stale";
    /**
     * Attach `callback`, a scheduled renderer prepared for our own copy, in place of the one
     * `retireScheduledRenderer` named, which the page has physically closed. Only that generation,
     * and only once; the new renderer waits for its own profile barrier.
     */
    transferScheduledRenderer(retired: number, callback: Function): void;
    /**
     * Camera, only when a real page adapter explicitly requested provisioning.
     */
    readonly camera: Camera | undefined;
    /**
     * Rejoin through another member rather than this endpoint after it closes.
     */
    readonly rejoinTicket: string | undefined;
    /**
     * The host of the relay our invite names, which joiners use unless they have their own.
     */
    readonly relay: string | undefined;
    /**
     * The ticket others join with. Anyone in a room can invite; it keeps working after the
     * original host leaves, as long as this session is open.
     */
    readonly ticket: string;
    /**
     * Voice, when `SessionOptions.voice` asked for it; otherwise undefined.
     */
    readonly voice: Voice | undefined;
}

/**
 * Managed source capability. No wasm constructor and no caller-authored predicate.
 * Cloning the parent's admitted Open retains its identity; close only revokes this lease.
 */
export class StreamLease {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    close(): void;
    current(): boolean;
    readonly owner: string;
    readonly size: number;
}

/**
 * The page's side of the room's voice. Explicit: nothing is captured until `join`, the
 * permission the page reports, and a `startCapture` it acknowledges.
 */
export class Voice {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * One Opus packet (20 ms, 48 kHz mono) from capture `generation`, captured at
     * `captureUs` on `nowUs`'s clock. 0 sent, 1 stale generation, 2 saturated (dropped),
     * -1 invalid.
     */
    capture(generation: number, captureUs: number, packet: Uint8Array): number;
    /**
     * How many reports the voice task has consumed.
     */
    consumed(): number;
    /**
     * Stop `generation`'s frames at once on a capture loss, before reporting it. False if it
     * wasn't the running one.
     */
    fence(generation: number): boolean;
    /**
     * Join voice. `full` until an earlier leave's `departed` has been polled and every report
     * sent before it consumed.
     */
    join(): VoiceSent;
    /**
     * Leave voice: a numbered departure.
     */
    leave(): VoiceSent;
    /**
     * Muting stops capture, so the browser's microphone indicator tells the truth.
     */
    mute(muted: boolean): VoiceSent;
    /**
     * The room clock in microseconds, to stamp captured packets with.
     */
    nowUs(): number;
    /**
     * The next command, or null.
     */
    poll(): VoiceCommand | null;
    /**
     * What to decode for the next 20 ms of output, per admitted voice link; null when the
     * voice task doesn't answer (play silence).
     */
    pull(): Promise<VoiceTalker[] | null>;
    /**
     * A report or request.
     */
    send(report: VoiceReport): VoiceSent;
    view(): VoiceView;
}

/**
 * The same bounded, localized display-name list used by native and the CLI.
 */
export function formatNames(names: string[]): string;

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
 * The invite as the link everyone copies, with the web page the room is watching in it where
 * there is one (a room on a site's own player): opening the link opens that page and joins.
 */
export function inviteLink(invite: string, page?: string | null): string;

/**
 * Validate an invite (a ticket or a link containing one) and return the bare ticket.
 */
export function parseInvite(invite: string): string;

/**
 * `text` as a QR code: an SVG, black on white with its quiet zone, that scales to any size.
 */
export function qrSvg(text: string): string;

/**
 * The room's last lines of log at `info` and above, oldest first, each after its time in
 * milliseconds since the epoch: kept whatever `?log=` asks the console for, so a failure can be
 * read afterwards from wherever the room runs (the extension's host has no address to ask with).
 */
export function recentLog(): string;

/**
 * Validate an invite (a ticket or a link containing one) and return the bare ticket.
 */
export function recognizeEntry(text: string): EntryCandidate[];

export function start(): void;

export function tuneHear(samples: Float32Array, rate: number, anchor_index: Uint32Array, anchor_ms: Float64Array, expected_ms: number): TuneResult;

/**
 * The probe itself, at `rate`: for the page to draw where the microphone should have heard it.
 */
export function tuneProbe(rate: number): Float32Array;

/**
 * Play `url` (a probe track, [`tune_probe_track`], its probe `lead` seconds in: [`PROBE_LEAD`]) in
 * `video`, read it as a room would, and say when its readings put the probe starting, in epoch ms,
 * as a one-element array. The element must already be allowed to play sound (the page primes it
 * in the click that started tuning).
 */
export function tuneProbePlay(video: HTMLVideoElement, url: string, lead: number): Promise<Float64Array>;

/**
 * The tuning probe: one sweep, [`PROBE_LEAD`] seconds in, as a WAV file ([`tune::probe_track`]).
 */
export function tuneProbeTrack(): Uint8Array;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_body_free: (a: number, b: number) => void;
    readonly __wbg_camera_free: (a: number, b: number) => void;
    readonly __wbg_conversationhost_free: (a: number, b: number) => void;
    readonly __wbg_conversationview_free: (a: number, b: number) => void;
    readonly __wbg_intounderlyingbytesource_free: (a: number, b: number) => void;
    readonly __wbg_intounderlyingsink_free: (a: number, b: number) => void;
    readonly __wbg_intounderlyingsource_free: (a: number, b: number) => void;
    readonly __wbg_plan_free: (a: number, b: number) => void;
    readonly __wbg_planreply_free: (a: number, b: number) => void;
    readonly __wbg_session_free: (a: number, b: number) => void;
    readonly __wbg_streamlease_free: (a: number, b: number) => void;
    readonly __wbg_voice_free: (a: number, b: number) => void;
    readonly body_cancel: (a: number) => void;
    readonly body_next: (a: number) => number;
    readonly camera_capture: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
    readonly camera_end: (a: number) => void;
    readonly camera_fence: (a: number, b: number) => number;
    readonly camera_nowUs: (a: number, b: number) => void;
    readonly camera_permits: (a: number, b: number, c: number, d: number) => number;
    readonly camera_picture: (a: number) => number;
    readonly camera_poll: (a: number) => number;
    readonly camera_send: (a: number, b: number) => number;
    readonly camera_view: (a: number) => number;
    readonly conversationhost_close: (a: number) => void;
    readonly conversationhost_retired: (a: number) => number;
    readonly conversationview_close: (a: number) => void;
    readonly conversationview_invalidate: (a: number, b: number) => void;
    readonly conversationview_snapshot: (a: number, b: number) => void;
    readonly formatNames: (a: number, b: number, c: number) => void;
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
    readonly inviteLink: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly parseInvite: (a: number, b: number, c: number) => void;
    readonly plan_cancel: (a: number, b: number, c: number, d: number) => void;
    readonly plan_create: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number) => void;
    readonly plan_creationChallenge: (a: number, b: number, c: number) => void;
    readonly plan_diagnostics: (a: number, b: number) => void;
    readonly plan_edit: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly plan_editNotes: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly plan_importReply: (a: number, b: number, c: number, d: number) => void;
    readonly plan_invite: (a: number, b: number) => void;
    readonly plan_keyChallenge: (a: number, b: number) => void;
    readonly plan_makerEpoch: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly plan_merge: (a: number, b: number, c: number, d: number) => void;
    readonly plan_new: (a: number, b: number, c: number) => void;
    readonly plan_occurrences: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly plan_permissions: (a: number, b: number, c: number, d: number) => void;
    readonly plan_personId: (a: number, b: number, c: number, d: number) => void;
    readonly plan_presenceSnapshot: (a: number, b: number, c: number, d: number) => void;
    readonly plan_reply: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
    readonly plan_replyFragments: (a: number, b: number) => void;
    readonly plan_retainReply: (a: number, b: number, c: number, d: number) => void;
    readonly plan_roomInvite: (a: number, b: number) => void;
    readonly plan_snapshot: (a: number, b: number) => void;
    readonly plan_summary: (a: number, b: number, c: number, d: number) => void;
    readonly planreply_fragment: (a: number, b: number) => void;
    readonly planreply_merge: (a: number, b: number, c: number) => void;
    readonly planreply_snapshot: (a: number, b: number) => void;
    readonly qrSvg: (a: number, b: number, c: number) => void;
    readonly recentLog: (a: number) => void;
    readonly recognizeEntry: (a: number, b: number, c: number) => void;
    readonly session_acceptScreenSeat: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly session_acquireStreamLease: (a: number, b: number, c: number, d: number) => void;
    readonly session_adoptOwnCopy: (a: number) => number;
    readonly session_camera: (a: number) => number;
    readonly session_cancelOwnCopyCheck: (a: number) => void;
    readonly session_cancelStart: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly session_checkOwnCopy: (a: number, b: number, c: number, d: number) => number;
    readonly session_chooseScreenSeat: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
    readonly session_clockMs: (a: number) => number;
    readonly session_conversationContext: (a: number, b: number) => void;
    readonly session_conversationRequest: (a: number, b: number, c: number, d: number) => void;
    readonly session_host: (a: number) => number;
    readonly session_join: (a: number, b: number, c: number) => number;
    readonly session_leave: (a: number) => number;
    readonly session_observeSeek: (a: number, b: number, c: number, d: number, e: number) => number;
    readonly session_onEvent: (a: number, b: number) => void;
    readonly session_pause: (a: number) => void;
    readonly session_play: (a: number) => void;
    readonly session_playerInput: (a: number, b: number, c: number) => void;
    readonly session_rejoinTicket: (a: number, b: number) => void;
    readonly session_relay: (a: number, b: number) => void;
    readonly session_resumePlayback: (a: number) => void;
    readonly session_retireScheduledRenderer: (a: number, b: number) => void;
    readonly session_retireStream: (a: number) => number;
    readonly session_scheduledInput: (a: number, b: number, c: number) => void;
    readonly session_seek: (a: number, b: number) => void;
    readonly session_seekEvidence: (a: number, b: number, c: number, d: number) => void;
    readonly session_seekWithEvidence: (a: number, b: number, c: number) => void;
    readonly session_setOutputDelay: (a: number, b: number) => void;
    readonly session_setScheduledRenderer: (a: number, b: number, c: number) => void;
    readonly session_startNow: (a: number, b: number, c: number) => void;
    readonly session_startWithout: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly session_streamBody: (a: number, b: number, c: number) => void;
    readonly session_streamHead: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly session_streamHeadOwned: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
    readonly session_takeOwnCopy: (a: number, b: number) => void;
    readonly session_ticket: (a: number, b: number) => void;
    readonly session_transferScheduledRenderer: (a: number, b: number, c: number, d: number) => void;
    readonly session_voice: (a: number) => number;
    readonly start: () => void;
    readonly streamlease_close: (a: number) => void;
    readonly streamlease_current: (a: number) => number;
    readonly streamlease_owner: (a: number, b: number) => void;
    readonly streamlease_size: (a: number) => number;
    readonly tuneHear: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
    readonly tuneProbe: (a: number, b: number) => void;
    readonly tuneProbePlay: (a: number, b: number, c: number, d: number) => number;
    readonly tuneProbeTrack: (a: number) => void;
    readonly voice_capture: (a: number, b: number, c: number, d: number, e: number) => number;
    readonly voice_consumed: (a: number) => number;
    readonly voice_fence: (a: number, b: number) => number;
    readonly voice_join: (a: number) => number;
    readonly voice_leave: (a: number) => number;
    readonly voice_mute: (a: number, b: number) => number;
    readonly voice_nowUs: (a: number) => number;
    readonly voice_poll: (a: number) => number;
    readonly voice_pull: (a: number) => number;
    readonly voice_send: (a: number, b: number) => number;
    readonly voice_view: (a: number) => number;
    readonly ring_core_0_17_14__bn_mul_mont: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly __wasm_bindgen_func_elem_2006: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_28067: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_28069: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_16390: (a: number, b: number, c: number) => void;
    readonly __wasm_bindgen_func_elem_19050: (a: number, b: number, c: number) => void;
    readonly __wasm_bindgen_func_elem_2005: (a: number, b: number, c: number) => void;
    readonly __wasm_bindgen_func_elem_20720: (a: number, b: number, c: number) => void;
    readonly __wasm_bindgen_func_elem_18842: (a: number, b: number) => void;
    readonly __wasm_bindgen_func_elem_19936: (a: number, b: number) => void;
    readonly __wasm_bindgen_func_elem_20026: (a: number, b: number) => void;
    readonly __wasm_bindgen_func_elem_27914: (a: number, b: number) => void;
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
