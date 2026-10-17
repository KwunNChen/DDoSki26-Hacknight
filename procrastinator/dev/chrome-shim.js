// Dev-only fake chrome.* API so test.html?standalone=1 can run content scripts without the extension.
// Not referenced by manifest.json. Storage is backed by localStorage.
(() => {
  const KEY = "proc-fake-storage";
  const listeners = [];
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };

  window.chrome = {
    runtime: {
      id: "fake-extension-id",
      getURL: (p) => new URL(p, location.href).href,
      sendMessage: async (msg) => {
        console.log("[chrome-shim] sendMessage", msg);
        if (msg && msg.type === "OPEN_WINDOW") window.open(msg.url, "_blank", "popup,width=420,height=780");
        return { ok: true };
      }
    },
    storage: {
      local: {
        get: async (keys) => {
          const all = read();
          if (keys == null) return all;
          const out = {};
          for (const k of [].concat(keys)) if (k in all) out[k] = all[k];
          return out;
        },
        set: async (obj) => {
          const all = read();
          const changes = {};
          for (const [k, v] of Object.entries(obj)) {
            changes[k] = { oldValue: all[k], newValue: v };
            all[k] = v;
          }
          localStorage.setItem(KEY, JSON.stringify(all));
          listeners.forEach((fn) => fn(changes, "local"));
        }
      },
      onChanged: { addListener: (fn) => listeners.push(fn) }
    }
  };
})();
