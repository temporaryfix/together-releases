// Room view and media controls. Navigation returns through the owner's onLeave callback.
import { Lifecycle, disposeSession } from "./lifecycle.js";
import { backend } from "./backend.js";
import { MediaLoadError, streamSource } from "./media.js";
import { outputDelayMs } from "./tune.js";
import { t } from "./copy.js";
import { h, icon, log, nudge, paintRange, prefs, setIcon } from "./ui.js";
import { $, screens, showScreen, setBusy, setError } from "./screens.js";

const wasm = backend.ready;
const formatTime = (seconds) => backend.formatTime(seconds);

/** Seconds of media buffered past the playhead. */
function bufferedAhead(video) {
  const { buffered, currentTime } = video;
  for (let i = 0; i < buffered.length; i++) {
    if (buffered.start(i) <= currentTime && currentTime <= buffered.end(i)) return +(buffered.end(i) - currentTime).toFixed(2);
  }
  return 0;
}

const IDLE_AFTER_MS = 2800;
const SEEK_STEP = 5;
const SLOW_CONNECT_MS = 12000;
/** A joiner hears about everyone already in the room at once; the strip shows them, no toasts. */
const ARRIVAL_QUIET_MS = 5000;
/** How long the controls show a play, pause or seek we asked for before the video has made it. */
const INTENT_MS = 1000;


/** How long the countdown's last beat stays on screen after playback starts. */
const GO_MS = 500;

export class Room {
  constructor(root, onLeave) {
    this.onLeave = onLeave;
    this.root = root;
    this.stage = $("[data-stage]", root);
    this.video = $("[data-video]", root);
    this.overlay = $("[data-overlay]", root);
    this.play = $("[data-play]", root);
    this.scrubber = $("[data-scrubber]", root);
    this.current = $("[data-current]", root);
    this.duration = $("[data-duration]", root);
    this.mute = $("[data-mute]", root);
    this.volume = $("[data-volume]", root);
    this.fullscreen = $("[data-fullscreen]", root);
    this.inviteButton = $("[data-invite]", root);
    this.popover = $("[data-invite-popover]", root);
    this.invite = $("together-invite", root);
    this.mismatch = $("[data-mismatch]", root);
    this.readyControl = $("[data-ready-control]", root);
    this.readyButton = $("[data-ready]", root);
    this.readyElement = $("together-ready", root);
    this.readyNote = $("[data-ready-note]", root);
    this.readyTitle = $("[data-ready-title]", root);
    this.toasts = $("together-toasts", root);
    this.session = undefined;
    this.lifecycle = new Lifecycle();
    this.bind();
  }

  get isOpen() {
    return !this.root.hidden;
  }

