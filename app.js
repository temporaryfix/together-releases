// Together in the browser: landing, invite and room screens around a room session from `backend.js`.

import { Room } from "./room.js";
import { $, screens, showScreen, setBusy, setError } from "./screens.js";
import "./kit/ready.js";
import "./kit/people.js";
import "./kit/countdown.js";
import "./kit/tune.js";
import "./kit/invite.js";
import "./kit/toasts.js";
import { t, localize } from "./copy.js";
localize();
import { backend } from "./backend.js";
import { fileSource, pickFile } from "./media.js";
import { canStream } from "./stream.js";
import { tune, tuneNow } from "./tune.js";
import { h, log, prefs } from "./ui.js";

const wasm = backend.ready;
wasm.catch((error) => log.error("could not load the room backend", error));


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
        placeholder: t("ui-your-name"),
        maxlength: "40",
        autocomplete: "nickname",
        "aria-label": t("ui-your-name"),
        onkeydown: (e) => e.key === "Enter" && this.commit(),
        onblur: () => this.input.value.trim() && this.commit(),
      });
      this.slot.replaceChildren(h("div", { class: "name-row" }, this.input), error);
      if (focus) this.input.focus();
    } else {
      const change = h("button", { class: "name-change quiet-link", type: "button", onclick: () => this.edit() }, t("ui-change"));
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
    this.error.textContent = t("ui-add-your-name-first");
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
// Picking a file: click, keyboard, or dropped anywhere on the window (see `Drop` below).

function wireFileInput(screen, onFile) {
  const input = $("[data-file]", screen);
  input.addEventListener("change", () => {
    const file = pickFile(input.files);
    input.value = "";
    if (file) onFile(file);
  });
}

const VIDEO_NAME = /\.(mp4|m4v|mov|webm|mkv|ogv|avi)$/i;
/** Types that say nothing either way: some systems don't know what an .mkv is. */
const vague = (type) => !type || type === "application/octet-stream";
const videoType = (type) => type.startsWith("video/") || type === "application/x-matroska";

/** The video among dropped files: the first that says it's one, else one that might be. */
function videoFrom(files) {
  const list = [...(files ?? [])];
  return list.find((f) => videoType(f.type) || VIDEO_NAME.test(f.name)) ?? list.find((f) => vague(f.type));
}

/**
 * Files dragged anywhere over the window. The whole window is the target, with a word about what
 * dropping will do before you let go, and a refusal when the browser can already tell it isn't a
 * video. Everything else that gets dragged (text, links) is left alone.
 */
class Drop {
  constructor(el) {
    this.el = el;
    this.title = $("[data-drop-title]", el);
    this.depth = 0;
    const files = (e) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
    window.addEventListener("dragenter", (e) => {
      if (!files(e)) return;
      e.preventDefault();
      this.depth++;
      this.over(e);
    });
    window.addEventListener("dragover", (e) => {
      if (!files(e)) return;
      // Always, so a file let go of anywhere is never opened by the browser in place of the app.
      e.preventDefault();
      this.over(e);
    });
    window.addEventListener("dragleave", (e) => {
      if (!files(e)) return;
      // Entering a child fires before leaving its parent, so the count only reaches zero on the
      // way out of the window.
      this.depth = Math.max(0, this.depth - 1);
      if (this.depth === 0) this.end();
    });
    window.addEventListener("drop", (e) => {
      if (!files(e)) return;
      e.preventDefault();
      this.dropped(e);
    });
    window.addEventListener("dragend", () => this.end());
    window.addEventListener("blur", () => this.end());
    window.addEventListener("keydown", (e) => e.key === "Escape" && this.end());
  }

  /** What dropping here would do, for whichever screen is showing. */
  target() {
    if (room.isOpen) {
      // Someone watching the room's copy can switch to their own, as the button offers.
      if (!room.isHost && room.source?.kind !== "file") {
        return { title: t("ui-drop-your-copy"), take: (file) => room.leave({ keepInvite: true }).then(() => joinWith(file)) };
      }
      return { refuse: t("ui-leave-the-room-to-change-the-video") };
    }
    // Opening a room: the file is already chosen.
    if (room.active) return undefined;
    if (!screens.invited.hidden) {
      // A room on a site's player has no file to take.
      if (screens.invited.classList.contains("is-on-site")) return undefined;
      return { title: t("ui-drop-your-copy"), take: joinWith, screen: screens.invited };
    }
    return { title: t("ui-drop-to-watch"), take: startWith, screen: screens.landing };
  }

  /** "video", "other", or "unknown" when the browser won't say until the drop (Safari). */
  verdict(dataTransfer) {
    const items = Array.from(dataTransfer.items ?? []).filter((item) => item.kind === "file");
    if (items.length === 0) return "unknown";
    if (items.some((item) => videoType(item.type))) return "video";
    return items.some((item) => vague(item.type)) ? "unknown" : "other";
  }

  over(e) {
    const target = this.target();
    const refusal = !target ? "" : target.refuse ?? (this.verdict(e.dataTransfer) === "other" ? t("ui-that-s-not-a-video") : "");
    e.dataTransfer.dropEffect = target && !refusal ? "copy" : "none";
    // Keep watching: some browsers never say when a drag leaves the window.
    clearTimeout(this.watchdog);
    this.watchdog = setTimeout(() => this.end(), 1000);
    if (!target) return this.end();
    const state = refusal ? "refuse" : "accept";
    const title = refusal || target.title;
    if (this.title.textContent !== title) this.title.textContent = title;
    if (this.el.dataset.state !== state) this.el.dataset.state = state;
  }

  dropped(e) {
    const target = this.target();
    const accepted = this.el.dataset.state === "accept";
    this.depth = 0;
    clearTimeout(this.watchdog);
    if (!target || target.refuse || !accepted) return this.end();
    const file = videoFrom(e.dataTransfer.files);
    if (!file) {
      this.end();
      if (target.screen) setError(target.screen, t("ui-that-file-isn-t-a-video"));
      return;
    }
    // Taken: the mark closes up as the overlay goes.
    this.el.dataset.state = "taken";
    setTimeout(() => this.el.dataset.state === "taken" && this.el.removeAttribute("data-state"), 420);
    target.take(file);
  }

  end() {
    this.depth = 0;
    clearTimeout(this.watchdog);
    if (this.el.dataset.state && this.el.dataset.state !== "taken") this.el.removeAttribute("data-state");
  }
}

// Landing

const landingName = new NameField($("[data-name-slot]", screens.landing), t("ui-your-name-2"));
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
wireFileInput(screens.landing, startWith);

const joinForm = $("[data-join-form]");
const inviteInput = $("[data-invite-input]");
const joinError = $("[data-join-error]");
joinForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = inviteInput.value.trim();
  if (!text) {
    joinError.textContent = t("ui-paste-the-invite-link-a-friend-sent-you");
    inviteInput.focus();
    return;
  }
  await wasm;
  try {
    location.hash = backend.inspectInvite(text).ticket;
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

const invitedName = new NameField($("[data-name-slot]", screens.invited), t("ui-your-name-2"));
let pendingJoin;

/** Join the room, streaming the video from it unless `file` is our own copy. */
function joinWith(file) {
  setError(screens.invited);
  const invite = inviteFromHash();
  if (!invite) return route();
  if (screens.invited.classList.contains("is-on-site")) return;
  const name = invitedName.require();
  if (!name) {
    pendingJoin = () => joinWith(file);
    return;
  }
  pendingJoin = undefined;
  room.open({ source: file && fileSource(file), stream: !file, name, invite, from: screens.invited });
}

invitedName.onCommit = () => pendingJoin?.();
wireFileInput(screens.invited, joinWith);
$("[data-stream]", screens.invited).addEventListener("click", () => joinWith());

/**
 * The extension's claim on invite links, for rooms on a site's own player.
 *
 * Contract with the browser extension: its content script runs on this site at document_start and
 * sets `document.documentElement.dataset.togetherExtension` (any non-empty value, e.g. its
 * version) before this module runs. For an invite whose ticket carries a page (`InviteInfo.page`),
 * the extension takes over the tab itself: it opens that page and joins the room there. So when
 * the attribute is set, this page only says t("ui-opening-in-together") and does nothing else: no
 * install prompt, no joining. Invites without a page are joined here as always, extension or not.
 * The attribute is also watched after load, in case the content script is late.
 */
const extensionHere = () => Boolean(document.documentElement.dataset.togetherExtension);
new MutationObserver(() => {
  const invite = inviteFromHash();
  if (invite && !screens.invited.hidden) renderInvited(invite);
}).observe(document.documentElement, { attributes: true, attributeFilter: ["data-together-extension"] });

/** "www.youtube.com", from a page's address, for saying where a room is. */
function siteOf(page) {
  try {
    return new URL(page).host || page;
  } catch {
    return page;
  }
}

/**
 * What the invite in the URL allows: refused outright if it's from another version of Together,
 * handed to the extension if the room is on a site's own player, and streaming only through a
 * relay (yours, or the room's own that the invite names).
 */
async function renderInvited(invite) {
  const screen = screens.invited;
  const onSite = $("[data-on-site]", screen);
  let info;
  try {
    await wasm;
    info = backend.inspectInvite(invite);
  } catch (error) {
    // Still loading, or broken: leave the choices as they are and let joining say what's wrong.
    if (!error?.message || inviteFromHash() !== invite) return;
    screen.classList.add("is-refused");
    screen.classList.remove("is-on-site");
    onSite.hidden = true;
    setError(screen, error.message);
    return;
  }
  if (inviteFromHash() !== invite) return;
  screen.classList.remove("is-refused");
  // A room on a site's player: nothing to drop or stream here. Say where it is and how to get in.
  screen.classList.toggle("is-on-site", Boolean(info.page));
  onSite.hidden = !info.page;
  if (info.page) {
    const handed = extensionHere();
    $("[data-on-site-where]", screen).textContent = handed ? t("ui-opening-in-together") : `Your friend is watching on ${siteOf(info.page)}.`;
    $("[data-on-site-how]", screen).hidden = handed;
    $("[data-on-site-install]", screen).hidden = handed;
    const page = $("[data-on-site-page]", screen);
    page.href = info.page;
    page.hidden = handed;
    return;
  }
  // A browser can only stream the room's copy through a relay that isn't public, so without one,
  // don't offer it: go straight to opening your own copy rather than finding out after a wait.
  const stream = canStream() && Boolean(prefs.relay || info.relay);
  $("[data-stream]", screen).hidden = !stream;
  $("[data-own-copy-hint]", screen).hidden = stream;
  $("[data-own-copy]", screen).classList.toggle("btn-primary", !stream);
}
// Tuning: measure this browser's sound against what the room reads, with the microphone.
{
  const button = $("[data-tune]");
  const status = $("[data-tune-status]");
  const tuneRow = $("together-tune");
  let revision = 0;
  const show = async () => {
    const current = ++revision;
    const selection = await tuneNow();
    if (current === revision) tuneRow.update(selection);
  };
  show();
  // The sound moves to whatever is plugged in or unplugged, so the row follows it.
  navigator.mediaDevices?.addEventListener?.("devicechange", () => show());
  // While it runs: what it is doing, a live microphone meter, and how far through it is. Thirty
  // silent seconds with one line of text is what this replaces; the phases are tune.js's own.
  const PHASES = ["microphone", "reference", "video"];
  const run = $("[data-tune-run]");
  const meter = $("[data-tune-meter]");
  const progress = ({ phase, label, fraction, level, hot }) => {
    $("[data-tune-step]").textContent = label;
    meter.style.setProperty("--level", level.toFixed(3));
    $("[data-tune-meter-text]").textContent = t("tune-microphone-level", { percent: Math.round(level * 100) });
    $("[data-tune-hot]").hidden = !hot;
    const at = PHASES.indexOf(phase);
    for (const [i, name] of PHASES.entries()) {
      const li = $(`[data-tune-phase="${name}"]`);
      li.dataset.state = i < at ? "done" : i === at ? "now" : "";
      li.style.setProperty("--through", i < at ? 1 : i === at ? fraction.toFixed(3) : 0);
    }
  };
  const row = $(".tune-offer");
  button.addEventListener("click", async () => {
    button.disabled = true;
    // The panel says what is happening, so the row that offered the tune gets out of the way
    // rather than saying it a second time in smaller type.
    row.hidden = true;
    run.hidden = false;
    try {
      await tune($("[data-tune-video]"), (step) => (status.textContent = step), progress);
      await show();
    } catch (error) {
      status.textContent = error.message;
    } finally {
      run.hidden = true;
      row.hidden = false;
      button.disabled = false;
    }
  });
}

$("[data-home]").addEventListener("click", (e) => {
  e.preventDefault();
  history.pushState(null, "", location.pathname + location.search);
  route();
});

// ---------------------------------------------------------------------------------------------
// The room.

const room = new Room(screens.room, route);
new Drop($("[data-drop]"));

// ---------------------------------------------------------------------------------------------
// Routing: an invite in the URL goes straight to joining.

function route() {
  // A room that is open, or still opening, owns the screen until it is left.
  if (room.active) return;
  const invite = inviteFromHash();
  if (invite) {
    showScreen("invited");
    setError(screens.invited);
    renderInvited(invite);
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
