// Where a room's video comes from.
//
// Every source has the same shape, so the room doesn't care how bytes arrive:
//
//   {
//     kind:    "file" | "stream",
//     title:   string,              shown in the room and compared with other peers'
//     size:    number | undefined,  bytes, if known
//     file:    File | undefined,    the file itself, for the room to hash
//     attach(video): Promise<void>  load into the element; resolves once the duration is known
//     release(): void               free whatever attach() took
//   }
//
// Two of them: a file on this device, and the room's own copy arriving over iroh-blobs.

import { serve, stopServing, streamUrl } from "./stream.js";

export class MediaLoadError extends Error {}

/** A video file the user picked or dropped. */
export function fileSource(file) {
  let url;
  const controller = new AbortController();
  return {
    kind: "file",
    title: file.name,
    size: file.size,
    file,
    async attach(video) {
      url = URL.createObjectURL(file);
      try {
        await load(video, url, controller.signal);
      } catch (error) {
        this.release();
        throw error;
      }
    },
    release() {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
      url = undefined;
    },
  };
}

/**
 * The room's copy, fetched from its peers as it plays.
 *
 * The bytes arrive over iroh; the Service Worker turns them into the range requests a `<video>`
 * expects, so seeking works long before the whole film is here.
 */
export function streamSource(session, { hash, title, size }) {
  const owner = {};
  const controller = new AbortController();
  return {
    kind: "stream",
    title,
    size,
    async attach(video) {
      try {
        controller.signal.throwIfAborted();
        await serve(session, owner);
        controller.signal.throwIfAborted();
        await load(video, streamUrl(hash, title), controller.signal);
      } catch (error) {
        this.release();
        throw error instanceof MediaLoadError ? error : new MediaLoadError(error.message);
      }
    },
    release() {
      controller.abort();
      stopServing(owner);
    },
  };
}

/** Point `video` at `src` and wait until its duration is known. */
function load(video, src, signal) {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const done = () => {
      video.removeEventListener("loadedmetadata", ok);
      video.removeEventListener("error", fail);
      signal.removeEventListener("abort", abort);
    };
    const abort = () => {
      done();
      reject(signal.reason);
    };
    const ok = () => {
      done();
      resolve();
    };
    const fail = () => {
      done();
      reject(new MediaLoadError(describeError(video.error)));
    };
    signal.addEventListener("abort", abort, { once: true });
    video.addEventListener("loadedmetadata", ok);
    video.addEventListener("error", fail);
    video.src = src;
    video.load();
  });
}

// `MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED`.
const SRC_NOT_SUPPORTED = 4;

function describeError(error) {
  if (error?.code === SRC_NOT_SUPPORTED) {
    return "This browser can’t play that file. MP4 (H.264) and WebM work everywhere.";
  }
  return "That file couldn’t be opened. Try another copy of the video.";
}

/** The first file in a drop or file-input event, if any. */
export function pickFile(fileList) {
  return fileList && fileList.length > 0 ? fileList[0] : undefined;
}
