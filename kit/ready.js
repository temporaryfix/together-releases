import { t } from "../copy.js";
import { icon, h, setIcon } from "../ui.js";

/** Shared ready button; native button semantics and focus stay intact across updates. */
class TogetherReady extends HTMLElement {
  connectedCallback() {
    if (this.button) return;
    this.label = h("span", { "data-ready-label": "" });
    this.button = h("button", { class: "btn btn-primary", type: "button", "aria-pressed": "false", "data-ready": "" }, icon("i-check"), this.label);
    if (this.hasAttribute("large")) this.button.classList.add("btn-large");
    this.append(this.button);
    this.update({ mine: false, open: false });
  }

  update({ mine, open }) {
    this.hidden = !open;
    this.button.hidden = !open;
    this.button.setAttribute("aria-pressed", String(mine));
    this.button.classList.toggle("btn-primary", !mine);
    this.button.classList.toggle("btn-secondary", mine);
    this.label.textContent = t(mine ? "not-ready-button" : "ready-button");
    this.button.title = this.hasAttribute("keyboard")
      ? t(mine ? "not-ready-button-key" : "ready-button-key")
      : this.label.textContent;
    setIcon(this.button.querySelector("svg"), mine ? "i-close" : "i-check");
  }
}
customElements.define("together-ready", TogetherReady);
