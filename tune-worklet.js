// The microphone's recorder for tune.js: an AudioWorklet that hands on blocks of samples, each
// with the context time of its first sample, and the loudest sample in it. A file of its own, not
// a blob: an extension's content security policy only runs scripts it ships.
//
// The peak rides along on the block that is being posted anyway, so the meter the page shows while
// tuning runs costs one number every 4096 samples (about 85 ms at 48 kHz) and no extra messages.

class Recorder extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buf = new Float32Array(4096);
    this.n = 0;
    this.t0 = 0;
    this.last = -1;
    this.silence = new Float32Array(128);
  }

  flush() {
    if (this.n > 0) {
      let peak = 0;
      for (let i = 0; i < this.n; i++) {
        const v = this.buf[i] < 0 ? -this.buf[i] : this.buf[i];
        if (v > peak) peak = v;
      }
      this.port.postMessage({ t0: this.t0, samples: this.buf.slice(0, this.n), peak });
    }
    this.n = 0;
  }

  // Every sample's time is its block's start plus its place in the block, so the block must hold
  // one sample per frame of context time. Safari (26, 2026-09-19) breaks that two ways, and each
  // moved the tune's marks by up to 230 ms: a quantum can come with no input, which is kept as silence
  // rather than skipped, and quanta can go missing altogether, which starts a new block at the
  // right time rather than running the samples on either side together.
  process(inputs) {
    const quantum = 128 / sampleRate;
    if (this.last >= 0 && Math.abs(currentTime - this.last - quantum) > quantum / 2) this.flush();
    this.last = currentTime;
    const ch = (inputs[0] && inputs[0][0]) || this.silence;
    if (this.n === 0) this.t0 = currentTime;
    this.buf.set(ch, this.n);
    this.n += ch.length;
    if (this.n + 128 > this.buf.length) this.flush();
    return true;
  }
}
registerProcessor("together-recorder", Recorder);
