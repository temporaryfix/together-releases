import { t } from "../copy.js";
import { copyText, nudge, setIcon } from "../ui.js";

/** Shared invite state. Each surface supplies its own synchronous or remote QR encoder. */
class TogetherInvite extends HTMLElement {
  #link = "";
  #revision = 0;
  #feedback;

  setLink(link) {
    if (link === this.#link) return;
    this.#link = link;
    this.#revision++;
    this.#resetFeedback();
    this.querySelector("[data-invite-link]").value = link;
    this.querySelector("[data-invite-qr]").replaceChildren();
  }

  setQr(link, source) {
    if (link !== this.#link) return false;
    const box = this.querySelector("[data-invite-qr]");
    const svg = new DOMParser().parseFromString(source || "", "image/svg+xml").documentElement;
    if (svg?.localName !== "svg" || svg.namespaceURI !== "http://www.w3.org/2000/svg") {
      box.replaceChildren();
      box.hidden = true;
      return false;
    }
    // The encoder is our own WASM. Translator/user text is never accepted as SVG markup.
    const width = Number(this.getAttribute("qr-pixels"));
    if (width > 0) {
      const modules = svg.viewBox.baseVal.width || Number(svg.getAttribute("width")) || 1;
      const size = `${Math.max(3, Math.floor(width / modules)) * modules}px`;
      svg.setAttribute("width", size);
      svg.setAttribute("height", size);
    }
    box.replaceChildren(document.importNode(svg, true));
    box.hidden = false;
    return true;
  }

  async copy({ fallback = true, feedback = true } = {}) {
    if (!this.#link) return false;
    const revision = this.#revision;
    const copied = await copyText(this.#link, fallback ? this.querySelector("[data-invite-link]") : undefined);
    if (revision !== this.#revision || !this.isConnected) return false;
    if (copied && feedback) this.#showFeedback();
    return copied;
  }

  disconnectedCallback() {
    this.#revision++;
    this.#resetFeedback();
  }

  #showFeedback() {
    this.#resetFeedback();
    const button = this.querySelector("[data-copy-link]");
    const label = button.querySelector("span");
    const svg = button.querySelector("svg");
    const previous = label.textContent;
    label.textContent = t("copy-done");
    if (svg) {
      setIcon(svg, "i-check");
      nudge(svg, [{ transform: "scale(0.4)" }, { transform: "none" }], { duration: 420 });
    }
    const restore = () => {
      label.textContent = previous;
      if (svg) setIcon(svg, "i-copy");
    };
    this.#feedback = { restore, timer: setTimeout(() => this.#resetFeedback(), 1600) };
  }

  #resetFeedback() {
    if (!this.#feedback) return;
    clearTimeout(this.#feedback.timer);
    this.#feedback.restore();
    this.#feedback = undefined;
  }
}
customElements.define("together-invite", TogetherInvite);
