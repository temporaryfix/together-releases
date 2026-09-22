import { t } from "../copy.js";
import { h } from "../ui.js";

/** Render a deadline supplied by the room clock. The owning surface advances time. */
class TogetherCountdown extends HTMLElement {
  update({ left, resuming, message = "" }) {
    const tick = Math.max(0, Math.ceil(left / 1000));
    const caption = tick > 0 ? t(resuming ? "countdown-resuming" : "countdown-starting", { seconds: tick }) : message;
    if (this.hasAttribute("compact")) {
      // Preserve the live-region node; only announce when the displayed second changes.
      if (this.textContent !== caption) this.textContent = caption;
      return;
    }
    this.replaceChildren(tick === 0
      ? h("div", { class: "countdown is-go" }, h("span", { class: "countdown-ring" }))
      : h("div", { class: "countdown", role: "status" },
        h("div", { class: "countdown-dial" }, sweep(left), h("span", { class: "countdown-number", "aria-hidden": "true" }, String(tick))),
        h("p", { class: "countdown-caption" }, caption)));
  }
}

/** Start the circle at the current fraction of a second, including late status delivery. */
function sweep(left) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "countdown-sweep");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = '<circle cx="50" cy="50" r="49" pathLength="1"/><circle cx="50" cy="50" r="49" pathLength="1"/>';
  const into = 1000 - (((left % 1000) + 1000) % 1000 || 1000);
  svg.style.setProperty("--into", `${-into}ms`);
  return svg;
}

customElements.define("together-countdown", TogetherCountdown);
