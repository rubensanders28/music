// Shared by all the chord pages (chords.html, chord-library.html, keys.html, songs.html):
// the list of chords, keys and scales, how to draw a chord diagram, and how to strum a chord.
// Each page loads this file with <script src="chord-data.js"></script> before its own code.

// ---------- Music basics ----------
const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLATS = { "C#": "D♭", "D#": "E♭", "F#": "G♭", "G#": "A♭", "A#": "B♭" };
function pretty(i) { return NOTES[i].replace("#", "♯"); }

// Open strings as MIDI numbers, from the thick low E (6th string) to the thin high E (1st string).
// This is the order chord diagrams use: low E on the left.
const OPEN = [40, 45, 50, 55, 59, 64];
const STRING_NAMES = ["E", "A", "D", "G", "B", "E"];

// Each chord type is a recipe: which notes to stack on top of the root,
// counted in semitones. A major chord is root + 4 + 7, a minor chord is root + 3 + 7.
const TYPES = [
  { id: "maj",  label: "major", suffix: "",    notes: [0, 4, 7],     level: 1 },
  { id: "min",  label: "minor", suffix: "m",   notes: [0, 3, 7],     level: 1 },
  { id: "7",    label: "7",     suffix: "7",   notes: [0, 4, 7, 10], level: 2 },
  { id: "maj7", label: "maj7",  suffix: "maj7",notes: [0, 4, 7, 11], level: 2 },
  { id: "m7",   label: "m7",    suffix: "m7",  notes: [0, 3, 7, 10], level: 2 },
  { id: "sus2", label: "sus2",  suffix: "sus2",notes: [0, 2, 7],     level: 3 },
  { id: "sus4", label: "sus4",  suffix: "sus4",notes: [0, 5, 7],     level: 3 },
  { id: "dim",  label: "dim",   suffix: "dim", notes: [0, 3, 6],     level: 3 },
  { id: "aug",  label: "aug",   suffix: "aug", notes: [0, 4, 8],     level: 3 },
  { id: "dim7", label: "dim7",  suffix: "dim7",notes: [0, 3, 6, 9],  level: 3 },
  { id: "m7b5", label: "m7♭5",  suffix: "m7♭5",notes: [0, 3, 6, 10], level: 3 },
  { id: "6",    label: "6",     suffix: "6",   notes: [0, 4, 7, 9],  level: 3 },
  // Level 4: power chords and "extended" chords. A 9 is the 2nd one octave up (14 semitones,
  // which is the same note name as 2), a 13 is the 6th one octave up. Guitarists often
  // leave out the 5th (7) in these, because six strings can't fit every note comfortably.
  { id: "5",     label: "5",     suffix: "5",     notes: [0, 7],            level: 4 },
  { id: "add9",  label: "add9",  suffix: "add9",  notes: [0, 4, 7, 2],      level: 4 },
  { id: "7sus4", label: "7sus4", suffix: "7sus4", notes: [0, 5, 7, 10],     level: 4 },
  { id: "m6",    label: "m6",    suffix: "m6",    notes: [0, 3, 7, 9],      level: 4 },
  { id: "mmaj7", label: "m(maj7)", suffix: "m(maj7)", notes: [0, 3, 7, 11], level: 4 },
  { id: "9",     label: "9",     suffix: "9",     notes: [0, 4, 7, 10, 2],  level: 4 },
  { id: "m9",    label: "m9",    suffix: "m9",    notes: [0, 3, 7, 10, 2],  level: 4 },
  { id: "maj9",  label: "maj9",  suffix: "maj9",  notes: [0, 4, 7, 11, 2],  level: 4 },
  { id: "7s9",   label: "7♯9",   suffix: "7♯9",   notes: [0, 4, 7, 10, 3],  level: 4 },
  { id: "13",    label: "13",    suffix: "13",    notes: [0, 4, 7, 10, 9],  level: 4 },
];

