"use strict";
(() => {
  const defaults = { enabled: true, dismissals: 0, triggers: 0, minutesPrevented: 0, conversations: 0, lastTrigger: 0 };
  const state = { ...defaults };
  const el = id => document.getElementById(id);
  const count = value => typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
  const storage = globalThis.chrome?.storage;
  let revision = 0;
  function render() {
    const triggers = count(state.triggers), dismissals = count(state.dismissals);
    const score = Math.min(100, Math.floor(triggers * 12 + dismissals * 5));
    el("minutes").textContent = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(count(state.minutesPrevented));
    for (const key of ["triggers", "dismissals", "conversations"]) el(key).textContent = Math.floor(count(state[key])).toLocaleString();
    el("enabled").checked = state.enabled !== false;
    el("status-text").textContent = state.enabled !== false ? "Ready to derail your day" : "Distractions on pause";
    el("status-dot").classList.toggle("active", state.enabled !== false);
    el("score").textContent = String(score);
    el("score-fill").style.width = `${score}%`;
    el("score-bar").setAttribute("aria-valuenow", String(score));
    el("score-caption").textContent = score >= 80 ? "A masterclass in doing it later." : score >= 40 ? "You're really putting things off." : "So much untapped distraction.";
    el("achievement").textContent = triggers >= 1 ? "Unlocked: Avoided Reading Chapter 4" : "Your first distraction awaits.";
  }
  render();
  if (!storage?.local) {
    el("notice").textContent = "Design preview. Load the assembled extension in Chrome to show live stats.";
    return;
  }
  // Subscribe before the initial read; a change during the read triggers a fresh snapshot.
  async function refresh() {
    const request = ++revision;
    try {
      const saved = await storage.local.get(defaults);
      if (request !== revision) return;
      Object.assign(state, defaults, saved);
      render();
      el("enabled").disabled = false;
    } catch {
      if (request === revision) el("notice").textContent = "Could not read extension stats. Reopen the popup to retry.";
    }
  }
  function onChanged(changes, area) {
    if (area !== "local" || !Object.keys(defaults).some(key => key in changes)) return;
    void refresh();
  }
  storage.onChanged.addListener(onChanged);
  el("enabled").addEventListener("change", async event => {
    const toggle = event.currentTarget;
    const enabled = toggle.checked;
    toggle.disabled = true;
    try {
      await storage.local.set({ enabled }); // Person C only owns this storage key.
      state.enabled = enabled;
      el("notice").textContent = "";
    } catch {
      el("notice").textContent = "Could not save your setting. Try again.";
    } finally {
      render();
      toggle.disabled = false;
    }
  });
  window.addEventListener("pagehide", () => storage.onChanged.removeListener(onChanged), { once: true });
  void refresh();
})();
