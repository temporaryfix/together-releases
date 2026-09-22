import { t } from "../copy.js";
import { worn } from "../tune-device.js";

/** The same device-specific tune and available action on every browser surface. */
class TogetherTune extends HTMLElement {
  update({ on = null, matched = false, tune = null } = {}) {
    const button = this.querySelector("[data-tune]");
    const status = this.querySelector("[data-tune-status]");
    const how = this.querySelector("[data-tune-how]");
    this.tuneMs = Number.isFinite(tune?.delayMs) ? tune.delayMs : null;
    const unavailable = worn(on);
    button.hidden = unavailable;
    if (how) how.hidden = unavailable || this.tuneMs !== null;
    button.textContent = t(this.tuneMs === null ? "ui-tune-it" : "ui-tune-again");
    if (unavailable) {
      status.textContent = t("ui-a-microphone-can-t-hear-inside-headphones");
    } else if (this.tuneMs === null) {
      status.textContent = on ? t("tune-output-untuned", { output: on }) : t("ui-sound-early-or-late");
    } else {
      const args = { milliseconds: Math.abs(this.tuneMs).toFixed(0), side: this.tuneMs > 0 ? "late" : "early", output: on ?? "" };
      status.textContent = Math.abs(this.tuneMs) < 1
        ? t(matched && on ? "tune-output-on-time" : "ui-sound-tuned-on-time", args)
        : t(matched && on ? "tune-output-adjusted" : "tune-adjusted", args);
    }
  }
}
customElements.define("together-tune", TogetherTune);