  /** Enter a room: load the media, then host or join. Ignored while a room is open or opening. */
  async open({ source, stream, name, invite, from }) {
    const operation = this.lifecycle.begin();
    if (!operation) return;
    this.active = true;
    this.reset();
    this.isHost = !invite;
    this.phase = "starting";
    // Streaming joiners don't know what they're watching until someone in the room offers it.
    this.awaitingFilm = Boolean(stream);
    setBusy(from, true);
    // The room screen formats times through wasm, so it can't open before wasm has loaded.
    try {
      await wasm;
      if (!this.lifecycle.owns(operation)) return;
    } catch {
      if (!this.lifecycle.owns(operation)) return;
      this.close();
      setBusy(from, false);
      setError(from, t("backend-load-failed"));
      return;
    }

    if (source) {
      this.show(source);
      try {
        await source.attach(this.video);
        if (!this.lifecycle.owns(operation)) return;
      } catch (error) {
        if (!this.lifecycle.owns(operation)) return;
        setBusy(from, false);
        setError(from, error instanceof MediaLoadError ? error.message : t("ui-that-file-couldn-t-be-opened"));
        this.close();
        return;
      }
    }
    setBusy(from, false);
    showScreen("room");
    this.animate();
    this.syncControls();
    this.renderOverlay();

    try {
      await wasm;
      const options = {
        video: this.video,
        name,
        stream: Boolean(stream),
        relay: prefs.relay || undefined,
        title: source?.title,
        duration: source && this.video.duration,
        size: source?.size,
        file: source?.file,
        outputDelay: await outputDelayMs(),
      };
      if (!this.lifecycle.owns(operation)) return;
      this.tuneMs = options.outputDelay;
      log.info(invite ? "joining a room" : "hosting a room", {
        stream: options.stream,
        relay: options.relay ?? "public",
        title: options.title,
        duration: options.duration,
        size: options.size,
      });
      const session = invite ? await backend.join(invite, options) : await backend.host(options);
      if (!this.lifecycle.owns(operation)) {
        await disposeSession(session).catch((error) => log.error("couldn’t leave the old room", error));
        return;
      }
      this.session = session;
    } catch (error) {
      if (!this.lifecycle.owns(operation)) return;
      log.error("couldn’t open the room", error);
      this.close();
      showScreen(from === screens.invited ? "invited" : "landing");
      setError(from, error.message || t("ui-couldn-t-open-the-room"));
      return;
    }

    this.phase = "live";
    this.openedAt = performance.now();
    this.slowTimer = setTimeout(() => this.renderOverlay(), SLOW_CONNECT_MS);
    this.showInvite(backend.inviteLink(this.session.ticket));
    this.inviteButton.disabled = false;
    this.session.onEvent((event) => {
      if (this.lifecycle.owns(operation)) this.handle(event);
    });
    this.renderOverlay();
    this.wake();
  }

  /** Leave the room. `keepInvite` goes back to the invite screen rather than the start. */
  async leave({ keepInvite = false } = {}) {
    const session = this.session;
    this.session = undefined;
    // Invalidate pending work before waiting for the transport. A new room can open immediately.
    this.close();
    if (!keepInvite) history.pushState(null, "", location.pathname + location.search);
    this.onLeave();
    if (session) {
      log.info("leaving the room");
      await disposeSession(session).catch((error) => log.error("couldn’t leave the room", error));
    }
  }

  /** Take `source` as the room's video. */
  show(source) {
    this.source = source;
    $("[data-title]", this.root).textContent = source.title;
    document.title = `${source.title} · Together`;
  }

  /** Someone in the room offered a copy: play it as it arrives. */
  async startStreaming(event) {
    if (!this.session || this.source) return;
    const source = streamSource(this.session, event);
    this.show(source);
    this.awaitingFilm = false;
    this.renderOverlay();
    try {
      await source.attach(this.video);
    } catch (error) {
      if (this.source !== source) return;
      this.streamError = error.message;
    }
    if (this.source === source) this.renderOverlay();
  }

  /** Tear down everything local. */
  close() {
    this.lifecycle.cancel();
    this.active = false;
    clearTimeout(this.slowTimer);
    clearTimeout(this.idleTimer);
    clearTimeout(this.clickTimer);
    clearTimeout(this.intentTimer);
    cancelAnimationFrame(this.frame);
    this.video.pause();
    this.video.removeAttribute("src");
    this.video.load();
    this.source?.release();
    this.source = undefined;
    if (document.fullscreenElement) document.exitFullscreen?.();
    if (this.popover.matches(":popover-open")) this.popover.hidePopover();
    document.title = t("ui-together");
  }

  reset() {
    this.phase = "starting";
    this.intent = undefined;
    this.scrubbing = false;
    this.source = undefined;
    this.awaitingFilm = false;
    this.streamError = undefined;
    this.relayBlocked = false;
    this.program = undefined;
    this.refused = undefined;
    this.role = "viewer";
    this.me = undefined;
    this.mySync = undefined;
    this.peers = new Map();
    /** People who joined before their name arrived: their arrival is said once it has. */
    this.unannounced = new Set();
    this.hadPeers = false;
    this.ready = undefined;
    this.waiting = undefined;
    this.starting = undefined;
    this.blocked = false;
    this.stopped = undefined;
    this.overlayKey = undefined;
    this.pendingSeek = undefined;
    $("together-people", this.root).clear();
    this.toasts.clear();
    this.mismatch.hidden = true;
    this.readyControl.hidden = true;
    this.inviteButton.disabled = true;
    this.invite.setLink("");
    this.stage.classList.remove("is-idle");
  }