// ---------- Chord shapes ----------
// Guitarists learn a handful of shapes and slide them up the neck. Each shape below is
// written as it looks in open position (frets for strings low E → high E, x = don't play).
// Sliding a shape up by r frets turns it into a chord r semitones higher; the open
// strings then become a "barre" (one finger pressing several strings).
//   openRoot: the root note of the shape in open position (as an index in NOTES)
//   movable:  false for shapes that are only comfortable as open chords
const x = null;
const SHAPES = [
  { openRoot: 4, movable: true, chords: { // E shape, root on the 6th string
    maj: [0,2,2,1,0,0], min: [0,2,2,0,0,0], "7": [0,2,0,1,0,0], maj7: [0,x,1,1,0,x], m7: [0,2,0,0,0,0],
    sus2: [0,2,4,4,x,x], sus4: [0,2,2,2,0,0], dim: [0,1,2,0,x,x], aug: [0,3,2,1,1,0],
    dim7: [0,x,2,3,2,3], m7b5: [0,1,0,0,x,x], "6": [0,2,2,1,2,0],
    "5": [0,2,2,x,x,x], add9: [0,2,2,1,0,2], "7sus4": [0,2,0,2,0,0], m6: [0,2,2,0,2,0], mmaj7: [0,2,1,0,0,0],
    "9": [0,2,0,1,0,2], m9: [0,2,0,0,0,2], maj9: [0,2,1,1,0,2], "13": [0,x,0,1,2,0] } },
  { openRoot: 9, movable: true, chords: { // A shape, root on the 5th string
    maj: [x,0,2,2,2,0], min: [x,0,2,2,1,0], "7": [x,0,2,0,2,0], maj7: [x,0,2,1,2,0], m7: [x,0,2,0,1,0],
    sus2: [x,0,2,2,0,0], sus4: [x,0,2,2,3,0], dim: [x,0,1,2,1,x], aug: [x,0,3,2,2,1],
    dim7: [x,0,1,2,1,2], m7b5: [x,0,1,0,1,x], "6": [x,0,2,2,2,2],
    "5": [x,0,2,2,x,x], add9: [x,0,2,4,2,0], "7sus4": [x,0,2,0,3,0], m6: [x,0,2,2,1,2], mmaj7: [x,0,2,1,1,0],
    "9": [x,0,2,4,2,3], m9: [x,0,2,4,1,3], maj9: [x,0,2,4,2,4], "13": [x,0,x,0,2,2] } },
  { openRoot: 2, movable: true, chords: { // D shape, root on the 4th string
    maj: [x,x,0,2,3,2], min: [x,x,0,2,3,1], "7": [x,x,0,2,1,2], maj7: [x,x,0,2,2,2], m7: [x,x,0,2,1,1],
    sus2: [x,x,0,2,3,0], sus4: [x,x,0,2,3,3], dim: [x,x,0,1,3,1], aug: [x,x,0,3,3,2],
    dim7: [x,x,0,1,0,1], m7b5: [x,x,0,1,1,1], "6": [x,x,0,2,0,2],
    "5": [x,x,0,2,3,x], "7sus4": [x,x,0,2,1,3], m6: [x,x,0,2,0,1], mmaj7: [x,x,0,2,2,1] } },
  { openRoot: 10, movable: true, chords: { // "Hendrix" shape, root on the 5th string, one fret above the open string
    "7s9": [x,1,0,1,2,x] } },
  { openRoot: 0, movable: false, chords: { // C shape (open C chords)
    maj: [x,3,2,0,1,0], "7": [x,3,2,3,1,0], maj7: [x,3,2,0,0,0],
    add9: [x,3,2,0,3,0], "9": [x,3,2,3,3,3], maj9: [x,3,2,4,3,0] } },
  { openRoot: 7, movable: false, chords: { // G shape (open G chords)
    maj: [3,2,0,0,0,3], "7": [3,2,0,0,0,1], maj7: [3,2,0,0,0,2], "6": [3,2,0,0,0,0], sus4: [3,x,0,0,1,3] } },
  { openRoot: 5, movable: false, chords: { // small F shapes, the usual way to start before learning the full F barre
    maj: [x,x,3,2,1,1], maj7: [x,x,3,2,1,0] } },
  { openRoot: 11, movable: false, chords: { // B7, a common open chord
    "7": [x,2,1,2,0,2] } },
];
// The usual open Emaj7 and Esus2 use all six strings; they go first, so they're the shape shown by default
SHAPES.unshift({ openRoot: 4, movable: false, chords: { maj7: [0,2,1,1,0,0], sus2: [0,2,4,4,0,0] } });
// Open F♯m7♭5 (2 0 2 2 1 0): all six strings, with open A and E as the ♭3 and ♭7. It's the ii chord in E minor,
// where those open strings ring along nicely, so it goes first too.
SHAPES.unshift({ openRoot: 6, movable: false, chords: { m7b5: [2,0,2,2,1,0] } });
// Open Bsus4 (x 2 4 4 0 0): the open high E is the sus 4th and the open B doubles the root, so it's easier
// than the barre and rings more. It goes first too.
SHAPES.unshift({ openRoot: 11, movable: false, chords: { sus4: [x,2,4,4,0,0] } });

