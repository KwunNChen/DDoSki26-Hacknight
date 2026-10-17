# CLAUDE.md: The Procrastinator (Chrome extension, hacknight, 2 hours)

## What this is
A Chrome extension called **The Procrastinator**, the anti-Grammarly. On school sites (Canvas, Gradescope, etc.) it detects you're being productive and fixes that: a YouTube Shorts-style feed takes over the screen, the close button dodges the cursor, and a scripted chatbot ("Procrastibot") talks you out of studying. The extension popup shows "Productivity Prevented Today."

It's an impractical-inventions hackathon project. The goal is a funny, reliable demo, not production quality. Speed beats polish. Full plan is in `README.md`.

## HARD RULES (read first)
- **Do NOT commit, push, open PRs, or publish anything.** No `git commit`, `git push`, `gh` commands, or Web Store submission. The user does all git and publishing themselves.
- **Only edit files the current person owns** (see ownership below). If a change is needed in someone else's file, say so instead of editing it.
- **No build step, no npm, no frameworks, no backend.** Vanilla JS + CSS, Manifest V3, loaded unpacked.
- **Don't add dependencies or tooling** unless asked. If something seems to need one, find a plain-JS way.
- **Don't scrape Instagram or download copyrighted videos.** Video comes from YouTube embeds (or 2 tiny local fallback clips).
- Keep changes small and runnable. After every change, the extension must still load with no errors.

## Stack
Chrome Extension, **Manifest V3**, vanilla JS, plain CSS, `chrome.storage.local`. Sideload: `chrome://extensions` -> Developer mode -> Load unpacked -> this folder. After edits: refresh the extension card, then refresh the target tab.

## File ownership
```
manifest.json, background.js, content/main.js           -> Person A (core)
content/modules/reels.js, content/modules/chatbot.js,
assets/reels/                                            -> Person B (distractions)
content/overlay.css, popup/*, assets/icons, assets/sounds -> Person C (UI/demo)
```

## Contracts (do not break these)

### Module interface
Content scripts are listed in the manifest in this order: `reels.js`, `chatbot.js`, then `main.js`. They share a global.
```js
window.PROC = window.PROC || { modules: {} };
window.PROC.modules.reels = {
  name: "reels",
  placement: "fullscreen",     // "corner" for chatbot
  mount(root, api) {
    // root: element inside the overlay
    // api.dismiss(), api.assetUrl(path), api.openPopupWindow(url)
    return () => { /* unmount: clear timers, remove iframes */ };
  }
};
```

### Storage schema (`chrome.storage.local`)
```js
{ enabled: true, dismissals: 0, triggers: 0, minutesPrevented: 0,
  conversations: 0, lastTrigger: 0 }
```
Person A writes `triggers`, `dismissals`, `minutesPrevented`, `lastTrigger`. Person B increments `conversations`. Person C only writes `enabled`.

### Background message
```js
chrome.runtime.sendMessage({ type: "OPEN_WINDOW", url: "https://www.youtube.com/shorts" })
// background.js -> chrome.windows.create({ url, type: "popup", width: 420, height: 780 })
```

## Technical notes
- **YouTube embed URL** (iframe; `/shorts/ID` blocks iframes, `/embed/ID` works):
  `https://www.youtube.com/embed/ID?autoplay=1&mute=1&loop=1&playlist=ID&controls=0&playsinline=1`
  `mute=1` is required for autoplay; `loop=1` needs `playlist=` set to the same ID.
- Feed = vertical scroll-snap container of embeds. Use an `IntersectionObserver` to set `iframe.src` only for the visible slide and clear it when it leaves. Never load all iframes at once.
- **Canvas may block iframes via CSP.** If so, fall back to `api.openPopupWindow(...)` and/or 2 local `<video muted loop playsinline>` clips.
- Canvas is a single-page app: guard against double-mounting (`if (document.getElementById('proc-host')) return;`).
- Overlay host: `position:fixed; inset:0; z-index:2147483647`. Shadow DOM is nice-to-have, not required.
- MV3 forbids inline scripts in `popup.html`. Use an external `popup.js`.
- Test without Canvas login: `test.html` served with `python3 -m http.server 8000`. Manifest matches `http://localhost/*`.
- Escalation: `delay = max(8000, 45000 * 0.7 ** dismissals)`. Dodging dismiss button: runs away on attempts 1 and 2, closes on attempt 3. Demo mode: press `Shift+P` three times for a 3-second delay.

## Cut list (if short on time)
Achievements and sounds -> tab-title keyword trigger -> fake procrastination score -> escalation (fixed 15s) -> real-feed spikes.
**Never cut:** extension loads, overlay with video, dodging dismiss button, popup counter, scripted chatbot.

## Definition of done
Loads unpacked with no errors; overlay appears on Canvas after the delay and plays a Short; dismiss button dodges twice then closes; Procrastibot replies to chips; popup shows a live-updating counter.

---

# Kickoff prompts (copy-paste one per person into Claude Code)

## Person A: core engine
> Read CLAUDE.md. I'm Person A. Create `manifest.json` (MV3, storage permission, background service worker, popup action, content script with matches for instructure.com, bcourses.berkeley.edu, gradescope.com, docs.google.com, http://localhost/*, loading modules/reels.js, modules/chatbot.js, then main.js, plus overlay.css, with web_accessible_resources for assets/*), `background.js` (handle OPEN_WINDOW via chrome.windows.create), and `content/main.js`. First goal: a full-screen overlay div that shows "YOU SHOULD BE STUDYING" with a close button, guarded against double-mounting. Then add: trigger timer with the escalation formula, dodging dismiss button, storage stats, support for `placement: "corner"` modules, mount the chatbot after final dismiss, tab-title keyword trigger, and Shift+P x3 demo mode. Create a `test.html` for localhost testing. Only edit my files. Do not commit or push.

## Person B: distractions
> Read CLAUDE.md. I'm Person B. Create `content/modules/reels.js` and `content/modules/chatbot.js` following the module interface exactly. Start with stubs that render placeholders. Then build reels: a phone-shaped vertical scroll-snap feed of YouTube embeds from a hardcoded `IDS` array (I'll fill in IDs), using an IntersectionObserver to set/clear iframe src for the visible slide, with a fake "Shorts" header and like/comment/share rail. Add a fallback that renders local muted looping clips and calls `api.openPopupWindow`. Then the chatbot: corner bubble with message list, input, typing indicator, 3 quick-reply chips ("I have a midterm", "I'm so stressed", "Just 10 more minutes"), and a keyword-based scripted brain that playfully convinces the user not to study (harmless, no insults), incrementing `conversations` in chrome.storage.local on first message. Only edit my files. Do not commit or push.

## Person C: UI and demo
> Read CLAUDE.md. I'm Person C. Create `popup/popup.html`, `popup/popup.css`, `popup/popup.js` (no inline scripts), and `content/overlay.css`. The popup reads chrome.storage.local and live-updates via chrome.storage.onChanged to show "Productivity Prevented Today: N min", Triggers, Dismissals, Conversations Had, a fake Procrastination Score (triggers*12 + dismissals*5, capped at 100) with a progress bar, and an on/off toggle that writes `enabled`. overlay.css: dark Shorts-style look, fade-in, shake animation for dismiss attempts, chat bubble styles, typing indicator, bot avatar and online dot. Then fake achievements in the popup. Generate simple placeholder icons (16/48/128 PNG) if possible. Only edit my files. Do not commit or push.