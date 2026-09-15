// The page's half of the Service Worker bridge: the room's film, behind a URL a <video> can open.
//
// The worker in sw.js asks the questions; everything it asks about is answered by the `Session`,
// which holds the iroh connection and the bytes fetched so far. Bodies stay here as wasm objects
// and are read a piece at a time, because a stream can't be sent across a message port.

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
let ready;
let nextBody = 0;
const bodies = new Map();

/** Answer the worker's requests from `newSession` until `stopServing`. */
export async function serve(newSession) {
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

export function stopServing() {
  session = undefined;
  for (const id of [...bodies.keys()]) close(id);
}

async function start() {
  if (!canStream()) throw new Error("This browser can’t stream without a secure connection.");
  navigator.serviceWorker.removeEventListener("message", answer);
  navigator.serviceWorker.addEventListener("message", answer);
  await navigator.serviceWorker.register(new URL("./sw.js", import.meta.url));
  await navigator.serviceWorker.ready;
  // A worker only sees requests from pages it controls, and it doesn't control this one until it
  // claims it, which happens once it has activated.
  if (!navigator.serviceWorker.controller) {
    await Promise.race([
      new Promise((resolve) => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true })),
      new Promise((resolve) => setTimeout(resolve, CONTROL_TIMEOUT_MS)),
    ]);
  }
  if (!navigator.serviceWorker.controller) {
    throw new Error("The helper that plays the room’s copy didn’t start. Reload and try again.");
  }
}

function answer(event) {
  const port = event.ports[0];
  const reply = (value, transfer = []) => port?.postMessage(value, transfer);
  const message = event.data;
  if (!session) return reply({ error: "nothing is streaming" });
  try {
    switch (message.kind) {
      case "head":
        return reply(session.streamHead(message.hash, message.range ?? undefined));
      case "open": {
        const id = ++nextBody;
        bodies.set(id, { body: session.streamBody(message.start, message.end), reading: false, closed: false });
        return reply({ id });
      }
      case "read":
        return read(message.id, reply);
      case "close":
        return close(message.id);
    }
  } catch (error) {
    reply({ error: String(error?.message ?? error) });
  }
}

function read(id, reply) {
  const entry = bodies.get(id);
  if (!entry) return reply({ error: "that body has been closed" });
  entry.reading = true;
  entry.body.next().then(
    (bytes) => {
      // The wasm side hands over a fresh array, so the buffer can be given away rather than copied.
      done(id);
      reply(bytes ? { bytes: bytes.buffer } : {}, bytes ? [bytes.buffer] : []);
    },
    (error) => {
      done(id);
      reply({ error: String(error?.message ?? error) });
    },
  );
}

function done(id) {
  const entry = bodies.get(id);
  if (!entry) return;
  entry.reading = false;
  if (entry.closed) close(id);
}

/** Stop a body now, and free it once whatever is reading it has let go: wasm objects can't be
 * freed mid-call. */
function close(id) {
  const entry = bodies.get(id);
  if (!entry) return;
  entry.body.cancel();
  if (entry.reading) {
    entry.closed = true;
    return;
  }
  bodies.delete(id);
  entry.body.free();
}