// Turn every shape into real chords: one per root note it can reach.
// Each chord is { root, type, frets, barre } where barre is the fret the shape was slid to.
function allChords() {
  const list = [];
  SHAPES.forEach(shape => {
    for (const typeId in shape.chords) {
      for (let r = 0; r <= (shape.movable ? 11 : 0); r++) {
        const frets = shape.chords[typeId].map(f => f === null ? null : f + r);
        // Some open shapes become a 4-fret stretch when you slide them up (the E-shape sus2, the A-shape 9th):
        // nobody plays those as barre chords, so leave them out. (Open, with the nut's help, they're fine.)
        const fretted = frets.filter(f => f !== null && f > 0);
        if (r > 0 && Math.max(...fretted) - Math.min(...fretted) > 3) continue;
        list.push({ root: (shape.openRoot + r) % 12, type: TYPES.find(t => t.id === typeId), frets, barre: r });
      }
    }
  });
  return list;
}
const CHORDS = allChords();

function chordName(c) { return c.name || pretty(c.root) + c.type.suffix; }

// ---------- Slash chords ----------
// A chord with a different note in the bass, written chord/bass: G/B is a G chord with B as its lowest note.
// They make a bass line walk smoothly between chords (G – G/B – C) or hold one bass note under changing chords.
// These are the most common ones, as they're usually played on the guitar (frets low E → high e, x = not played).
//   root, type: the chord on top; bass: the bass note (as an index in NOTES)
const SLASH_CHORDS = [
  { name: "C/E", root: 0, type: "maj", bass: 4, frets: [0, 3, 2, 0, 1, 0] },
  { name: "C/G", root: 0, type: "maj", bass: 7, frets: [3, 3, 2, 0, 1, 0] },
  { name: "C/B", root: 0, type: "maj", bass: 11, frets: [x, 2, 2, 0, 1, 0] },
  { name: "C/D", root: 0, type: "maj", bass: 2, frets: [x, x, 0, 0, 1, 0] },
  { name: "D/F♯", root: 2, type: "maj", bass: 6, frets: [2, 0, 0, 2, 3, 2] },
  { name: "D/A", root: 2, type: "maj", bass: 9, frets: [x, 0, 0, 2, 3, 2] },
  { name: "D/C", root: 2, type: "maj", bass: 0, frets: [x, 3, 0, 2, 3, 2] },
  { name: "Dm/C", root: 2, type: "min", bass: 0, frets: [x, 3, 0, 2, 3, 1] },
  { name: "Dm/F", root: 2, type: "min", bass: 5, frets: [1, 0, 0, 2, 3, 1] },
  { name: "E/G♯", root: 4, type: "maj", bass: 8, frets: [4, x, 2, 1, 0, 0] },
  { name: "E/B", root: 4, type: "maj", bass: 11, frets: [x, 2, 2, 1, 0, 0] },
  { name: "Em/D", root: 4, type: "min", bass: 2, frets: [x, x, 0, 0, 0, 0] },
  { name: "Em/G", root: 4, type: "min", bass: 7, frets: [3, 2, 2, 0, 0, 0] },
  { name: "F/A", root: 5, type: "maj", bass: 9, frets: [x, 0, 3, 2, 1, 1] },
  { name: "F/C", root: 5, type: "maj", bass: 0, frets: [x, 3, 3, 2, 1, 1] },
  { name: "F/G", root: 5, type: "maj", bass: 7, frets: [3, x, 3, 2, 1, 1] },
  { name: "G/B", root: 7, type: "maj", bass: 11, frets: [x, 2, 0, 0, 3, 3] },
  { name: "G/D", root: 7, type: "maj", bass: 2, frets: [x, x, 0, 0, 0, 3] },
  { name: "G/F♯", root: 7, type: "maj", bass: 6, frets: [2, x, 0, 0, 0, 3] },
  { name: "G/A", root: 7, type: "maj", bass: 9, frets: [x, 0, 0, 0, 0, 3] },
  { name: "A/C♯", root: 9, type: "maj", bass: 1, frets: [x, 4, 2, 2, 2, 0] },
  { name: "Bm/G♯", root: 11, type: "min", bass: 8, frets: [4, x, 4, 4, 3, x] },
  { name: "A/E", root: 9, type: "maj", bass: 4, frets: [0, 0, 2, 2, 2, 0] },
  { name: "Am/G", root: 9, type: "min", bass: 7, frets: [3, 0, 2, 2, 1, 0] },
  { name: "Am/E", root: 9, type: "min", bass: 4, frets: [0, 0, 2, 2, 1, 0] },
  { name: "Am/C", root: 9, type: "min", bass: 0, frets: [x, 3, 2, 2, 1, 0] },
  { name: "Am/F♯", root: 9, type: "min", bass: 6, frets: [2, 0, 2, 2, 1, 0] },
].map(s => ({ ...s, chordType: TYPES.find(t => t.id === s.type), type: { id: "slash" + s.bass, label: "slash", suffix: "" }, barre: 0, slash: true }));

