// Shared piano sound, used by the piano trainer (index.html) and My songs (songs.html).
// Load it with <script src="piano-sound.js"></script>, then call playPiano(midi, when).
//
// Everything is wrapped in (() => { ... })() so its variable names stay private
// and can't clash with the page's own code; only playPiano comes out.
const playPiano = (() => {
  // Real piano recordings from the open-source tonejs-instruments project (CC BY 3.0).
  // We load every third note (C, D♯, F♯, A in each octave) and stretch the notes in between
  // by one semitone at most. File names use "s" for sharp: "Fs2" = F♯2.
  const SAMPLE_URL = "https://cdn.jsdelivr.net/gh/nbrosowsky/tonejs-instruments@master/samples/piano/";
  const SAMPLE_NOTES = [];
  for (let octave = 1; octave <= 7; octave++) ["C", "Ds", "Fs", "A"].forEach(n => SAMPLE_NOTES.push(n + octave));
  // A few files aren't available (Ds1, Ds7, C8), so we use their neighbours instead
  SAMPLE_NOTES.splice(SAMPLE_NOTES.indexOf("Ds1"), 1, "D1");
  SAMPLE_NOTES.splice(SAMPLE_NOTES.indexOf("Ds7"), 1, "E7");

  const audio = new AudioContext();
  const samples = new Map(); // MIDI number → decoded recording

  function sampleMidi(name) {
    const semis = { C: 0, Cs: 1, D: 2, Ds: 3, E: 4, F: 5, Fs: 6, G: 7, Gs: 8, A: 9, As: 10, B: 11 };
    const octave = Number(name[name.length - 1]);
    return 12 * (octave + 1) + semis[name.slice(0, -1)];
  }

  // Download every sample in the background. If one fails (e.g. you're offline) we just skip it.
  SAMPLE_NOTES.forEach(name => {
    fetch(SAMPLE_URL + name + ".mp3")
      .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(data => audio.decodeAudioData(data))
      .then(buffer => samples.set(sampleMidi(name), buffer))
      .catch(() => {});
  });

  // Fallback when the recordings couldn't be loaded: a simple computer-made tone
  function synthNote(midi, when) {
    const start = audio.currentTime + when;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "triangle";
    osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12); // A4 = 440 Hz
    // Quick fade in, slow fade out, so it sounds like a soft pluck instead of a beep
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.3, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 1.2);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + 1.3);
  }

  // Play one note. midi: the note's MIDI number (middle C = 60). when: seconds from now.
  return function playPiano(midi, when = 0) {
    audio.resume(); // browsers only allow sound after you've clicked something
    if (samples.size === 0) return synthNote(midi, when);

    // Use the closest recording we have, and speed it up or slow it down to hit the exact note.
    // Playing a recording twice as fast makes it one octave higher, so one semitone is 2^(1/12).
    let nearest = null;
    for (const m of samples.keys()) if (nearest === null || Math.abs(m - midi) < Math.abs(nearest - midi)) nearest = m;

    const start = audio.currentTime + when;
    const source = audio.createBufferSource();
    const gain = audio.createGain();
    source.buffer = samples.get(nearest);
    source.playbackRate.value = Math.pow(2, (midi - nearest) / 12);
    gain.gain.setValueAtTime(0.6, start);
    gain.gain.setValueAtTime(0.6, start + 1.8);
    gain.gain.linearRampToValueAtTime(0, start + 2.3); // fade out so the next note starts clean
    source.connect(gain).connect(audio.destination);
    source.start(start);
    source.stop(start + 2.3);
  };
})();
