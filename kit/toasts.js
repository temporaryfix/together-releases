import { avatar, h, icon } from "../ui.js";

/** Bounded transient messages; the component owns both visible rows and their timers. */
class TogetherToasts extends HTMLElement {
  #entries = new Map();

  show(message, { person, icon: iconName, key } = {}) {
    const list = this.querySelector("ol");
    const lead = person ? avatar(person) : iconName ? icon(iconName) : undefined;
    const item = h("li", { class: lead ? "toast" : "toast is-plain" }, lead, h("span", {}, message));
    const previous = key && [...list.children].find((li) => li.dataset.key === key && !li.classList.contains("is-leaving"));
    if (key) item.dataset.key = key;
    if (previous) {
      previous.before(item);
      this.#remove(previous);
      item.style.animation = "none";
    } else {
      list.append(item);
    }
    const limit = Number(this.getAttribute("max"));
    const max = Number.isSafeInteger(limit) && limit > 0 ? limit : 3;
    while (list.children.length > max) this.#remove(list.firstElementChild);
    const configured = Number(this.getAttribute("duration"));
    const duration = Number.isFinite(configured) && configured > 0 ? configured : 3600;
    this.#entries.set(item, { timer: setTimeout(() => this.#dismiss(item), duration) });
  }

  clear() {
    for (const item of this.#entries.keys()) this.#remove(item);
  }

  disconnectedCallback() {
    this.clear();
  }

  #dismiss(item) {
    const entry = this.#entries.get(item);
    if (!entry) return;
    item.classList.add("is-leaving");
    entry.onEnd = (event) => { if (event.target === item) this.#remove(item); };
    item.addEventListener("animationend", entry.onEnd);
    // Reduced motion may prevent animationend entirely.
    entry.timer = setTimeout(() => this.#remove(item), 400);
  }

  #remove(item) {
    const entry = this.#entries.get(item);
    if (entry) {
      clearTimeout(entry.timer);
      if (entry.onEnd) item.removeEventListener("animationend", entry.onEnd);
      this.#entries.delete(item);
    }
    item.remove();
  }
}
customElements.define("together-toasts", TogetherToasts);
