// Every sound is synthesized with WebAudio — no audio files, no network. The pad
// starts on the first user gesture (browsers block audio before one) and every effect
// is a short envelope over an oscillator or filtered noise.
const PENTA = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24];

export function createAudio() {
  let context = null;
  let master = null;
  let padNodes = null;
  let muted = false;

  function ensure() {
    if (context) {
      if (context.state === 'suspended') context.resume();
      return true;
    }
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return false;
      context = new Ctor();
      master = context.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(context.destination);
      startPad();
      return true;
    } catch {
      return false;
    }
  }

  function startPad() {
    // A slow night pad: two detuned sines a fifth apart, breathing on an LFO.
    const gain = context.createGain();
    gain.gain.value = 0.05;
    const lfo = context.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = context.createGain();
    lfoGain.gain.value = 0.025;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    const oscs = [110, 164.81, 220].map((freq) => {
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * 6;
      osc.connect(gain);
      osc.start();
      return osc;
    });
    gain.connect(master);
    lfo.start();
    padNodes = { gain, oscs, lfo };
  }

  function tone({ freq, endFreq = null, type = 'sine', at = 0, dur = 0.2, vol = 0.2 }) {
    if (!context || muted) return;
    const t0 = context.currentTime + at;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (endFreq !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise({ at = 0, dur = 0.4, vol = 0.25, from = 4000, to = 300 }) {
    if (!context || muted) return;
    const t0 = context.currentTime + at;
    const length = Math.max(1, Math.floor(context.sampleRate * dur));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(from, t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
    filter.Q.value = 0.8;
    const gain = context.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(t0);
  }

  return {
    unlock() {
      ensure();
    },
    setMuted(value) {
      muted = value;
      if (master) master.gain.value = muted ? 0 : 0.5;
    },
    isMuted() {
      return muted;
    },
    /** A pentatonic chime that climbs with the combo. */
    pickup(combo) {
      if (!ensure()) return;
      const step = PENTA[Math.min(combo - 1, PENTA.length - 1)];
      tone({ freq: 523.25 * Math.pow(2, step / 12), dur: 0.28, vol: 0.16 });
      tone({ freq: 1046.5 * Math.pow(2, step / 12), dur: 0.18, vol: 0.05 });
    },
    flash() {
      if (!ensure()) return;
      noise({ dur: 0.45, vol: 0.3, from: 5200, to: 240 });
      tone({ freq: 880, endFreq: 1760, type: 'triangle', dur: 0.3, vol: 0.12 });
    },
    hit() {
      if (!ensure()) return;
      tone({ freq: 160, endFreq: 45, type: 'sawtooth', dur: 0.35, vol: 0.25 });
      noise({ dur: 0.2, vol: 0.15, from: 900, to: 120 });
    },
    wave() {
      if (!ensure()) return;
      tone({ freq: 392, dur: 0.4, vol: 0.12 });
      tone({ freq: 587.33, at: 0.09, dur: 0.5, vol: 0.12 });
    },
    boss() {
      if (!ensure()) return;
      tone({ freq: 98, endFreq: 55, type: 'sawtooth', dur: 0.8, vol: 0.2 });
      tone({ freq: 103, endFreq: 58, type: 'sawtooth', dur: 0.8, vol: 0.2 });
    },
    victory() {
      if (!ensure()) return;
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
        tone({ freq, at: i * 0.13, dur: 0.5, vol: 0.14 });
      });
    },
    gameOver() {
      if (!ensure()) return;
      [392, 329.63, 261.63, 196].forEach((freq, i) => {
        tone({ freq, at: i * 0.18, dur: 0.45, vol: 0.13 });
      });
    },
    destroy() {
      if (padNodes) {
        padNodes.oscs.forEach((o) => { try { o.stop(); } catch { /* already stopped */ } });
        try { padNodes.lfo.stop(); } catch { /* already stopped */ }
        padNodes = null;
      }
      if (context) {
        context.close();
        context = null;
        master = null;
      }
    },
  };
}