// A slash chord on the piano: the chord in the octave below middle C, with the bass note an octave lower
function pianoSlashChord(s) {
  return [36 + s.bass, ...pianoChord(s.root, s.chordType.id)];
}

// ---------- Keys and scales ----------
const MAJOR = [0, 2, 4, 5, 7, 9, 11];        // the major scale, in semitones from the key note
const MINOR = [0, 2, 3, 5, 7, 8, 10];        // the natural minor scale
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

// In a scale every letter A–G is used exactly once. That's why the 4th note of F major is
// B♭ and not A♯: A is already taken. So we give each degree the next letter and work out
// which ♯ or ♭ it needs to land on the right pitch.
//   rootName: the key note written with # or b, e.g. "F#" or "Bb"
const LETTERS = "CDEFGAB";
const NATURAL = [0, 2, 4, 5, 7, 9, 11]; // pitch of C, D, E, F, G, A, B
const ACCIDENTAL = { "-2": "𝄫", "-1": "♭", "0": "", "1": "♯", "2": "𝄪" };

function spellScale(rootName, steps) {
  const letter = LETTERS.indexOf(rootName[0]);
  const rootPc = (NATURAL[letter] + (rootName[1] === "#" ? 1 : rootName[1] === "b" ? -1 : 0) + 12) % 12;
  return steps.map((step, i) => {
    const l = (letter + i) % 7;
    const pc = (rootPc + step) % 12;
    const acc = ((pc - NATURAL[l] + 18) % 12) - 6; // how far from the plain letter: -1 = ♭, +1 = ♯
    return { pc, name: LETTERS[l] + ACCIDENTAL[acc] };
  });
}

// Where on the neck a chord is played: "open" (uses open strings near the nut),
// "low" (a barre starting within the first 4 frets) or "high" (further up the neck)
function position(c) {
  if (c.barre === 0) return "open";
  return c.barre <= 4 ? "low" : "high";
}

