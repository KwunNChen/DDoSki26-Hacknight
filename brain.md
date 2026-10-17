# The Procrastinator: Handoff v2 (3 people, 2 hours)

**Pitch:** The anti-Grammarly. A Chrome extension that detects you're being productive on Canvas and fixes that: real Instagram Reels takes over your screen, the close button dodges you, and a chatbot talks you out of studying.

**Demo path:** open a Canvas page -> ~15s -> Reels overlay appears -> try to close it (button runs away) -> Procrastibot pops up -> extension popup shows "Productivity Prevented: 47 min."

**Rule #1: it's a Chrome extension first.** Nothing else matters until it loads unpacked and shows an overlay on a page.

**Git:** you commit and push yourselves. Nobody edits a file they don't own.

---

## Stack
- Chrome Extension, **Manifest V3**, vanilla JS + CSS. No bundler, no npm, no backend.
- Sideload: `chrome://extensions` -> Developer mode -> Load unpacked -> pick the `procrastinator/` folder.
- After any edit: hit the refresh icon on the extension card, then refresh the target tab.

## File layout
```
procrastinator/
  manifest.json            A
  background.js            A   (service worker: popup-window fallback)
  rules.json               A   (strips iframe-blocking headers on instagram.com)
  content/
    main.js                A   (trigger, escalation, overlay shell, dismiss logic)
    overlay.css            C
    modules/
      reels.js             B
      chatbot.js           B
  popup/
    popup.html             C
    popup.css              C
    popup.js               C
  assets/
    reels/                 B   (2-3 local fallback clips, small)
    icons/                 C   (16.png 48.png 128.png)
    sounds/                C
```

## Contracts (agree in the first 15 minutes)

### Module interface (A <-> B)
Modules are listed in the manifest's `content_scripts.js` array **before** `main.js`, so they share a global.
```js
window.PROC = window.PROC || { modules: {} };
window.PROC.modules.reels = {
  name: "reels",
  placement: "fullscreen",     // or "corner" for chatbot
  mount(root, api) {
    // root: element inside the overlay to render into
    // api.dismiss(): ask main.js to close (it decides if allowed)
    // api.assetUrl(path): chrome.runtime.getURL(path)
    // api.openPopupWindow(): fallback, asks background to open Reels in a window
    return () => { /* unmount: clear timers, stop videos */ };
  }
};
```

### Storage schema (A writes, C reads)
```js
// chrome.storage.local
{ enabled: true, dismissals: 0, triggers: 0, minutesPrevented: 0,
  conversations: 0, lastTrigger: 0 }
```
C only writes `enabled`.

### Background message (A <-> B)
```js
chrome.runtime.sendMessage({ type: "OPEN_REELS_WINDOW" })
// background.js: chrome.windows.create({url:"https://www.instagram.com/reels/", type:"popup", width:420, height:780})
```

---

# PERSON A: Core Engine (critical path)

**You own:** `manifest.json`, `background.js`, `rules.json`, `content/main.js`.

### Phase 1 (0:00-0:20): get the bare extension loading
1. `manifest.json`:
   ```json
   {
     "manifest_version": 3,
     "name": "The Procrastinator",
     "version": "0.1",
     "permissions": ["storage", "declarativeNetRequest"],
     "host_permissions": ["*://*.instagram.com/*"],
     "background": { "service_worker": "background.js" },
     "action": { "default_popup": "popup/popup.html" },
     "content_scripts": [{
       "matches": ["*://*.instructure.com/*", "*://bcourses.berkeley.edu/*",
                   "*://*.gradescope.com/*", "*://docs.google.com/*",
                   "http://localhost/*"],
       "js": ["content/modules/reels.js", "content/modules/chatbot.js", "content/main.js"],
       "css": ["content/overlay.css"],
       "run_at": "document_idle"
     }],
     "declarative_net_request": {
       "rule_resources": [{ "id": "ig", "enabled": true, "path": "rules.json" }]
     },
     "web_accessible_resources": [{ "resources": ["assets/*"], "matches": ["<all_urls>"] }]
   }
   ```
2. `content/main.js`: create a `<div id="proc-host">` with `position:fixed; inset:0; z-index:2147483647`, text "YOU SHOULD BE STUDYING", and a close button. Guard against double mounting.
3. Tell B and C the moment it loads. **Everyone else should have it running on their laptop by 0:20.**

### Phase 2 (0:20-0:35): Instagram iframe spike (5 minutes max)
`rules.json`:
```json
[{
  "id": 1, "priority": 1,
  "action": { "type": "modifyHeaders",
    "responseHeaders": [
      { "header": "x-frame-options", "operation": "remove" },
      { "header": "content-security-policy", "operation": "remove" }
    ]},
  "condition": { "urlFilter": "||instagram.com", "resourceTypes": ["sub_frame"] }
}]
```
Test: iframe `https://www.instagram.com/reels/` in the overlay.
- **Feed loads logged in:** tell B to use the iframe.
- **Login wall or blank:** tell B to use the popup-window fallback. Stop spending time on it.

`background.js`: listen for `OPEN_REELS_WINDOW` and call `chrome.windows.create(...)`.

### Phase 3 (0:35-1:15): the joke logic
- Trigger timer: `delay = max(8000, 45000 * 0.7 ** dismissals)`. First trigger after ~15s on first load.
- Dodging dismiss button: runs away from the cursor on attempts 1 and 2, closes on attempt 3.
- Stats: increment `triggers`, `dismissals`, `minutesPrevented` (random +1 to +4) in storage.
- Support `placement: "corner"` for the chatbot (fixed bottom-right container, can show alongside the overlay).
- On final dismiss, mount the chatbot: "Leaving already?"