  // --- Room events ---------------------------------------------------------------------------

  handle(event) {
    if (event.type === "status") log.trace("status", event);
    else log.info(`event: ${event.type}`, event);
    switch (event.type) {
      case "status":
        this.me = event.me;
        this.mySync = event.sync;
        this.role = event.role ?? "viewer";
        this.following = event.following ?? "yes";
        this.peers = new Map(event.peers.map((peer) => [peer.who.id, peer]));
        if (this.peers.size > 0) this.hadPeers = true;
        this.ready = event.ready;
        this.waiting = event.waiting;
        // A countdown someone interrupted is over; one still in flight keeps its instant.
        if (event.waiting.type === "starting") this.startCountdown(event.waiting);
        else if (event.paused) this.starting = undefined;
        this.renderPeople();
        this.renderReady();
        break;
      case "peerJoined":
        this.hadPeers = true;
        if (!this.peers.has(event.who.id)) {
          this.peers.set(event.who.id, { who: event.who, sync: { level: "unknown", label: t("sync-measuring"), detail: t("sync-measuring-detail") } });
        }
        if (event.who.named === false) this.unannounced.add(event.who.id);
        this.renderPeople();
        if (this.settled() && event.who.named !== false) this.toasts.show(event.message, { person: event.who });
        break;
      case "peerLeft":
        this.peers.delete(event.who.id);
        // Someone who never showed, because their name never came, leaves without a word.
        if (!this.unannounced.delete(event.who.id)) this.toasts.show(event.message, { person: event.who });
        this.renderPeople();
        break;
      case "changed":
        if (!event.local) this.toasts.show(event.message, { person: event.who, key: `${event.who.id}:${event.action}` });
        break;
      case "mediaMismatch":
        this.showMismatch(event);
        break;
      case "ready":
        // Everyone's answer arrives at once when you join; the rail already shows them.
        if (!event.local && this.settled()) {
          this.toasts.show(event.message, { person: event.who, key: `ready:${event.who.id}` });
        }
        break;
      case "holding":
        // Say it the moment the room decides; the next status confirms or clears it.
        this.waiting = { type: "stalled", who: [event.who.name], local: event.local, message: event.message };
        break;
      case "starting":
        this.startCountdown(event);
        break;
      case "gaveUp":
        this.toasts.show(event.message, { icon: "i-alert", key: `gaveUp:${event.who.id}` });
        break;
      case "streaming":
        this.startStreaming(event);
        break;
      case "relayBlocked":
        this.relayBlocked = event.blocked;
        break;
      case "playback":
        this.blocked = event.blocked;
        this.renderPeople();
        break;
      case "program":
        this.program = event.message ? event : undefined;
        break;
      case "refused":
        this.refuse(event);
        break;
      case "stopped":
        this.phase = "stopped";
        this.stopped = event;
        break;
    }
    this.renderReady();
    this.renderOverlay();
  }

  renderPeople() {
    $("together-people", this.root).update({
      me: this.me, role: this.role, sync: this.mySync, blocked: this.blocked,
      waiting: this.waiting, ready: this.ready, peers: [...this.peers.values()],
    }, {
      timings: prefs.timings, tuneMs: this.tuneMs,
      onArrival: (who) => {
        if (this.unannounced.delete(who.id) && this.settled()) {
          this.toasts.show(t("member-joined", { name: who.name }), { person: who });
        }
      },
    });
  }

  /** Whether we've been here long enough for what happens to be news rather than arrival. */
  settled() {
    return this.isHost || performance.now() - this.openedAt > ARRIVAL_QUIET_MS;
  }

