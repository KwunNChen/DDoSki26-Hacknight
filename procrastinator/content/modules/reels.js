(function registerReelsModule() {
  "use strict";

  const proc = (window.PROC = window.PROC || {});
  proc.modules = proc.modules || {};

  const CLIPS = [
    {
      path: "assets/reels/reel-orbit.mp4",
      creator: "@tiny.breaks",
      caption: "A tiny cosmic snack for your eyeballs ✨",
      audio: "soft focus · original audio",
    },
    {
      path: "assets/reels/reel-bloom.mp4",
      creator: "@scroll.garden",
      caption: "Proof that one more swipe is always available 🌱",
      audio: "garden loop · original audio",
    },
    {
      path: "assets/reels/reel-soda.mp4",
      creator: "@bubble.club",
      caption: "An oddly satisfying study break in 5 seconds 🫧",
      audio: "bubble pop · original audio",
    },
  ];

  let popupRequested = false;

  function makeElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function playSilently(video) {
    try {
      const playback = video.play();
      if (playback && typeof playback.catch === "function") {
        playback.catch(() => {});
      }
    } catch (_error) {
      // Autoplay can be denied by the browser; scrolling and captions still work.
    }
  }

  function requestInstagramPopup(api) {
    if (popupRequested || typeof api.openPopupWindow !== "function") return;
    popupRequested = true;

    try {
      Promise.resolve(api.openPopupWindow()).catch(() => {});
    } catch (_error) {
      // Keep the local feed usable if the extension background cannot open a window.
    }
  }

  function makeLocalCard(clip, index, api, signal) {
    const card = makeElement("article", "proc-reels__card");
    card.setAttribute("aria-label", `Reel ${index + 1} of ${CLIPS.length}`);

    const video = makeElement("video", "proc-reels__video");
    video.src =
      typeof api.assetUrl === "function" ? api.assetUrl(clip.path) : clip.path;
    video.autoplay = index === 0;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = index === 0 ? "auto" : "metadata";
    video.setAttribute("muted", "");
    video.setAttribute("loop", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("aria-label", clip.caption);

    const caption = makeElement("div", "proc-reels__caption");
    const creator = makeElement("p", "proc-reels__creator", clip.creator);
    const description = makeElement("p", "proc-reels__description", clip.caption);
    const audio = makeElement("p", "proc-reels__audio", `♫ ${clip.audio}`);
    caption.append(creator, description, audio);

    const loadMessage = makeElement(
      "p",
      "proc-reels__load-message",
      "Your mini break is taking a moment to load.",
    );
    loadMessage.hidden = true;
    video.addEventListener(
      "error",
      () => {
        loadMessage.hidden = false;
        card.classList.add("proc-reels__card--unavailable");
      },
      { signal },
    );

    card.append(video, caption, loadMessage);
    return { card, video };
  }

  function mountIframe(root) {
    const frame = makeElement("iframe", "proc-reels__iframe");
    frame.src = "https://www.instagram.com/reels/";
    frame.title = "Instagram Reels";
    frame.loading = "lazy";
    frame.allow = "autoplay; encrypted-media; picture-in-picture";
    frame.referrerPolicy = "no-referrer";
    root.append(frame);
  }

  function mountLocalFeed(root, api, observerState) {
    const feed = makeElement("div", "proc-reels__feed");
    feed.setAttribute("aria-label", "Local Reels-style demo feed");
    feed.tabIndex = 0;

    const videos = [];
    CLIPS.forEach((clip, index) => {
      const { card, video } = makeLocalCard(clip, index, api, observerState.signal);
      feed.append(card);
      videos.push(video);

      if (observerState.observer) observerState.observer.observe(card);
    });
    observerState.videos = videos;

    root.append(feed);
    requestInstagramPopup(api);

    if (videos[0] && typeof videos[0].play === "function") {
      playSilently(videos[0]);
    }
  }

  proc.modules.reels = {
    name: "reels",
    placement: "fullscreen",

    mount(root, api = {}) {
      if (!root) return () => {};

      const abortController = new AbortController();
      const observerState = {
        videos: [],
        observer: null,
        signal: abortController.signal,
      };
      // Person A can enable the iframe after the five-minute login/framing spike.
      const iframeWorks =
        api.instagramIframeWorks === true || proc.instagramIframeWorks === true;

      root.replaceChildren();
      root.classList.add("proc-reels");
      root.setAttribute("role", "region");
      root.setAttribute("aria-label", "A short-form video break");

      const shell = makeElement("section", "proc-reels__shell");
      const header = makeElement("header", "proc-reels__topbar");
      const brand = makeElement("p", "proc-reels__brand", "procrastiscroll");
      const tabs = makeElement("nav", "proc-reels__tabs");
      tabs.setAttribute("aria-label", "Video feed");
      const forYou = makeElement("span", "proc-reels__tab proc-reels__tab--active", "For You");
      forYou.setAttribute("aria-current", "page");
      const following = makeElement("span", "proc-reels__tab", "Following");
      tabs.append(forYou, following);
      header.append(brand, tabs);
      shell.append(header);

      if (iframeWorks) {
        mountIframe(shell);
      } else {
        if (typeof IntersectionObserver === "function") {
          observerState.observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                const video = entry.target.querySelector("video");
                if (!video) return;

                if (entry.isIntersecting) {
                  playSilently(video);
                } else {
                  video.pause();
                }
              });
            },
            { threshold: 0.6 },
          );
        }
        mountLocalFeed(shell, api, observerState);
      }

      root.append(shell);

      return () => {
        abortController.abort();
        if (observerState.observer) observerState.observer.disconnect();
        observerState.videos.forEach((video) => {
          video.pause();
          video.removeAttribute("src");
          video.load();
        });
        root.replaceChildren();
        root.classList.remove("proc-reels");
        root.removeAttribute("role");
        root.removeAttribute("aria-label");
      };
    },
  };
})();
