// together in the browser: landing, invite and room screens around a wasm `Session`.

import init, { Session, formatTime, parseInvite } from "./pkg/together_web.js";
import { MediaLoadError, fileSource, pickFile, streamSource } from "./media.js";
import { canStream } from "./stream.js";
import { Toasts, avatar, copyText, h, icon, paintRange, prefs, renderBadge, setIcon } from "./ui.js";

const wasm = init();
wasm.catch((error) => console.error("together: could not load WebAssembly", error));

const $ = (selector, root = document) => root.querySelector(selector);

const screens = {
  landing: $("#landing"),
  invited: $("#invited"),
  room: $("#room"),
};

function showScreen(name) {
  for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
}

function inviteFromHash() {
  const hash = decodeURIComponent(location.hash.slice(1));
  return hash.startsWith("watch") ? hash : undefined;
}

// ---------------------------------------------------------------------------------------------
// Your name: asked once, remembered.

class NameField {
  constructor(slot, lead) {
    this.slot = slot;
    this.lead = lead;
    this.editing = !prefs.name;
    this.onCommit = undefined;
    this.render();
  }

  render(focus = false) {
    const error = h("p", { class: "field-error", role: "alert" });
    if (this.editing) {
      this.input = h("input", {
        class: "input name-input",
        type: "text",
        value: prefs.name,
        placeholder: "Your name",
        maxlength: "40",
        autocomplete: "nickname",
        "aria-label": "Your name",
        onkeydown: (e) => e.key === "Enter" && this.commit(),
        onblur: () => this.input.value.trim() && this.commit(),
      });
      this.slot.replaceChildren(h("div", { class: "name-row" }, this.input), error);
      if (focus) this.input.focus();
    } else {
      const change = h("button", { class: "name-change quiet-link", type: "button", onclick: () => this.edit() }, "Change");
      this.slot.replaceChildren(
        h("div", { class: "name-row" }, h("span", {}, `${this.lead} `, h("strong", {}, prefs.name)), change),
        error,
      );
    }
    this.error = error;
  }

  edit() {
    this.editing = true;
    this.render(true);
  }

  commit() {
    const name = this.input?.value.trim();
    if (!name) return this.demand();
    prefs.name = name;
    this.editing = false;
    this.render();
    this.onCommit?.(name);
  }

  /** The name, or undefined after asking for it. */
  require() {
    if (!this.editing && prefs.name) return prefs.name;
    const name = this.input.value.trim();
    if (name) {
      prefs.name = name;
      return name;
    }
    this.demand();
    return undefined;
  }

  demand() {
    this.input.setAttribute("aria-invalid", "true");
    this.error.textContent = "Add your name first.";
    this.input.focus();
    this.input.addEventListener(
      "input",
      () => {
        this.input.removeAttribute("aria-invalid");
        this.error.textContent = "";
      },
      { once: true },
    );
  }
}

// ---------------------------------------------------------------------------------------------
// Picking a file: click, keyboard or drag and drop.

function wireDropzone(screen, onFile) {
  const zone = $("[data-dropzone]", screen);
  const input = $("[data-file]", screen);
  input.addEventListener("change", () => {
    const file = pickFile(input.files);
    input.value = "";
    if (file) onFile(file);
  });
  let depth = 0;
  zone.addEventListener("dragenter", (e) => {
    e.preventDefault();
    depth++;
    zone.classList.add("is-dragging");
  });
  zone.addEventListener("dragleave", () => {
    if (--depth <= 0) zone.classList.remove("is-dragging");
  });
  zone.addEventListener("drop", () => {
    depth = 0;
    zone.classList.remove("is-dragging");
  });
  // Accept drops anywhere on the screen, not just the zone.
  screen.addEventListener("dragover", (e) => e.preventDefault());
  screen.addEventListener("drop", (e) => {
    e.preventDefault();
    const file = pickFile(e.dataTransfer?.files);
    if (file) onFile(file);
  });
}

function setError(screen, message = "") {
  $("[data-error]", screen).textContent = message;
}

function setBusy(screen, busy) {
  $("[data-dropzone]", screen).classList.toggle("is-busy", busy);
}

