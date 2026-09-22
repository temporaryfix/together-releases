// Pure ownership policy. Tokens identify operations, not elapsed time or browser objects.
export class Lifecycle {
  #current;

  begin() {
    if (this.#current) return undefined;
    const operation = {};
    this.#current = operation;
    return operation;
  }

  owns(operation) {
    return operation !== undefined && this.#current === operation;
  }

  cancel() {
    this.#current = undefined;
  }
}

// Every adopted or late session is disposed even when its graceful shutdown fails.
export async function disposeSession(session, timeoutMs = 2000) {
  let timer;
  try {
    await Promise.race([
      Promise.resolve().then(() => session.leave()),
      new Promise((resolve) => { timer = setTimeout(resolve, timeoutMs); }),
    ]);
  } finally {
    clearTimeout(timer);
    session.close();
  }
}
