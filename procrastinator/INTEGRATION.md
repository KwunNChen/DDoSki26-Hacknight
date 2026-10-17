# Person A integration notes

## Stub files (overwrite on merge)
These exist only so this folder loads unpacked on its own. Replace them with the real versions:
- `content/modules/reels.js`, `content/modules/chatbot.js` -> Person B
- `content/overlay.css`, `popup/popup.html`, `popup/popup.js` -> Person C

Once C has `assets/icons/16.png`, `48.png` and `128.png`, Person A adds an `"icons"` block to `manifest.json`.

## For Person B (modules)
- `api.dismiss()`: from a **fullscreen** module it counts as one dismiss attempt (the button dodges on attempts 1 and 2 and closes on 3). From a **corner** module it removes the corner box.
- `api.assetUrl(path)` and `api.openPopupWindow(url)` work as in CLAUDE.md. `openPopupWindow` returns a Promise.
- Extra fields: `api.placement`, `api.reason` (`"trigger"` or `"dismissed"`), and `api.greeting` (`"Leaving already?"` when the chatbot mounts after a dismiss). The chatbot can use the greeting as its first line.
- The chatbot mounts once per page, after the first overlay is fully dismissed.
- If `mount()` throws, main.js logs it and shows the fallback "YOU SHOULD BE STUDYING" screen instead.

## For Person C (overlay.css hooks)
| Selector | What it is |
|---|---|
| `#proc-host` (also has `.proc-host .proc-fade-in`) | full-screen overlay. Position and z-index are set inline |
| `#proc-host.proc-shake` | added for about 600ms on each dodge. Put your shake animation here |
| `#proc-host .proc-stage` | flex container where the reels module mounts |
| `.proc-module`, `.proc-module-reels`, `.proc-module-chatbot` | each module's root |
| `#proc-host .proc-dismiss` | the dodging close button. **Don't set position/top/left in CSS**: main.js moves it inline |
| `.proc-dismiss.proc-dismiss-tired` | after 2 dodges; the label becomes "✕ Close (fine)" |
| `#proc-host .proc-taunt` (+ `.proc-show`) | the "Nope." / "Nice try." text |
| `#proc-host .proc-fallback` (h1, p) | shown when no reels module is loaded |
| `#proc-corner` (`.proc-corner`) | fixed bottom-right box for the chatbot |
| `.proc-toast` | small bottom-center toast (demo mode) |
| `.proc-warning` (+ `.proc-warning-count`, `small`) | heads-up banner shown 4s (1.5s in demo mode) before each overlay, with a countdown number |

main.js injects zero-specificity `:where()` defaults, so any rule in overlay.css wins over them.

## Testing
- `python -m http.server 8000` in this folder, then open `http://localhost:8000/test.html`
- `?standalone=1` runs the scripts without the extension (fake `chrome.*` from `dev/chrome-shim.js`)
- Shift+P three times: 3-second trigger (demo mode). Escape counts as a dismiss attempt.
- First trigger is 45s, or 22.5s if the title or URL has assignment/due/exam/midterm/quiz/homework. Each dismissal multiplies the delay by 0.7, down to a minimum of 8s.
