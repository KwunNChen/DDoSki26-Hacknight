# The Procrastinator

**The anti-Grammarly.** A Chrome extension that detects you're being productive on Canvas and fixes that: a YouTube Shorts-style feed takes over your screen, the close button dodges your cursor, and a chatbot talks you out of studying.

**Demo path:** open a Canvas page -> ~15s -> Shorts overlay appears -> try to close it (button runs away) -> Procrastibot pops up -> extension popup shows "Productivity Prevented: 47 min."

**Rule #1: Chrome extension first.** Nothing else matters until it loads unpacked and shows an overlay on a page.

**Team rules:** 3 people, 2 hours, nobody edits a file they don't own. Everyone commits and pushes their own work.

---

## Stack
- Chrome Extension, **Manifest V3**, vanilla JS + CSS. No bundler, no npm, no backend.
- Sideload: `chrome://extensions` -> Developer mode -> Load unpacked -> pick this folder.
- After any edit: click the refresh icon on the extension card, then refresh the target tab.
- Video source: **YouTube embeds** (main path). Real Instagram or the real Shorts feed are optional spikes.

## File layout
```
procrastinator/
  README.md
  manifest.json            A
  background.js            A   (service worker: popup-window fallback)
  content/
    main.js                A   (trigger, escalation, overlay shell, dismiss logic)
    overlay.css            C
    modules/
      reels.js             B   (YouTube Shorts-style feed)
      chatbot.js           B   (Procrastibot, scripted)
  popup/
    popup.html             C
    popup.css              C
    popup.js               C
  assets/
    reels/                 B   (2 local clips for no-Wi-Fi fallback, small)
    icons/                 C   (16.png 48.png 128.png)
    sounds/                C
```

---

## Contracts (agree in the first 15 minutes)

### Module interface (A <-> B)
Modules are listed in the manifest's `content_scripts.js` array **before** `main.js`, so they share a global.
```js
window.PROC = window.PROC || { modules: {} };
window.PROC.modules.reels = {
  name: "reels",
  placement: "fullscreen",     // "corner" for the chatbot
  mount(root, api) {
    // root: element inside the overlay to render into
    // api.dismiss(): ask main.js to close (it decides if allowed)
    // api.assetUrl(path): chrome.runtime.getURL(path)
    // api.openPopupWindow(url): fallback, asks background to open a window
    return () => { /* unmount: clear timers, remove iframes, stop videos */ };
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

### Background message (B -> A)
```js
chrome.runtime.sendMessage({ type: "OPEN_WINDOW", url: "https://www.youtube.com/shorts" })
// background.js: chrome.windows.create({ url, type: "popup", width: 420, height: 780 })
```

---

## Video approach (YouTube)

`youtube.com/shorts/ID` blocks iframes, but the **embed URL** works with no login, no cookies, and no header-stripping:

```
https://www.youtube.com/embed/VIDEO_ID?autoplay=1&mute=1&loop=1&playlist=VIDEO_ID&controls=0&playsinline=1
```

- `mute=1` is required for autoplay.
- `loop=1` only works with `playlist=` set to the same video ID.
- **Feed:** a vertical scroll-snap container (`scroll-snap-type: y mandatory`), each slide `100%` height and phone-width, with 8 to 10 video IDs hardcoded in an array in `reels.js`.
- **Lag fix:** use an `IntersectionObserver`. Set an iframe's `src` only when its slide is on screen and clear it when it leaves. Do NOT load all iframes at once.
- **Video IDs:** take them from the URL of Shorts you like (the part after `/shorts/`). Open `https://www.youtube.com/embed/ID` once to confirm the video allows embedding.

```js
const IDS = ["ID1","ID2","ID3","ID4","ID5","ID6","ID7","ID8"]; // B fills these in
const embed = id =>
  `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&playsinline=1`;
```

**Biggest early risk: Canvas's CSP may block iframes.** Test on a real Canvas page in the first 30 minutes. If blocked, use the popup-window fallback (`chrome.windows.create` with a Shorts URL, via the background script). It needs no special permissions.

**Optional spikes (5 minutes max each, only after the main path works):**
- Real Shorts feed: iframe `https://www.youtube.com/shorts`. May need a `declarativeNetRequest` rule to strip `x-frame-options` and `content-security-policy` on `sub_frame`.
- Real Instagram Reels: same trick, but it often hits a third-party cookie login wall. Lowest priority.
- If you use either, add `declarativeNetRequest` to permissions and a `rules.json`. These rules weaken framing protections in your own browser, so this is demo-only. Do not publish to the Web Store.

---

# PERSON A: Core Engine (critical path)

**You own:** `manifest.json`, `background.js`, `content/main.js`.

### 0:00-0:20: bare extension loading
`manifest.json`:
```json
{
  "manifest_version": 3,
  "name": "The Procrastinator",
  "version": "0.1",
  "permissions": ["storage"],
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
  "web_accessible_resources": [{ "resources": ["assets/*"], "matches": ["<all_urls>"] }]
}
```
`content/main.js`: create `<div id="proc-host">` with `position:fixed; inset:0; z-index:2147483647`, text "YOU SHOULD BE STUDYING", and a close button. Guard against double mounting (Canvas is a single-page app). **Tell B and C the moment it loads.** All 3 laptops should have it running by 0:20.

### 0:20-0:35: iframe check
Open a real Canvas page and test whether a YouTube embed iframe loads in the overlay. Report to B:
- **Loads:** B uses embeds.
- **Blocked:** B uses `api.openPopupWindow(...)`, and you finish `background.js` for `OPEN_WINDOW`.

