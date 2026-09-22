// One roster renderer for the page and extension. Native list semantics, keyed rows and
// accessible status text survive frequent snapshots without rebuilding focused content.
import { t } from "../copy.js";
import { avatar, calm, h } from "../ui.js";
const $ = (selector, root) => root.querySelector(selector);
const SVG = "http://www.w3.org/2000/svg";

class TogetherPeople extends HTMLElement {
  #timers = new Map();

  clear() {
    for (const timer of this.#timers.values()) clearTimeout(timer);
    this.#timers.clear();
    this.querySelector("ul")?.replaceChildren();
  }

  disconnectedCallback() { this.clear(); }

  #cancel(li) {
    clearTimeout(this.#timers.get(li));
    this.#timers.delete(li);
  }

  #later(li, delay, action) {
    this.#cancel(li);
    this.#timers.set(li, setTimeout(() => {
      this.#timers.delete(li);
      action();
    }, delay));
  }

  #celebrateReady(li) {
    this.#cancel(li);
    li.classList.remove("is-confirming");
    if (calm.matches) return;
    // Restart the flourish if they toggle quickly.
    void li.offsetWidth;
    li.classList.add("is-confirming");
    this.#later(li, 1400, () => li.classList.remove("is-confirming"));
  }

  #depart(li) {
    this.#cancel(li);
    if (calm.matches) return li.remove();
    li.classList.add("is-leaving");
    this.#later(li, 320, () => li.remove());
  }

  update(status, { timings = false, tuneMs, onArrival = () => {} } = {}) {
    const people = this.querySelector("ul");
    const { me, role, sync: mySync, blocked, waiting, ready, peers } = status;
    // Waiting on the autoplay policy isn't being out of sync; don't show a scary number.
    const mine = blocked ? { level: "unknown", label: t("sync-click"), detail: t("sync-click-detail") } : mySync;
    const held = waiting?.type === "stalled" && waiting.local;
    const rows = me
      ? [{ who: { ...me, name: t("person-you", { name: me.name }) }, role: role, sync: mine, ready: ready?.mine === true, stalled: held, you: true }]
      : [];
    // Someone whose name hasn't arrived yet isn't shown at all, rather than as "Someone".
    rows.push(...[...peers].filter((row) => row.who.named !== false));
    // Retire an earlier snapshot's departure before applying another. Rapid churn cannot
    // accumulate invisible rows or leave an old timer attached to a returning identity.
    for (const li of people.querySelectorAll(".is-leaving")) {
      this.#cancel(li);
      li.remove();
    }
    const present = [...people.children];
    const existing = new Map(present.map((li) => [li.dataset.id, li]));
    const keep = new Set();
    rows.forEach((row, index) => {
      const id = row.you ? "me" : row.who.id;
      keep.add(id);
      let li = existing.get(id);
      const arriving = !li;
      if (arriving) {
        li = h(
          "li",
          { class: "person", "data-id": id, style: { "--i": index } },
          face(row.who, row.you),
          h("span", { class: "person-text who", "aria-hidden": "true" }, h("span", { class: "person-name who-name" }), h("span", { class: "person-note who-note" })),
          h("span", { class: "visually-hidden", "data-status": "" }),
        );
        // Their arrival, held back until there was a name to say it with.
        onArrival(row.who);
      }
      // A name can arrive, or change, after the row is made: keep the circle and the words in step.
      const nameEl = $(".person-name", li);
      if (nameEl.textContent !== row.who.name) nameEl.textContent = row.who.name;
      const initials = $(".avatar", li);
      if (initials.textContent !== row.who.initials) initials.textContent = row.who.initials;
      const live = [...people.children].filter((el) => !el.classList.contains("is-leaving"));
      if (live[index] !== li) people.insertBefore(li, live[index] ?? null);
      const sync = row.sync ?? { level: "unknown", label: t("sync-measuring"), detail: t("sync-measuring-detail") };
      // Being stuck is the more urgent of the two, and a stalled player isn't waiting to start.
      const state = row.stalled ? "stalled" : row.ready ? "ready" : "";
      if (li.dataset.state !== state) {
        // Saying you're ready gets a tick, once, as it happens; arriving already ready doesn't.
        if (state === "ready" && !arriving) this.#celebrateReady(li);
        li.dataset.state = state;
      }
      if (li.dataset.sync !== sync.level) li.dataset.sync = sync.level;
      const role = row.role ?? "viewer";
      if (li.dataset.role !== role) li.dataset.role = role;
      drawMeter(li, sync);
      // Words only when something is off; the circle says the rest. Show timings puts the figures
      // there instead, always, with this output's tune on your own.
      const noted = row.stalled || ["poor", "off"].includes(sync.level) || row.following === "loading" || (row.you && blocked);
      const tune = row.you && tuneMs ? t("person-tune", { timing: signedMs(tuneMs) }) : "";
      const note = timings && sync.timing && !row.stalled ? `${sync.timing}${tune}` : noted ? sync.label : "";
      const noteEl = $(".person-note", li);
      if (noteEl.textContent !== note) noteEl.textContent = note;
      const aside = row.ready && !row.stalled ? t("person-ready") : "";
      // How we reach them: direct is worth saying too, so "nothing shown" never has to mean
      // "we couldn't tell" and "it's fine" at the same time.
      // Only how, never the relay's host name: that's no one's business but a log's.
      const via =
        row.link?.type === "relayed"
          ? t("person-relayed")
          : row.link?.type === "direct"
            ? t("person-direct")
            : row.link?.type === "indirect"
              ? t("person-indirect")
              : "";
      const what = role === "screen" ? t("person-tv") : role === "remote" ? t("person-remote") : "";
      const title = t("person-detail", { name: row.who.name, role: what, sync: sync.detail, ready: aside, trip: row.rttMs != null ? t("person-round-trip", { milliseconds: Math.round(row.rttMs) }) : "", via });
      if (li.title !== title) {
        li.title = title;
        $("[data-status]", li).textContent = title;
      }
      const link = row.link?.type ?? "";
      if (li.dataset.link !== link) li.dataset.link = link;
    });
    for (const [id, li] of existing) if (!keep.has(id)) this.#depart(li);
  }

}
customElements.define("together-people", TogetherPeople);

