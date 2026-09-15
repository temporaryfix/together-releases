// Where a room's video comes from.
//
// Every source has the same shape, so the room doesn't care how bytes arrive:
//
//   {
//     kind:    "file" | ...,
//     title:   string,              shown in the room and compared with other peers'
//     size:    number | undefined,  bytes, if known
//     attach(video): Promise<void>  load into the element; resolves once the duration is known
//     release(): void               free whatever attach() took
//   }
//
// Today there's one: a file on this device. Streaming from another peer (iroh-blobs) will be a
// second source with the same shape.

export class MediaLoadError extends Error {}

/** A video file the user picked or dropped. */
export function fileSource(file) {
  let url;
  return {
    kind: "file",
    title: file.name,
    size: file.size,
    async attach(video) {
      url = URL.createObjectURL(file);
      try {
        await load(video, url);
      } catch (error) {
        this.release();
        throw error;
      }
    },
    release() {
      if (url) URL.revokeObjectURL(url);
      url = undefined;
    },
  };
}

/** Point `video` at `src` and wait until its duration is known. */
function load(video, src) {
  return new Promise((resolve, reject) => {
    const done = () => {
      video.removeEventListener("loadedmetadata", ok);
      video.removeEventListener("error", fail);
    };
    const ok = () => {
      done();
      resolve();
    };
    const fail = () => {
      done();
      reject(new MediaLoadError(describeError(video.error)));
    };
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
