// A real keyboard (digital piano or MIDI keyboard) connected over USB, through the browser's Web MIDI.
// Works in Chrome and Edge (also on Android with a USB cable); Safari and iPhone/iPad don't support it.
//
//   Midi.onNote(e => ...)     e = { type: "on" | "off", midi: 60, velocity: 0–127 }
//   Midi.onPedal(down => ...) the sustain pedal
//   Midi.mount(element)       a "Connect keyboard" button with the connection status
//
// Once you've connected, the page connects by itself on your next visit (the browser remembers that you allowed it).
const Midi = (() => {
  const noteListeners = new Set(), pedalListeners = new Set(), statusListeners = new Set();
  const REMEMBER = "midiConnected";
  let access = null;
  let state = "off"; // off · unsupported · asking · denied · none (allowed, but nothing plugged in) · connected
  const held = new Set();

  const supported = () => typeof navigator.requestMIDIAccess === "function";
  const inputs = () => access ? [...access.inputs.values()] : [];
  const setState = s => { state = s; statusListeners.forEach(f => f(state, deviceNames())); };
  const deviceNames = () => inputs().map(i => i.name || "MIDI keyboard");

  function onMessage(e) {
    const [status, a, b] = e.data;
    const cmd = status & 0xf0;
    if (cmd === 0x90 && b > 0) { held.add(a); noteListeners.forEach(f => f({ type: "on", midi: a, velocity: b })); }
    else if (cmd === 0x80 || (cmd === 0x90 && b === 0)) { held.delete(a); noteListeners.forEach(f => f({ type: "off", midi: a, velocity: 0 })); }
    else if (cmd === 0xb0 && a === 64) pedalListeners.forEach(f => f(b >= 64)); // controller 64 = sustain pedal
  }

  function bind() {
    inputs().forEach(input => { input.onmidimessage = onMessage; });
    setState(inputs().length ? "connected" : "none");
  }

  async function connect() {
    if (!supported()) return setState("unsupported");
    setState("asking");
    try {
      access = await navigator.requestMIDIAccess();
      access.onstatechange = bind; // plugging a keyboard in or out
      try { localStorage.setItem(REMEMBER, "1"); } catch (e) {}
      bind();
    } catch (e) {
      setState("denied");
    }
  }

  // Connected before? Then connect again by itself.
  try { if (supported() && localStorage.getItem(REMEMBER) === "1") connect(); } catch (e) {}

  function mount(el) {
    if (!el) return;
    el.classList.add("midi-box");
    const render = (s, names) => {
      const text = {
        off: "Play along on a real keyboard: connect a digital piano or MIDI keyboard with a USB cable.",
        unsupported: "Your browser can't connect to a MIDI keyboard. Chrome and Edge can (not Safari or iPhone).",
        asking: "Waiting for permission… (allow MIDI devices in the box your browser shows)",
        denied: "The browser didn't allow access to MIDI devices. You can allow it in the site settings (the icon left of the address).",
        none: "No keyboard found. Plug it in with a USB cable and switch it on: it connects by itself.",
        connected: `🎹 Connected: ${names.join(", ")}`,
      }[s];
      const button = s === "off" || s === "denied" ? `<button class="midi-btn" type="button">🎹 Connect keyboard</button>` : "";
      el.innerHTML = `${button}<span class="midi-text${s === "connected" ? " on" : ""}">${text}</span>`;
      const b = el.querySelector("button");
      if (b) b.onclick = connect;
    };
    statusListeners.add(render);
    render(state, deviceNames());
  }

  const style = document.createElement("style");
  style.textContent = `
    .midi-box { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; font-size: 0.85rem; color: var(--muted); }
    .midi-btn { font: inherit; font-weight: 600; border: none; border-radius: 8px; padding: 7px 12px; background: var(--btn); color: var(--ink); cursor: pointer; }
    .midi-btn:hover { outline: 2px solid var(--accent); }
    .midi-text.on { color: var(--good); font-weight: 600; }
  `;
  document.head.appendChild(style);

  return {
    connect, mount, supported,
    status: () => state,
    held: () => new Set(held),
    onNote: f => noteListeners.add(f),
    onPedal: f => pedalListeners.add(f),
    onStatus: f => statusListeners.add(f),
  };
})();
