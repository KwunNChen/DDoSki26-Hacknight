(function registerChatbotModule() {
  "use strict";

  const proc = (window.PROC = window.PROC || {});
  proc.modules = proc.modules || {};

  const OPENING_MESSAGE =
    "Hey! I noticed you're doing homework. Gross. Want to watch something instead?";
  const QUICK_REPLIES = [
    "I have a midterm",
    "I'm so stressed",
    "Just 10 more minutes",
  ];
  const GENERIC_REPLIES = [
    "One little scroll can be a very small little break.",
    "Your next video could be the one with the tiny hat.",
    "The algorithm says you deserve a snack-sized detour.",
    "What if your notes took a five-second intermission?",
    "A fresh batch of videos is waiting patiently.",
    "You can always pick up where you left off after one more clip.",
    "This is a nice moment to admire how many tabs you have open.",
    "The feed has prepared a highly scientific amount of cuteness.",
  ];

  let genericReplyIndex = 0;

  function makeElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function replyFor(message) {
    const normalized = message.toLowerCase();

    if (/\b(due|deadline|midterm|exam)\b/.test(normalized)) {
      return "Sounds like Tomorrow You's problem.";
    }
    if (/\b(tired|stress|stressed)\b/.test(normalized)) {
      return "Rest is productive. Scrolling is rest.";
    }
    if (/\b(should|need to|have to)\b/.test(normalized)) {
      return "Bold word choice. 'Should' has never done anything for anyone.";
    }
    if (/\b(grade|gpa)\b/.test(normalized)) {
      return "GPA is just a number. So is screen time.";
    }

    const reply = GENERIC_REPLIES[genericReplyIndex % GENERIC_REPLIES.length];
    genericReplyIndex += 1;
    return reply;
  }

  function incrementConversationCount() {
    const storage = globalThis.chrome?.storage?.local;
    if (!storage || typeof storage.get !== "function" || typeof storage.set !== "function") {
      return;
    }

    try {
      storage.get(["conversations"], (values) => {
        if (globalThis.chrome?.runtime?.lastError) return;
        const current = Number(values?.conversations) || 0;
        storage.set({ conversations: current + 1 });
      });
    } catch (_error) {
      // The chat remains usable when storage permission is unavailable.
    }
  }

  function addMessage(list, sender, text) {
    const message = makeElement(
      "p",
      `proc-chatbot__message proc-chatbot__message--${sender}`,
      text,
    );
    message.setAttribute("data-sender", sender);
    list.append(message);
    list.scrollTop = list.scrollHeight;
  }

  proc.modules.chatbot = {
    name: "chatbot",
    placement: "corner",

    mount(root) {
      if (!root) return () => {};

      const abortController = new AbortController();
      const timers = new Set();
      let firstMessageSent = false;
      let isReplying = false;

      root.replaceChildren();
      root.classList.add("proc-chatbot");
      root.setAttribute("role", "region");
      root.setAttribute("aria-label", "Procrastibot chat");

      const panel = makeElement("section", "proc-chatbot__panel");
      const header = makeElement("header", "proc-chatbot__header");
      const avatar = makeElement("span", "proc-chatbot__avatar", "P");
      avatar.setAttribute("aria-hidden", "true");
      const headerCopy = makeElement("div", "proc-chatbot__header-copy");
      const title = makeElement("p", "proc-chatbot__title", "Procrastibot");
      const status = makeElement("p", "proc-chatbot__status", "online · ready to distract");
      headerCopy.append(title, status);
      header.append(avatar, headerCopy);

      const messages = makeElement("div", "proc-chatbot__messages");
      messages.setAttribute("role", "log");
      messages.setAttribute("aria-live", "polite");
      messages.setAttribute("aria-relevant", "additions");
      addMessage(messages, "assistant", OPENING_MESSAGE);

      const chips = makeElement("div", "proc-chatbot__quick-replies");
      chips.setAttribute("aria-label", "Suggested replies");

      const typing = makeElement("p", "proc-chatbot__typing", "Procrastibot is typing…");
      typing.setAttribute("role", "status");
      typing.setAttribute("aria-live", "polite");
      typing.hidden = true;

      const form = makeElement("form", "proc-chatbot__composer");
      const input = makeElement("input", "proc-chatbot__input");
      input.type = "text";
      input.name = "message";
      input.maxLength = 180;
      input.autocomplete = "off";
      input.placeholder = "Give Procrastibot an excuse…";
      input.setAttribute("aria-label", "Message Procrastibot");

      const send = makeElement("button", "proc-chatbot__send", "Send");
      send.type = "submit";
      form.append(input, send);

      QUICK_REPLIES.forEach((reply) => {
        const chip = makeElement("button", "proc-chatbot__chip", reply);
        chip.type = "button";
        chip.addEventListener(
          "click",
          () => submitMessage(reply),
          { signal: abortController.signal },
        );
        chips.append(chip);
      });

      function setReplying(value) {
        isReplying = value;
        typing.hidden = !value;
        input.disabled = value;
        send.disabled = value;
        chips.querySelectorAll("button").forEach((button) => {
          button.disabled = value;
        });
        if (!value) input.focus();
      }

      function submitMessage(rawMessage) {
        const message = String(rawMessage || "").trim();
        if (!message || isReplying) return;

        addMessage(messages, "user", message);
        if (!firstMessageSent) {
          firstMessageSent = true;
          incrementConversationCount();
          chips.remove();
        }

        input.value = "";
        setReplying(true);
        const timer = window.setTimeout(() => {
          timers.delete(timer);
          if (!abortController.signal.aborted) {
            addMessage(messages, "assistant", replyFor(message));
            setReplying(false);
          }
        }, 550);
        timers.add(timer);
      }

      form.addEventListener(
        "submit",
        (event) => {
          event.preventDefault();
          submitMessage(input.value);
        },
        { signal: abortController.signal },
      );

      panel.append(header, messages, chips, typing, form);
      root.append(panel);

      return () => {
        abortController.abort();
        timers.forEach((timer) => window.clearTimeout(timer));
        timers.clear();
        root.replaceChildren();
        root.classList.remove("proc-chatbot");
        root.removeAttribute("role");
        root.removeAttribute("aria-label");
      };
    },
  };
})();
