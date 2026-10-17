// The Procrastinator: core engine (Person A)
// Loaded after content/modules/*.js, so window.PROC.modules is already populated.
(() => {
  if (window.__procMainLoaded) return; // SPA / double-injection guard
  window.__procMainLoaded = true;

  window.PROC = window.PROC || { modules: {} };
  window.PROC.modules = window.PROC.modules || {};

  // ---------------------------------------------------------------- config
  const BASE_DELAY = 45000;
  const MIN_DELAY = 8000;
  const DECAY = 0.7;
  const DEMO_DELAY = 3000;
  const WARN_MS = 4000;       // heads-up banner shown this long before the overlay
  const DEMO_WARN_MS = 1500;  // shorter heads-up in demo mode
  const DODGES = 2; // button runs away this many times, then closes on the next attempt
  const KEYWORD_RE = /\b(assignments?|due|exams?|midterms?|finals?|quiz(?:zes)?|homework)\b/i;
  const TAUNTS = ["Nope.", "Nice try."];
  const DEFAULTS = {
    enabled: true, dismissals: 0, triggers: 0, minutesPrevented: 0,
    conversations: 0, lastTrigger: 0
  };

  // ----------------------------------------------------------------- state
  let enabled = true;
  let demoMode = false;
  let firstTrigger = true;
  let timer = null;
  let scheduleToken = 0;
  let overlay = null; // { host, stage, btn, taunt, attempts, lastAttempt, unmounts, prevOverflow }
  let corner = null;  // { host, unmounts }
  let shiftPPresses = [];
  let warning = null; // { el, tick, done } while the heads-up banner is showing

  const log = (...a) => console.log("%c[Procrastinator]", "color:#f0f", ...a);
  const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  // --------------------------------------------------------------- storage
  // After the extension is reloaded, old content scripts lose chrome.runtime. Don't throw.
  const alive = () => { try { return !!chrome.runtime?.id; } catch { return false; } };

  async function getStats() {
    if (!alive()) return { ...DEFAULTS };
    try {
      return { ...DEFAULTS, ...(await chrome.storage.local.get(Object.keys(DEFAULTS))) };
    } catch { return { ...DEFAULTS }; }
  }

  // bump({ triggers: 1 }, { lastTrigger: Date.now() }) -> read-modify-write only the given keys
  async function bump(deltas, extra = {}) {
    if (!alive()) return;
    try {
      const cur = await chrome.storage.local.get(Object.keys(deltas));
      const next = { ...extra };
      for (const k of Object.keys(deltas)) next[k] = (Number(cur[k]) || 0) + deltas[k];
      await chrome.storage.local.set(next);
    } catch (e) { console.warn("[Procrastinator] storage write failed", e); }
  }

  // ------------------------------------------------------------ DOM utils
  function el(tag, props = {}, children = []) {
    const n = Object.assign(document.createElement(tag), props);
    for (const c of children) n.append(c);
    return n;
  }

  // Zero-specificity defaults so the overlay works before/without overlay.css.
  // Anything Person C writes in overlay.css wins over these.
  function injectBaseStyles() {
    if (document.getElementById("proc-base-style")) return;
    const css = `
      :where(#proc-host){display:flex;align-items:center;justify-content:center;
        background:rgba(0,0,0,.94);color:#fff;font:16px/1.4 system-ui,sans-serif;}
      :where(#proc-host .proc-stage){position:relative;width:100%;height:100%;
        display:flex;align-items:center;justify-content:center;}
      :where(#proc-host .proc-fallback){text-align:center;padding:24px;}
      :where(#proc-host .proc-fallback h1){font-size:clamp(32px,7vw,80px);margin:0 0 8px;
        font-weight:900;letter-spacing:.02em;color:#fff;}
      :where(#proc-host .proc-fallback p){font-size:20px;opacity:.7;margin:0;}
      :where(#proc-host .proc-dismiss){padding:10px 18px;border:0;border-radius:999px;
        background:#fff;color:#000;font:700 14px system-ui,sans-serif;cursor:pointer;
        box-shadow:0 4px 16px rgba(0,0,0,.4);}
      :where(#proc-host .proc-taunt){position:absolute;top:70px;right:20px;font:800 22px system-ui;
        color:#ff3b5c;opacity:0;transition:opacity .15s;pointer-events:none;z-index:3;}
      :where(#proc-host .proc-taunt.proc-show){opacity:1;}
      :where(.proc-warning){position:fixed;top:20px;left:50%;transform:translateX(-50%);
        z-index:2147483647;display:flex;align-items:center;gap:12px;max-width:min(92vw,460px);
        background:#21182f;color:#e8d9ff;border:1px solid #c3a7fa88;border-radius:14px;
        padding:12px 18px;font:600 14px/1.35 system-ui,sans-serif;box-shadow:0 10px 36px rgba(0,0,0,.45);}
      :where(.proc-warning small){display:block;opacity:.7;font-weight:500;font-size:12px;}
      :where(.proc-toast){position:fixed;left:50%;bottom:24px;transform:translateX(-50%);
        z-index:2147483647;background:#111;color:#fff;padding:10px 16px;border-radius:10px;
        font:600 14px system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.35);}
    `;
    (document.head || document.documentElement).append(el("style", { id: "proc-base-style", textContent: css }));
  }

  function toast(text, ms = 2200) {
    const t = el("div", { className: "proc-toast", textContent: text });
    document.documentElement.append(t);
    setTimeout(() => t.remove(), ms);
  }

  // ------------------------------------------------------- module mounting
  function modulesFor(placement) {
    return Object.values(window.PROC.modules).filter(
      (m) => m && typeof m.mount === "function" && (m.placement || "fullscreen") === placement
    );
  }

  function makeApi(placement, reason) {
    return {
      placement,
      reason,                                   // "trigger" | "dismissed"
      greeting: reason === "dismissed" ? "Leaving already?" : null,
      dismiss: placement === "corner" ? closeCorner : () => attemptDismiss(null, true),
      assetUrl: (path) => (alive() ? chrome.runtime.getURL(path) : path),
      openPopupWindow: (url) => {
        if (!alive()) return Promise.resolve({ ok: false });
        return chrome.runtime.sendMessage({ type: "OPEN_WINDOW", url }).catch((e) => ({ ok: false, error: String(e) }));
      }
    };
  }

  // Mount every module of one placement into `container`. Returns unmount fns + how many succeeded.
  function mountAll(placement, container, reason) {
    const unmounts = [];
    let ok = 0;
    for (const m of modulesFor(placement)) {
      const root = el("div", { className: `proc-module proc-module-${m.name || "anon"}` });
      container.append(root);
      try {
        const u = m.mount(root, makeApi(placement, reason));
        if (typeof u === "function") unmounts.push(u);
        ok++;
      } catch (e) {
        console.error(`[Procrastinator] module "${m.name}" failed to mount`, e);
        root.remove();
      }
    }
    return { unmounts, ok };
  }

  function runUnmounts(list) {
    for (const u of list) {
      try { u(); } catch (e) { console.error("[Procrastinator] unmount failed", e); }
    }
  }

  // ========================================================================
  // PHASE 1: full-screen overlay shell
  // ========================================================================
  function showOverlay() {
    if (overlay || document.getElementById("proc-host")) return; // double-mount guard

    const host = el("div", { id: "proc-host", className: "proc-host proc-fade-in" });
    host.style.cssText = "position:fixed;inset:0;z-index:2147483647;";
    host.setAttribute("role", "dialog");
    host.setAttribute("aria-modal", "true");
    host.setAttribute("aria-label", "The Procrastinator");

    const stage = el("div", { className: "proc-stage" });
    const taunt = el("div", { className: "proc-taunt", ariaLive: "polite" });
    const btn = el("button", { className: "proc-dismiss", type: "button", textContent: "✕ Close" });
    btn.setAttribute("aria-label", "Close");
    // Positioning is functional (the dodge depends on it), so it lives inline.
    btn.style.cssText = "position:absolute;top:16px;right:16px;z-index:3;transition:left .22s ease,top .22s ease;";

    host.append(stage, taunt, btn);
    document.documentElement.append(host);

    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    // Fullscreen modules (reels). Fallback text if none loaded or all crashed.
    const { unmounts, ok } = mountAll("fullscreen", stage, "trigger");
    if (!ok) {
      stage.append(el("div", { className: "proc-fallback" }, [
        el("h1", { textContent: "YOU SHOULD BE STUDYING" }),
        el("p", { textContent: "...but you won't be." })
      ]));
    }

    overlay = { host, stage, btn, taunt, attempts: 0, lastAttempt: 0, unmounts, prevOverflow };

    btn.addEventListener("pointerenter", (e) => attemptDismiss(e, false));
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      attemptDismiss(e, true);
    });

    bump({ triggers: 1, minutesPrevented: rand(1, 4) }, { lastTrigger: Date.now() });
    log("overlay shown");
  }

  async function closeOverlay({ counted = true } = {}) {
    if (!overlay) return;
    const o = overlay;
    overlay = null;
    runUnmounts(o.unmounts);
    o.host.remove();
    document.documentElement.style.overflow = o.prevOverflow;

    if (counted) {
      await bump({ dismissals: 1, minutesPrevented: rand(1, 4) });
      mountCorner("dismissed");
      log("overlay dismissed");
    }
    schedule();
  }

  // ========================================================================
  // PHASE 2: dodging dismiss button
  // ========================================================================
  // Hover or click = an attempt. Attempts 1..DODGES: button runs away. After that: a click closes.
  function attemptDismiss(e, isClick) {
    if (!overlay) return;
    const o = overlay;

    if (o.attempts >= DODGES) {
      if (isClick) closeOverlay();
      return;
    }

    const now = Date.now();
    if (now - o.lastAttempt < 350) return; // cursor re-entering mid-flight isn't a new attempt
    o.lastAttempt = now;
    o.attempts++;

    const r = o.btn.getBoundingClientRect();
    const cx = e && e.clientX != null ? e.clientX : r.left + r.width / 2;
    const cy = e && e.clientY != null ? e.clientY : r.top + r.height / 2;
    dodge(o.btn, cx, cy);

    o.taunt.textContent = TAUNTS[o.attempts - 1] || "Nope.";
    o.taunt.classList.add("proc-show");
    setTimeout(() => o.taunt.classList.remove("proc-show"), 1100);

    o.host.classList.remove("proc-shake");
    void o.host.offsetWidth; // restart the animation
    o.host.classList.add("proc-shake");
    setTimeout(() => o.host.classList.remove("proc-shake"), 600);

    if (o.attempts >= DODGES) {
      o.btn.textContent = "✕ Close (fine)";
      o.btn.classList.add("proc-dismiss-tired");
    }
  }

  // Move the button to a random spot far from the cursor.
  function dodge(btn, cx, cy) {
    const r = btn.getBoundingClientRect();
    // First move: convert right-anchored position into left/top so the transition animates.
    if (btn.style.right !== "auto") {
      btn.style.left = r.left + "px";
      btn.style.top = r.top + "px";
      btn.style.right = "auto";
      void btn.offsetWidth;
    }
    const pad = 20;
    const maxX = Math.max(pad, innerWidth - r.width - pad);
    const maxY = Math.max(pad, innerHeight - r.height - pad);
    let best = { x: pad, y: pad }, bestDist = -1;
    for (let i = 0; i < 16; i++) {
      const x = pad + Math.random() * (maxX - pad);
      const y = pad + Math.random() * (maxY - pad);
      const d = Math.hypot(x + r.width / 2 - cx, y + r.height / 2 - cy);
      if (d > bestDist) { bestDist = d; best = { x, y }; }
    }
    btn.style.left = best.x + "px";
    btn.style.top = best.y + "px";
  }

  // ========================================================================
  // PHASE 2: trigger timer with escalation
  // delay = max(8000, 45000 * 0.7 ** dismissals); tab-title keyword halves the first one.
  // ========================================================================
  function isStudyPage() {
    return KEYWORD_RE.test(document.title) || KEYWORD_RE.test(location.pathname);
  }

  async function computeDelay() {
    if (demoMode) return DEMO_DELAY;
    const { dismissals } = await getStats();
    let delay = Math.max(MIN_DELAY, BASE_DELAY * DECAY ** dismissals);
    if (firstTrigger && isStudyPage()) delay /= 2;
    return Math.round(delay);
  }

  async function schedule(delayOverride) {
    const token = ++scheduleToken;
    cancelWarning();
    clearTimeout(timer);
    timer = null;
    if (!enabled || overlay) return;
    const delay = delayOverride ?? (await computeDelay());
    if (token !== scheduleToken || !enabled || overlay) return; // a newer schedule() won
    timer = setTimeout(fire, Math.max(0, delay - warnMs()));
    log(`next trigger in ${(delay / 1000).toFixed(1)}s${demoMode ? " (demo mode)" : ""}`);
  }

  function fire() {
    timer = null;
    if (!enabled || overlay) return;
    if (document.hidden) {
      // Don't waste the joke on a background tab: fire shortly after the user comes back.
      const onVis = () => {
        if (document.hidden) return;
        document.removeEventListener("visibilitychange", onVis);
        schedule(1500);
      };
      document.addEventListener("visibilitychange", onVis);
      return;
    }
    firstTrigger = false;
    startWarning(showOverlay);
  }

  // ------------------------------------------------------------------
  // Heads-up banner: "Procrastination incoming", shown for warnMs(), then the overlay.
  // ------------------------------------------------------------------
  const warnMs = () => (demoMode ? DEMO_WARN_MS : WARN_MS);

  function startWarning(onDone) {
    cancelWarning();
    const text = el("div", {}, [
      el("div", { textContent: "⚠️ Productivity detected. Procrastination incoming." }),
      el("small", { textContent: `Spotted on ${location.hostname || "this page"}. Brace yourself.` })
    ]);
    const banner = el("div", { className: "proc-warning", role: "alert" }, [text]);
    document.documentElement.append(banner);
    const tick = setTimeout(() => {
      cancelWarning();
      if (enabled && !overlay) onDone();
    }, warnMs());
    warning = { el: banner, tick };
    log(`heads-up shown on ${location.host}`);
  }

  function cancelWarning() {
    if (!warning) return;
    clearTimeout(warning.tick);
    warning.el.remove();
    warning = null;
  }

  // ========================================================================
  // PHASE 3: corner modules (chatbot) after the final dismiss
  // ========================================================================
  function mountCorner(reason) {
    if (corner || document.getElementById("proc-corner")) return;
    if (!modulesFor("corner").length) return;
    const host = el("div", { id: "proc-corner", className: "proc-corner" });
    host.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483647;";
    document.documentElement.append(host);
    const { unmounts, ok } = mountAll("corner", host, reason);
    if (!ok) { host.remove(); return; }
    corner = { host, unmounts };
  }

  function closeCorner() {
    if (!corner) return;
    runUnmounts(corner.unmounts);
    corner.host.remove();
    corner = null;
  }

  // ========================================================================
  // PHASE 3: keyboard: Escape = dismiss attempt, Shift+P x3 = demo mode
  // ========================================================================
  function isEditable(t) {
    return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay) {
      e.preventDefault();
      e.stopPropagation();
      attemptDismiss(null, true);
      return;
    }
    if (!e.shiftKey || e.code !== "KeyP" || e.repeat || isEditable(e.target)) return;
    const now = Date.now();
    shiftPPresses = shiftPPresses.filter((t) => now - t < 1500);
    shiftPPresses.push(now);
    if (shiftPPresses.length >= 3) {
      shiftPPresses = [];
      demoMode = true;
      toast("🎬 Demo mode: procrastination in 3s");
      if (!overlay) schedule(DEMO_DELAY);
    }
  }, true);

  // ------------------------------------------------- popup on/off toggle
  if (alive()) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" || !changes.enabled) return;
      enabled = changes.enabled.newValue !== false;
      if (enabled) {
        schedule();
      } else {
        clearTimeout(timer);
        timer = null;
        cancelWarning();
        closeOverlay({ counted: false });
        closeCorner();
      }
    });
  }

  // ---------------------------------------------------------- debug hooks
  // Usable from DevTools console when the extension's context is selected.
  window.PROC.core = {
    trigger: () => { clearTimeout(timer); cancelWarning(); showOverlay(); },
    warn: () => startWarning(showOverlay),
    close: () => closeOverlay(),
    demo: () => { demoMode = true; schedule(DEMO_DELAY); },
    schedule
  };

  // ------------------------------------------------------------------ boot
  (async () => {
    injectBaseStyles();
    const s = await getStats();
    enabled = s.enabled !== false;
    log(`loaded on ${location.host} (enabled: ${enabled}, dismissals so far: ${s.dismissals})`);
    if (enabled) schedule();
  })();
})();
