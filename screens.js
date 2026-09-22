// Navigation owns these fixed page screens; each controller owns its content.
export const $ = (selector, root = document) => root.querySelector(selector);

export const screens = {
  landing: $("#landing"),
  invited: $("#invited"),
  room: $("#room"),
};

export function showScreen(name) {
  for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
}

export function setError(screen, message = "") {
  $("[data-error]", screen).textContent = message;
}

export function setBusy(screen, busy) {
  $("[data-dropzone]", screen).classList.toggle("is-busy", busy);
}
