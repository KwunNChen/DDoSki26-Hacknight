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
    .proc-module-reels {
      display: flex;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      align-items: center;
      justify-content: center;
    }
    .proc-reels {
      display: flex;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .proc-reels__shell {
      position: relative;
      width: min(100%, 420px);
      height: min(100%, 780px);
      max-height: 100%;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 26px;
      background: #08090d;
      box-shadow: 0 24px 90px rgba(0, 0, 0, 0.54);
    }
    .proc-reels__topbar {
      position: absolute;
      z-index: 5;
      top: 0;
      right: 0;
      left: 0;
      display: flex;
      min-height: 66px;
      align-items: center;
      justify-content: space-between;
      padding: max(18px, env(safe-area-inset-top)) 18px 10px;
      background: linear-gradient(180deg, rgba(0, 0, 0, 0.68), transparent);
      pointer-events: none;
    }
    .proc-reels__brand,
    .proc-reels__counter {
      margin: 0;
      color: #fff;
      font-size: 12px;
      font-weight: 850;
      letter-spacing: 0.04em;
      text-shadow: 0 2px 10px #000;
    }
    .proc-reels__brand::before {
      display: inline-grid;
      width: 22px;
      height: 16px;
      margin-right: 7px;
      place-items: center;
      border-radius: 5px;
      background: #ff0033;
      content: "▶";
      font-size: 9px;
      vertical-align: -1px;
    }
    .proc-reels__counter {
      color: rgba(255, 255, 255, 0.82);
      font-size: 10px;
      letter-spacing: 0.1em;
    }
    .proc-reels__feed {
      position: absolute;
      inset: 0;
      display: flex;
      width: 100%;
      height: 100%;
      flex-direction: column;
      overflow-x: hidden;
      overflow-y: auto;
      overscroll-behavior-y: contain;
      scroll-snap-type: y mandatory;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      touch-action: pan-y;
    }
    .proc-reels__feed::-webkit-scrollbar { display: none; }
    .proc-reels__card {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 100%;
      flex: 0 0 100%;
      overflow: hidden;
      scroll-snap-align: start;
      scroll-snap-stop: always;
      background: #08090d;
    }
    .proc-reels__player {
      position: absolute;
      inset: 0;
      display: block;
      width: 100%;
      height: 100%;
      border: 0;
      background: #08090d;
    }
    .proc-reels__caption {
      position: absolute;
      z-index: 3;
      right: 62px;
      bottom: 55px;
      left: 15px;
      display: grid;
      gap: 6px;
      padding: 38px 8px 3px;
      background: linear-gradient(0deg, rgba(0, 0, 0, 0.82), transparent);
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
      pointer-events: none;
    }
    .proc-reels__creator,
    .proc-reels__description { margin: 0; }
    .proc-reels__creator { font-size: 12px; font-weight: 850; }
    .proc-reels__description { font-size: 12px; line-height: 1.4; }
    .proc-reels__watch-link {
      justify-self: start;
      padding: 5px 8px;
      border: 1px solid rgba(255, 255, 255, 0.28);
      border-radius: 7px;
      background: rgba(15, 15, 20, 0.72);
      color: #fff;
      cursor: pointer;
      font: 700 10px/1.3 system-ui, sans-serif;
      text-decoration: none;
      pointer-events: auto;
    }
    .proc-reels__watch-link:hover { background: rgba(104, 79, 204, 0.9); }
    .proc-reels__watch-link[aria-busy="true"] { cursor: wait; opacity: 0.7; }
    .proc-reels__navigation {
      position: absolute;
      z-index: 6;
      top: 50%;
      right: 11px;
      display: flex;
      flex-direction: column;
      gap: 9px;
      transform: translateY(-50%);
    }
    .proc-reels__nav-button {
      display: grid;
      width: 36px;
      height: 36px;
      place-items: center;
      border: 1px solid rgba(255, 255, 255, 0.32);
      border-radius: 50%;
      background: rgba(10, 10, 16, 0.62);
      color: #fff;
      cursor: pointer;
      font: 700 16px/1 system-ui, sans-serif;
      backdrop-filter: blur(8px);
    }
    .proc-reels__nav-button:hover { background: rgba(118, 87, 223, 0.92); }
    @media (max-width: 480px) {
      .proc-reels__shell { width: 100%; height: 100%; border: 0; border-radius: 0; }
      .proc-reels__topbar { padding-right: 112px; }
    }
    @media (max-height: 600px) {
      .proc-reels__shell { border-radius: 14px; }
    }
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

        return {
          id,
          creator: String(source.creator || source.channel || "YouTube creator"),
          title: String(source.title || "YouTube Short"),
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

  function embedUrl(short, origin, autoplay) {
    const url = new URL(`/embed/${short.id}`, YOUTUBE_PLAYER_ORIGIN);
    url.searchParams.set("autoplay", autoplay ? "1" : "0");
    url.searchParams.set("controls", "1");
    url.searchParams.set("enablejsapi", "1");
    url.searchParams.set("mute", "1");
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
      sendPlayerCommand(frame, "mute");
      sendPlayerCommand(frame, "playVideo");
      return;
    }

    frame.dataset.started = "true";
    frame.src = embedUrl(entry.short, origin, true);
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
              sendPlayerCommand(frame, "mute");
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
    next.addEventListener("click", () => scrollTo(state.activeIndex + 1), {
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
        scrollTo(state.activeIndex + direction);
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
        if (entryIndex === index) startShort(entry, origin);
        else unloadShort(entry);
      });
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
    return { feed, entries };
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
        signal: abortController.signal,
      };

      root.replaceChildren();
      root.classList.add("proc-reels");
      root.setAttribute("role", "region");
      root.setAttribute("aria-label", "A YouTube Shorts break");

      const shell = makeElement("section", "proc-reels__shell");
      const styles = makeElement("style", "proc-reels__styles");
      styles.textContent = REELS_STYLES;
      const header = makeElement("header", "proc-reels__topbar");
      const brand = makeElement("p", "proc-reels__brand", "YouTube Shorts");
      const counter = makeElement("p", "proc-reels__counter", "0 / 0");
      state.counter = counter;
      header.append(brand, counter);
      shell.append(styles, header);
      mountShortsFeed(shell, api, state);
      root.append(shell);

      return () => {
        abortController.abort();
        if (state.observer) state.observer.disconnect();
        state.entries.forEach(({ frame }) => {
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