### Phase 4 (1:15-1:45)
- Tab-title keyword trigger (`assignment`, `due`, `exam`, `midterm`) halves the initial delay.
- Demo mode: press `Shift+P` three times -> 3-second delay.
- Canvas is a single-page app, so make sure it never double-mounts.

### Phase 5 (1:45-2:00)
Bug bash on a real Canvas page. Test load-unpacked on a second laptop.

**Done when:** loads with no errors on `chrome://extensions`, overlay appears on Canvas, dismiss button dodges, stats update.

---

# PERSON B: Distractions

**You own:** `content/modules/reels.js`, `content/modules/chatbot.js`, `assets/reels/`.

### Phase 1 (0:00-0:20): stubs
Write both modules to the interface above, each just rendering a placeholder (`REELS HERE`, `CHAT HERE`). Hand them to A so the skeleton can mount them. Prep 2 to 3 local clips (under ~3 MB, muted, loop) as a safety net.

### Phase 2 (0:20-0:50): Reels module
- A will tell you whether the iframe spike worked.
- **If yes:** render `<iframe src="https://www.instagram.com/reels/" allow="autoplay">` full-size, centered like a phone (about 420x780), with a fake "For You" tab bar on top.
- **If no:** render your local clips in a vertical scroll-snap feed (`scroll-snap-type: y mandatory`, each child `100vh`, muted looping `<video playsinline>`), and also call `api.openPopupWindow()` so the real Reels opens beside it.
- Videos must be `muted` + `playsinline`, or Chrome blocks autoplay.

### Phase 3 (0:50-1:30): Procrastibot (scripted)
- Corner chat bubble, bottom-right, message list + input + typing indicator ("Procrastibot is typing...").
- Opens with: *"Hey! I noticed you're doing homework. Gross. Want to watch something instead?"*
- **3 quick-reply chips** so the demo never depends on typing: "I have a midterm", "I'm so stressed", "Just 10 more minutes".
- Keyword brain:
  - `due | deadline | midterm | exam` -> "Sounds like Tomorrow You's problem."
  - `tired | stress` -> "Rest is productive. Scrolling is rest."
  - `should | need to | have to` -> "Bold word choice. 'Should' has never done anything for anyone."
  - `grade | gpa` -> "GPA is just a number. So is screen time."
  - default -> rotate 8 generic persuasions
- Increment `conversations` in storage on first user message.
- Keep it harmless and playful. No insults.

### Phase 4 (1:30-1:50)
Polish, make sure `unmount` clears timers and stops videos, test the iframe on a real Canvas page with A.

**Done when:** Reels render inside the overlay (live or fallback), chatbot responds to chips and keywords, no console errors.

---

# PERSON C: UI and Demo (you write no core logic)

**You own:** `content/overlay.css`, `popup/*`, `assets/icons`, `assets/sounds`.

### Phase 1 (0:00-0:20)
- `popup/popup.html` skeleton with a heading and placeholders. **No inline scripts** (MV3 blocks them), so use an external `popup.js`.
- Icons 16/48/128 (a sad clock or a crossed-out pencil works).
- Pick the name and tagline.

### Phase 2 (0:20-1:00)
- `popup.js`: read storage and render **"Productivity Prevented Today: N min"**, **Triggers**, **Dismissals**, **Conversations Had**. Live-update with `chrome.storage.onChanged`.
- On/off toggle writing `enabled`.
- A fake "Procrastination Score" (e.g. `triggers * 12 + dismissals * 5`, capped at 100) with a progress bar.

### Phase 3 (1:00-1:30)
- `overlay.css`: dark Instagram-ish look, fade-in on mount, shake animation on dismiss attempts, chat bubble styles, "online" status dot, bot avatar.
- A short sound effect on overlay appear (muted by default if autoplay blocks it).

### Phase 4 (1:30-1:45)
Fake achievements in the popup ("Unlocked: Avoided Reading Chapter 4"). Skip if behind.

### Phase 5 (1:45-2:00)
- **Record the demo video** (30 to 60 s screen capture of the full demo path). Do this *before* the final 10 minutes. Save a copy to your phone.
- Rehearse the one-sentence pitch with an outsider.

**Done when:** popup shows live-updating numbers, overlay looks good, video is recorded and saved in two places.

---

## Sync points
- **0:20:** bare extension loads on all 3 laptops. If not, everyone helps A.
- **0:35:** integration check. Overlay mounts the stub modules and the popup reads storage. If this fails, stop and fix it together.
- **1:45:** feature freeze. Bug fixes and demo only.

## Gotchas
- Canvas is a single-page app. Guard against mounting the overlay twice.
- Instagram in an iframe may show a login wall (third-party cookies). Don't sink time into it. Use the popup-window fallback.
- Removing Instagram's headers only affects your own browser. It's demo-only, so don't publish this to the Web Store.
- Test without Canvas login using `http://localhost` and a simple `test.html` served with `python3 -m http.server`.
- `chrome://extensions` shows errors on the extension card. Check there first when something doesn't load.
- Keep `z-index: 2147483647` on the overlay host.

## Cut list (in order)
1. Achievements and sounds
2. Tab-title keyword trigger
3. Fake procrastination score
4. Fancy escalation (use a fixed 15s delay)

**Never cut:** loading extension, overlay with Reels (live or fallback), dodging dismiss button, popup counter, scripted chatbot, backup demo video.