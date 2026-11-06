// Accuracy over your last 50 answers, used by every quiz. A best streak can be one lucky run, and the
// "correct" count starts over each visit; this one keeps going between visits and moves with how you're
// doing now: one bad day doesn't spoil it, and old mistakes drop out once you've moved on.
//
//   const recent = lastAnswers("noteTrainerRecent");  // the key it's saved under
//   recent.mount(document.querySelector(".stats"));   // adds a "last 50" box to the stats row
//   recent.add(true);                                 // after each answer: right or wrong
//   recent.use("earChordsRecent");                    // switch to another key (e.g. a different mode)
//
// Saved as a string of up to 50 "1"s (right) and "0"s (wrong), oldest first.
const RECENT_MAX = 50;

// `noun`: what's being counted, for the tooltip ("answers", or "takes" in the Rhythm trainer)
function lastAnswers(key, noun = "answers") {
  let box = null;

  const load = () => {
    try { return (localStorage.getItem(key) || "").replace(/[^01]/g, "").slice(-RECENT_MAX); } catch (e) { return ""; }
  };

  function summary() {
    const s = load();
    const right = [...s].filter(c => c === "1").length;
    return { count: s.length, right, percent: s.length ? Math.round(right / s.length * 100) : null };
  }

  // "86%" with "last 50" under it (or "last 12" while you haven't answered 50 yet)
  function render() {
    if (!box) return;
    const { count, right, percent } = summary();
    box.querySelector("b").textContent = percent === null ? "–" : percent + "%";
    box.querySelector("span").textContent = count && count < RECENT_MAX ? `last ${count}` : `last ${RECENT_MAX}`;
    box.title = count ? `${right} of your last ${count} ${noun} were ${noun === "takes" ? "played well" : "right"}` : `Your accuracy over your last ${RECENT_MAX} ${noun}`;
  }

  return {
    summary,
    render,
    // `after`: put the box after this element (default: at the end of the row)
    mount(row, after) {
      if (!row) return this;
      box = document.createElement("div");
      box.innerHTML = "<b></b><span></span>";
      if (after && after.parentNode === row) after.after(box); else row.appendChild(box);
      render();
      return this;
    },
    add(right) {
      const s = (load() + (right ? "1" : "0")).slice(-RECENT_MAX);
      try { localStorage.setItem(key, s); } catch (e) {}
      render();
    },
    use(newKey) { key = newKey; render(); return this; },
    reset() { try { localStorage.removeItem(key); } catch (e) {} render(); },
  };
}
