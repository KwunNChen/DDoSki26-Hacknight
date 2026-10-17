(function registerReelsModule() {
  "use strict";

  const proc = (window.PROC = window.PROC || {});
  proc.modules = proc.modules || {};

  // These are real Shorts, embedded through YouTube's player. Pass `youtubeShorts`
  // in the module API to replace this small demo feed with other Shorts IDs/URLs.
  const DEFAULT_SHORTS = [
    {
      id: "Eemry3tRxEY",
      creator: "LastMinit",
      title: "Tung Tung Tung Sahur 😳 #shorts",
    },
    {
      id: "_5Q2ypx66iQ",
      creator: "Torajo Kids",
      title: "Tung Tung Tung Sahur dancing #shorts",
    },
    {
      id: "f36FrAUn-GU",
      creator: "FASH",
      title: "Story Tung Tung Tung Sahur (Animation) #brainrot",
    },
    {
      id: "zDh90Tn37kI",
      creator: "ZoharD19",
      title: "Bombardiro Crocodilo 🔥💥 #shorts",
    },
    {
      id: "loHchY6b55o",
      creator: "Funny Short Creator",
      title: "Brr Brr Patapim sings #shorts",
    },
    {
      id: "iU5auRRwQtA",
      creator: "MrStar Shorts",
      title: "Brr Brr Patapim Catch #shorts",
    },
    {
      id: "nhnQvKf7ewc",
      creator: "Laughing Toons",
      title: "Tralalero Tralala trend animation #shorts",
    },
    {
      id: "4nJ7O6MaU0s",
      creator: "Brainrot Stories",
      title: "Bombombini Gusini backstory #shorts",
    },
    {
      id: "UfbMRZfRuMo",
      creator: "Team Lily",
      title: "Chimpanzini Bananini in 2099 #shorts",
    },
    {
      id: "1rd54nS_tLA",
      creator: "TimeRealm",
      title: "Italian Brainrot Memes: Before & After #shorts",
    },
    {
      id: "etNb2M2QBzI",
      creator: "Cute animals",
      title: "Funny animals #shorts",
    },
    {
      id: "1UgJI6O8T2U",
      creator: "Dancing Cat",
      title: "Funny cat videos | cute cats | Try not to laugh",
    },
    {
      id: "N88hXQ4KOOs",
      creator: "Pawfect Laughs",
      title: "Ranking Funny Dog Videos! #shorts",
    },
  ];
  const VIDEO_ID_PATTERN = /^[\w-]{11}$/;
  const YOUTUBE_PLAYER_ORIGIN = "https://www.youtube.com";
  const YOUTUBE_WIDGET_CHANNEL = "widget";
  let playerSequence = 0;
  const REELS_STYLES = `
    #proc-host .proc-module-reels { display:flex; width:100%; height:100%; min-width:0; min-height:0; align-items:center; justify-content:center; }
    #proc-host .proc-reels { display:flex; width:100%; height:100%; min-width:0; min-height:0; align-items:center; justify-content:center; color:#fff; font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    #proc-host .proc-reels__device { position:relative; width:min(100%,430px); height:min(100%,880px); padding:8px; border:2px solid #51475d; border-radius:48px; background:linear-gradient(145deg,#322b39,#09080d 42%,#292332); box-shadow:0 28px 90px #000a,inset 0 0 0 1px #ffffff24; }
    #proc-host .proc-reels__shell { position:relative; display:flex; flex-direction:column; width:100%; height:100%; overflow:hidden; border:1px solid #ffffff1f; border-radius:38px; background:#08090d; box-shadow:inset 0 0 24px #0008; }
    #proc-host .proc-reels__notch { position:absolute; z-index:10; top:7px; left:50%; width:84px; height:20px; transform:translateX(-50%); border-radius:999px; background:#050507; box-shadow:inset 0 1px 2px #ffffff1a; pointer-events:none; }
    #proc-host .proc-reels__topbar { position:relative; z-index:5; display:flex; flex-shrink:0; align-items:center; justify-content:space-between; gap:7px; min-height:74px; padding:26px 12px 8px; background:#14111a; border-bottom:1px solid #ffffff12; }
    #proc-host .proc-reels__brand { display:flex; align-items:center; gap:6px; margin:0; color:#fff; font-size:12px; font-weight:900; letter-spacing:.02em; white-space:nowrap; }
    #proc-host .proc-reels__brand-mark { display:grid; width:21px; height:16px; place-items:center; border-radius:5px; background:#ff0033; color:#fff; font-size:9px; }
    #proc-host .proc-reels__tabs { display:flex; gap:3px; padding:3px; border:1px solid #ffffff14; border-radius:11px; background:#09080d; }
    #proc-host .proc-reels__tab,#proc-host .proc-reels__audio { min-height:32px; padding:0 9px; border:0; border-radius:8px; background:transparent; color:#a79bb5; cursor:pointer; font:800 10px/1 system-ui,sans-serif; white-space:nowrap; }
    #proc-host .proc-reels__tab[aria-pressed="true"] { background:#c3a7fa; color:#24172e; }
    #proc-host .proc-reels__audio { border:1px solid #ffffff20; color:#fff; }
    #proc-host .proc-reels__audio[aria-pressed="true"] { border-color:#c7ff6b99; color:#c7ff6b; }
    #proc-host .proc-reels__autonext { position:relative; z-index:4; height:3px; flex:0 0 3px; background:#ffffff16; overflow:hidden; }
    #proc-host .proc-reels__autonext-fill { width:100%; height:100%; transform:scaleX(0); transform-origin:left; background:#c7ff6b; }
    #proc-host .proc-reels__autonext-fill.is-running { animation:proc-autonext 10s linear forwards; }
    #proc-host .proc-reels__content { position:relative; flex:1; min-height:0; overflow:hidden; background:#08090d; }
    #proc-host .proc-reels__feed { display:flex; width:100%; height:100%; flex-direction:column; overflow-x:hidden; overflow-y:auto; overscroll-behavior-y:contain; scroll-snap-type:y mandatory; scrollbar-width:none; -webkit-overflow-scrolling:touch; touch-action:pan-y; }
    #proc-host .proc-reels__feed::-webkit-scrollbar { display:none; }
    #proc-host .proc-reels__card { position:relative; width:100%; height:100%; min-height:100%; flex:0 0 100%; overflow:hidden; scroll-snap-align:start; scroll-snap-stop:always; background:#08090d; }
    #proc-host .proc-reels__player { position:absolute; inset:0; display:block; width:100%; height:100%; border:0; background:#08090d; }
    #proc-host .proc-reels__caption { position:absolute; z-index:3; right:60px; bottom:32px; left:12px; display:grid; gap:5px; padding:40px 8px 3px; background:linear-gradient(0deg,#000d,transparent); text-shadow:0 2px 10px #000; pointer-events:none; }
    #proc-host .proc-reels__creator,#proc-host .proc-reels__description { margin:0; }
    #proc-host .proc-reels__creator { font-size:12px; font-weight:850; }
    #proc-host .proc-reels__description { font-size:12px; line-height:1.35; }
    #proc-host .proc-reels__watch-link { justify-self:start; padding:5px 8px; border:1px solid #ffffff38; border-radius:7px; background:#0f0f14bb; color:#fff; font:700 10px/1.3 system-ui,sans-serif; text-decoration:none; pointer-events:auto; }
    #proc-host .proc-reels__navigation { position:absolute; z-index:6; top:50%; right:9px; display:flex; flex-direction:column; gap:9px; transform:translateY(-50%); }
    #proc-host .proc-reels__nav-button { display:grid; width:35px; height:35px; place-items:center; border:1px solid #ffffff52; border-radius:50%; background:#0a0a10a8; color:#fff; cursor:pointer; font:700 16px/1 system-ui,sans-serif; backdrop-filter:blur(8px); }
    #proc-host .proc-clicker { position:absolute; inset:0; display:flex; flex-direction:column; gap:10px; overflow-y:auto; padding:12px 13px 22px; background:radial-gradient(ellipse at 50% 32%,#352247 0%,#171021 42%,#0b0910 100%); scrollbar-width:thin; scrollbar-color:#625075 transparent; }
    #proc-host .proc-clicker,#proc-host .proc-clicker * { cursor:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 16 16' shape-rendering='crispEdges'%3E%3Cpath d='M2 1h4v8h2V5h3v3h3v3h-2v4H7V9H5V7H3V4H2z' fill='%23f5f2ff' stroke='%23140b1f' stroke-width='1.5'/%3E%3Cpath d='M8 10h2v3H8z' fill='%23c7ff6b'/%3E%3C/svg%3E") 2 1,pointer!important; }
    #proc-host .proc-clicker__wallet { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:9px 11px; border:1px solid #c7ff6b55; border-radius:13px; background:#171c12dd; box-shadow:0 0 18px #c7ff6b12; }
    #proc-host .proc-clicker__bank { color:#e4ffb5; font-size:20px; font-weight:950; font-variant-numeric:tabular-nums; }
    #proc-host .proc-clicker__rate { color:#9bdb78; font-size:10px; font-weight:800; text-align:right; }
    #proc-host .proc-clicker__main { position:relative; display:flex; min-height:246px; flex-direction:column; align-items:center; justify-content:center; overflow:hidden; border:1px solid #ffffff1c; border-radius:17px; background:radial-gradient(circle at 50% 43%,#6e3e7a55,#271a3544 48%,#100d18 76%); }
    #proc-host .proc-clicker__rank { position:absolute; top:10px; color:#dbbfef; font-size:9px; font-weight:900; letter-spacing:.13em; }
    #proc-host .proc-clicker__mascot { position:relative; display:grid; width:205px; height:190px; place-items:center; padding:0; border:0; background:transparent; }
    #proc-host .proc-clicker__mascot img { display:block; width:100%; height:100%; object-fit:contain; image-rendering:pixelated; filter:drop-shadow(0 10px 4px #0008); pointer-events:none; }
    #proc-host .proc-clicker__mascot.is-bonking { animation:proc-clicker-bonk 230ms cubic-bezier(.2,.8,.2,1); }
    #proc-host .proc-clicker__hint { margin:2px 0 0; color:#e2d2f0; font-size:11px; font-weight:800; }
    #proc-host .proc-clicker__streak { color:#c7ff6b; font-size:9px; font-weight:900; letter-spacing:.08em; }
    #proc-host .proc-clicker__shop-head { display:flex; align-items:center; justify-content:space-between; gap:8px; }
    #proc-host .proc-clicker__shop-title { margin:0; color:#e3d4f3; font-size:11px; font-weight:950; letter-spacing:.09em; }
    #proc-host .proc-clicker__sound { padding:5px 8px; border:1px solid #ffffff20; border-radius:8px; background:#211a2b; color:#ddd0eb; font:800 9px system-ui,sans-serif; }
    #proc-host .proc-clicker__upgrades { display:grid; gap:6px; }
    #proc-host .proc-clicker__upgrade { display:grid; grid-template-columns:34px 1fr auto; align-items:center; gap:8px; width:100%; min-height:54px; padding:7px 9px; border:1px solid #ffffff1b; border-radius:11px; background:linear-gradient(100deg,#211a2c,#14101b); color:#f7f2ff; text-align:left; }
    #proc-host .proc-clicker__upgrade:disabled { opacity:.48; }
    #proc-host .proc-clicker__icon { display:grid; width:32px; height:32px; place-items:center; border:1px solid #ffffff20; border-radius:9px; background:#3b2b48; font-size:20px; }
    #proc-host .proc-clicker__upgrade-name { display:block; font-size:10px; font-weight:900; }
    #proc-host .proc-clicker__upgrade-desc { display:block; margin-top:2px; color:#a99bb5; font-size:9px; }
    #proc-host .proc-clicker__cost { color:#d8fba6; font-size:10px; font-weight:900; text-align:right; white-space:nowrap; }
    #proc-host .proc-clicker__roster { display:grid; grid-template-columns:1fr 94px; align-items:center; gap:8px; padding:7px 9px; border:1px dashed #b89bd35c; border-radius:11px; background:#191322; }
    #proc-host .proc-clicker__roster p { margin:0; color:#c4b3d4; font-size:9px; line-height:1.35; }
    #proc-host .proc-clicker__roster strong { color:#f1d5ff; }
    #proc-host .proc-clicker__roster img { width:94px; height:66px; object-fit:cover; object-position:center; image-rendering:pixelated; }
    #proc-host .proc-clicker__rebirth { padding:9px; border:1px solid #ffba5555; border-radius:10px; background:#392619; color:#ffd995; font:900 10px system-ui,sans-serif; }
    #proc-host .proc-reels__home { position:relative; z-index:8; display:flex; flex:0 0 16px; align-items:center; justify-content:center; background:#08090d; }
    #proc-host .proc-reels__home::after { width:92px; height:4px; border-radius:4px; background:#ffffffd9; content:""; }
    @keyframes proc-autonext { to { transform:scaleX(1); } }
    @keyframes proc-clicker-bonk { 0% {transform:scale(1)} 34% {transform:scale(1.12)} 67% {transform:scale(.94)} 100% {transform:scale(1)} }
    @media(max-width:480px) { #proc-host .proc-reels__device { width:100%; height:100%; padding:0; border:0; border-radius:0; background:#08090d; box-shadow:none; } #proc-host .proc-reels__shell { border:0; border-radius:0; } #proc-host .proc-reels__topbar { padding-right:120px; } }
    @media(max-height:700px) { #proc-host .proc-reels__device { max-height:calc(100% - 4px); } #proc-host .proc-clicker { gap:6px; padding:8px 10px 18px; } #proc-host .proc-clicker__main { min-height:205px; } #proc-host .proc-clicker__mascot { width:170px; height:160px; } }
    @media(prefers-reduced-motion:reduce) { #proc-host .proc-reels__autonext-fill.is-running,#proc-host .proc-clicker__mascot.is-bonking { animation:none; } }
  `;

  function makeElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function videoIdFrom(value) {
    if (typeof value !== "string") return "";
    const candidate = value.trim();
    if (VIDEO_ID_PATTERN.test(candidate)) return candidate;

    try {
      const url = new URL(candidate);
      const host = url.hostname.toLowerCase();
      if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] || "";
      if (!host.endsWith("youtube.com")) return "";
      if (url.pathname === "/watch") return url.searchParams.get("v") || "";
      const parts = url.pathname.split("/").filter(Boolean);
      const videoRoute = parts.findIndex((part) => ["shorts", "embed", "live"].includes(part));
      return videoRoute >= 0 ? parts[videoRoute + 1] || "" : "";
    } catch (_error) {
      return "";
    }
  }

  function shortsFor(api) {
    const configured = Array.isArray(api.youtubeShorts)
      ? api.youtubeShorts
      : Array.isArray(proc.youtubeShorts)
        ? proc.youtubeShorts
        : DEFAULT_SHORTS;

    const shorts = configured
      .map((item) => {
        const source = typeof item === "string" ? { url: item } : item || {};
        const id = videoIdFrom(source.id || source.url || source.videoUrl || "");
        if (!VIDEO_ID_PATTERN.test(id)) return null;
        const durationSeconds = Number(source.durationSeconds);
        if (Number.isFinite(durationSeconds) && durationSeconds > 59) return null;

        return {
          id,
          creator: String(source.creator || source.channel || "YouTube creator"),
          title: String(source.title || "YouTube Short"),
          durationSeconds: Number.isFinite(durationSeconds) && durationSeconds > 0
            ? durationSeconds
            : null,
          url: `https://www.youtube.com/shorts/${id}`,
        };
      })
      .filter(Boolean)
      .slice(0, 20);

    const feed = shorts.length ? shorts : DEFAULT_SHORTS.slice();
    // Give every session a fresh feed order while keeping every selected Short.
    for (let index = feed.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [feed[index], feed[swapIndex]] = [feed[swapIndex], feed[index]];
    }
    return feed;
  }

  function embedUrl(short, origin, autoplay, soundEnabled) {
    const url = new URL(`/embed/${short.id}`, YOUTUBE_PLAYER_ORIGIN);
    url.searchParams.set("autoplay", autoplay ? "1" : "0");
    url.searchParams.set("controls", "1");
    url.searchParams.set("enablejsapi", "1");
    // Start muted so autoplay works; the sound button unmutes on the user's gesture.
    url.searchParams.set("mute", soundEnabled ? "0" : "1");
    // Keep every embed below a minute even when a caller supplies an unknown clip.
    url.searchParams.set("end", "59");
    url.searchParams.set("playsinline", "1");
    url.searchParams.set("rel", "0");
    if (origin && origin !== "null") url.searchParams.set("origin", origin);
    return url.href;
  }

  function sendPlayerCommand(frame, command, args = []) {
    if (!frame.contentWindow || frame.dataset.started !== "true") return;
    try {
      frame.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: command,
          args,
          id: frame.id,
          channel: YOUTUBE_WIDGET_CHANNEL,
        }),
        YOUTUBE_PLAYER_ORIGIN,
      );
    } catch (_error) {
      // The embed remains playable with its own YouTube controls if postMessage fails.
    }
  }

  function listenForPlayerReady(frame, signal, attempt = 0) {
    if (
      !frame.contentWindow
      || frame.dataset.started !== "true"
      || frame.dataset.apiReady === "true"
      || signal.aborted
      || attempt >= 12
    ) return;

    try {
      frame.contentWindow.postMessage(
        JSON.stringify({
          event: "listening",
          id: frame.id,
          channel: YOUTUBE_WIDGET_CHANNEL,
        }),
        YOUTUBE_PLAYER_ORIGIN,
      );
    } catch (_error) {
      // Retry the handshake while the YouTube player initializes.
    }
    window.setTimeout(() => listenForPlayerReady(frame, signal, attempt + 1), 250);
  }

  function startShort(entry, origin) {
    const { frame } = entry;
    if (frame.dataset.started === "true") {
      sendPlayerCommand(frame, soundEnabled ? "unMute" : "mute");
      if (soundEnabled) sendPlayerCommand(frame, "setVolume", [100]);
      sendPlayerCommand(frame, "playVideo");
      return;
    }

    frame.dataset.started = "true";
    frame.src = embedUrl(entry.short, origin, true, soundEnabled);
  }

  function unloadShort(entry) {
    const { frame } = entry;
    if (frame.dataset.started !== "true") return;
    frame.removeAttribute("src");
    delete frame.dataset.started;
    delete frame.dataset.loaded;
    delete frame.dataset.apiReady;
  }

  function makeShortCard(short, index, total, signal, api, onPlayerLoad) {
    const card = makeElement("article", "proc-reels__card");
    card.setAttribute("role", "group");
    card.setAttribute("aria-label", `Short ${index + 1} of ${total}: ${short.title}`);

    const frame = makeElement("iframe", "proc-reels__player");
    frame.id = `proc-reels-player-${++playerSequence}`;
    frame.title = `YouTube Short: ${short.title}`;
    frame.loading = index === 0 ? "eager" : "lazy";
    frame.allow = "autoplay; encrypted-media; picture-in-picture; web-share";
    frame.allowFullscreen = true;
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.addEventListener("load", () => onPlayerLoad(frame), { signal });

    const details = makeElement("div", "proc-reels__caption");
    const creator = makeElement("p", "proc-reels__creator", short.creator);
    const title = makeElement("p", "proc-reels__description", short.title);
    const link = makeElement("a", "proc-reels__watch-link", "Watch on YouTube ↗");
    link.href = short.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.addEventListener(
      "click",
      async (event) => {
        event.stopPropagation();
        if (typeof api.openPopupWindow !== "function" || link.dataset.useDirectLink === "true") return;
        event.preventDefault();
        if (link.dataset.opening === "true") return;
        link.dataset.opening = "true";
        link.setAttribute("aria-busy", "true");
        try {
          const result = await api.openPopupWindow(short.url);
          if (!result?.ok) {
            link.dataset.useDirectLink = "true";
            link.textContent = "Open on YouTube ↗";
          }
        } catch (_error) {
          link.dataset.useDirectLink = "true";
          link.textContent = "Open on YouTube ↗";
        } finally {
          delete link.dataset.opening;
          link.removeAttribute("aria-busy");
        }
      },
      { signal },
    );
    details.append(creator, title, link);

    card.append(frame, details);
    return { card, frame, short };
  }

  function mountShortsFeed(root, api, state) {
    const shorts = shortsFor(api);
    const origin = window.location.origin;
    const feed = makeElement("div", "proc-reels__feed");
    feed.setAttribute("aria-label", "YouTube Shorts feed");
    feed.tabIndex = 0;

    const entries = shorts.map((short, index) =>
      makeShortCard(short, index, shorts.length, state.signal, api, (frame) => {
        if (frame.dataset.started !== "true") return;
        if (frame.dataset.loaded === "true") return;
        frame.dataset.loaded = "true";
        listenForPlayerReady(frame, state.signal);
        if (state.activeFrame === frame) {
          window.setTimeout(() => {
            if (state.activeFrame === frame && !state.signal.aborted) {
              sendPlayerCommand(frame, state.soundEnabled ? "unMute" : "mute");
              if (state.soundEnabled) sendPlayerCommand(frame, "setVolume", [100]);
              sendPlayerCommand(frame, "playVideo");
            }
          }, 250);
        }
      }),
    );
    entries.forEach((entry) => feed.append(entry.card));

    const navigation = makeElement("nav", "proc-reels__navigation");
    navigation.setAttribute("aria-label", "Shorts feed controls");
    const previous = makeElement("button", "proc-reels__nav-button", "↑");
    previous.type = "button";
    previous.setAttribute("aria-label", "Previous Short");
    const next = makeElement("button", "proc-reels__nav-button", "↓");
    next.type = "button";
    next.setAttribute("aria-label", "Next Short");
    navigation.append(previous, next);

    function scrollTo(index) {
      const entry = entries[Math.max(0, Math.min(entries.length - 1, index))];
      if (entry) entry.card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function advanceAfterPlaybackEnd(frame) {
      const endedIndex = state.activeIndex;
      if (
        endedIndex < 0
        || endedIndex >= entries.length - 1
        || state.pendingAdvanceIndex === endedIndex
      ) return;

      state.pendingAdvanceIndex = endedIndex;
      window.setTimeout(() => {
        if (state.pendingAdvanceIndex === endedIndex) state.pendingAdvanceIndex = -1;
        if (
          state.signal.aborted
          || state.activeIndex !== endedIndex
          || state.activeFrame !== frame
        ) return;
        scrollTo(endedIndex + 1);
      }, 180);
    }

    previous.addEventListener("click", () => scrollTo(state.activeIndex - 1), {
      signal: state.signal,
    });
    next.addEventListener("click", () => scrollTo((state.activeIndex + 1) % entries.length), {
      signal: state.signal,
    });
    feed.addEventListener(
      "keydown",
      (event) => {
        const direction = event.key === "ArrowDown" || event.key === "PageDown"
          ? 1
          : event.key === "ArrowUp" || event.key === "PageUp"
            ? -1
            : 0;
        if (!direction) return;
        event.preventDefault();
        scrollTo((state.activeIndex + direction + entries.length) % entries.length);
      },
      { signal: state.signal },
    );

    function setActive(index) {
      if (index === state.activeIndex) return;
      state.activeIndex = index;
      state.activeFrame = entries[index]?.frame || null;
      state.pendingAdvanceIndex = -1;
      if (state.counter) state.counter.textContent = `${index + 1} / ${entries.length}`;
      entries.forEach((entry, entryIndex) => {
        entry.card.toggleAttribute("data-active", entryIndex === index);
        if (entryIndex === index) startShort(entry, origin, state.soundEnabled);
        else unloadShort(entry);
      });
      scheduleAutoAdvance(index);
    }

    window.addEventListener(
      "message",
      (event) => {
        const frame = state.activeFrame;
        if (
          event.origin !== YOUTUBE_PLAYER_ORIGIN
          || !frame
          || event.source !== frame.contentWindow
          || frame.dataset.started !== "true"
        ) return;

        let message;
        try {
          message = typeof event.data === "string" ? JSON.parse(event.data) : null;
        } catch (_error) {
          return;
        }
        if (!message || (message.id && message.id !== frame.id)) return;

        if (message.event === "onReady") {
          frame.dataset.apiReady = "true";
          sendPlayerCommand(frame, "addEventListener", ["onStateChange"]);
          sendPlayerCommand(frame, "addEventListener", ["onError"]);
          return;
        }

        if (message.event === "onError") {
          advanceAfterPlaybackEnd(frame);
          return;
        }

        if (message.event === "onStateChange" && Number(message.info) === 0) {
          advanceAfterPlaybackEnd(frame);
        }
      },
      { signal: state.signal },
    );

    state.entries = entries;
    if (typeof IntersectionObserver === "function") {
      state.observer = new IntersectionObserver(
        (observations) => {
          const mostVisible = observations
            .filter((observation) => observation.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (!mostVisible) return;
          const index = entries.findIndex((entry) => entry.card === mostVisible.target);
          if (index >= 0) setActive(index);
        },
        { root: feed, threshold: [0.6, 0.8, 1] },
      );
      entries.forEach((entry) => state.observer.observe(entry.card));
    } else {
      setActive(0);
    }

    root.append(feed, navigation);
    state.stopAutoAdvance = stopAutoAdvance;
    state.scheduleAutoAdvance = scheduleAutoAdvance;
    return { feed, entries };
  }

  function mountBrainrotClicker(root, api, state) {
    const panel = makeElement("section", "proc-clicker");
    panel.hidden = true;
    panel.setAttribute("aria-label", "Brainrot clicker game");
    const wallet = makeElement("div", "proc-clicker__wallet");
    const bank = makeElement("strong", "proc-clicker__bank", "0");
    const rate = makeElement("span", "proc-clicker__rate", "+0 / sec");
    wallet.append(bank, rate);

    const main = makeElement("div", "proc-clicker__main");
    const rank = makeElement("div", "proc-clicker__rank", "RANK: BRAINROT INTERN");
    const mascot = makeElement("button", "proc-clicker__mascot");
    mascot.type = "button";
    mascot.setAttribute("aria-label", "Bonk Tung Tung Sahur to earn brainrot points");
    const portrait = makeElement("img");
    portrait.src = typeof api.assetUrl === "function"
      ? api.assetUrl("assets/brainrot-clicker/tung-tung-sahur.png")
      : "assets/brainrot-clicker/tung-tung-sahur.png";
    portrait.alt = "Pixel-art Tung Tung Sahur";
    mascot.append(portrait);
    const hint = makeElement("p", "proc-clicker__hint", "TAP THE LOG. FEED THE BRAINROT.");
    const streakText = makeElement("p", "proc-clicker__streak", "STREAK 0 / 10");
    main.append(rank, mascot, hint, streakText);

    const shopHead = makeElement("div", "proc-clicker__shop-head");
    const shopTitle = makeElement("h2", "proc-clicker__shop-title", "BRAINROT UPGRADES");
    const sound = makeElement("button", "proc-clicker__sound", "🔊 SOUND ON");
    sound.type = "button";
    sound.setAttribute("aria-pressed", "true");
    shopHead.append(shopTitle, sound);

    const upgrades = [
      { id: "sticks", icon: "🪵", name: "Extra Sahur Stick", desc: "+1 point per bonk", cost: 25, click: 1, cps: 0 },
      { id: "croc", icon: "🐊", name: "Crocodilo Copter", desc: "+1 point per second", cost: 80, click: 0, cps: 1 },
      { id: "shark", icon: "🦈", name: "Tralalero Sneakers", desc: "+7 points per second", cost: 420, click: 0, cps: 7 },
      { id: "chimp", icon: "🍌", name: "Chimpanzini Clone Lab", desc: "+35 points per second", cost: 2200, click: 0, cps: 35 },
      { id: "patapim", icon: "🌳", name: "Patapim Meme Forest", desc: "+180 points per second", cost: 11000, click: 0, cps: 180 },
    ];
    const upgradeList = makeElement("div", "proc-clicker__upgrades");
    const upgradeButtons = new Map();
    upgrades.forEach((upgrade) => {
      const button = makeElement("button", "proc-clicker__upgrade");
      button.type = "button";
      const icon = makeElement("span", "proc-clicker__icon", upgrade.icon);
      const copy = makeElement("span");
      const title = makeElement("strong", "proc-clicker__upgrade-name", upgrade.name);
      const desc = makeElement("small", "proc-clicker__upgrade-desc", upgrade.desc);
      copy.append(title, desc);
      const cost = makeElement("span", "proc-clicker__cost", "25 · LV 0");
      button.append(icon, copy, cost);
      button.addEventListener("click", () => {
        const count = Number(game.upgrades[upgrade.id]) || 0;
        const price = Math.floor(upgrade.cost * (1.17 ** count));
        if (game.bank < price) return;
        game.bank -= price;
        game.upgrades[upgrade.id] = count + 1;
        game.clickPower += upgrade.click;
        game.cps += upgrade.cps;
        playGameTone("upgrade");
        render();
        save();
      }, { signal: state.signal });
      upgradeButtons.set(upgrade.id, { button, cost, upgrade });
      upgradeList.append(button);
    });

    const roster = makeElement("div", "proc-clicker__roster");
    const rosterCopy = makeElement("p");
    const rosterTitle = makeElement("strong", "", "THE BRAINROT SQUAD");
    rosterCopy.append(rosterTitle, document.createElement("br"), document.createTextNode("Unlock meme factories and recruit the crew.") );
    const rosterImage = makeElement("img");
    rosterImage.src = typeof api.assetUrl === "function"
      ? api.assetUrl("assets/brainrot-clicker/brainrot-sprite-atlas.png")
      : "assets/brainrot-clicker/brainrot-sprite-atlas.png";
    rosterImage.alt = "Pixel art Tung Tung Sahur, Bombardiro Crocodilo, Tralalero Tralala and Chimpanzini Bananini";
    roster.append(rosterCopy, rosterImage);

    const rebirth = makeElement("button", "proc-clicker__rebirth", "REBOOT BRAIN · unlock at 25,000 lifetime points");
    rebirth.type = "button";
    rebirth.hidden = true;
    panel.append(wallet, main, shopHead, upgradeList, roster, rebirth);
    root.append(panel);

    const storageKey = "proc-brainrot-clicker-v1";
    const initial = { bank: 0, lifetime: 0, clicks: 0, clickPower: 1, cps: 0, prestige: 0, upgrades: {} };
    let game = initial;
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) || "null");
      if (saved && Number.isFinite(Number(saved.bank))) game = { ...initial, ...saved, upgrades: saved.upgrades || {} };
    } catch (_error) { /* storage may be disabled in private contexts */ }
    let soundEnabled = true;
    let audioContext = null;
    let lastClickAt = 0;
    let streak = 0;
    let lastTick = Date.now();

    function save() {
      try { window.localStorage.setItem(storageKey, JSON.stringify(game)); } catch (_error) { /* optional persistence */ }
    }

    function formatCount(value) {
      const safe = Math.max(0, Math.floor(Number(value) || 0));
      if (safe >= 1e9) return `${(safe / 1e9).toFixed(1)}B`;
      if (safe >= 1e6) return `${(safe / 1e6).toFixed(1)}M`;
      if (safe >= 1e4) return `${(safe / 1e3).toFixed(1)}K`;
      return safe.toLocaleString();
    }

    function playGameTone(kind) {
      if (!soundEnabled) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      try {
        audioContext ||= new AudioCtx();
        if (audioContext.state === "suspended") audioContext.resume();
        const now = audioContext.currentTime;
        const notes = kind === "upgrade" ? [520, 780] : [260 + Math.min(streak, 10) * 22];
        notes.forEach((frequency, index) => {
          const oscillator = audioContext.createOscillator();
          const gain = audioContext.createGain();
          oscillator.type = kind === "upgrade" ? "square" : "triangle";
          oscillator.frequency.setValueAtTime(frequency, now + index * 0.075);
          gain.gain.setValueAtTime(0.0001, now + index * 0.075);
          gain.gain.exponentialRampToValueAtTime(kind === "upgrade" ? 0.09 : 0.055, now + index * 0.075 + 0.008);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.075 + 0.095);
          oscillator.connect(gain);
          gain.connect(audioContext.destination);
          oscillator.start(now + index * 0.075);
          oscillator.stop(now + index * 0.075 + 0.1);
        });
      } catch (_error) { /* browser audio is optional */ }
    }

    function rankName() {
      if (game.lifetime >= 25000) return "BRAINROT LEGEND";
      if (game.lifetime >= 5000) return "MEME LORD";
      if (game.lifetime >= 500) return "SCROLL GREMLIN";
      return "BRAINROT INTERN";
    }

    function render() {
      bank.textContent = formatCount(game.bank);
      rate.textContent = `+${formatCount(game.cps * (1 + game.prestige * 0.25))} / sec`;
      rank.textContent = `RANK: ${rankName()}${game.prestige ? ` · AURA ×${(1 + game.prestige * 0.25).toFixed(2)}` : ""}`;
      streakText.textContent = streak >= 10 ? `HYPE STREAK ×2 · ${streak}` : `STREAK ${streak} / 10`;
      upgradeButtons.forEach(({ button, cost, upgrade }) => {
        const count = Number(game.upgrades[upgrade.id]) || 0;
        const price = Math.floor(upgrade.cost * (1.17 ** count));
        cost.textContent = `${formatCount(price)} · LV ${count}`;
        button.disabled = game.bank < price;
      });
      rebirth.hidden = game.lifetime < 25000;
      if (!rebirth.hidden) rebirth.textContent = `REBOOT BRAIN · PRESTIGE ${game.prestige + 1} · reset for +25% power`;
    }

    mascot.addEventListener("click", () => {
      const now = Date.now();
      streak = now - lastClickAt <= 1200 ? streak + 1 : 1;
      lastClickAt = now;
      const combo = streak >= 10 ? 2 : 1;
      const critical = Math.random() < 0.07 ? 5 : 1;
      const points = Math.max(1, Math.round(game.clickPower * (1 + game.prestige * 0.25) * combo * critical));
      game.bank += points;
      game.lifetime += points;
      game.clicks += 1;
      mascot.classList.remove("is-bonking");
      void mascot.offsetWidth;
      mascot.classList.add("is-bonking");
      hint.textContent = critical > 1 ? `CRITICAL BONK! +${formatCount(points)}` : combo > 1 ? `HYPE STREAK! +${formatCount(points)}` : `+${formatCount(points)} BRAINROT`;
      playGameTone("click");
      render();
      save();
    }, { signal: state.signal });

    sound.addEventListener("click", () => {
      soundEnabled = !soundEnabled;
      sound.textContent = soundEnabled ? "🔊 SOUND ON" : "🔇 SOUND OFF";
      sound.setAttribute("aria-pressed", String(soundEnabled));
      if (soundEnabled) playGameTone("upgrade");
    }, { signal: state.signal });

    rebirth.addEventListener("click", () => {
      if (game.lifetime < 25000) return;
      game.bank = 0;
      game.clickPower = 1;
      game.cps = 0;
      game.upgrades = {};
      game.prestige += 1;
      streak = 0;
      playGameTone("upgrade");
      hint.textContent = `BRAIN REBOOTED · PERMANENT AURA ×${(1 + game.prestige * 0.25).toFixed(2)}`;
      render();
      save();
    }, { signal: state.signal });

    const tick = window.setInterval(() => {
      const now = Date.now();
      const elapsed = Math.min(1, Math.max(0, (now - lastTick) / 1000));
      lastTick = now;
      if (game.cps > 0 && elapsed > 0) {
        const earned = game.cps * elapsed * (1 + game.prestige * 0.25);
        game.bank += earned;
        game.lifetime += earned;
        render();
        save();
      }
    }, 250);

    const previousRenderHook = window.render_game_to_text;
    const previousAdvanceHook = window.advanceTime;
    window.render_game_to_text = () => JSON.stringify({ bank: Math.floor(game.bank), lifetime: Math.floor(game.lifetime), cps: game.cps, clickPower: game.clickPower, prestige: game.prestige, upgrades: game.upgrades, rank: rankName() });
    window.advanceTime = (milliseconds) => {
      const elapsed = Math.max(0, Number(milliseconds) || 0) / 1000;
      const earned = game.cps * elapsed * (1 + game.prestige * 0.25);
      game.bank += earned;
      game.lifetime += earned;
      render();
      save();
      return window.render_game_to_text();
    };
    state.clickerPanel = panel;
    state.sound = { enabled: () => soundEnabled };
    render();
    return () => {
      window.clearInterval(tick);
      if (audioContext && audioContext.state !== "closed") audioContext.close();
      if (window.render_game_to_text) {
        if (previousRenderHook === undefined) delete window.render_game_to_text;
        else window.render_game_to_text = previousRenderHook;
      }
      if (window.advanceTime) {
        if (previousAdvanceHook === undefined) delete window.advanceTime;
        else window.advanceTime = previousAdvanceHook;
      }
    };
  }

  proc.modules.reels = {
    name: "reels",
    placement: "fullscreen",

    mount(root, api = {}) {
      if (!root) return () => {};

      const abortController = new AbortController();
      const state = {
        activeIndex: -1,
        activeFrame: null,
        entries: [],
        observer: null,
        activeTab: "shorts",
        soundEnabled: false,
        autoAdvanceTimer: null,
        signal: abortController.signal,
      };

      root.replaceChildren();
      root.classList.add("proc-reels");
      root.setAttribute("role", "region");
      root.setAttribute("aria-label", "A YouTube Shorts break");

      const device = makeElement("div", "proc-reels__device");
      const shell = makeElement("section", "proc-reels__shell");
      const styles = makeElement("style", "proc-reels__styles");
      styles.textContent = REELS_STYLES;
      const notch = makeElement("div", "proc-reels__notch");
      notch.setAttribute("aria-hidden", "true");
      const header = makeElement("header", "proc-reels__topbar");
      const brand = makeElement("p", "proc-reels__brand");
      const brandMark = makeElement("span", "proc-reels__brand-mark", "▶");
      const brandText = makeElement("span", "", "YouTube Shorts");
      brand.append(brandMark, brandText);
      const tabs = makeElement("div", "proc-reels__tabs");
      const shortsTab = makeElement("button", "proc-reels__tab", "SHORTS");
      shortsTab.type = "button";
      shortsTab.setAttribute("aria-pressed", "true");
      const clickerTab = makeElement("button", "proc-reels__tab", "CLICKER");
      clickerTab.type = "button";
      clickerTab.setAttribute("aria-pressed", "false");
      tabs.append(shortsTab, clickerTab);
      const audioButton = makeElement("button", "proc-reels__audio", "🔇 SOUND");
      audioButton.type = "button";
      audioButton.setAttribute("aria-label", "Enable sound for Shorts");
      audioButton.setAttribute("aria-pressed", "false");
      state.audioButton = audioButton;
      header.append(brand, tabs, audioButton);

      const autoNext = makeElement("div", "proc-reels__autonext");
      autoNext.setAttribute("role", "img");
      autoNext.setAttribute("aria-label", "Shorts automatically advance every 10 seconds");
      const autoNextFill = makeElement("div", "proc-reels__autonext-fill");
      autoNext.append(autoNextFill);
      state.autoNextFill = autoNextFill;
      const content = makeElement("div", "proc-reels__content");
      const { feed, entries } = mountShortsFeed(content, api, state);
      const cleanupClicker = mountBrainrotClicker(content, api, state);
      state.cleanupClicker = cleanupClicker;

      function showTab(tab) {
        if (tab === state.activeTab) return;
        state.activeTab = tab;
        const showingShorts = tab === "shorts";
        shortsTab.setAttribute("aria-pressed", String(showingShorts));
        clickerTab.setAttribute("aria-pressed", String(!showingShorts));
        feed.hidden = !showingShorts;
        state.clickerPanel.hidden = showingShorts;
        autoNext.hidden = !showingShorts;
        if (showingShorts) {
          if (state.activeFrame) sendPlayerCommand(state.activeFrame, "playVideo");
          state.scheduleAutoAdvance?.();
        } else {
          state.stopAutoAdvance?.();
          if (state.activeFrame) sendPlayerCommand(state.activeFrame, "pauseVideo");
        }
      }
      shortsTab.addEventListener("click", () => showTab("shorts"), { signal: state.signal });
      clickerTab.addEventListener("click", () => showTab("clicker"), { signal: state.signal });
      audioButton.addEventListener("click", () => {
        state.soundEnabled = !state.soundEnabled;
        audioButton.textContent = state.soundEnabled ? "🔊 SOUND" : "🔇 SOUND";
        audioButton.setAttribute("aria-label", state.soundEnabled ? "Mute Shorts" : "Enable sound for Shorts");
        audioButton.setAttribute("aria-pressed", String(state.soundEnabled));
        if (state.activeFrame?.dataset.started === "true") {
          sendPlayerCommand(state.activeFrame, state.soundEnabled ? "unMute" : "mute");
          if (state.soundEnabled) sendPlayerCommand(state.activeFrame, "setVolume", [100]);
          if (state.activeTab === "shorts") sendPlayerCommand(state.activeFrame, "playVideo");
        }
      }, { signal: state.signal });

      const home = makeElement("div", "proc-reels__home");
      home.setAttribute("aria-hidden", "true");
      shell.append(styles, notch, header, autoNext, content, home);
      device.append(shell);
      root.append(device);

      return () => {
        abortController.abort();
        window.clearTimeout(state.autoAdvanceTimer);
        if (state.cleanupClicker) state.cleanupClicker();
        if (state.observer) state.observer.disconnect();
        entries.forEach(({ frame }) => {
          unloadShort({ frame });
        });
        root.replaceChildren();
        root.classList.remove("proc-reels");
        root.removeAttribute("role");
        root.removeAttribute("aria-label");
      };
    },
  };
})();