  /** The ready control: who has said they're ready, and the way to say it yourself. */
  renderReady() {
    const ready = this.ready;
    // Only worth asking once there's somebody to start with, and while nothing else is on screen.
    const show =
      Boolean(ready?.open) && this.peers.size > 0 && !this.starting && !["stalled", "ad", "loading"].includes(this.waiting?.type) && !this.program;
    this.readyControl.hidden = !show;
    this.stage.classList.toggle("is-asking", show);
    if (!show) return;
    const mine = ready.mine;
    const others = this.waiting?.type === "ready" ? this.waiting.message : "";
    const title = t(mine ? "ready-title-mine" : "ready-title");
    const note = mine ? others || t("ready-count", ready) : t("ready-instructions");
    if (this.readyTitle.textContent !== title) {
      // Answering changes what the prompt says; let it land rather than blink.
      const answered = this.readyTitle.textContent !== "";
      this.readyTitle.textContent = title;
      if (answered) nudge(this.readyTitle, [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }]);
    }
    if (this.readyNote.textContent !== note) {
      this.readyNote.textContent = note;
      nudge(this.readyNote, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: "ease-out" });
    }
    this.readyElement.update({ mine, open: show });
  }

  toggleReady() {
    if (!this.session || !this.ready?.open) return;
    log.info(this.ready.mine ? "you pressed: not ready" : "you pressed: ready");
    this.session.setReady(!this.ready.mine);
    // Don't wait for the next status to acknowledge the press.
    this.ready = { ...this.ready, mine: !this.ready.mine };
    this.renderReady();
    this.wake();
  }

  /** Follow a countdown by the instant it lands on, not by a timer started when we heard. */
  startCountdown({ startsAt, resuming, message }) {
    this.starting = { startsAt, resuming, message };
    this.renderOverlay();
  }

  /** Where the countdown is now: `undefined` once it has landed and the flourish is done. */
  countdown() {
    if (!this.starting || !this.session) return undefined;
    const left = this.starting.startsAt - this.session.clockMs();
    if (left < -GO_MS) {
      this.starting = undefined;
      return undefined;
    }
    return { ...this.starting, left, tick: Math.max(0, Math.ceil(left / 1000)) };
  }

  /**
   * Someone turned us away (§4.4). Before we're in, it's the end of joining; once we're watching
   * with others, it's news about one link, and the room carries on.
   */
  refuse(event) {
    if (!this.hadPeers) {
      this.refused = event;
      return;
    }
    this.toasts.show(event.message, { person: event.who ?? undefined, icon: event.who ? undefined : "i-alert", key: `refused:${event.reason}` });
  }

  showMismatch(event) {
    $("[data-mismatch-title]", this.root).textContent = event.message;
    $("[data-mismatch-text]", this.root).textContent =
      t("ui-check-you-both-opened-the-same-file");
    this.mismatch.hidden = false;
  }

  // --- Overlay states ------------------------------------------------------------------------

  renderOverlay() {
    const state = this.overlayState();
    const key = state && `${state.kind}:${state.slow ?? ""}:${state.title ?? ""}:${state.tick ?? ""}`;
    if (key === this.overlayKey) return;
    this.overlayKey = key;
    if (!state) {
      this.overlay.hidden = true;
      this.overlay.removeAttribute("data-kind");
      this.overlay.replaceChildren();
      return;
    }
    this.overlay.hidden = false;
    this.overlay.dataset.kind = state.kind;
    this.overlay.classList.toggle("is-clear", state.clear === true);
    this.overlay.replaceChildren(state.render());
  }

  overlayState() {
    const leaveForOwnCopy = (primary = true) =>
      h(
        "button",
        { class: primary ? "btn btn-primary" : "btn btn-secondary", type: "button", onclick: () => this.leave({ keepInvite: true }) },
        t("ui-open-my-own-copy"),
      );
    if (this.phase === "stopped" && this.stopped?.error) {
      return {
        kind: "stopped",
        render: () =>
          card({
            mark: markLonely(),
            title: t("room-disconnected"),
            text: this.stopped.message,
            action: h("button", { class: "btn btn-primary", type: "button", onclick: () => this.leave() }, t("ui-back-to-start")),
          }),
      };
    }
    if (this.phase === "starting") {
      return { kind: "starting", render: () => card({ mark: markPulse(), title: t("room-connecting") }) };
    }
    if (this.blocked) {
      return {
        kind: "blocked",
        render: () =>
          h(
            "button",
            { class: "join-playback", type: "button", onclick: () => this.session?.resumePlayback() },
            h("span", { class: "join-playback-disc" }, icon("i-play")),
            h("span", { class: "overlay-title" }, t("ui-click-to-join-in")),
          ),
      };
    }
    if (this.streamError) {
      return {
        kind: "streamError",
        render: () => card({ mark: markLonely(), title: t("ui-couldn-t-play-the-room-s-video"), text: this.streamError, action: leaveForOwnCopy() }),
      };
    }
    if (this.phase !== "live") return undefined;
    if (this.refused && !this.hadPeers) {
      const { reason, message } = this.refused;
      const update = reason === "newer";
      return {
        kind: "refused",
        title: message,
        render: () =>
          card({
            mark: markLonely(),
            title: update ? t("ui-update-to-join") : reason === "roomFull" ? t("ui-the-room-is-full") : t("ui-can-t-join-this-room"),
            text: message,
            action: update
              ? h("button", { class: "btn btn-primary", type: "button", onclick: () => location.reload() }, t("ui-reload"))
              : h("button", { class: "btn btn-primary", type: "button", onclick: () => this.leave() }, t("ui-back-to-start")),
          }),
      };
    }
    if (this.program?.unsupported) {
      return {
        kind: "unsupported",
        render: () =>
          card({
            mark: markLonely(),
            title: this.program.message,
            action: h("button", { class: "btn btn-primary", type: "button", onclick: () => location.reload() }, t("ui-reload")),
          }),
      };
    }
    if (this.program?.offProgram) {
      return { kind: "off-program", title: this.program.message, render: () => card({ quiet: true, mark: markLonely(), title: this.program.message }) };
    }
    if (this.program?.loading || this.waiting?.type === "loading") {
      return { kind: "loading", render: () => card({ quiet: true, mark: markPulse(), title: t("program-loading") }) };
    }
    if (!this.isHost && !this.hadPeers) {
      const slow = performance.now() - this.openedAt >= SLOW_CONNECT_MS;
      return {
        kind: "connecting",
        slow,
        render: () =>
          card({
            mark: markPulse(),
            title: t("room-joining"),
            text: slow ? t("join-taking-time") : undefined,
          }),
      };
    }
    if (this.awaitingFilm && this.relayBlocked) {
      return {
        kind: "relay-blocked",
        render: () =>
          card({
            mark: markLonely(),
            title: t("ui-can-t-stream-to-this-browser"),
            text: t("ui-open-your-own-copy-of-the-video-to-watch"),
            action: leaveForOwnCopy(),
          }),
      };
    }
    if (this.awaitingFilm) {
      const slow = performance.now() - this.openedAt >= SLOW_CONNECT_MS;
      return {
        kind: "waiting-for-film",
        slow,
        render: () =>
          card({
            mark: markPulse(),
            title: slow ? t("ui-nobody-s-sharing-the-video") : t("ui-getting-the-video"),
            action: slow ? leaveForOwnCopy(false) : undefined,
          }),
      };
    }
    const countdown = this.countdown();
    if (countdown) {
      const { tick, resuming } = countdown;
      // The same count whether it's the start or after a pause; only the words say which.
      return {
        kind: "countdown",
        // Each second is its own element, so the number lands rather than ticking over.
        tick,
        // Nothing dims the first frame of the film, nor a film someone paused a moment ago.
        clear: resuming || tick === 0,
        render: () => {
          const element = h("together-countdown");
          element.update(countdown);
          return element;
        },
      };
    }
    if (this.waiting?.type === "stalled" || this.waiting?.type === "ad") {
      const title = this.waiting.message;
      const text = this.waiting.type === "ad" ? t("ui-carries-on-after-the-ad") : t("ui-carries-on-by-itself");
      return {
        kind: "holding",
        title,
        render: () => card({ quiet: true, mark: markPulse(), title, text }),
      };
    }
    if (this.peers.size > 0) return undefined;
    if (!this.video.paused) return undefined;
    const title = this.hadPeers ? t("ui-everyone-else-left") : t("ui-invite-a-friend");
    return {
      kind: "waiting",
      title,
      clear: true,
      render: () =>
        card({
          mark: markWaiting(),
          title,
          text: t("ui-send-them-the-link-you-ll-start-together"),
          action: h(
            "button",
            { class: "btn btn-primary", type: "button", onclick: () => this.copyInvite() },
            icon("i-link"),
            h("span", {}, t("ui-copy-link")),
          ),
        }),
    };
  }

  // --- Controls ------------------------------------------------------------------------------

  bind() {
    const video = this.video;
    this.play.addEventListener("click", () => this.togglePlay());
    for (const type of ["play", "pause", "durationchange", "loadedmetadata", "volumechange"]) {
      video.addEventListener(type, () => this.syncControls());
    }
    for (const type of ["play", "playing", "pause", "waiting", "stalled", "seeking", "seeked", "ratechange", "ended", "emptied"]) {
      video.addEventListener(type, () =>
        log.debug(`video: ${type}`, { at: video.currentTime, rate: video.playbackRate, readyState: video.readyState, buffered: bufferedAhead(video) }),
      );
    }
    video.addEventListener("error", () => log.warn("video: error", video.error));
    video.addEventListener("play", () => this.renderOverlay());
    video.addEventListener("pause", () => {
      this.renderOverlay();
      this.wake();
    });

    // A click toggles playback; a double click goes full screen without toggling twice.
    video.addEventListener("click", () => {
      clearTimeout(this.clickTimer);
      this.clickTimer = setTimeout(() => this.togglePlay(), 220);
    });
    video.addEventListener("dblclick", () => {
      clearTimeout(this.clickTimer);
      this.toggleFullscreen();
    });

    this.scrubber.addEventListener("input", () => {
      this.scrubbing = true;
      this.current.textContent = formatTime(Number(this.scrubber.value));
      paintRange(this.scrubber);
    });
    this.scrubber.addEventListener("change", () => {
      this.scrubbing = false;
      this.seekTo(Number(this.scrubber.value));
    });

    this.mute.addEventListener("click", () => {
      video.muted = !video.muted;
    });
    this.volume.addEventListener("input", () => {
      video.volume = Number(this.volume.value);
      video.muted = video.volume === 0;
      prefs.volume = video.volume;
    });
    video.volume = prefs.volume;

    this.fullscreen.addEventListener("click", () => this.toggleFullscreen());
    document.addEventListener("fullscreenchange", () => {
      const on = Boolean(document.fullscreenElement);
      setIcon($("svg", this.fullscreen), on ? "i-shrink" : "i-expand");
      this.fullscreen.setAttribute("aria-label", on ? t("ui-exit-full-screen") : t("ui-full-screen"));
      this.fullscreen.title = on ? t("ui-exit-full-screen-f") : t("ui-full-screen-f");
    });

    this.readyButton.addEventListener("click", () => this.toggleReady());
    this.timingsButton = $("[data-timings]", this.root);
    const showTimings = () => {
      const on = prefs.timings;
      this.timingsButton.setAttribute("aria-pressed", String(on));
      this.timingsButton.title = this.timingsButton.ariaLabel = on ? t("ui-hide-timings") : t("ui-show-timings");
    };
    showTimings();
    this.timingsButton.addEventListener("click", () => {
      prefs.timings = !prefs.timings;
      showTimings();
    });
    $("[data-leave]", this.root).addEventListener("click", () => this.leave());
    $("[data-mismatch-close]", this.root).addEventListener("click", () => {
      this.mismatch.hidden = true;
    });

    this.popover.addEventListener("toggle", (e) => {
      if (e.newState === "open") this.copyInvite({ quiet: true });
      else this.wake();
    });
    const copyButton = $("[data-copy-link]", this.popover);
    copyButton.addEventListener("click", async () => {
      if (await this.invite.copy()) {
        this.toasts.show(t("ui-link-copied"), { icon: "i-check", key: "copied" });
      }
    });

    this.stage.addEventListener("pointermove", () => this.wake());
    this.stage.addEventListener("pointerdown", () => this.wake());
    document.addEventListener("keydown", (e) => this.onKey(e));
  }

  /** The room owns its animation loop; the landing page needs no playback frames. */
  animate() {
    cancelAnimationFrame(this.frame);
    const frame = () => {
      if (!this.active || !this.isOpen) return;
      this.renderTime();
      // A countdown is a deadline on the room clock, so it is redrawn from the clock.
      if (this.starting) this.renderOverlay();
      this.frame = requestAnimationFrame(frame);
    };
    this.frame = requestAnimationFrame(frame);
  }

  togglePlay() {
    const session = this.session;
    if (!session) return;
    log.info("you pressed: play/pause", { blocked: this.blocked, ended: this.video.ended, paused: this.video.paused, at: this.video.currentTime });
    if (this.blocked) {
      session.resumePlayback();
    } else if (this.video.ended) {
      // Watch it again, together.
      session.seek(0);
      session.play();
      this.intend(false);
    } else if (this.wantsPaused()) {
      session.play();
      this.intend(false);
    } else {
      session.pause();
      this.intend(true);
    }
    this.wake();
  }

  /**
   * The room plays, pauses and seeks a moment after the press, on an instant every screen
   * shares, so the video itself moves a beat later. The controls answer the press straight away.
   */
  intend(paused) {
    this.intent = { paused, at: performance.now() };
    this.syncControls();
    clearTimeout(this.intentTimer);
    this.intentTimer = setTimeout(() => this.syncControls(), INTENT_MS);
  }

  /** Whether playback is paused, or about to be because we asked. */
  wantsPaused() {
    const intent = this.intent;
    return intent && performance.now() - intent.at < INTENT_MS ? intent.paused : this.video.paused;
  }

  seekTo(seconds) {
    const duration = Number.isFinite(this.video.duration) ? this.video.duration : Infinity;
    const target = Math.min(Math.max(0, seconds), duration);
    log.info(`you seeked to ${target.toFixed(3)}s`, { from: this.video.currentTime });
    this.pendingSeek = { target, at: performance.now() };
    this.session?.seek(target);
  }

  /** Relative seeks stack when repeated faster than the player lands them. */
  seekBy(delta) {
    const recent = this.pendingSeek && performance.now() - this.pendingSeek.at < 800;
    this.seekTo((recent ? this.pendingSeek.target : this.video.currentTime) + delta);
    this.wake();
  }

  /**
   * The invite link and its QR code, in the popover. The link is the web app's public address
   * whichever copy of it this page is, so it opens the same way for everyone (and in a terminal).
   */
  showInvite(link) {
    this.invite.setLink(link);
    try {
      this.invite.setQr(link, backend.qrSvg(link));
    } catch {
      // Too long for a QR code: the link alone still works.
      this.invite.setQr(link, "");
    }
  }

  async copyInvite({ quiet = false } = {}) {
    if (!this.session) return;
    const copied = await this.invite.copy({ fallback: false, feedback: false });
    if (copied) this.toasts.show(t("ui-link-copied"), { icon: "i-check", key: "copied" });
    else if (!quiet) this.popover.showPopover();
  }

  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (this.stage.requestFullscreen) {
      this.stage.requestFullscreen().catch(() => {});
    } else if (this.video.webkitEnterFullscreen) {
      // iOS Safari only allows the video itself to go full screen.
      this.video.webkitEnterFullscreen();
    }
  }

  onKey(e) {
    if (!this.isOpen || e.metaKey || e.ctrlKey || e.altKey) return;
    const target = e.target;
    const typing = target.matches?.("input[type=text], textarea, [contenteditable]");
    if (typing) return;
    switch (e.key) {
      case " ":
      case "k":
        // A focused button keeps Space for itself; everywhere else it plays and pauses.
        if (e.key === " " && target.matches?.("button")) return;
        e.preventDefault();
        this.togglePlay();
        break;
      case "ArrowLeft":
      case "ArrowRight":
        if (target.matches?.("input[type=range]")) return;
        e.preventDefault();
        this.seekBy(e.key === "ArrowLeft" ? -SEEK_STEP : SEEK_STEP);
        break;
      case "f":
        this.toggleFullscreen();
        break;
      case "m":
        this.video.muted = !this.video.muted;
        this.wake();
        break;
      // The same key the terminal uses.
      case "r":
        this.toggleReady();
        break;
    }
  }

  /** Show the controls, and hide them again after a while if nothing needs them. */
  wake() {
    clearTimeout(this.idleTimer);
    if (!this.active) return;
    this.stage.classList.remove("is-idle");
    this.idleTimer = setTimeout(() => {
      const busy =
        this.video.paused ||
        this.popover.matches(":popover-open") ||
        this.stage.querySelector(".controls:hover, .topbar:hover, .controls:focus-within, .topbar:focus-within");
      if (busy) this.wake();
      else this.stage.classList.add("is-idle");
    }, IDLE_AFTER_MS);
  }

  syncControls() {
    const video = this.video;
    const paused = this.wantsPaused();
    setIcon($("svg", this.play), paused ? "i-play" : "i-pause");
    this.play.setAttribute("aria-label", paused ? t("ui-play") : t("ui-pause"));
    this.play.title = paused ? t("ui-play-space") : t("ui-pause-space");
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    this.scrubber.max = String(duration);
    this.duration.textContent = formatTime(duration);
    const muted = video.muted || video.volume === 0;
    setIcon($("svg", this.mute), muted ? "i-muted" : "i-volume");
    this.mute.setAttribute("aria-label", muted ? t("ui-unmute") : t("ui-mute"));
    this.volume.value = String(muted ? 0 : video.volume);
    paintRange(this.volume);
  }

  renderTime() {
    if (this.scrubbing) return;
    // Until a seek we asked for lands, show where it is going rather than where it was.
    const seek = this.pendingSeek;
    const landing = seek && performance.now() - seek.at < INTENT_MS && Math.abs(this.video.currentTime - seek.target) > 0.25;
    const now = landing ? seek.target : this.video.currentTime;
    if (now === this.lastRendered) return;
    this.lastRendered = now;
    this.scrubber.value = String(now);
    this.scrubber.setAttribute("aria-valuetext", formatTime(now));
    const text = formatTime(now);
    if (this.current.textContent !== text) this.current.textContent = text;
    paintRange(this.scrubber);
  }
}

function card({ mark, title, text, action, quiet = false }) {
  return h(
    "div",
    { class: quiet ? "overlay-card is-quiet" : "overlay-card" },
    mark,
    h("p", { class: "overlay-title" }, title),
    text && h("p", { class: "overlay-text" }, text),
    action,
  );
}

const SVG = "http://www.w3.org/2000/svg";

function svgMark(children) {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("class", "overlay-mark");
  svg.setAttribute("viewBox", "0 0 44 28");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = children;
  return svg;
}

/** You, and a friend still to come. */
const markWaiting = () =>
  svgMark(`<circle cx="15" cy="14" r="11" fill="currentColor"/><circle class="friend" cx="29" cy="14" r="10.25" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3"/>`);

/** Two people finding each other. */
const markPulse = () =>
  svgMark(
    `<circle class="pulse" cx="15" cy="14" r="11" fill="currentColor"/><circle class="pulse" cx="29" cy="14" r="10.25" fill="none" stroke="currentColor" stroke-width="1.5"/>`,
  );

/** On your own. */
const markLonely = () =>
  svgMark(`<circle cx="15" cy="14" r="11" fill="currentColor" opacity="0.45"/><circle cx="29" cy="14" r="10.25" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.45"/>`);
