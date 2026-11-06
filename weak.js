// Weak spots, shared by the trainers: for every question (a note, a fret, a chord...) we remember your last
// few answers. The ones you've been getting wrong come up more often, until you get them right again.
//
//   const weak = weakSpots("noteTrainerWeak");      // the key it's saved under
//   const item = weak.pick(items, it => it.id);      // a random item, weak ones more likely
//   weak.add(item.id, right);                        // after each answer
//   weak.worst(ids)                                  // your weakest ones, worst first (optionally only these ids)
//   weak.show(element, ids, nameOf)                  // a "Weak spots" line on the page
//
// Saved as { id: "10110" }: your last answers for that question, oldest first (1 = right, 0 = wrong).
const WEAK_REMEMBER = 6;  // answers remembered per question
const WEAK_BOOST = 5;     // a question you got wrong every time comes up 1 + 5 = 6 times as often

function weakSpots(key) {
  let data = {};
  try { data = JSON.parse(localStorage.getItem(key)) || {}; } catch (e) {}
  const save = () => { try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {} };

  // How often you've missed it lately, from 0 to 1. Recent answers count more than older ones.
  function missRate(id) {
    const s = data[id];
    if (!s) return 0;
    let miss = 0, all = 0;
    [...s].forEach((c, i) => { const w = i + 1; all += w; if (c === "0") miss += w; });
    return all ? miss / all : 0;
  }
  const weightOf = id => 1 + WEAK_BOOST * missRate(id);

  const api = {
    missRate,
    weightOf,
    pick(items, idOf = x => x) {
      if (!items.length) return undefined;
      const w = items.map(it => weightOf(idOf(it)));
      let r = Math.random() * w.reduce((a, b) => a + b, 0);
      for (let i = 0; i < items.length; i++) { if ((r -= w[i]) < 0) return items[i]; }
      return items[items.length - 1];
    },
    add(id, right) {
      data[id] = ((data[id] || "") + (right ? "1" : "0")).slice(-WEAK_REMEMBER);
      // A question you've got right every time lately isn't a weak spot any more: forget it, to keep this small
      if (!data[id].includes("0") && data[id].length >= 3) delete data[id];
      save();
    },
    // Questions you've missed lately, worst first: [{ id, missed, tries }]
    worst(ids) {
      const allowed = ids ? new Set(ids.map(String)) : null;
      return Object.keys(data)
        .filter(id => data[id].includes("0") && (!allowed || allowed.has(id)))
        .map(id => ({ id, missed: [...data[id]].filter(c => c === "0").length, tries: data[id].length, rate: missRate(id) }))
        .sort((a, b) => b.rate - a.rate || b.missed - a.missed);
    },
    // "Weak spots: F♯ (2 of 3 wrong) · B ..." for the questions in the current quiz
    show(el, ids, nameOf = id => id, max = 6) {
      if (!el) return;
      const list = api.worst(ids).slice(0, max);
      el.innerHTML = list.length
        ? `<b>Weak spots</b> <span class="weak-why">(asked more often until you get them right)</span>: ` +
          list.map(w => `<span class="weak-item" title="${w.missed} of your last ${w.tries} wrong">${nameOf(w.id)} <small>${w.missed}/${w.tries}</small></span>`).join(" ")
        : "";
      el.hidden = !list.length;
    },
    reset() { data = {}; save(); },
  };
  return api;
}

// The look of the "Weak spots" line, the same on every page
(() => {
  const style = document.createElement("style");
  style.textContent = `
    .weak { margin-top: 12px; font-size: 0.85rem; line-height: 1.9; color: var(--ink); text-align: center; }
    .weak .weak-why { color: var(--muted); font-size: 0.8rem; }
    .weak .weak-item { display: inline-block; padding: 0 8px; margin: 0 2px; border-radius: 10px; background: var(--btn); font-weight: 600; }
    .weak .weak-item small { color: var(--bad, #c92a2a); font-weight: 700; }
  `;
  document.head.appendChild(style);
})();
