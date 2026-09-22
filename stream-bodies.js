// Own WASM response bodies. A pending next() borrows its body: cancel it immediately,
// but never free it until that call settles. IDs are never reused across films.
export class StreamBodies {
  #next = 0;
  #entries = new Map();

  open(body, id = ++this.#next) {
    if (this.#entries.has(id)) {
      try { body.cancel(); } finally { body.free(); }
      throw new Error("That body is already open");
    }
    this.#entries.set(id, { body, reading: false, closed: false });
    return id;
  }

  async read(id) {
    const entry = this.#entries.get(id);
    if (!entry || entry.closed) throw new Error("That body has been closed");
    if (entry.reading) throw new Error("That body is already being read");
    entry.reading = true;
    try {
      const bytes = await entry.body.next();
      if (!bytes) this.close(id);
      return entry.closed ? undefined : bytes;
    } catch (error) {
      this.close(id);
      throw error;
    } finally {
      entry.reading = false;
      if (entry.closed) this.#free(id, entry);
    }
  }

  close(id) {
    const entry = this.#entries.get(id);
    if (!entry || entry.closed) return;
    entry.closed = true;
    try {
      entry.body.cancel();
    } finally {
      if (!entry.reading) this.#free(id, entry);
    }
  }

  closeAll() {
    for (const id of this.#entries.keys()) this.close(id);
  }

  #free(id, entry) {
    this.#entries.delete(id);
    entry.body.free();
  }
}
