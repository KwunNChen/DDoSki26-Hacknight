// STUB (Person A placeholder). Replace with Person C's popup.js on merge.
const render = () =>
  chrome.storage.local.get(null).then((s) => {
    document.getElementById("stats").textContent = JSON.stringify(s, null, 2);
    document.getElementById("enabled").checked = s.enabled !== false;
  });
document.getElementById("enabled").addEventListener("change", (e) =>
  chrome.storage.local.set({ enabled: e.target.checked })
);
chrome.storage.onChanged.addListener(render);
render();
