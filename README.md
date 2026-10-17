# The PROcrastinator

**The anti-Grammarly.** A Chrome extension that notices you being productive on your school sites and fixes that.

Built for an impractical-inventions hackathon. It is intentionally useless.

## What it does

When you've been on a school page for a while:

1. A banner warns you: **"Productivity detected. Procrastination incoming."**
2. A full-screen overlay takes over, showing one of two things at random (50/50):
   - **YouTube Shorts feed** in a phone-style frame, with auto-advance every 10 seconds, plus a **Brainrot Clicker** game on a second tab.
   - **Brainrot Snake**, where the apples are Italian brainrot characters.
3. The **close button runs away from your cursor** twice, then finally lets you out.
4. **Procrastibot**, a scripted chatbot, pops up in the corner and talks you out of working.
5. You get **10 page clicks of grace** before it can come back. After that it returns, faster each time.

The toolbar popup shows **Productivity Prevented Today**, plus triggers, dismissals, conversations had, a Procrastination Score and an on/off switch.

## Where it runs

`*.instructure.com` (Canvas), `bcourses.berkeley.edu`, `*.gradescope.com`, `*.pensive.com`, `docs.google.com`, and `localhost` / `127.0.0.1` for testing.

## Install (load unpacked)

1. Clone this repo.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and select the **`procrastinator`** folder (the one containing `manifest.json`).
4. Open a Canvas, Gradescope, bCourses or Pensive page.

After changing any code, click the refresh icon on the extension's card, then reload the tab. Chrome does not update tabs that are already open.

## Try it quickly

- **Demo mode:** press **Shift+P three times**. The banner appears at 2.5s and the overlay at 5s. It skips the grace period.
- **Normal timing:** the first popup comes after 45s, or 22.5s if the tab title or URL contains a word like *assignment, due, exam, midterm, final, quiz* or *homework*. Each dismissal multiplies the delay by 0.7, down to a minimum of 8s.
- **Escape** counts as a close attempt, so it dodges too.

## Controls

| Where | Controls |
|---|---|
| Snake | Arrow keys or WASD (or swipe). Space or Enter restarts after a game over. Walls wrap around. |
| Shorts feed | Scroll, the up/down buttons, or wait for auto-advance. |
| Clicker | Tap the mascot to earn points and buy upgrades. Progress is saved. |
| Procrastibot | Use the quick-reply chips or type a message. |

## Test without a school login

From inside the `procrastinator` folder:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000/test.html>. Adding `?standalone=1` runs the scripts without the extension installed, using a fake `chrome.*` API from `dev/chrome-shim.js`.

To force a specific game from the DevTools console (with the extension's context selected): `PROC.core.trigger("snake")` or `PROC.core.trigger("reels")`.

## How it's built

Chrome Extension, **Manifest V3**, vanilla JavaScript and CSS. No framework, no npm, no build step, no backend. The only storage is `chrome.storage.local`.

```
procrastinator/
  manifest.json          MV3 config, permissions, site list
  background.js          service worker (popup-window fallback, default stats)
  content/
    main.js              core engine: timer, banner, overlay, dodge button, grace period
    overlay.css          overlay and chatbot styling
    modules/
      reels.js           YouTube Shorts feed + Brainrot Clicker
      snake.js           Brainrot Snake (HTML5 canvas)
      chatbot.js         Procrastibot
  popup/                 toolbar popup (HTML, CSS, JS)
  assets/                icons and clicker images
  test.html, dev/        local test page and fake chrome API
  INTEGRATION.md         notes on the module contract and CSS hooks
```

Each distraction is a module that registers itself on a shared global (`window.PROC.modules`) with a `placement` of `fullscreen` or `corner`. The engine mounts one random fullscreen module per popup and falls back to another if one fails to mount. See `procrastinator/INTEGRATION.md` for details.

## Team

- **Core engine:** triggers, escalation, banner, overlay, dodging close button, grace period, snake, manifest.
- **Distractions:** YouTube Shorts feed, brainrot clicker, Procrastibot.
- **UI and demo:** popup, overlay styling, icons.

## Troubleshooting

- **Nothing happens on a page:** reload the extension on `chrome://extensions`, then reload the tab. Open DevTools (F12) and look for `[Procrastinator] loaded on ...` in the Console. If it's missing, the extension isn't running on that page.
- **Reels don't open:** check the Console for a red `module "reels" failed to mount` error. Pull the latest code and reload the extension.
- **Wrong folder loaded:** on the extension's **Details** page, the Source path must end in `procrastinator`.
