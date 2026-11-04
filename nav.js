// The menu at the top of every page, kept in one place so it looks the same everywhere.
// Put <script src="nav.js"></script> right after <body>; the menu appears where the script is.
// To add a page, add it to PAGES below.
(() => {
  const PAGES = [
    ["index.html", "Piano trainer"],
    ["guitar.html", "Fretboard trainer"],
    ["chords.html", "Chord trainer"],
    ["chord-library.html", "Chord library"],
    ["keys.html", "Chords in a key"],
    ["progressions.html", "Progression generator"],
    ["songs.html", "My songs"],
    ["circle.html", "Circle of fifths"],
    ["scales.html", "Scale shapes"],
    ["metronome.html", "Tempo ladder"],
  ];

  // The page we're on is shown in bold instead of as a link. An address ending in "/" is index.html.
  const here = location.pathname.split("/").pop() || "index.html";

  const style = document.createElement("style");
  style.textContent = `
    .site-nav {
      display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 20px;
      max-width: 1100px; margin: 0 auto 24px; padding-bottom: 14px;
      border-bottom: 1px solid var(--btn); font-size: 0.95rem;
    }
    .site-nav a { color: var(--accent); text-decoration: none; }
    .site-nav a:hover { text-decoration: underline; }
    .site-nav a[aria-current] { color: var(--ink); font-weight: 700; }
  `;
  document.head.appendChild(style);

  const nav = document.createElement("nav");
  nav.className = "site-nav";
  nav.setAttribute("aria-label", "Pages");
  PAGES.forEach(([file, name]) => {
    const a = document.createElement("a");
    a.href = file;
    a.textContent = name;
    if (file === here) a.setAttribute("aria-current", "page");
    nav.appendChild(a);
  });
  document.currentScript.after(nav);
})();
