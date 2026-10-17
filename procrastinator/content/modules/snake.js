// Brainrot Snake (Person A). A fullscreen module: the snake eats Italian-brainrot "apples".
// No assets, no network: everything is drawn on one <canvas>.
(function registerSnakeModule() {
  "use strict";

  const proc = (window.PROC = window.PROC || {});
  proc.modules = proc.modules || {};

  const COLS = 20;
  const ROWS = 20;
  const CELL = 24;
  const SIZE = COLS * CELL;
  const START_STEP_MS = 125;
  const MIN_STEP_MS = 62;
  const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

  // The "apples". Name text only, no copyrighted art.
  const BRAINROT = [
    { emoji: "🥁", name: "Tung Tung Tung Sahur" },
    { emoji: "🐊", name: "Bombardiro Crocodilo" },
    { emoji: "🦈", name: "Tralalero Tralala" },
    { emoji: "☕", name: "Cappuccino Assassino" },
    { emoji: "🍌", name: "Chimpanzini Bananini" },
    { emoji: "🚽", name: "Skibidi Toilet" },
    { emoji: "🌵", name: "Lirili Larila" },
    { emoji: "💃", name: "Ballerina Cappuccina" },
    { emoji: "🌳", name: "Brr Brr Patapim" },
    { emoji: "🗿", name: "Sigma Moai" }
  ];
  const COMBO_LINES = ["NO CAP", "LOCKED IN", "AURA +1000", "CERTIFIED BRAINROT", "W RIZZ", "UNSTOPPABLE"];
  const DEATH_LINES = ["SKILL ISSUE", "NOT THE SNAKE 😭", "L + RATIO", "YOU FELL OFF", "COOKED."];

  const STYLES = `
    .proc-snake { display:flex; flex-direction:column; align-items:center; gap:10px; width:100%;
      color:#fff; font-family:system-ui,-apple-system,"Segoe UI",sans-serif; user-select:none; }
    .proc-snake__hud { display:flex; justify-content:space-between; align-items:center; gap:12px;
      width:min(480px,86vw,68vh); font-weight:800; letter-spacing:.04em; font-size:13px; }
    .proc-snake__title { color:#c7ff6b; }
    .proc-snake__score { color:#fff; font-variant-numeric:tabular-nums; }
    .proc-snake__ticker { min-height:20px; width:min(480px,86vw,68vh); text-align:center; font-size:13px;
      font-weight:700; color:#c3a7fa; }
    .proc-snake__board { position:relative; width:min(480px,86vw,68vh); aspect-ratio:1; border-radius:18px;
      overflow:hidden; border:2px solid #c3a7fa66; box-shadow:0 0 40px #c3a7fa33, 0 24px 80px #000a; background:#0b0814; }
    .proc-snake__canvas { display:block; width:100%; height:100%; touch-action:none; image-rendering:auto; }
    .proc-snake__screen { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center;
      justify-content:center; gap:10px; text-align:center; padding:20px; background:#0b0814e6; }
    .proc-snake__screen[hidden] { display:none; }
    .proc-snake__big { margin:0; font-size:clamp(26px,6vw,40px); font-weight:900; line-height:1.05; color:#c7ff6b; }
    .proc-snake__small { margin:0; font-size:13px; color:#d5c5eb; max-width:300px; line-height:1.45; }
    .proc-snake__go { margin-top:6px; padding:11px 20px; border:0; border-radius:999px; background:#c7ff6b;
      color:#233015; font:800 14px system-ui,sans-serif; cursor:pointer; }
    .proc-snake__go:hover { filter:brightness(1.08); }
    .proc-snake__foot { font-size:11px; color:#8d829c; }
  `;

  function el(tag, className, text) {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
  }

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  proc.modules.snake = {
    name: "snake",
    placement: "fullscreen",

    mount(root) {
      if (!root) return () => {};

      const abort = new AbortController();
      const { signal } = abort;

      // ------------------------------------------------------------ DOM
      const wrap = el("section", "proc-snake");
      wrap.setAttribute("role", "application");
      wrap.setAttribute("aria-label", "Brainrot Snake. Use the arrow keys or WASD.");
      const style = el("style", "", STYLES);

      const hud = el("div", "proc-snake__hud");
      const title = el("span", "proc-snake__title", "🐍 BRAINROT SNAKE");
      const score = el("span", "proc-snake__score", "AURA 0");
      hud.append(title, score);

      const ticker = el("div", "proc-snake__ticker", "Eat the brainrot. Touch grass later.");
      ticker.setAttribute("aria-live", "polite");

      const board = el("div", "proc-snake__board");
      const canvas = el("canvas", "proc-snake__canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d");

      const startScreen = el("div", "proc-snake__screen");
      startScreen.append(
        el("p", "proc-snake__big", "EAT THE BRAINROT"),
        el("p", "proc-snake__small", "Arrow keys, WASD or swipe. Walls wrap around. Don't bite yourself.")
      );
      const startBtn = el("button", "proc-snake__go", "Start (or press any arrow)");
      startBtn.type = "button";
      startScreen.append(startBtn);

      const overScreen = el("div", "proc-snake__screen");
      overScreen.hidden = true;
      const overTitle = el("p", "proc-snake__big", "SKILL ISSUE");
      const overText = el("p", "proc-snake__small", "");
      const overBtn = el("button", "proc-snake__go", "Run it back (Space)");
      overBtn.type = "button";
      overScreen.append(overTitle, overText, overBtn);

      board.append(canvas, startScreen, overScreen);
      const foot = el("div", "proc-snake__foot", "homework can wait. the snake cannot.");
      wrap.append(style, hud, ticker, board, foot);
      root.append(wrap);

      // ---------------------------------------------------------- state
      let snake, dir, queue, apple, lastChar, eaten, stepMs, acc, started, dead;
      let popups = [];
      let shake = 0;
      let flash = 0;
      let best = 0;
      let last = performance.now();
      let raf = 0;

      function randomFreeCell() {
        for (let i = 0; i < 400; i++) {
          const c = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
          if (!snake.some((s) => s.x === c.x && s.y === c.y)) return c;
        }
        return { x: 0, y: 0 };
      }

      function spawnApple() {
        let char;
        do { char = pick(BRAINROT); } while (char === lastChar && BRAINROT.length > 1);
        lastChar = char;
        apple = { ...randomFreeCell(), char };
      }

      function reset() {
        snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
        dir = { x: 1, y: 0 };
        queue = [];
        eaten = 0;
        stepMs = START_STEP_MS;
        acc = 0;
        started = false;
        dead = false;
        popups = [];
        lastChar = null;
        spawnApple();
        score.textContent = "AURA 0";
        ticker.textContent = "Eat the brainrot. Touch grass later.";
        overScreen.hidden = true;
        startScreen.hidden = false;
      }

      function turn(dx, dy) {
        if (dead) return;
        if (!started) { started = true; startScreen.hidden = true; } // any direction starts the game
        const ref = queue.length ? queue[queue.length - 1] : dir;
        if ((dx === -ref.x && dy === -ref.y) || (dx === ref.x && dy === ref.y)) return; // no U-turn, no repeats
        if (queue.length < 2) queue.push({ x: dx, y: dy });
      }

      function die() {
        dead = true;
        shake = 0.5;
        best = Math.max(best, eaten);
        overTitle.textContent = pick(DEATH_LINES);
        overText.textContent = `You ate ${eaten} brainrot${eaten === 1 ? "" : "s"} for ${eaten * 100} aura. Best: ${best * 100}.`;
        overScreen.hidden = false;
      }

      function step() {
        const next = queue.shift();
        if (next) dir = next;
        const head = {
          x: (snake[0].x + dir.x + COLS) % COLS,
          y: (snake[0].y + dir.y + ROWS) % ROWS
        };
        const eating = head.x === apple.x && head.y === apple.y;
        const body = eating ? snake : snake.slice(0, -1); // the tail moves out of the way unless we grow
        if (body.some((s) => s.x === head.x && s.y === head.y)) { die(); return; }

        snake.unshift(head);
        if (!eating) { snake.pop(); return; }

        eaten++;
        score.textContent = `AURA ${eaten * 100}`;
        ticker.textContent = `ate ${apple.char.name} ${apple.char.emoji}`;
        popups.push({
          x: head.x * CELL + CELL / 2, y: head.y * CELL, age: 0,
          text: eaten % 5 === 0 ? pick(COMBO_LINES) : "+100"
        });
        shake = 0.22;
        flash = 0.35;
        stepMs = Math.max(MIN_STEP_MS, stepMs - 4);
        spawnApple();
      }

      // --------------------------------------------------------- drawing
      function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      }

      function draw(now, dt) {
        ctx.save();
        if (shake > 0) ctx.translate((Math.random() - 0.5) * 8 * shake * 4, (Math.random() - 0.5) * 8 * shake * 4);

        ctx.fillStyle = "#0b0814";
        ctx.fillRect(-10, -10, SIZE + 20, SIZE + 20);
        if (flash > 0) {
          ctx.fillStyle = `hsla(${(now / 4) % 360},90%,60%,${flash * 0.35})`;
          ctx.fillRect(0, 0, SIZE, SIZE);
        }
        ctx.strokeStyle = "#ffffff0b";
        ctx.lineWidth = 1;
        for (let i = 1; i < COLS; i++) {
          ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, SIZE); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(SIZE, i * CELL); ctx.stroke();
        }

        // Apple: bobbing emoji with a soft glow.
        const bob = Math.sin(now / 180) * 2;
        ctx.shadowColor = "#c3a7fa";
        ctx.shadowBlur = 16;
        ctx.font = `${CELL - 2}px ${EMOJI_FONT}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(apple.char.emoji, apple.x * CELL + CELL / 2, apple.y * CELL + CELL / 2 + bob);
        ctx.shadowBlur = 0;

        // Snake: rainbow body, moai head.
        for (let i = snake.length - 1; i >= 1; i--) {
          const s = snake[i];
          ctx.fillStyle = `hsl(${(now / 12 + i * 14) % 360},85%,58%)`;
          roundRect(s.x * CELL + 2, s.y * CELL + 2, CELL - 4, CELL - 4, 7);
          ctx.fill();
        }
        const h = snake[0];
        ctx.font = `${CELL}px ${EMOJI_FONT}`;
        ctx.fillText(dead ? "💀" : "🗿", h.x * CELL + CELL / 2, h.y * CELL + CELL / 2 + 1);

        // Floating "+100" popups.
        ctx.font = `900 15px system-ui, sans-serif`;
        for (const p of popups) {
          const a = Math.max(0, 1 - p.age / 0.9);
          ctx.fillStyle = `rgba(199,255,107,${a})`;
          ctx.strokeStyle = `rgba(0,0,0,${a})`;
          ctx.lineWidth = 3;
          const py = p.y - p.age * 44;
          ctx.strokeText(p.text, p.x, py);
          ctx.fillText(p.text, p.x, py);
        }
        ctx.restore();

        shake = Math.max(0, shake - dt * 1.6);
        flash = Math.max(0, flash - dt * 1.4);
        for (const p of popups) p.age += dt;
        popups = popups.filter((p) => p.age < 0.9);
      }

      function frame(now) {
        raf = requestAnimationFrame(frame);
        const dt = Math.min(0.1, (now - last) / 1000); // cap so a background tab doesn't fast-forward the snake
        last = now;
        if (started && !dead) {
          acc += dt * 1000;
          while (acc >= stepMs && !dead) { acc -= stepMs; step(); }
        }
        draw(now, dt);
      }

      // --------------------------------------------------------- input
      const KEYS = {
        ArrowUp: [0, -1], KeyW: [0, -1],
        ArrowDown: [0, 1], KeyS: [0, 1],
        ArrowLeft: [-1, 0], KeyA: [-1, 0],
        ArrowRight: [1, 0], KeyD: [1, 0]
      };

      window.addEventListener("keydown", (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const t = e.target;
        if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
        const d = KEYS[e.code];
        if (d) {
          e.preventDefault();
          e.stopPropagation(); // keep the host page (Canvas, Gradescope) from reacting
          turn(d[0], d[1]);
        } else if ((e.code === "Space" || e.code === "Enter") && dead) {
          e.preventDefault();
          e.stopPropagation();
          reset();
        }
      }, { capture: true, signal });

      // Swipe on the board.
      let sx = 0, sy = 0, swiping = false;
      canvas.addEventListener("pointerdown", (e) => { sx = e.clientX; sy = e.clientY; swiping = true; }, { signal });
      canvas.addEventListener("pointerup", (e) => {
        if (!swiping) return;
        swiping = false;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
        if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0);
        else turn(0, dy > 0 ? 1 : -1);
      }, { signal });

      startBtn.addEventListener("click", () => turn(1, 0), { signal });
      overBtn.addEventListener("click", () => reset(), { signal });

      reset();
      raf = requestAnimationFrame(frame);

      return () => {
        abort.abort();
        cancelAnimationFrame(raf);
        wrap.remove();
      };
    }
  };
})();