// ---------- Scales ----------
// Each scale lists which letter it uses (0 = the root's letter, 1 = the next letter, ...) and
// how many semitones above the root each note is. Pentatonic and blues scales skip some letters,
// and the blues scale uses the 5th letter twice (♭5 and 5).
//   core: for the blues scale, the notes the guitar positions are built from (the minor pentatonic);
//         the extra "blue" note is then added wherever it falls inside the position.
// Used by Scale shapes and the Keyboard page.
const SEVEN = [0, 1, 2, 3, 4, 5, 6];
const SCALE_TYPES = [
  { group: "Major and minor", id: "major", name: "Major", degs: SEVEN, semis: [0, 2, 4, 5, 7, 9, 11],
    mood: "Bright and happy. The scale most songs and most music lessons start from." },
  { group: "Major and minor", id: "minor", name: "Natural minor", degs: SEVEN, semis: [0, 2, 3, 5, 7, 8, 10],
    mood: "Sad, dark or serious. Same notes as the major scale three semitones up (its relative major)." },
  { group: "Major and minor", id: "harmonic", name: "Harmonic minor", degs: SEVEN, semis: [0, 2, 3, 5, 7, 8, 11],
    mood: "Minor with a raised 7th. The big 3-semitone jump gives it a classical, exotic sound." },
  { group: "Major and minor", id: "melodic", name: "Melodic minor", degs: SEVEN, semis: [0, 2, 3, 5, 7, 9, 11],
    mood: "Minor at the bottom, major at the top. Used a lot in jazz." },
  { group: "Pentatonic and blues", id: "majpent", name: "Major pentatonic", degs: [0, 1, 2, 4, 5], semis: [0, 2, 4, 7, 9],
    mood: "The major scale without its 4th and 7th. Only 5 notes and no semitone clashes, so it's hard to play a wrong note." },
  { group: "Pentatonic and blues", id: "minpent", name: "Minor pentatonic", degs: [0, 2, 3, 4, 6], semis: [0, 3, 5, 7, 10],
    mood: "The rock and blues guitar solo scale. Usually the first scale guitarists learn." },
  { group: "Pentatonic and blues", id: "blues", name: "Blues", degs: [0, 2, 3, 4, 4, 6], semis: [0, 3, 5, 6, 7, 10], core: [0, 1, 2, 4, 5],
    mood: "Minor pentatonic plus the ♭5, the \"blue note\". Slide through it rather than stopping on it." },
  { group: "Modes", id: "dorian", name: "Dorian", degs: SEVEN, semis: [0, 2, 3, 5, 7, 9, 10],
    mood: "Minor with a raised 6th: hopeful rather than sad. Funk, soul and Santana." },
  { group: "Modes", id: "phrygian", name: "Phrygian", degs: SEVEN, semis: [0, 1, 3, 5, 7, 8, 10],
    mood: "Minor with a ♭2 right next to the root. Dark, Spanish and metal-sounding." },
  { group: "Modes", id: "lydian", name: "Lydian", degs: SEVEN, semis: [0, 2, 4, 6, 7, 9, 11],
    mood: "Major with a raised 4th. Dreamy and floating; loved by film composers." },
  { group: "Modes", id: "mixolydian", name: "Mixolydian", degs: SEVEN, semis: [0, 2, 4, 5, 7, 9, 10],
    mood: "Major with a ♭7. Bluesy and relaxed: classic rock and Celtic music." },
  { group: "Modes", id: "locrian", name: "Locrian", degs: SEVEN, semis: [0, 1, 3, 5, 6, 8, 10],
    mood: "The unstable one: its ♭5 means the root chord is diminished. Rare, but good to know." },
];

const ROOTS = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"];

// Spell the scale so every note gets the right letter (B♭ in F major, not A♯).
// Same idea as spellScale in chord-data.js, but letters can be skipped or repeated.
function spellNotes(rootName, scale) {
  const letter = LETTERS.indexOf(rootName[0]);
  const rootPc = (NATURAL[letter] + (rootName[1] === "#" ? 1 : rootName[1] === "b" ? -1 : 0) + 12) % 12;
  return scale.semis.map((semi, i) => {
    const l = (letter + scale.degs[i]) % 7;
    const pc = (rootPc + semi) % 12;
    const acc = ((pc - NATURAL[l] + 18) % 12) - 6;
    // Degree name: compare with the major scale, so 3 semitones on the 3rd letter is "♭3"
    const shift = semi - MAJOR[scale.degs[i]];
    return { pc, name: LETTERS[l] + ACCIDENTAL[acc], degree: ACCIDENTAL[shift] + (scale.degs[i] + 1) };
  });
}

// ---------- Sound ----------
// Real acoustic guitar recordings, one file per note, from the open-source
// tonejs-instruments project (CC BY 3.0). File names use "s" for sharp: "Fs2" = F♯2.
const SAMPLE_URL = "https://cdn.jsdelivr.net/gh/nbrosowsky/tonejs-instruments@master/samples/guitar-acoustic/";
const SAMPLE_NOTES = ["E2", "F2", "Fs2", "G2", "A2", "As2", "B2", "C3", "Cs3", "D3", "Ds3", "E3", "F3", "Fs3", "G3",
  "A3", "As3", "B3", "C4", "Cs4", "D4", "Ds4", "E4", "F4", "Fs4", "G4", "A4", "As4", "B4", "C5", "Cs5", "D5"];

