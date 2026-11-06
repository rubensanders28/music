// Accounts and sync between devices, using a free Supabase project (see SYNC-SETUP.md).
//
// Every page saves its data in the browser (localStorage). When you're signed in, this file keeps that data
// in step with your account: changes you make are sent up a moment later, and changes from your other devices
// arrive within a second or two. Everyone who signs up has their own account and only ever sees their own progress.
//
// Load it on every page right after nav.js:   <script src="nav.js"></script><script src="sync.js"></script>
// It has to run before the page's own code, so it can notice everything the page saves.
//
// Accounts are switched off until SUPABASE_URL and SUPABASE_KEY below are filled in.
(() => {
  // ---------- Your Supabase project ----------
  // From Supabase → Project Settings → API: the Project URL and the "anon" / "publishable" key.
  // Both are meant to be public: they only say which project to talk to. People's data is protected
  // by the row-level security rules in supabase-setup.sql, which let each person reach only their own row.
  const SUPABASE_URL = "https://ezwkmujhvigttddjgybl.supabase.co";
  const SUPABASE_KEY = "sb_publishable_kRFf-N6EW8AEwOeP4RgrwA_g--GOLkb";
  const SUPABASE_JS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js";

  // ---------- Noticing every change the site saves ----------
  // For each saved item we remember when it last changed ("stamps"), so that when two devices disagree,
  // the most recent change wins. Not synced: our own bookkeeping ("sync:...") and Supabase's login session ("sb-...").
  const STAMPS = "sync:stamps", DIRTY = "sync:dirty", SYNCED_USER = "sync:user";
  const store = window.localStorage;
  const rawSet = Storage.prototype.setItem, rawRemove = Storage.prototype.removeItem;
  const synced = key => !key.startsWith("sync:") && !key.startsWith("sb-");

  const readJson = (key, fallback) => { try { return JSON.parse(store.getItem(key)) || fallback; } catch (e) { return fallback; } };
  const writeJson = (key, value) => { try { rawSet.call(store, key, JSON.stringify(value)); } catch (e) {} };
  let stamps = readJson(STAMPS, {});
  let dirty = new Set(readJson(DIRTY, []));   // changed here, not yet sent up
  const saveBookkeeping = () => { writeJson(STAMPS, stamps); writeJson(DIRTY, [...dirty]); };

  function changedHere(key) {
    stamps[key] = Date.now();
    dirty.add(key);
    saveBookkeeping();
    schedulePush();
  }

  // Pages call localStorage.setItem / removeItem directly; we listen in on those calls.
  // Saving the same value again (pages often save their settings when they open) isn't a change.
  Storage.prototype.setItem = function (key, value) {
    if (this !== store || !synced(String(key))) return rawSet.call(this, key, value);
    const before = this.getItem(key);
    rawSet.call(this, key, value);
    if (before !== String(value)) changedHere(String(key));
  };
  Storage.prototype.removeItem = function (key) {
    if (this !== store || !synced(String(key))) return rawRemove.call(this, key);
    const had = this.getItem(key) !== null;
    rawRemove.call(this, key);
    if (had) changedHere(String(key));
  };

  let pushTimer = null;
  function schedulePush() {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(push, 1500);
  }

  // Accounts aren't set up: the site works on this device only. (push, further down, then has nothing to do.)
  if (!SUPABASE_URL || !SUPABASE_KEY) return;

  // ---------- The account button and window ----------
  const css = document.createElement("style");
  css.textContent = `
    .sync-btn { background: none; border: none; padding: 0; font: inherit; color: var(--muted); cursor: pointer; }
    .sync-btn:hover { color: var(--accent); }
    .sync-btn.on { color: var(--good, #2b8a3e); }
    .sync-btn.error { color: var(--bad, #c92a2a); }
    .sync-dialog { border: none; border-radius: 16px; padding: 20px; width: min(380px, calc(100% - 32px)); background: var(--card); color: var(--ink);
      box-shadow: 0 10px 40px rgba(0,0,0,.3); font-family: inherit; }
    .sync-dialog::backdrop { background: rgba(0,0,0,.4); }
    .sync-dialog h2 { margin: 0 0 4px; font-size: 1.2rem; }
    .sync-dialog p { margin: 6px 0; color: var(--muted); font-size: 0.85rem; line-height: 1.45; }
    .sync-dialog label { display: grid; gap: 3px; margin-top: 10px; font-size: 0.85rem; color: var(--muted); }
    .sync-dialog input { font: inherit; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--btn); background: var(--bg); color: var(--ink); }
    .sync-dialog .row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
    .sync-dialog button { font: inherit; font-weight: 600; border: none; border-radius: 8px; padding: 8px 14px; background: var(--btn); color: var(--ink); cursor: pointer; }
    .sync-dialog button.main { background: var(--accent); color: #fff; }
    .sync-dialog button.danger { background: none; color: var(--bad, #c92a2a); padding: 8px 0; }
    .sync-dialog button.link { background: none; color: var(--accent); padding: 0; font-weight: 500; font-size: 0.85rem; }
    .sync-dialog .close { position: absolute; top: 10px; right: 12px; background: none; font-size: 1.2rem; padding: 2px 6px; color: var(--muted); }
    .sync-dialog .msg { min-height: 1.2em; font-weight: 600; color: var(--ink); }
    .sync-dialog .msg.bad { color: var(--bad, #c92a2a); }
    .sync-toast { position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%); z-index: 50; display: flex; gap: 12px; align-items: center;
      background: var(--ink); color: var(--bg); padding: 10px 16px; border-radius: 12px; font-size: 0.9rem; box-shadow: 0 4px 16px rgba(0,0,0,.25); max-width: calc(100% - 32px); }
    .sync-toast button { font: inherit; font-weight: 700; border: none; border-radius: 8px; padding: 4px 10px; background: var(--accent); color: #fff; cursor: pointer; }
  `;
  document.head.appendChild(css);

  const button = document.createElement("button");
  button.className = "sync-btn";
  button.textContent = "☁ Sign in";
  const nav = document.querySelector(".site-nav");
  if (nav) nav.appendChild(button);

  const dialog = document.createElement("dialog");
  dialog.className = "sync-dialog";
  document.body.appendChild(dialog);

  function toast(text, actionLabel, action) {
    document.querySelectorAll(".sync-toast").forEach(t => t.remove());
    const t = document.createElement("div");
    t.className = "sync-toast";
    t.textContent = text;
    if (actionLabel) {
      const b = document.createElement("button");
      b.textContent = actionLabel;
      b.onclick = action;
      t.appendChild(b);
    } else {
      setTimeout(() => t.remove(), 5000);
    }
    document.body.appendChild(t);
  }

  const escape = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // The window has a few screens: sign in, create an account, forgot password, set a new password, and "signed in"
  function showScreen(screen, message = "", bad = false) {
    const user = currentUser;
    const msg = `<p class="msg${bad ? " bad" : ""}" id="syncMsg">${escape(message)}</p>`;
    const close = `<button class="close" data-act="close" aria-label="Close">×</button>`;
    const screens = {
      signin: `${close}<h2>Sign in</h2>
        <p>Sign in to keep your progress on every device you use.</p>
        <form data-form="signin"><label>Email <input name="email" type="email" autocomplete="email" required></label>
        <label>Password <input name="password" type="password" autocomplete="current-password" required></label>
        ${msg}<div class="row"><button class="main">Sign in</button><button type="button" data-act="signup">Create an account</button></div></form>
        <div class="row"><button class="link" data-act="forgot">Forgot your password?</button></div>`,
      signup: `${close}<h2>Create an account</h2>
        <p>Free. We store only your email address and your practice progress, and you can delete both at any time.</p>
        <form data-form="signup"><label>Email <input name="email" type="email" autocomplete="email" required></label>
        <label>Password (at least 8 characters) <input name="password" type="password" autocomplete="new-password" minlength="8" required></label>
        ${msg}<div class="row"><button class="main">Create account</button><button type="button" data-act="signin">I have an account</button></div></form>`,
      forgot: `${close}<h2>Forgot your password?</h2>
        <p>We'll email you a link to set a new one.</p>
        <form data-form="forgot"><label>Email <input name="email" type="email" autocomplete="email" required></label>
        ${msg}<div class="row"><button class="main">Send the link</button><button type="button" data-act="signin">Back</button></div></form>`,
      newpassword: `<h2>Set a new password</h2>
        <form data-form="newpassword"><label>New password (at least 8 characters) <input name="password" type="password" autocomplete="new-password" minlength="8" required></label>
        ${msg}<div class="row"><button class="main">Save password</button></div></form>`,
      account: user ? `${close}<h2>Your account</h2>
        <p>Signed in as <b>${escape(user.email)}</b>. Your progress syncs on every device where you sign in.</p>
        ${msg}<div class="row"><button class="main" data-act="close">Done</button><button data-act="signout">Sign out</button></div>
        <p>Signing out removes your progress from this device (it stays in your account), so the next person starts fresh.</p>
        <div class="row"><button class="danger" data-act="delete">Delete my account and all my progress</button></div>` : "",
    };
    dialog.innerHTML = screens[screen];
    if (!dialog.open) dialog.showModal();
    const first = dialog.querySelector("input");
    if (first) first.focus();
  }

  const setMessage = (text, bad = false) => {
    const m = dialog.querySelector("#syncMsg");
    if (m) { m.textContent = text; m.className = "msg" + (bad ? " bad" : ""); }
  };

  // The address emails send people back to: this page, without any leftover login details
  const backHere = () => location.origin + location.pathname;

  dialog.addEventListener("click", async e => {
    const act = e.target.dataset && e.target.dataset.act;
    if (!act) return;
    e.preventDefault();
    if (act === "close") return dialog.close();
    if (["signin", "signup", "forgot"].includes(act)) return showScreen(act);
    if (act === "signout") return signOut();
    if (act === "delete") return deleteAccount();
  });

  dialog.addEventListener("submit", async e => {
    e.preventDefault();
    const form = e.target, kind = form.dataset.form;
    const email = form.email ? form.email.value.trim() : "", password = form.password ? form.password.value : "";
    form.querySelectorAll("button").forEach(b => b.disabled = true);
    try {
      if (kind === "signin") {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        dialog.close();
        toast("Signed in. Your progress now syncs between your devices.");
      } else if (kind === "signup") {
        const { data, error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: backHere() } });
        if (error) throw error;
        if (data.session) { dialog.close(); toast("Welcome! Your progress now syncs between your devices."); }
        else setMessage("Almost there: we've emailed you a link. Click it to confirm your address, then you're signed in.");
      } else if (kind === "forgot") {
        const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: backHere() });
        if (error) throw error;
        setMessage("If there's an account for that address, a link is on its way. Check your email.");
      } else if (kind === "newpassword") {
        const { error } = await client.auth.updateUser({ password });
        if (error) throw error;
        dialog.close();
        toast("Your new password is saved.");
      }
    } catch (err) {
      setMessage(friendly(err), true);
    } finally {
      form.querySelectorAll("button").forEach(b => b.disabled = false);
    }
  });

  function friendly(err) {
    const m = (err && err.message) || String(err);
    if (/invalid login credentials/i.test(m)) return "That email and password don't match.";
    if (/email not confirmed/i.test(m)) return "Please confirm your email address first: click the link we sent you.";
    if (/already registered/i.test(m)) return "There's already an account with that email. Sign in instead.";
    if (/rate limit|too many/i.test(m)) return "Too many tries or emails in a short time. Please wait a while and try again.";
    if (/password/i.test(m) && /characters|short|weak/i.test(m)) return "Please choose a longer password (at least 8 characters).";
    if (/fetch|network/i.test(m)) return "Couldn't reach the server. Check your internet connection.";
    return m;
  }

  button.onclick = () => showScreen(currentUser ? "account" : "signin");

  // ---------- Syncing ----------
  // Your progress is one row in the "progress" table: data (key → value) and stamps (key → when it changed).
  // A removed item is kept as null, so the removal reaches your other devices too.
  let client = null;
  let currentUser = null;
  let ready = false;        // true once we've read what's in your account
  let channel = null;
  const openedAt = Date.now();
  let touched = false;      // has the page been used since it opened?
  ["pointerdown", "keydown"].forEach(e => document.addEventListener(e, () => { touched = true; }, { capture: true, once: true }));

  function showStatus(state, detail) {
    button.classList.toggle("on", state === "on");
    button.classList.toggle("error", state === "error");
    button.textContent = state === "off" ? "☁ Sign in" : state === "error" ? "☁ Sync problem" : "☁ " + (currentUser.email.split("@")[0]);
    button.title = detail || "";
  }

  // Take in your account's progress. The newest change wins, except for things changed here and not sent yet.
  function receive(online) {
    const changed = [];
    for (const key in (online.stamps || {})) {
      const theirs = Number(online.stamps[key]);
      if (theirs <= (stamps[key] || 0) || dirty.has(key)) continue;
      const value = online.data ? online.data[key] : null;
      if (store.getItem(key) !== value) {
        if (value === null || value === undefined) rawRemove.call(store, key); else rawSet.call(store, key, value);
        changed.push(key);
      }
      stamps[key] = theirs;
    }
    saveBookkeeping();
    // The page has already read its data when it opened, so it needs a reload to show the new data.
    // Right after opening, nobody's using it yet: just reload. Otherwise ask, so we don't interrupt you.
    if (changed.length) {
      if (!touched && Date.now() - openedAt < 5000) location.reload();
      else toast("New changes from your other device.", "Reload", () => location.reload());
    }
  }

  async function readOnline() {
    const { data, error } = await client.from("progress").select("data, stamps").eq("user_id", currentUser.id).maybeSingle();
    if (error) throw error;
    return data || { data: {}, stamps: {} };
  }

  // The first time you sign in on a device, your account's progress wins. If the device has progress of its
  // own that your account doesn't have yet (e.g. you used the site here before signing up), you choose
  // whether to add it to your account.
  async function firstSyncOnThisDevice(online) {
    const onlineKeys = new Set(Object.keys(online.stamps || {}));
    const extra = [];
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (synced(key) && !onlineKeys.has(key)) extra.push(key);
    }
    let addExtra = true;
    if (extra.length && onlineKeys.size) {
      addExtra = confirm("This device has some progress that isn't in your account yet.\n\n" +
        "OK: add it to your account.\nCancel: remove it from this device and use only your account's progress.");
    }
    // Your account's version of everything it has replaces this device's
    stamps = {};
    dirty = new Set();
    for (const key of onlineKeys) stamps[key] = 0;
    extra.forEach(key => {
      if (addExtra) { stamps[key] = Date.now(); dirty.add(key); }
      else rawRemove.call(store, key);
    });
    saveBookkeeping();
    rawSet.call(store, SYNCED_USER, currentUser.id);
    receive(online);
  }

  // Send everything changed here. The database merges it key by key (newest change wins) in one step,
  // so two devices saving at the same moment can't undo each other's changes.
  async function push() {
    if (!client || !currentUser || !ready || dirty.size === 0) return;
    const keys = [...dirty];
    const data = {}, times = {};
    keys.forEach(k => { data[k] = store.getItem(k); times[k] = stamps[k] || Date.now(); });
    try {
      const { data: row, error } = await client.rpc("merge_progress", { new_data: data, new_stamps: times });
      if (error) throw error;
      keys.forEach(k => { if (stamps[k] === times[k]) dirty.delete(k); }); // unless it changed again meanwhile
      saveBookkeeping();
      if (row) receive(Array.isArray(row) ? row[0] : row);
      showStatus("on", `Signed in as ${currentUser.email}. Your progress is synced.`);
    } catch (e) {
      console.warn("Sync: couldn't send changes, will try again", e);
      showStatus("error", "Couldn't save to your account right now. Your progress is still on this device and will sync later.");
      setTimeout(schedulePush, 20000);
    }
  }

  async function pull() {
    if (!currentUser) return;
    try {
      receive(await readOnline());
      showStatus("on", `Signed in as ${currentUser.email}. Your progress is synced.`);
    } catch (e) {
      showStatus("error", "Couldn't reach your account right now. Your progress is still saved on this device.");
    }
  }

  async function startSyncing(user) {
    currentUser = user;
    showStatus("on", `Signed in as ${user.email}. Syncing…`);
    try {
      const online = await readOnline();
      if (store.getItem(SYNCED_USER) !== user.id) await firstSyncOnThisDevice(online);
      else receive(online);
      ready = true;
      showStatus("on", `Signed in as ${user.email}. Your progress is synced.`);
      schedulePush();
    } catch (e) {
      console.warn("Sync: couldn't read your account", e);
      showStatus("error", "Couldn't reach your account right now. Your progress is still saved on this device.");
      setTimeout(() => startSyncing(user), 20000);
      return;
    }
    // Changes from your other devices arrive straight away
    channel = client.channel("progress-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "progress", filter: `user_id=eq.${user.id}` },
        payload => { if (payload.new && payload.new.stamps) receive(payload.new); })
      .subscribe();
  }

  function stopSyncing() {
    if (channel) { client.removeChannel(channel); channel = null; }
    currentUser = null;
    ready = false;
    showStatus("off", "Sign in to keep your progress on all your devices");
  }

  // Sign out: send any last changes, then clear this device so the next person starts fresh
  async function signOut() {
    setMessage("Saving your last changes…");
    await push();
    await client.auth.signOut();
    clearThisDevice();
    location.reload();
  }

  function clearThisDevice() {
    const keys = [];
    for (let i = 0; i < store.length; i++) keys.push(store.key(i));
    keys.forEach(k => { if (synced(k) || k.startsWith("sync:")) rawRemove.call(store, k); });
    stamps = {}; dirty = new Set();
  }

  async function deleteAccount() {
    if (!confirm(`Delete the account ${currentUser.email} and all its progress, on every device? This can't be undone.`)) return;
    setMessage("Deleting…");
    const { error } = await client.rpc("delete_my_account");
    if (error) return setMessage("Couldn't delete the account: " + error.message, true);
    await client.auth.signOut();
    clearThisDevice();
    location.reload();
  }

  // ---------- Starting up ----------
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (window.supabase) return resolve();
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  loadScript(SUPABASE_JS).then(() => {
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    client.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") return showScreen("newpassword");
      const user = session && session.user;
      if (user && (!currentUser || currentUser.id !== user.id)) startSyncing(user);
      else if (!user && currentUser) stopSyncing();
      else if (!user) showStatus("off", "Sign in to keep your progress on all your devices");
    });
    // Coming back to the page (e.g. switching apps on your phone): check for news. Leaving it: send any last changes.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") pull(); else push();
    });
  }).catch(e => {
    console.warn("Sync: couldn't load Supabase", e);
    button.textContent = "☁ Sync unavailable";
    button.title = "Couldn't reach the sync service. Your progress is still saved on this device.";
  });
})();