/** Someone's circle, with a ring for how they are and a tick for the moment they're ready. */
function face(who, you) {
  const ring = document.createElementNS(SVG, "svg");
  ring.setAttribute("class", "face-ring");
  ring.setAttribute("viewBox", "0 0 36 36");
  ring.innerHTML = `<circle cx="18" cy="18" r="16.75" pathLength="100"/>`;
  const tick = document.createElementNS(SVG, "svg");
  tick.setAttribute("class", "face-tick");
  tick.setAttribute("viewBox", "0 0 24 24");
  tick.innerHTML = `<path d="m7 12.5 3.3 3.3L17 9" pathLength="1"/>`;
  const meter = document.createElementNS(SVG, "svg");
  meter.setAttribute("class", "face-meter");
  meter.setAttribute("viewBox", "0 0 36 36");
  meter.innerHTML = `<circle cx="18" cy="18" r="16.75" pathLength="360"/>`;
  return h("span", { class: you ? "face is-you" : "face", "aria-hidden": "true" }, avatar(who, { you }), tick, ring, meter);
}
/** Gaps this far from the room reach the end of the meter's travel. */
const METER_FULL_MS = 200;
/** How far round the circle, either side of the bottom, the meter travels. */
const METER_SWEEP_DEG = 70;
/** The shortest arc drawn, so a precise measurement still shows. */
const METER_MIN_DEG = 16;

/** "+42 ms", "−3 ms", "0 ms". */
const signedMs = (ms) => {
  const size = Math.abs(ms).toFixed(0);
  return `${size === "0" ? "" : ms > 0 ? "+" : "−"}${size} ms`;
};

/**
 * The sync meter, on the rim of someone's circle: a short arc hanging at the bottom when they're
 * with the room, sliding round towards the right when ahead and the left when behind. Its length
 * is how sure the measurement is. Square-root scaled, so a few milliseconds still move it and a
 * second doesn't go past the side.
 */
function drawMeter(li, sync) {
  const svg = $(".face-meter", li);
  const gap = sync?.gapMs;
  const shown = typeof gap === "number" && Number.isFinite(gap);
  svg.classList.toggle("is-shown", shown);
  if (!shown) return;
  const err = Math.max(0, sync.errMs ?? 0);
  const angle = (ms) => Math.sign(ms) * Math.min(1, Math.sqrt(Math.abs(ms) / METER_FULL_MS)) * METER_SWEEP_DEG;
  let from = angle(gap - err);
  let to = angle(gap + err);
  if (to - from < METER_MIN_DEG) {
    const middle = angle(gap);
    [from, to] = [middle - METER_MIN_DEG / 2, middle + METER_MIN_DEG / 2];
  }
  // SVG circles start at three o'clock and run clockwise; the bottom is 90°, and ahead is towards
  // the right, which from the bottom is anticlockwise.
  svg.style.setProperty("--meter-start", `${(90 - to).toFixed(1)}deg`);
  svg.style.setProperty("--meter-length", (to - from).toFixed(1));
}