const audio = new AudioContext();
const samples = new Map(); // MIDI number → decoded recording

function sampleMidi(name) {
  const note = name[0] + (name[1] === "s" ? "#" : "");
  return 12 * (Number(name[name.length - 1]) + 1) + NOTES.indexOf(note);
}

// Download every sample in the background. If one fails (e.g. you're offline) we just skip it.
SAMPLE_NOTES.forEach(name => {
  fetch(SAMPLE_URL + name + ".mp3")
    .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then(data => audio.decodeAudioData(data))
    .then(buffer => samples.set(sampleMidi(name), buffer))
    .catch(() => {});
});

function pluck(midi, when) {
  audio.resume(); // browsers only allow sound after you've clicked something
  if (samples.size === 0) return synthPluck(midi, when);

  // Use the closest recording we have, and speed it up or slow it down to hit the exact note.
  // Playing a recording twice as fast makes it one octave higher, so one semitone is 2^(1/12).
  let nearest = null;
  for (const m of samples.keys()) if (nearest === null || Math.abs(m - midi) < Math.abs(nearest - midi)) nearest = m;

  const t = audio.currentTime + when;
  const source = audio.createBufferSource();
  const gain = audio.createGain();
  source.buffer = samples.get(nearest);
  source.playbackRate.value = Math.pow(2, (midi - nearest) / 12);
  gain.gain.setValueAtTime(0.5, t);
  gain.gain.setValueAtTime(0.5, t + 2.2);
  gain.gain.linearRampToValueAtTime(0, t + 2.8); // fade out so the next chord starts clean
  source.connect(gain).connect(audio.destination);
  source.start(t);
  source.stop(t + 2.8);
}

// Fallback when the recordings couldn't be loaded: a simple computer-made pluck
function synthPluck(midi, when) {
  const t = audio.currentTime + when;
  const osc = audio.createOscillator();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  osc.type = "sawtooth";
  osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(3000, t);
  filter.frequency.exponentialRampToValueAtTime(300, t + 0.6);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.12, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 2);
  osc.connect(filter).connect(gain).connect(audio.destination);
  osc.start(t);
  osc.stop(t + 2.1);
}

// A strum is just the strings plucked one after another, low to high, very quickly
function strum(chord) {
  let delay = 0;
  chord.frets.forEach((f, s) => {
    if (f === null) return;
    pluck(OPEN[s] + f, delay);
    delay += 0.03;
  });
}

// ---------- Drawing a chord diagram ----------
// Draws `chord` into the <svg> element `svg` (which should have viewBox="0 0 240 285").
// Options: lefty (mirror it for left-handed players), showRoot (colour the root note's dot).
// The page's CSS decides the colours, using the classes grid-line, nut, finger, root, marker, label and fret-label.
const DIAGRAM_WIDTH = 240;
const LEFT = 40, STRING_GAP = 32;   // string 0 (low E) is at x = 40
const TOP = 60, FRET_GAP = 38;      // top of the grid
const ROWS = 5;                     // how many frets the diagram shows

function el(tag, attrs, text) {
  const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (text !== undefined) e.textContent = text;
  return e;
}

// ---------- Chords on the piano ----------
// The notes of a chord as MIDI numbers, starting from the root in the octave below middle C.
// Notes like the 9th (2 semitones) go an octave up when the chord also has a 3rd, because that's how
// they're played: C9 is C E G B♭ D, with the D above the B♭.
//   typeId: a chord type id from TYPES, e.g. "m7"
function pianoChord(root, typeId) {
  const notes = TYPES.find(t => t.id === typeId).notes;
  const hasThird = notes.includes(3) || notes.includes(4);
  const hasSeventh = notes.includes(10) || notes.includes(11);
  const up = notes.map(n => {
    if (n === 2 && hasThird) return 14;                      // 9th
    if (n === 3 && notes.includes(4)) return 15;             // ♯9th (in 7♯9)
    if (n === 9 && hasSeventh) return 21;                    // 13th
    return n;
  });
  return up.sort((a, b) => a - b).map(n => 48 + root + n);
}

