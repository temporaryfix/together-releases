// together in the browser: landing, invite and room screens around a wasm `Session`.

import init, { Session, formatTime, parseInvite } from "./pkg/together_web.js";
import { MediaLoadError, fileSource, pickFile } from "./media.js";
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
      this.slot.replaceChildren(h("div", { class: "name-row" }, h("span", {}, this.lead), this.input), error);
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
    this.error.textContent = "Add your name so friends know who’s who.";
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
let pendingJoinFile;

function joinWith(file) {
  setError(screens.invited);
  const invite = inviteFromHash();
  if (!invite) return route();
  const name = invitedName.require();
  if (!name) {
    pendingJoinFile = file;
    return;
  }
  pendingJoinFile = undefined;
  room.open({ source: fileSource(file), name, invite, from: screens.invited });
}

invitedName.onCommit = () => pendingJoinFile && joinWith(pendingJoinFile);
wireDropzone(screens.invited, joinWith);
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
    this.toasts = new Toasts($("[data-toasts]", root));
    this.session = undefined;
    this.bind();
  }

  get isOpen() {
    return !screens.room.hidden;
  }

  /** Enter a room: load the media, then host or join. Ignored while a room is open or opening. */
  async open({ source, name, invite, from }) {
    if (this.active) return;
    this.active = true;
    this.reset();
    this.source = source;
    this.isHost = !invite;
    this.phase = "starting";
    $("[data-title]", this.root).textContent = source.title;
    document.title = `${source.title} · together`;
    setBusy(from, true);

    try {
      await source.attach(this.video);
    } catch (error) {
      setBusy(from, false);
      setError(from, error instanceof MediaLoadError ? error.message : "That file couldn’t be opened.");
      this.close();
      return;
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
        title: source.title,
        duration: this.video.duration,
        size: source.size,
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

  async leave() {
    const session = this.session;
    this.session = undefined;
    if (session) {
      // Don't keep the user waiting on a network that's gone.
      await Promise.race([session.leave(), new Promise((r) => setTimeout(r, 2000))]);
      session.free();
    }
    this.close();
    history.pushState(null, "", location.pathname + location.search);
    route();
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
    this.peers = new Map();
    this.hadPeers = false;
    this.blocked = false;
    this.stopped = undefined;
    this.overlayKey = undefined;
    this.pendingSeek = undefined;
    this.people.replaceChildren();
    this.toasts.clear();
    this.mismatch.hidden = true;
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
        this.renderPeople();
        break;
      case "peerJoined":
        this.hadPeers = true;
        if (!this.peers.has(event.who.id)) {
          this.peers.set(event.who.id, { who: event.who, sync: { level: "unknown", label: "syncing…", detail: "Measuring sync" } });
        }
        this.renderPeople();
        if (this.isHost || performance.now() - this.openedAt > ARRIVAL_QUIET_MS) {
          this.toasts.show(event.message, { person: event.who });
        }
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
      case "playback":
        this.blocked = event.blocked;
        this.renderPeople();
        break;
      case "stopped":
        this.phase = "stopped";
        this.stopped = event;
        break;
    }
    this.renderOverlay();
  }

  renderPeople() {
    // Waiting on the autoplay policy isn't being out of sync; don't show a scary number.
    const mine = this.blocked ? { level: "unknown", label: "needs a click", detail: "Waiting for a click to start playback" } : this.mySync;
    const rows = this.me ? [{ who: { ...this.me, name: "You" }, sync: mine, you: true }] : [];
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
          avatar(row.who),
          h("span", { class: "person-text" }, h("span", { class: "person-name" }, row.who.name), badge),
        );
      }
      if (this.people.children[index] !== li) this.people.insertBefore(li, this.people.children[index] ?? null);
      const sync = row.sync ?? { level: "unknown", label: "syncing…", detail: "Measuring sync" };
      renderBadge($(".badge", li), sync);
      li.title = `${row.who.name}: ${sync.detail}${row.rttMs != null ? ` · ${Math.round(row.rttMs)} ms round trip` : ""}`;
      li.setAttribute("aria-label", li.title);
    });
    for (const [id, li] of existing) if (!keep.has(id)) li.remove();
  }

  showMismatch(event) {
    const theirs = event.duration ? `“${event.title}” (${formatTime(event.duration)})` : `“${event.title}”`;
    $("[data-mismatch-title]", this.root).textContent = event.message;
    $("[data-mismatch-text]", this.root).textContent =
      `They have ${theirs}. Playback still stays in sync, so check you both picked the same file.`;
    this.mismatch.hidden = false;
  }

  // --- Overlay states ------------------------------------------------------------------------

  renderOverlay() {
    const state = this.overlayState();
    const key = state && `${state.kind}:${state.slow ?? ""}:${state.title ?? ""}`;
    if (key === this.overlayKey) return;
    this.overlayKey = key;
    if (!state) {
      this.overlay.hidden = true;
      this.overlay.replaceChildren();
      return;
    }
    this.overlay.hidden = false;
    this.overlay.classList.toggle("is-clear", state.clear === true);
    this.overlay.replaceChildren(state.render());
  }

  overlayState() {
    if (this.phase === "stopped" && this.stopped?.error) {
      return {
        kind: "stopped",
        render: () =>
          card({
            mark: markLonely(),
            title: "Disconnected",
            text: `${this.stopped.message}. Your friends can send a new invite to get you back in.`,
            action: h("button", { class: "btn btn-primary", type: "button", onclick: () => this.leave() }, "Back to start"),
          }),
      };
    }
    if (this.phase === "starting") {
      return {
        kind: "starting",
        render: () =>
          card({
            mark: markPulse(),
            title: this.isHost ? "Starting your room…" : "Joining the room…",
            text: this.isHost ? "Getting an invite link ready." : "Finding the people in this room.",
          }),
      };
    }
    if (this.blocked) {
      return {
        kind: "blocked",
        render: () =>
          h(
            "button",
            { class: "join-playback", type: "button", onclick: () => this.session?.resumePlayback() },
            h("span", { class: "join-playback-disc" }, icon("i-play")),
            h("span", { class: "overlay-card" },
              h("span", { class: "overlay-title" }, "Click to join playback"),
              h("span", { class: "overlay-text" }, "Your friends are already watching. Your browser needs a click before it plays video with sound."),
            ),
          ),
      };
    }
    if (this.phase !== "live" || this.peers.size > 0) return undefined;
    if (!this.isHost && !this.hadPeers) {
      const slow = performance.now() - this.openedAt >= SLOW_CONNECT_MS;
      return {
        kind: "connecting",
        slow,
        render: () =>
          card({
            mark: markPulse(),
            title: "Connecting to the room…",
            text: slow
              ? "Still trying. Make sure the person who invited you still has the room open."
              : "This usually takes a few seconds.",
          }),
      };
    }
    if (!this.video.paused) return undefined;
    const title = this.hadPeers ? "Everyone else left" : "Waiting for friends";
    return {
      kind: "waiting",
      title,
      clear: true,
      render: () =>
        card({
          mark: markWaiting(),
          title,
          text: "Send the invite link. Whoever joins starts at the same moment as you.",
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
      if (this.isOpen) this.renderTime();
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

function card({ mark, title, text, action }) {
  return h(
    "div",
    { class: "overlay-card" },
    mark,
    h("p", { class: "overlay-title" }, title),
    h("p", { class: "overlay-text" }, text),
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
  svgMark(`<circle cx="15" cy="14" r="11" fill="var(--beam-cool)"/><circle class="friend" cx="29" cy="14" r="10.2"/>`);

/** Two lights finding each other. */
const markPulse = () =>
  svgMark(
    `<circle class="pulse" cx="15" cy="14" r="11" fill="var(--beam-cool)"/><circle class="pulse" cx="29" cy="14" r="11" fill="var(--beam-warm)"/>`,
  );

const markLonely = () =>
  svgMark(`<circle cx="15" cy="14" r="11" fill="var(--beam-cool)" opacity="0.5"/><circle cx="29" cy="14" r="10.2" fill="none" stroke="var(--mist)" stroke-width="1.6" stroke-dasharray="3.2 3"/>`);

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
  if (room.isOpen) return;
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