// Landing

const landingName = new NameField($("[data-name-slot]", screens.landing), "Watching as");
let pendingFile;

function startWith(file) {
  setError(screens.landing);
  const name = landingName.require();
  if (!name) {
    pendingFile = file;
    return;
  }
  pendingFile = undefined;
  room.open({ source: fileSource(file), name, from: screens.landing });
}

landingName.onCommit = () => pendingFile && startWith(pendingFile);
wireDropzone(screens.landing, startWith);

const joinForm = $("[data-join-form]");
const inviteInput = $("[data-invite-input]");
const joinError = $("[data-join-error]");
joinForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = inviteInput.value.trim();
  if (!text) {
    joinError.textContent = "Paste the invite link a friend sent you.";
    inviteInput.focus();
    return;
  }
  await wasm;
  try {
    location.hash = parseInvite(text);
    inviteInput.value = "";
    joinError.textContent = "";
  } catch (error) {
    inviteInput.setAttribute("aria-invalid", "true");
    joinError.textContent = error.message;
  }
});
inviteInput.addEventListener("input", () => {
  inviteInput.removeAttribute("aria-invalid");
  joinError.textContent = "";
});

// Invited

const invitedName = new NameField($("[data-name-slot]", screens.invited), "Joining as");
let pendingJoin;

/** Join the room, streaming the video from it unless `file` is our own copy. */
function joinWith(file) {
  setError(screens.invited);
  const invite = inviteFromHash();
  if (!invite) return route();
  const name = invitedName.require();
  if (!name) {
    pendingJoin = () => joinWith(file);
    return;
  }
  pendingJoin = undefined;
  room.open({ source: file && fileSource(file), stream: !file, name, invite, from: screens.invited });
}

invitedName.onCommit = () => pendingJoin?.();
wireDropzone(screens.invited, joinWith);
$("[data-stream]", screens.invited).addEventListener("click", () => joinWith());
// A browser can only stream the room's copy through a relay of your own, so without one, don't
// offer it: go straight to opening your own copy rather than finding out after a wait.
if (canStream() && prefs.relay) {
  $("[data-stream]", screens.invited).hidden = false;
  $("[data-own-copy-hint]", screens.invited).hidden = true;
} else {
  $("[data-own-copy]", screens.invited).classList.add("btn-primary");
}
$("[data-home]").addEventListener("click", (e) => {
  e.preventDefault();
  history.pushState(null, "", location.pathname + location.search);
  route();
});

// ---------------------------------------------------------------------------------------------
// The room.

const IDLE_AFTER_MS = 2800;
const SEEK_STEP = 5;
const SLOW_CONNECT_MS = 12000;
/** A joiner hears about everyone already in the room at once; the strip shows them, no toasts. */
const ARRIVAL_QUIET_MS = 5000;
/** How long the countdown's last beat stays on screen after playback starts. */
const GO_MS = 500;

class Room {
  constructor(root) {
    this.root = root;
    this.stage = $("[data-stage]", root);
    this.video = $("[data-video]", root);
    this.people = $("[data-people]", root);
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
    this.mismatch = $("[data-mismatch]", root);
    this.readyControl = $("[data-ready-control]", root);
    this.readyButton = $("[data-ready]", root);
    this.readyLabel = $("[data-ready-label]", root);
    this.readyNote = $("[data-ready-note]", root);
    this.readyTitle = $("[data-ready-title]", root);
    this.toasts = new Toasts($("[data-toasts]", root));
    this.session = undefined;
    this.bind();
  }

  get isOpen() {
    return !screens.room.hidden;
  }