### 0:35-1:15: the joke logic
- Trigger timer: `delay = max(8000, 45000 * 0.7 ** dismissals)`. First trigger ~15s after page load.
- Dodging dismiss button: runs from the cursor on attempts 1 and 2, closes on attempt 3.
- Stats: increment `triggers`, `dismissals`, `minutesPrevented` (random +1 to +4) in storage.
- Support `placement: "corner"` (fixed bottom-right container) for the chatbot.
- On final dismiss, mount the chatbot: "Leaving already?"

### 1:15-1:45
- Tab-title keyword trigger (`assignment`, `due`, `exam`, `midterm`) halves the initial delay.
- Demo mode: press `Shift+P` three times -> 3-second delay.

### 1:45-2:00
Bug bash on real Canvas. Test load-unpacked on a second laptop.

**Done when:** loads with no errors on `chrome://extensions`, overlay appears on Canvas, dismiss button dodges, stats update.

---

# PERSON B: Distractions

**You own:** `content/modules/reels.js`, `content/modules/chatbot.js`, `assets/reels/`.

### 0:00-0:20: stubs
Write both modules to the interface above, each rendering a placeholder. Hand them to A so the skeleton can mount them. Collect 8 to 10 Shorts IDs and check each at `/embed/ID`. Grab 2 small local clips (under ~3 MB) for no-Wi-Fi fallback.

### 0:20-0:50: Reels module (YouTube)
- Vertical scroll-snap feed of embeds in a phone-shaped column (~420x780), with a fake "Shorts" header and like/comment/share rail.
- `IntersectionObserver` to set and clear iframe `src` per visible slide.
- If A reports iframes are blocked on Canvas: render local clips in `<video muted loop playsinline>` and call `api.openPopupWindow("https://www.youtube.com/shorts")`.

### 0:50-1:30: Procrastibot (scripted)
- Corner chat bubble, message list, input, typing indicator ("Procrastibot is typing...").
- Opens with: *"Hey! I noticed you're doing homework. Gross. Want to watch something instead?"*
- **3 quick-reply chips** so the demo never depends on typing: "I have a midterm", "I'm so stressed", "Just 10 more minutes".
- Keyword brain:
  - `due | deadline | midterm | exam` -> "Sounds like Tomorrow You's problem."
  - `tired | stress` -> "Rest is productive. Scrolling is rest."
  - `should | need to | have to` -> "Bold word choice. 'Should' has never done anything for anyone."
  - `grade | gpa` -> "GPA is just a number. So is screen time."
  - default -> rotate 8 generic persuasions
- Increment `conversations` in storage on the first user message.
- Keep it playful and harmless. No insults.

### 1:30-1:50
Polish. Make sure `unmount` removes iframes and clears timers. Test on real Canvas with A.

**Done when:** feed scrolls and plays inside the overlay (or fallback works), chatbot answers chips and keywords, no console errors.

---

# PERSON C: UI and Demo (no core logic)

**You own:** `content/overlay.css`, `popup/*`, `assets/icons`, `assets/sounds`.

### 0:00-0:20
- `popup/popup.html` skeleton. **No inline scripts** (MV3 blocks them), so use an external `popup.js`.
- Icons 16/48/128. Pick name and tagline.

### 0:20-1:00
- `popup.js`: read storage and render **"Productivity Prevented Today: N min"**, **Triggers**, **Dismissals**, **Conversations Had**. Live updates via `chrome.storage.onChanged`.
- On/off toggle writing `enabled`.
- Fake "Procrastination Score" (`triggers * 12 + dismissals * 5`, capped at 100) with a progress bar.

### 1:00-1:30
- `overlay.css`: dark Shorts-style look, fade-in on mount, shake animation on dismiss attempts, chat bubble styles, "online" dot, bot avatar.
- Short sound effect on overlay appear (may be blocked by autoplay, so don't depend on it).

### 1:30-1:45
Fake achievements in the popup ("Unlocked: Avoided Reading Chapter 4"). Skip if behind.

### 1:45-2:00
- **Record the demo video** (30 to 60 s screen capture of the full demo path), before the last 10 minutes. Save copies to your laptop and phone.
- Rehearse the one-sentence pitch with an outsider.

**Done when:** popup shows live-updating numbers, overlay looks good, video is recorded and saved in two places.

---

## Sync points
- **0:20:** bare extension loads on all 3 laptops. If not, everyone helps A.
- **0:35:** integration check: overlay mounts the stub modules and the popup reads storage. If this fails, stop and fix it together.
- **1:45:** feature freeze. Bug fixes and demo only.

## Gotchas
- Canvas is a single-page app. Guard against double-mounting the overlay.
- Canvas CSP may block iframes. Test early and use the popup-window fallback if needed.
- `autoplay` needs `mute=1` for YouTube embeds and `muted playsinline` on `<video>`.
- Never load all iframes at once. Use the `IntersectionObserver`.
- Test without a Canvas login: make a `test.html` and run `python3 -m http.server 8000`; the manifest already matches `http://localhost/*`.
- Check `chrome://extensions` for error messages on the extension card first when something breaks.
- `z-index: 2147483647` on the overlay host.

## Cut list (in order)
1. Achievements and sounds
2. Tab-title keyword trigger
3. Fake procrastination score
4. Fancy escalation (use a fixed 15s delay)
5. Real-feed spikes (Instagram, real Shorts)

**Never cut:** the extension loading, overlay with video (embeds or fallback), dodging dismiss button, popup counter, scripted chatbot, backup demo video.

## Definition of done
- Loads unpacked on a fresh Chrome profile with no errors.
- On Canvas, the overlay appears within the delay and plays a Short.
- Dismiss button misbehaves on the first two attempts, then closes.
- Procrastibot appears and replies to chips.
- Popup shows a live, increasing "Productivity Prevented" number.
- 30 to 60 second demo video saved locally and on a phone.