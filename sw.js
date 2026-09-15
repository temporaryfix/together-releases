// The browser's answer to the CLI's localhost media server.
//
// A page can't listen on a port, so requests for the film the room is streaming are intercepted
// here and answered by the page, which is where the iroh connection and the downloaded bytes live.
// This worker only carries the question across and streams the answer back: the status, the
// headers and the range arithmetic all come from the page (crates/web/src/stream.rs), so there is
// one implementation of the rules `<video>` relies on.

/** Everything under here is a film; the first segment after it is the blob hash. */
const FILMS = new URL("./stream/", self.location).pathname;

self.addEventListener("install", () => self.skipWaiting());
// Claim the pages that are already open: a first visit is otherwise uncontrolled, and requests
// from an uncontrolled page never reach a worker at all.
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(FILMS)) return;
  event.respondWith(serve(event, url));
});

async function serve(event, url) {
  const page = await client(event);
  if (!page) return new Response(null, { status: 503 });
  const hash = url.pathname.slice(FILMS.length).split("/")[0];
  let head;
  try {
    head = await ask(page, { kind: "head", hash, range: event.request.headers.get("range") });
  } catch (error) {
    return new Response(String(error), { status: 500 });
  }
  const headers = {
    "accept-ranges": "bytes",
    "content-type": head.contentType,
    "content-length": String(head.contentLength),
    // The bytes are already in the page; a second copy in the HTTP cache would be one too many.
    "cache-control": "no-store",
  };
  if (head.contentRange) headers["content-range"] = head.contentRange;
  const empty = event.request.method === "HEAD" || head.end <= head.start;
  return new Response(empty ? null : body(page, head), { status: head.status, headers });
}

/** Reads the body a piece at a time, so nothing is downloaded further ahead than it is played. */
function body(page, head) {
  let id;
  return new ReadableStream({
    async start() {
      ({ id } = await ask(page, { kind: "open", start: head.start, end: head.end }));
    },
    async pull(controller) {
      const { bytes } = await ask(page, { kind: "read", id });
      if (bytes) controller.enqueue(new Uint8Array(bytes));
      else controller.close();
    },
    // The player seeked away or has buffered enough: stop fetching for this response.
    cancel() {
      page.postMessage({ kind: "close", id });
    },
  });
}

/** The page that made the request, or any open one: a media element's request may name none. */
async function client(event) {
  const page = event.clientId && (await self.clients.get(event.clientId));
  return page ?? (await self.clients.matchAll({ type: "window" }))[0];
}

/** One question to the page, answered over its own channel. */
function ask(page, message) {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => {
      const answer = event.data;
      if (answer.error) reject(new Error(answer.error));
      else resolve(answer);
    };
    page.postMessage(message, [channel.port2]);
  });
}
