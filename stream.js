// The page's half of the Service Worker bridge: the room's film, behind a URL a <video> can open.
//
// The worker in sw.js asks the questions; everything it asks about is answered by the `Session`,
// which holds the iroh connection and the bytes fetched so far. Bodies stay here as wasm objects
// and are read a piece at a time, because a stream can't be sent across a message port.

import { StreamBodies } from "./stream-bodies.js";

/** Whether a film can be streamed here at all. Service Workers need a secure context. */
export function canStream() {
  return "serviceWorker" in navigator && window.isSecureContext;
}

/** Where a blob is played from. One segment per part, so any title is safe in a path. */
export function streamUrl(hash, title) {
  return new URL(`./stream/${hash}/${encodeURIComponent(title) || "film"}`, import.meta.url).href;
}

/** How long to wait for the worker to take charge of this page before giving up on streaming. */
const CONTROL_TIMEOUT_MS = 8000;

let session;
let owner;
let generation = 0;
let ready;
const bodies = new StreamBodies();

/** Answer the worker's requests from `newSession` until `stopServing`. */
export async function serve(newSession, newOwner) {
  bodies.closeAll();
  generation++;
  owner = newOwner;
  session = newSession;
  ready ??= start();
  try {
    await ready;
  } catch (error) {
    // A reload, or simply trying again, may do better than this attempt did.
    ready = undefined;
    throw error;
  }
}

export function stopServing(oldOwner) {
  if (owner !== oldOwner) return;
  owner = undefined;
  session = undefined;
  bodies.closeAll();
}

async function start() {
  if (!canStream()) throw new Error("This browser can’t stream without a secure connection.");
  navigator.serviceWorker.removeEventListener("message", answer);
  navigator.serviceWorker.addEventListener("message", answer);
  let timer;
  let controlled;
  const control = new Promise((resolve) => { controlled = resolve; });
  navigator.serviceWorker.addEventListener("controllerchange", controlled);
  try {
    await Promise.race([
      (async () => {
        await navigator.serviceWorker.register(new URL("./sw.js", import.meta.url));
        await navigator.serviceWorker.ready;
        if (!navigator.serviceWorker.controller) await control;
        if (!navigator.serviceWorker.controller) throw new Error("The streaming helper lost control of this page");
      })(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("The helper that plays the room’s copy didn’t start. Reload and try again.")), CONTROL_TIMEOUT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    navigator.serviceWorker.removeEventListener("controllerchange", controlled);
  }
}

function answer(event) {
  const port = event.ports[0];
  const reply = (value, transfer = []) => {
    if (!port) return;
    try { port.postMessage(value, transfer); } finally { port.close(); }
  };
  const message = event.data;
  if (!session) return reply({ error: "nothing is streaming" });
  try {
    switch (message.kind) {
      case "head":
        return reply({ ...session.streamHead(message.hash, message.range ?? undefined), generation });
      case "open": {
        if (message.generation !== generation) throw new Error("That film is no longer open");
        const id = bodies.open(session.streamBody(message.start, message.end), message.id);
        return reply({ id });
      }
      case "read":
        return bodies.read(message.id).then(
          (bytes) => reply(bytes ? { bytes: bytes.buffer } : {}, bytes ? [bytes.buffer] : []),
          (error) => reply({ error: String(error?.message ?? error) }),
        );
      case "close":
        return bodies.close(message.id);
      default:
        return reply({ error: "unknown stream request" });
    }
  } catch (error) {
    reply({ error: String(error?.message ?? error) });
  }
}