// Draws a small keyboard into `svg` with the keys in `midis` lit up, and `rootMidi` (if given) in the root colour.
// The page's CSS decides the colours, using the classes pk-white, pk-black, pk-on, pk-root and pk-label.
function drawPianoChord(svg, midis, rootMidi) {
  const isWhite = m => NATURAL.includes(m % 12);
  let low = midis[0], high = midis[midis.length - 1];
  if (!isWhite(low)) low--;
  if (!isWhite(high)) high++;
  const whites = () => { const w = []; for (let m = low; m <= high; m++) if (isWhite(m)) w.push(m); return w; };
  while (whites().length < 10) { high++; if (!isWhite(high)) high++; } // show at least 10 white keys
  const W = 20, H = 90, list = whites();

  svg.innerHTML = "";
  svg.setAttribute("viewBox", `0 0 ${list.length * W} ${H}`);
  const cls = m => (m === rootMidi ? " pk-root" : midis.includes(m) ? " pk-on" : "");
  list.forEach((m, i) => {
    svg.appendChild(el("rect", { x: i * W, y: 0, width: W, height: H, class: "pk-white" + cls(m) }));
    if (m % 12 === 0) svg.appendChild(el("text", { x: i * W + W / 2, y: H - 5, class: "pk-label" }, "C" + (Math.floor(m / 12) - 1)));
  });
  // Black keys sit after C, D, F, G and A
  list.forEach((m, i) => {
    if (i < list.length - 1 && [0, 2, 5, 7, 9].includes(m % 12)) {
      svg.appendChild(el("rect", { x: (i + 1) * W - 6, y: 0, width: 12, height: 55, rx: 2, class: "pk-black" + cls(m + 1) }));
    }
  });
}

function drawChord(svg, chord, { lefty = false, showRoot = false } = {}) {
  svg.innerHTML = "";
  // Left-handed players see the diagram mirrored: low E on the right
  const X = x => lefty ? DIAGRAM_WIDTH - x : x;
  const stringX = s => X(LEFT + s * STRING_GAP);

  const pressed = chord.frets.filter(f => f !== null && f > 0);
  // If the whole chord fits in the first 5 frets, start at the nut; otherwise start at the lowest fret used
  const start = Math.max(...pressed) <= ROWS ? 1 : Math.min(...pressed);
  const rowY = fret => TOP + (fret - start + 0.5) * FRET_GAP;

  // Grid: strings (vertical) and frets (horizontal)
  for (let s = 0; s < 6; s++) {
    svg.appendChild(el("line", { x1: stringX(s), x2: stringX(s), y1: TOP, y2: TOP + ROWS * FRET_GAP, class: "grid-line" }));
    svg.appendChild(el("text", { x: stringX(s), y: TOP + ROWS * FRET_GAP + 22, class: "label" }, STRING_NAMES[s]));
  }
  for (let r = 0; r <= ROWS; r++) {
    const y = TOP + r * FRET_GAP;
    svg.appendChild(el("line", { x1: stringX(0), x2: stringX(5), y1: y, y2: y, class: r === 0 && start === 1 ? "nut" : "grid-line" }));
  }
  if (start > 1) svg.appendChild(el("text", { x: X(16), y: rowY(start) + 5, class: "fret-label" }, start + "fr"));

  // Barre: a bar across the strings held down by one finger
  if (chord.barre > 0) {
    const barred = chord.frets.map((f, s) => f === chord.barre ? s : -1).filter(s => s >= 0);
    if (barred.length > 1) {
      const a = stringX(barred[0]), b = stringX(barred[barred.length - 1]);
      svg.appendChild(el("rect", { x: Math.min(a, b) - 11, y: rowY(chord.barre) - 11, width: Math.abs(b - a) + 22, height: 22, rx: 11, class: "finger" }));
    }
  }

  // The lowest string played is the root, so that's the one we can highlight
  const rootString = chord.frets.findIndex(f => f !== null);

  chord.frets.forEach((f, s) => {
    const cx = stringX(s);
    if (f === null) {        // × : don't play this string
      svg.appendChild(el("path", { d: `M${cx - 7} ${TOP - 27} l14 14 m0 -14 l-14 14`, class: "marker" }));
    } else if (f === 0) {    // ○ : play it open
      svg.appendChild(el("circle", { cx, cy: TOP - 20, r: 7, class: "marker" }));
    } else {
      svg.appendChild(el("circle", { cx, cy: rowY(f), r: 11, class: "finger" + (showRoot && s === rootString ? " root" : "") }));
    }
  });
}
