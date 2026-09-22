// Small DOM helpers shared by the screens.

/** `h("p", { class: "x" }, "text", child)` */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
    else if (key === "style") for (const [prop, v] of Object.entries(value)) el.style.setProperty(prop, v);
    else el.setAttribute(key, value === true ? "" : value);
  }
  el.append(...children.flat().filter((c) => c !== undefined && c !== null));
  return el;
}

const SVG = "http://www.w3.org/2000/svg";

/** An icon from the sprite in index.html. */
export function icon(name, className = "icon") {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("class", className);
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS(SVG, "use");
  use.setAttribute("href", `#${name}`);
  svg.append(use);
  return svg;
}

/** Swap a sprite icon in place. */
export function setIcon(svg, name) {
  svg.querySelector("use").setAttribute("href", `#${name}`);
}

/** Whether the person has asked for less motion. */
export const calm = matchMedia("(prefers-reduced-motion: reduce)");

/** A one-off flourish on `el` that says something just changed; skipped for calm motion. */
export function nudge(el, keyframes, options = {}) {
  if (calm.matches || !el.animate) return;
  el.animate(keyframes, { duration: 320, easing: "cubic-bezier(0.34, 1.36, 0.64, 1)", ...options });
}

/** A person's circle: yours is solid, everyone else's drawn in outline. Initials, no colour. */
export function avatar(person, { you = false } = {}) {
  return h("span", { class: you ? "avatar is-you" : "avatar", "aria-hidden": "true" }, person.initials);
}

/** Copy text, falling back to selecting an input when the Clipboard API is unavailable. */
export async function copyText(text, fallbackInput) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // A room or user edit may have replaced the field while the permission request was pending.
    if (!fallbackInput || fallbackInput.value !== text) return false;
    fallbackInput.focus();
    fallbackInput.select();
    return document.execCommand?.("copy") ?? false;
  }
}

/** Keep a range input's filled track in step with its value. */
export function paintRange(input) {
  const max = Number(input.max) || 0;
  const fill = max > 0 ? (Number(input.value) / max) * 100 : 0;
  input.style.setProperty("--fill", `${fill}%`);
}

/** Local preferences. */
export const prefs = {
  get name() {
    return localStorage.getItem("together.name")?.trim() || "";
  },
  set name(value) {
    localStorage.setItem("together.name", value.trim());
  },
  /** A relay server of the user's own, set once with `?relay=` (empty to forget it). */
  get relay() {
    return localStorage.getItem("together.relay")?.trim() || "";
  },
  set relay(value) {
    if (value.trim()) localStorage.setItem("together.relay", value.trim());
    else localStorage.removeItem("together.relay");
  },
  get volume() {
    const v = Number(localStorage.getItem("together.volume"));
    return Number.isFinite(v) && localStorage.getItem("together.volume") !== null ? v : 1;
  },
  set volume(value) {
    localStorage.setItem("together.volume", String(value));
  },
  /** Show timings: each person's real gap from the room in ms, in place of the words. */
  get timings() {
    return localStorage.getItem("together.timings") === "1";
  },
  set timings(on) {
    if (on) localStorage.setItem("together.timings", "1");
    else localStorage.removeItem("together.timings");
  },
};

// `?relay=https://relay.example.com` remembers a relay; `?relay=` forgets it.
{
  const relay = new URLSearchParams(location.search).get("relay");
  if (relay !== null) prefs.relay = relay;
}

/**
 * Console logging at the level `?log=` asks for (trace, debug, info, warn, error or off), warnings
 * and errors by default. The room's own logging, in wasm, reads the same parameter.
 *
 * - info: opening and leaving the room, what you press, and every room event.
 * - debug: the video element's own events (waiting, seeking, rate changes…) with its position.
 * - trace: the room's status twice a second.
 */
export const log = (() => {
  const levels = ["trace", "debug", "info", "warn", "error", "off"];
  const asked = new URLSearchParams(location.search).get("log");
  const threshold = levels.includes(asked) ? levels.indexOf(asked) : levels.indexOf("warn");
  const at = (level, write) => (...args) => {
    if (levels.indexOf(level) >= threshold) write(`together: ${level.toUpperCase()}`, ...args);
  };
  return {
    trace: at("trace", console.log),
    debug: at("debug", console.log),
    info: at("info", console.info),
    warn: at("warn", console.warn),
    error: at("error", console.error),
  };
})();
