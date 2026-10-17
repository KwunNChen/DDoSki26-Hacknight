// The Procrastinator: background service worker (Person A)

const DEFAULTS = {
  enabled: true,
  dismissals: 0,
  triggers: 0,
  minutesPrevented: 0,
  conversations: 0,
  lastTrigger: 0
};

// Fill in any missing storage keys on install/update. Never overwrites existing values.
chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(Object.keys(DEFAULTS));
  const missing = {};
  for (const [k, v] of Object.entries(DEFAULTS)) {
    if (current[k] === undefined) missing[k] = v;
  }
  if (Object.keys(missing).length) await chrome.storage.local.set(missing);
});

// Popup-window fallback for when a site's CSP blocks iframes.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.type !== "OPEN_WINDOW") return;

  const url = typeof msg.url === "string" ? msg.url : "";
  if (!/^https?:\/\//i.test(url)) {
    sendResponse({ ok: false, error: "bad url" });
    return;
  }

  chrome.windows
    .create({ url, type: "popup", width: 420, height: 780, focused: true })
    .then((win) => sendResponse({ ok: true, windowId: win.id }))
    .catch((err) => sendResponse({ ok: false, error: String(err) }));

  return true; // keep the channel open for the async response
});
