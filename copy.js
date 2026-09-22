import { createCopy } from "./copy-runtime.js";

const response = await fetch(new URL("./locales/en/together.ftl", import.meta.url));
if (!response.ok) throw new Error(`Together catalog could not load (${response.status})`);
export const t = createCopy(await response.text());

/** Localize plain text and accessible labels without ever parsing translator text as HTML. */
export function localize(root = document) {
  for (const element of root.querySelectorAll("[data-l10n-id]")) element.textContent = t(element.dataset.l10nId);
  for (const attribute of ["aria-label", "title", "placeholder"]) {
    for (const element of root.querySelectorAll(`[data-l10n-${attribute}]`)) {
      element.setAttribute(attribute, t(element.getAttribute(`data-l10n-${attribute}`)));
    }
  }
}