  /** Enter a room: load the media, then host or join. Ignored while a room is open or opening. */
  async open({ source, stream, name, invite, from }) {
    if (this.active) return;
    this.active = true;
    this.reset();
    this.isHost = !invite;
    this.phase = "starting";
    // Streaming joiners don't know what they're watching until someone in the room offers it.
    this.awaitingFilm = Boolean(stream);
    setBusy(from, true);

    if (source) {
      this.show(source);
      try {
        await source.attach(this.video);
      } catch (error) {
        setBusy(from, false);
        setError(from, error instanceof MediaLoadError ? error.message : "That file couldn’t be opened.");
        this.close();
        return;
      }
    }
    setBusy(from, false);
    showScreen("room");
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
      };
      this.session = invite ? await Session.join(invite, options) : await Session.host(options);
    } catch (error) {
      console.error("together:", error);
      this.close();
      showScreen(from === screens.invited ? "invited" : "landing");
      setError(from, error.message || "Couldn’t open the room.");
      return;
    }

    this.phase = "live";
    this.openedAt = performance.now();
    this.slowTimer = setTimeout(() => this.renderOverlay(), SLOW_CONNECT_MS);
    const link = `${location.origin}${location.pathname}#${this.session.ticket}`;
    $("[data-invite-link]", this.root).value = link;
    $("[data-invite-cli]", this.root).value = `together ${this.session.ticket}`;
    this.inviteButton.disabled = false;
    this.session.onEvent((event) => this.handle(event));
    this.renderOverlay();
    this.wake();
  }

  /** Leave the room. `keepInvite` goes back to the invite screen rather than the start. */
  async leave({ keepInvite = false } = {}) {
    const session = this.session;
    this.session = undefined;
    if (session) {
      // Don't keep the user waiting on a network that's gone.
      await Promise.race([session.leave(), new Promise((r) => setTimeout(r, 2000))]);
      session.free();
    }
    this.close();
    if (!keepInvite) history.pushState(null, "", location.pathname + location.search);
    route();
  }

  /** Take `source` as the room's video. */
  show(source) {
    this.source = source;
    $("[data-title]", this.root).textContent = source.title;
    document.title = `${source.title} · together`;
  }

  /** Someone in the room offered a copy: play it as it arrives. */
  async startStreaming(event) {
    if (!this.session || this.source) return;
    this.show(streamSource(this.session, event));
    this.awaitingFilm = false;
    this.renderOverlay();
    try {
      await this.source.attach(this.video);
    } catch (error) {
      this.streamError = error.message;
    }
    this.renderOverlay();
  }

  /** Tear down everything local. */
  close() {
    this.active = false;
    clearTimeout(this.slowTimer);
    clearTimeout(this.idleTimer);
    this.video.pause();
    this.video.removeAttribute("src");
    this.video.load();
    this.source?.release();
    this.source = undefined;
    if (document.fullscreenElement) document.exitFullscreen?.();
    if (this.popover.matches(":popover-open")) this.popover.hidePopover();
    document.title = "together";
  }

  reset() {
    this.phase = "starting";
    this.source = undefined;
    this.awaitingFilm = false;
    this.streamError = undefined;
    this.relayBlocked = false;
    this.peers = new Map();
    this.hadPeers = false;
    this.ready = undefined;
    this.waiting = undefined;
    this.starting = undefined;
    this.blocked = false;
    this.stopped = undefined;
    this.overlayKey = undefined;
    this.pendingSeek = undefined;
    this.people.replaceChildren();
    this.toasts.clear();
    this.mismatch.hidden = true;
    this.readyControl.hidden = true;
    this.inviteButton.disabled = true;
    this.stage.classList.remove("is-idle");
  }

  // --- Room events ---------------------------------------------------------------------------

  handle(event) {
    switch (event.type) {
      case "status":
        this.me = event.me;
        this.mySync = event.sync;
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
          this.peers.set(event.who.id, { who: event.who, sync: { level: "unknown", label: "syncing…", detail: "Measuring sync" } });
        }
        this.renderPeople();
        if (this.settled()) this.toasts.show(event.message, { person: event.who });
        break;
      case "peerLeft":
        this.peers.delete(event.who.id);
        this.renderPeople();
        this.toasts.show(event.message, { person: event.who });
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
      case "stopped":
        this.phase = "stopped";
        this.stopped = event;
        break;
    }
    this.renderReady();
    this.renderOverlay();
  }

  renderPeople() {
    // Waiting on the autoplay policy isn't being out of sync; don't show a scary number.
    const mine = this.blocked ? { level: "unknown", label: "needs a click", detail: "Waiting for a click to start playback" } : this.mySync;
    const held = this.waiting?.type === "stalled" && this.waiting.local;
    const rows = this.me
      ? [{ who: { ...this.me, name: "You" }, sync: mine, ready: this.ready?.mine === true, stalled: held, you: true }]
      : [];
    rows.push(...this.peers.values());
    const existing = new Map([...this.people.children].map((li) => [li.dataset.id, li]));
    const keep = new Set();
    rows.forEach((row, index) => {
      const id = row.you ? "me" : row.who.id;
      keep.add(id);
      let li = existing.get(id);
      if (!li) {
        const badge = h("span", { class: "badge", "data-level": "unknown" }, h("span", { class: "badge-dot" }), h("span", { "data-label": "" }));
        li = h(
          "li",
          { class: "person", "data-id": id },
          h("span", { class: "person-face" }, avatar(row.who), icon("i-check", "person-mark")),
          h("span", { class: "person-text" }, h("span", { class: "person-name" }, row.who.name), badge),
        );
      }
      if (this.people.children[index] !== li) this.people.insertBefore(li, this.people.children[index] ?? null);
      const sync = row.sync ?? { level: "unknown", label: "syncing…", detail: "Measuring sync" };
      renderBadge($(".badge", li), sync);
      // Being stuck is the more urgent of the two, and a stalled player isn't waiting to start.
      const state = row.stalled ? "stalled" : row.ready ? "ready" : "";
      if (li.dataset.state !== state) li.dataset.state = state;
      const aside = row.ready && !row.stalled ? " · ready to start" : "";
      // How we reach them: direct is worth saying too, so "nothing shown" never has to mean
      // "we couldn't tell" and "it's fine" at the same time.
      const via = row.link?.type === "relayed" ? ` · via relay ${row.link.relay}` : row.link?.type === "direct" ? " · direct" : "";
      li.title = `${row.who.name}: ${sync.detail}${aside}${row.rttMs != null ? ` · ${Math.round(row.rttMs)} ms round trip` : ""}${via}`;
      li.setAttribute("aria-label", li.title);
      const link = row.link?.type ?? "";
      if (li.dataset.link !== link) li.dataset.link = link;
    });
    for (const [id, li] of existing) if (!keep.has(id)) li.remove();
  }

  /** Whether we've been here long enough for what happens to be news rather than arrival. */
  settled() {
    return this.isHost || performance.now() - this.openedAt > ARRIVAL_QUIET_MS;
  }

  /** The ready control: who has said they're ready, and the way to say it yourself. */
  renderReady() {
    const ready = this.ready;
    // Only worth asking once there's somebody to start with, and while nothing else is on screen.
    const show = Boolean(ready?.open) && this.peers.size > 0 && !this.starting && this.waiting?.type !== "stalled";
    this.readyControl.hidden = !show;
    this.stage.classList.toggle("is-asking", show);
    if (!show) return;
    const mine = ready.mine;
    const others = this.waiting?.type === "ready" ? this.waiting.message : "";
    const title = mine ? "You’re ready" : "Ready to watch?";
    const note = mine ? others || `${ready.count} of ${ready.total} ready` : "It starts for everyone once you’re all ready.";
    if (this.readyTitle.textContent !== title) this.readyTitle.textContent = title;
    if (this.readyNote.textContent !== note) this.readyNote.textContent = note;
    this.readyButton.setAttribute("aria-pressed", String(mine));
    this.readyButton.classList.toggle("btn-primary", !mine);
    this.readyButton.classList.toggle("btn-secondary", mine);
    this.readyButton.title = mine ? "Not ready after all (R)" : "I’m ready (R)";
    const label = mine ? "Not ready" : "I’m ready";
    if (this.readyLabel.textContent !== label) this.readyLabel.textContent = label;
    setIcon($("svg", this.readyButton), mine ? "i-close" : "i-check");
  }

  toggleReady() {
    if (!this.session || !this.ready?.open) return;
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

  showMismatch(event) {
    $("[data-mismatch-title]", this.root).textContent = event.message;
    $("[data-mismatch-text]", this.root).textContent =
      "Their file doesn’t match yours. Playback still stays in sync, so check you both picked the same file.";
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
        "Open my own copy",
      );
    if (this.phase === "stopped" && this.stopped?.error) {
      return {
        kind: "stopped",
        render: () =>
          card({
            mark: markLonely(),
            title: "Disconnected",
            text: this.stopped.message,
            action: h("button", { class: "btn btn-primary", type: "button", onclick: () => this.leave() }, "Back to start"),
          }),
      };
    }
    if (this.phase === "starting") {
      return { kind: "starting", render: () => card({ mark: markPulse(), title: "Connecting…" }) };
    }
    if (this.blocked) {
      return {
        kind: "blocked",
        render: () =>
          h(
            "button",
            { class: "join-playback", type: "button", onclick: () => this.session?.resumePlayback() },
            h("span", { class: "join-playback-disc" }, icon("i-play")),
            h("span", { class: "overlay-title" }, "Click to join in"),
          ),
      };
    }
    if (this.streamError) {
      return {
        kind: "streamError",
        render: () => card({ mark: markLonely(), title: "Couldn’t play the room’s video", text: this.streamError, action: leaveForOwnCopy() }),
      };
    }
    if (this.phase !== "live") return undefined;
    if (!this.isHost && !this.hadPeers) {
      const slow = performance.now() - this.openedAt >= SLOW_CONNECT_MS;
      return {
        kind: "connecting",
        slow,
        render: () =>
          card({
            mark: markPulse(),
            title: "Joining…",
            text: slow ? "Still trying. Is the person who invited you still in the room?" : undefined,
          }),
      };
    }
    if (this.awaitingFilm && this.relayBlocked) {
      return {
        kind: "relay-blocked",
        render: () =>
          card({
            mark: markLonely(),
            title: "Can’t stream to this browser",
            text: "Open your own copy of the video to watch.",
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
            title: slow ? "Nobody’s sharing the video" : "Getting the video…",
            action: slow ? leaveForOwnCopy(false) : undefined,
          }),
      };
    }
    const countdown = this.countdown();
    if (countdown) {
      const { tick, resuming, message } = countdown;
      return {
        kind: "countdown",
        // Each second is its own element, so the number lands rather than ticking over.
        tick: resuming ? "resuming" : tick,
        // Nothing dims the first frame of the film.
        clear: resuming || tick === 0,
        render: () =>
          resuming
            ? h("div", { class: "countdown is-resuming" }, markPulse(), h("p", { class: "countdown-caption" }, message))
            : tick === 0
              // The film is the payoff; all that is left is the ring opening out of the last beat.
              ? h("div", { class: "countdown is-go" }, h("span", { class: "countdown-ring" }))
              : h("div", { class: "countdown" }, h("span", { class: "countdown-number" }, String(tick))),
      };
    }
    if (this.waiting?.type === "stalled") {
      const title = this.waiting.message;
      return {
        kind: "holding",
        title,
        render: () => card({ quiet: true, mark: markPulse(), title, text: "Carries on by itself." }),
      };
    }
    if (this.peers.size > 0) return undefined;
    if (!this.video.paused) return undefined;
    const title = this.hadPeers ? "Everyone else left" : "Invite a friend";
    return {
      kind: "waiting",
      title,
      clear: true,
      render: () =>
        card({
          mark: markWaiting(),
          title,
          text: "Send them the link. You’ll start together.",
          action: h(
            "button",
            { class: "btn btn-primary", type: "button", onclick: () => this.copyInvite() },
            icon("i-link"),
            h("span", {}, "Copy invite link"),
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
    video.addEventListener("play", () => this.renderOverlay());
    video.addEventListener("pause", () => {
      this.renderOverlay();
      this.wake();
    });

    // A click toggles playback; a double click goes full screen without toggling twice.
    let clickTimer;
    video.addEventListener("click", () => {
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => this.togglePlay(), 220);
    });
    video.addEventListener("dblclick", () => {
      clearTimeout(clickTimer);
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
      this.fullscreen.setAttribute("aria-label", on ? "Exit full screen" : "Full screen");
      this.fullscreen.title = on ? "Exit full screen (F)" : "Full screen (F)";
    });

    this.readyButton.addEventListener("click", () => this.toggleReady());
    $("[data-leave]", this.root).addEventListener("click", () => this.leave());
    $("[data-mismatch-close]", this.root).addEventListener("click", () => {
      this.mismatch.hidden = true;
    });

    this.popover.addEventListener("toggle", (e) => {
      if (e.newState === "open") this.copyInvite({ quiet: true });
      else this.wake();
    });
    for (const button of this.popover.querySelectorAll("[data-copy]")) {
      button.addEventListener("click", async () => {
        const input = button.dataset.copy === "cli" ? $("[data-invite-cli]", this.root) : $("[data-invite-link]", this.root);
        if (await copyText(input.value, input)) {
          flashCopied(button);
          this.toasts.show(button.dataset.copy === "cli" ? "Command copied" : "Invite link copied", { icon: "i-check" });
        }
      });
    }

    this.stage.addEventListener("pointermove", () => this.wake());
    this.stage.addEventListener("pointerdown", () => this.wake());
    document.addEventListener("keydown", (e) => this.onKey(e));

    const frame = () => {
      if (this.isOpen) {
        this.renderTime();
        // A countdown is a deadline on the room clock, so it is redrawn from the clock.
        if (this.starting) this.renderOverlay();
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  togglePlay() {
    const session = this.session;
    if (!session) return;
    if (this.blocked) {
      session.resumePlayback();
    } else if (this.video.ended) {
      // Watch it again, together.
      session.seek(0);
      session.play();
    } else if (this.video.paused) {
      session.play();
    } else {
      session.pause();
    }
    this.wake();
  }

  seekTo(seconds) {
    const duration = Number.isFinite(this.video.duration) ? this.video.duration : Infinity;
    const target = Math.min(Math.max(0, seconds), duration);
    this.pendingSeek = { target, at: performance.now() };
    this.session?.seek(target);
  }

  /** Relative seeks stack when repeated faster than the player lands them. */
  seekBy(delta) {
    const recent = this.pendingSeek && performance.now() - this.pendingSeek.at < 800;
    this.seekTo((recent ? this.pendingSeek.target : this.video.currentTime) + delta);
    this.wake();
  }

  async copyInvite({ quiet = false } = {}) {
    if (!this.session) return;
    const input = $("[data-invite-link]", this.root);
    const copied = await copyText(input.value);
    if (copied) this.toasts.show("Invite link copied. Send it to a friend.", { icon: "i-check" });
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
    this.stage.classList.remove("is-idle");
    clearTimeout(this.idleTimer);
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
    const paused = video.paused;
    setIcon($("svg", this.play), paused ? "i-play" : "i-pause");
    this.play.setAttribute("aria-label", paused ? "Play" : "Pause");
    this.play.title = paused ? "Play (Space)" : "Pause (Space)";
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    this.scrubber.max = String(duration);
    this.duration.textContent = formatTime(duration);
    const muted = video.muted || video.volume === 0;
    setIcon($("svg", this.mute), muted ? "i-muted" : "i-volume");
    this.mute.setAttribute("aria-label", muted ? "Unmute" : "Mute");
    this.volume.value = String(muted ? 0 : video.volume);
    paintRange(this.volume);
  }

  renderTime() {
    if (this.scrubbing) return;
    const now = this.video.currentTime;
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

function flashCopied(button) {
  const svg = $("svg", button);
  const label = $("span", button);
  setIcon(svg, "i-check");
  label.textContent = "Copied";
  setTimeout(() => {
    setIcon(svg, "i-copy");
    label.textContent = "Copy";
  }, 1600);
}

const room = new Room(screens.room);

// ---------------------------------------------------------------------------------------------
// Routing: an invite in the URL goes straight to joining.

function route() {
  // A room that is open, or still opening, owns the screen until it is left.
  if (room.active) return;
  if (inviteFromHash()) {
    showScreen("invited");
    setError(screens.invited);
  } else {
    showScreen("landing");
  }
}

window.addEventListener("hashchange", route);
window.addEventListener("popstate", route);
// Leaving the page should look like leaving the room to everyone else.
window.addEventListener("pagehide", () => room.session?.leave());
route();

// Exposed for debugging and end-to-end tests.
window.together = { room };
