(() => {
  "use strict";

  const OPEN_ANIMATION_MS = 220;
  const CLOSE_ANIMATION_MS = 160;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const typingTimers = new WeakMap();

  /* =========================================================
   * Section / file map (drives tabs, sidebar, status bar)
   * =======================================================*/
  const SECTIONS = [
    { id: "home", file: "welcome.ts", lang: "TypeScript" },
    { id: "experience", file: "experience.json", lang: "JSON" },
    { id: "projects", file: "projects.tsx", lang: "TypeScript JSX" },
    { id: "skills", file: "skills.txt", lang: "Plain Text" },
    { id: "contact", file: "contact.sh", lang: "Shell Script" },
  ];

  const scroll = document.querySelector("[data-scroll]");
  const tabs = Array.from(document.querySelectorAll(".tab"));
  const treeItems = Array.from(document.querySelectorAll(".tree-item[data-nav]"));
  const navSectionItems = Array.from(document.querySelectorAll("[data-nav-section]"));
  const sbSection = document.querySelector("[data-sb-section]");
  const sbLang = document.querySelector("[data-sb-lang]");
  const activeFileCrumb = document.querySelector("[data-active-file]");

  const sectionById = (id) => document.getElementById(id);

  const setActiveSection = (id) => {
    const meta = SECTIONS.find((s) => s.id === id);
    if (!meta) return;

    tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.tab === id));
    treeItems.forEach((item) => item.classList.toggle("is-active", item.dataset.nav === id));
    navSectionItems.forEach((item) => item.classList.toggle("is-active", item.dataset.navSection === id));

    if (sbSection) sbSection.textContent = meta.file;
    if (sbLang) sbLang.textContent = meta.lang;
    if (activeFileCrumb) activeFileCrumb.textContent = meta.file;
  };

  const goToSection = (id) => {
    const target = sectionById(id);
    if (!target || !scroll) return;
    const top = target.offsetTop - 12;
    scroll.scrollTo({ top, behavior: prefersReducedMotion.matches ? "auto" : "smooth" });
    setActiveSection(id);
    closeSidebarOnMobile();
  };

  tabs.forEach((tab) => tab.addEventListener("click", () => goToSection(tab.dataset.tab)));
  treeItems.forEach((item) => item.addEventListener("click", () => goToSection(item.dataset.nav)));
  document.querySelectorAll("[data-nav]").forEach((el) => {
    if (el.classList.contains("tree-item") || el.classList.contains("tab")) return;
    el.addEventListener("click", () => goToSection(el.dataset.nav));
  });

  /* =========================================================
   * Scroll spy
   * =======================================================*/
  const spyTargets = SECTIONS.map((s) => sectionById(s.id)).filter(Boolean);

  if ("IntersectionObserver" in window && scroll) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { root: scroll, rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    spyTargets.forEach((el) => spy.observe(el));
  }

  /* =========================================================
   * Scroll reveal
   * =======================================================*/
  const revealEls = Array.from(document.querySelectorAll(".reveal"));

  if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { root: scroll, rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* =========================================================
   * Hero code line reveal
   * =======================================================*/
  const heroCode = document.querySelector("[data-hero-code]");
  if (heroCode) {
    if (prefersReducedMotion.matches) {
      heroCode.removeAttribute("data-typed");
    } else {
      heroCode.setAttribute("data-typed", "");
      const rows = Array.from(heroCode.querySelectorAll(".ln-row"));
      rows.forEach((row, i) => {
        row.style.animationDelay = `${0.12 + i * 0.09}s`;
      });
    }
  }

  /* =========================================================
   * Line-number gutter
   * =======================================================*/
  const gutter = document.querySelector("[data-gutter]");
  const editorContent = document.querySelector(".editor-content");

  const buildGutter = () => {
    if (!gutter || !editorContent || getComputedStyle(gutter).display === "none") return;
    const lineHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--line-h")) || 26;
    const count = Math.ceil((editorContent.scrollHeight + 120) / lineHeight);
    const frag = document.createDocumentFragment();
    for (let i = 1; i <= count; i++) {
      const span = document.createElement("span");
      span.textContent = i;
      frag.appendChild(span);
    }
    gutter.replaceChildren(frag);
    gutter.style.height = `${editorContent.scrollHeight + 200}px`;
  };

  /* =========================================================
   * Sidebar / folder toggles
   * =======================================================*/
  const sidebar = document.querySelector("[data-sidebar]");
  const scrim = document.querySelector("[data-sidebar-scrim]");
  const sidebarToggles = document.querySelectorAll("[data-sidebar-toggle]");

  const isMobile = () => window.matchMedia("(max-width: 860px)").matches;

  const setSidebar = (collapsed) => {
    if (!sidebar) return;
    sidebar.classList.toggle("is-collapsed", collapsed);
    if (scrim) scrim.classList.toggle("is-hidden", collapsed);
    sidebarToggles.forEach((btn) => {
      if (btn.hasAttribute("aria-expanded")) btn.setAttribute("aria-expanded", String(!collapsed));
    });
  };

  const closeSidebarOnMobile = () => {
    if (isMobile()) setSidebar(true);
  };

  sidebarToggles.forEach((btn) =>
    btn.addEventListener("click", () => setSidebar(!sidebar.classList.contains("is-collapsed")))
  );
  if (scrim) scrim.addEventListener("click", () => setSidebar(true));

  // start collapsed on mobile
  if (isMobile()) setSidebar(true);
  else if (scrim) scrim.classList.add("is-hidden");

  document.querySelectorAll("[data-folder-toggle], [data-subfolder-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const groupSelector = btn.hasAttribute("data-folder-toggle")
        ? "[data-folder-group]"
        : "[data-subfolder-group]";
      const group = btn.hasAttribute("data-folder-toggle")
        ? document.querySelector(groupSelector)
        : btn.parentElement.querySelector(groupSelector) || document.querySelector(groupSelector);
      const expanded = btn.getAttribute("aria-expanded") !== "false";
      btn.setAttribute("aria-expanded", String(!expanded));
      if (group) group.classList.toggle("is-hidden", expanded);
    });
  });

  /* =========================================================
   * Status bar: clock + cursor position
   * =======================================================*/
  const sbClock = document.querySelector("[data-sb-clock]");
  const sbCursor = document.querySelector("[data-sb-cursor]");

  const updateClock = () => {
    if (!sbClock) return;
    const now = new Date();
    sbClock.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  updateClock();
  window.setInterval(updateClock, 30000);

  if (scroll && sbCursor) {
    const lineHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--line-h")) || 26;
    let cursorRaf = 0;
    scroll.addEventListener("scroll", () => {
      if (cursorRaf) return;
      cursorRaf = window.requestAnimationFrame(() => {
        const ln = Math.max(1, Math.round(scroll.scrollTop / lineHeight) + 1);
        const col = (Math.round(scroll.scrollTop) % 80) + 1;
        sbCursor.textContent = `Ln ${ln}, Col ${col}`;
        cursorRaf = 0;
      });
    });
  }

  /* =========================================================
   * About terminal (streamed typing)
   * =======================================================*/
  const ABOUT_LINES = [
    { kind: "cmd", text: "whoami" },
    { kind: "out", text: "Cameron Gaudian — Computer Science student @ MNSU, Mankato" },
    { kind: "gap" },
    { kind: "cmd", text: "cat about.md" },
    { kind: "out", text: "I turn big goals into daily progress." },
    {
      kind: "out",
      text: "Across school, work, fitness, and personal projects, I care a lot about consistency and steady effort.",
    },
    {
      kind: "out",
      text: "I'm easy to work with, always open to learning, and motivated by building things that are genuinely useful.",
    },
    { kind: "gap" },
    { kind: "cmd", text: "echo $STATUS" },
    { kind: "out", text: "● Available for new opportunities", cls: "term-ok" },
  ];

  const terminalTimers = new WeakMap();

  const buildTerminalLine = (line, text) => {
    const el = document.createElement("div");
    el.className = "term-line";
    if (line.kind === "gap") {
      el.classList.add("term-gap");
      return el;
    }
    if (line.kind === "cmd") {
      el.classList.add("term-cmd");
      const prompt = document.createElement("span");
      prompt.className = "term-prompt";
      prompt.textContent = "$";
      const span = document.createElement("span");
      span.className = "term-text";
      span.textContent = text;
      el.append(prompt, document.createTextNode(" "), span);
    } else {
      el.classList.add("term-out");
      if (line.cls) el.classList.add(line.cls);
      el.textContent = text;
    }
    return el;
  };

  const stopTerminal = (root) => {
    const id = terminalTimers.get(root);
    if (id) {
      window.clearTimeout(id);
      terminalTimers.delete(root);
    }
  };

  const startTerminal = (root) => {
    stopTerminal(root);
    if (prefersReducedMotion.matches) {
      root.replaceChildren();
      ABOUT_LINES.forEach((line) => root.appendChild(buildTerminalLine(line, line.text || "")));
      return;
    }

    root.replaceChildren();
    let lineIndex = 0;
    let charIndex = 0;
    let current = null;
    let textTarget = null;

    const tick = () => {
      if (lineIndex >= ABOUT_LINES.length) {
        terminalTimers.delete(root);
        return;
      }
      const line = ABOUT_LINES[lineIndex];

      if (!current) {
        current = buildTerminalLine(line, "");
        root.appendChild(current);
        root.scrollTop = root.scrollHeight;
        if (line.kind === "gap") {
          lineIndex += 1;
          current = null;
          terminalTimers.set(root, window.setTimeout(tick, 70));
          return;
        }
        textTarget = line.kind === "cmd" ? current.querySelector(".term-text") : current;
        charIndex = 0;
        current.classList.add("is-typing");
      }

      const full = line.text || "";
      if (charIndex < full.length) {
        textTarget.textContent += full.charAt(charIndex);
        charIndex += 1;
        const ch = full.charAt(charIndex - 1);
        const delay = line.kind === "cmd" ? 26 : /[.,!?·—]/.test(ch) ? 18 : 8;
        root.scrollTop = root.scrollHeight;
        terminalTimers.set(root, window.setTimeout(tick, delay));
      } else {
        current.classList.remove("is-typing");
        lineIndex += 1;
        current = null;
        textTarget = null;
        terminalTimers.set(root, window.setTimeout(tick, line.kind === "cmd" ? 180 : 90));
      }
    };

    tick();
  };

  /* =========================================================
   * Modals (open/close + typing description)
   * =======================================================*/
  const stopTyping = (element) => {
    const timerId = typingTimers.get(element);
    if (timerId) {
      window.clearTimeout(timerId);
      typingTimers.delete(element);
    }
  };

  const reserveDescriptionHeight = (element) => {
    const fullText = element.dataset.fullText || "";
    stopTyping(element);
    if (!fullText) {
      element.style.minHeight = "0px";
      return;
    }
    const previousText = element.textContent;
    const previousVisibility = element.style.visibility;
    element.style.minHeight = "0px";
    element.style.visibility = "hidden";
    element.textContent = fullText;
    const reservedHeight = Math.ceil(element.getBoundingClientRect().height);
    element.style.minHeight = `${reservedHeight}px`;
    element.textContent = previousText;
    element.style.visibility = previousVisibility;
  };

  const typeDescription = (element) => {
    const fullText = element.dataset.fullText || "";
    stopTyping(element);
    if (prefersReducedMotion.matches) {
      element.textContent = fullText;
      return;
    }
    let index = 0;
    element.textContent = "";
    const tick = () => {
      if (index >= fullText.length) {
        typingTimers.delete(element);
        return;
      }
      element.textContent += fullText.charAt(index);
      index += 1;
      const previousChar = fullText.charAt(index - 1);
      const nextDelay = /[.,!?]/.test(previousChar) ? 14 : 5;
      const timerId = window.setTimeout(tick, nextDelay);
      typingTimers.set(element, timerId);
    };
    tick();
  };

  const prepareDescriptions = () => {
    document.querySelectorAll(".project-modal-description").forEach((description) => {
      if (!description.dataset.fullText) {
        description.dataset.fullText = description.textContent.replace(/\s+/g, " ").trim();
        description.textContent = description.dataset.fullText;
      }
    });
  };

  const closeDialog = (dialog) => {
    if (!dialog || !dialog.open) return;
    dialog.querySelectorAll(".project-modal-description").forEach((description) => {
      stopTyping(description);
      description.textContent = description.dataset.fullText || description.textContent;
    });
    dialog.querySelectorAll("[data-terminal]").forEach((terminal) => stopTerminal(terminal));
    if (prefersReducedMotion.matches) {
      dialog.classList.remove("is-opening", "is-closing");
      dialog.close();
      return;
    }
    dialog.classList.remove("is-opening");
    dialog.classList.add("is-closing");
    window.setTimeout(() => {
      if (dialog.open) dialog.close();
      dialog.classList.remove("is-closing");
    }, CLOSE_ANIMATION_MS);
  };

  const openDialog = (dialog) => {
    if (!dialog || dialog.open || typeof dialog.showModal !== "function") return;
    dialog.classList.remove("is-closing");
    dialog.showModal();
    if (!prefersReducedMotion.matches) {
      dialog.classList.add("is-opening");
      window.setTimeout(() => dialog.classList.remove("is-opening"), OPEN_ANIMATION_MS);
    }
    const descriptions = dialog.querySelectorAll(".project-modal-description");
    const terminals = dialog.querySelectorAll("[data-terminal]");
    window.requestAnimationFrame(() => {
      descriptions.forEach((description) => {
        reserveDescriptionHeight(description);
        typeDescription(description);
      });
      terminals.forEach((terminal) => startTerminal(terminal));
    });
  };

  document.querySelectorAll("[data-modal-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const dialog = document.getElementById(button.getAttribute("data-modal-target"));
      openDialog(dialog);
      closeSidebarOnMobile();
    });
  });

  document.querySelectorAll(".project-modal, .terminal-modal").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      const rect = dialog.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (!inside) closeDialog(dialog);
    });
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeDialog(dialog);
    });
    dialog.querySelectorAll("[data-close-modal]").forEach((closeButton) => {
      closeButton.addEventListener("click", () => closeDialog(dialog));
    });
  });

  prepareDescriptions();

  /* =========================================================
   * Contact terminal (interactive: message -> contact -> send)
   *
   * The destination webhook is kept out of plaintext via base64.
   * NOTE: this only deters casual scraping. On a static site the
   * endpoint is ultimately reachable by the client, so it cannot be
   * truly secret. A serverless proxy would be needed for real secrecy.
   * =======================================================*/
  const WEBHOOK_PARTS = [
    "aHR0cHM6Ly9kaXNjb3JkYXBwLmNvbS9hcGkvd2ViaG9va3MvMTUxMTgwNzg0MjE1NDE4ODgyMC9Fai05czk2",
    "RnVVbjBLU1k1djZvZjdQamswcjBkc1ZueWRJZ3pZdlZUekZUZjJMY0xPd3lpZ1dEc1RvaEl1VUpTVFBLVA==",
  ];
  const getWebhookUrl = () => {
    try {
      return window.atob(WEBHOOK_PARTS.join(""));
    } catch (_) {
      return "";
    }
  };

  const contactState = new WeakMap();

  const appendContactLine = (root, opts) => {
    const el = document.createElement("div");
    el.className = "term-line";
    if (opts.kind === "gap") {
      el.classList.add("term-gap");
      root.appendChild(el);
      return el;
    }
    if (opts.kind === "cmd") {
      el.classList.add("term-cmd");
      const prompt = document.createElement("span");
      prompt.className = "term-prompt";
      prompt.textContent = opts.prompt || "$";
      const span = document.createElement("span");
      span.className = "term-text";
      span.textContent = opts.text || "";
      el.append(prompt, document.createTextNode(" "), span);
    } else {
      el.classList.add("term-out");
      if (opts.cls) el.classList.add(opts.cls);
      el.textContent = opts.text || "";
    }
    root.appendChild(el);
    root.scrollTop = root.scrollHeight;
    return el;
  };

  const stopContactTerminal = (root) => {
    const state = contactState.get(root);
    if (state && state.timer) window.clearTimeout(state.timer);
    contactState.delete(root);
    root.replaceChildren();
  };

  const postToDiscord = async (message, contact) => {
    const url = getWebhookUrl();
    if (!url) return false;
    const content = [
      "**New portfolio message**",
      "**Message:** " + message,
      "**Contact:** " + contact,
    ].join("\n");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "Portfolio Contact",
          content,
          // Never let a submitted message ping anyone.
          allowed_mentions: { parse: [] },
        }),
      });
      return res.ok;
    } catch (_) {
      return false;
    }
  };

  const startContactTerminal = (root) => {
    stopContactTerminal(root);
    const state = { timer: 0 };
    contactState.set(root, state);
    root.replaceChildren();

    const intro = [
      { kind: "cmd", text: "contact --new" },
      { kind: "out", text: "Leave a message below, plus a phone number or email," },
      { kind: "out", text: "and I'll get back to you as soon as I can." },
      { kind: "gap" },
    ];

    const showPrompt = (label, hint, onSubmit) => {
      appendContactLine(root, { kind: "out", text: hint });
      const line = document.createElement("div");
      line.className = "term-line term-cmd term-input-line";
      const prompt = document.createElement("span");
      prompt.className = "term-prompt";
      prompt.textContent = label;
      const input = document.createElement("input");
      input.className = "term-field";
      input.type = "text";
      input.autocomplete = "off";
      input.spellcheck = false;
      input.setAttribute("aria-label", hint);
      line.append(prompt, document.createTextNode(" "), input);
      root.appendChild(line);
      root.scrollTop = root.scrollHeight;
      input.focus();

      input.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        const value = input.value.trim();
        if (!value) return;
        input.remove();
        const span = document.createElement("span");
        span.className = "term-text";
        span.textContent = value;
        line.appendChild(span);
        line.classList.remove("term-input-line");
        onSubmit(value);
      });
    };

    const promptMessage = () => {
      showPrompt("message>", "What would you like to say?", (message) => {
        appendContactLine(root, { kind: "gap" });
        promptContact(message);
      });
    };

    const promptContact = (message) => {
      showPrompt("contact>", "How can I reach you? (phone, email, etc.)", (contact) => {
        appendContactLine(root, { kind: "gap" });
        sendMessage(message, contact);
      });
    };

    const sendMessage = async (message, contact) => {
      const status = appendContactLine(root, { kind: "out", text: "Sending…" });
      const ok = await postToDiscord(message, contact);
      if (contactState.get(root) !== state) return; // window was closed/reset
      if (ok) {
        status.textContent = "✓ Message sent — thanks for reaching out! I'll be in touch soon.";
        status.classList.add("term-ok");
      } else {
        status.textContent = "✗ Couldn't send right now. Please email cam.lambertt@gmail.com instead.";
        status.classList.add("term-err");
      }
    };

    const typeIntro = (done) => {
      if (prefersReducedMotion.matches) {
        intro.forEach((line) => appendContactLine(root, line));
        done();
        return;
      }
      let lineIndex = 0;
      let charIndex = 0;
      let current = null;
      let target = null;
      const tick = () => {
        if (lineIndex >= intro.length) {
          done();
          return;
        }
        const line = intro[lineIndex];
        if (!current) {
          current = appendContactLine(root, { ...line, text: "" });
          if (line.kind === "gap") {
            lineIndex += 1;
            current = null;
            state.timer = window.setTimeout(tick, 70);
            return;
          }
          target = line.kind === "cmd" ? current.querySelector(".term-text") : current;
          charIndex = 0;
          current.classList.add("is-typing");
        }
        const full = line.text || "";
        if (charIndex < full.length) {
          target.textContent += full.charAt(charIndex);
          charIndex += 1;
          root.scrollTop = root.scrollHeight;
          state.timer = window.setTimeout(tick, line.kind === "cmd" ? 24 : 7);
        } else {
          current.classList.remove("is-typing");
          lineIndex += 1;
          current = null;
          target = null;
          state.timer = window.setTimeout(tick, line.kind === "cmd" ? 160 : 70);
        }
      };
      tick();
    };

    typeIntro(promptMessage);
  };

  /* =========================================================
   * Floating windows (draggable, non-modal)
   * =======================================================*/
  const positionWindowDefault = (win) => {
    if (win.dataset.positioned === "1") return;
    const w = win.offsetWidth;
    const rightMargin = Math.max(24, Math.round(window.innerWidth * 0.06));
    const left = Math.max(12, window.innerWidth - w - rightMargin);
    const top = Math.max(64, Math.round(window.innerHeight * 0.12));
    win.style.left = `${left}px`;
    win.style.top = `${top}px`;
  };

  const openWindow = (win) => {
    if (!win) return;
    // Only one floating terminal window at a time — they share a default
    // position and would otherwise overlap and fight for focus.
    floatWindows.forEach((other) => {
      if (other !== win) closeWindow(other);
    });
    win.hidden = false;
    positionWindowDefault(win);
    win.querySelectorAll("[data-terminal]").forEach((terminal) => startTerminal(terminal));
    win.querySelectorAll("[data-contact-terminal]").forEach((terminal) => startContactTerminal(terminal));
    const closeBtn = win.querySelector("[data-window-close]");
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  };

  const closeWindow = (win) => {
    if (!win || win.hidden) return;
    win.hidden = true;
    win.querySelectorAll("[data-terminal]").forEach((terminal) => stopTerminal(terminal));
    win.querySelectorAll("[data-contact-terminal]").forEach((terminal) => stopContactTerminal(terminal));
  };

  const enableWindowDrag = (win) => {
    const handle = win.querySelector("[data-window-drag]");
    if (!handle) return;
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let originLeft = 0;
    let originTop = 0;

    const onPointerDown = (event) => {
      if (event.button !== 0 || event.target.closest("[data-window-close]")) return;
      dragging = true;
      const rect = win.getBoundingClientRect();
      originLeft = rect.left;
      originTop = rect.top;
      startX = event.clientX;
      startY = event.clientY;
      win.dataset.positioned = "1";
      win.classList.add("is-dragging");
      if (handle.setPointerCapture) handle.setPointerCapture(event.pointerId);
      event.preventDefault();
    };

    const onPointerMove = (event) => {
      if (!dragging) return;
      const w = win.offsetWidth;
      const h = win.offsetHeight;
      let nextLeft = originLeft + (event.clientX - startX);
      let nextTop = originTop + (event.clientY - startY);
      nextLeft = Math.min(Math.max(8, nextLeft), window.innerWidth - w - 8);
      nextTop = Math.min(Math.max(44, nextTop), window.innerHeight - h - 8);
      win.style.left = `${nextLeft}px`;
      win.style.top = `${nextTop}px`;
    };

    const onPointerUp = () => {
      if (!dragging) return;
      dragging = false;
      win.classList.remove("is-dragging");
    };

    handle.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const floatWindows = Array.from(document.querySelectorAll(".float-window"));
  floatWindows.forEach((win) => {
    enableWindowDrag(win);
    win.querySelectorAll("[data-window-close]").forEach((btn) =>
      btn.addEventListener("click", () => closeWindow(win))
    );
  });

  document.querySelectorAll("[data-window-open]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const win = document.getElementById(btn.getAttribute("data-window-open"));
      openWindow(win);
      closeSidebarOnMobile();
    });
  });

  /* =========================================================
   * Command palette
   * =======================================================*/
  const overlay = document.querySelector("[data-palette]");
  const paletteInput = document.querySelector("[data-palette-input]");
  const paletteList = document.querySelector("[data-palette-list]");
  let paletteActiveIndex = 0;
  let paletteFiltered = [];

  const COMMANDS = [
    {
      icon: "PDF",
      label: "Open resume",
      hint: "view",
      run: () => openDialog(document.getElementById("resume-modal")),
    },
    {
      icon: "@",
      label: "Copy email address",
      hint: "cam.lambertt@gmail.com",
      run: async () => {
        try {
          await navigator.clipboard.writeText("cam.lambertt@gmail.com");
        } catch (_) {
          window.location.href = "mailto:cam.lambertt@gmail.com";
        }
      },
    },
    {
      icon: "in",
      label: "Open LinkedIn",
      hint: "external",
      run: () => window.open("https://www.linkedin.com/in/cameron-gaudian-49499429a/", "_blank", "noopener"),
    },
    {
      icon: "gh",
      label: "Open GitHub",
      hint: "external",
      run: () => window.open("https://github.com/camgaudian", "_blank", "noopener"),
    },
  ];

  const renderPalette = (query = "") => {
    if (!paletteList) return;
    const q = query.trim().toLowerCase();
    paletteFiltered = COMMANDS.filter(
      (c) => !q || c.label.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q)
    );
    paletteActiveIndex = 0;
    paletteList.replaceChildren();

    if (paletteFiltered.length === 0) {
      const empty = document.createElement("li");
      empty.className = "palette-empty";
      empty.textContent = "No matching commands";
      paletteList.appendChild(empty);
      return;
    }

    paletteFiltered.forEach((cmd, i) => {
      const li = document.createElement("li");
      li.className = "palette-item" + (i === 0 ? " is-active" : "");
      li.setAttribute("role", "option");
      li.innerHTML = `<span class="pi-icon">${cmd.icon}</span><span class="pi-label"></span><span class="pi-hint"></span>`;
      li.querySelector(".pi-label").textContent = cmd.label;
      li.querySelector(".pi-hint").textContent = cmd.hint;
      li.addEventListener("click", () => runPaletteItem(i));
      li.addEventListener("mousemove", () => setPaletteActive(i));
      paletteList.appendChild(li);
    });
  };

  const setPaletteActive = (index) => {
    paletteActiveIndex = index;
    Array.from(paletteList.children).forEach((el, i) =>
      el.classList.toggle("is-active", i === index)
    );
  };

  const runPaletteItem = (index) => {
    const cmd = paletteFiltered[index];
    if (!cmd) return;
    closePalette();
    cmd.run();
  };

  const openPalette = () => {
    if (!overlay) return;
    overlay.hidden = false;
    renderPalette("");
    if (paletteInput) {
      paletteInput.value = "";
      paletteInput.focus();
    }
  };

  const closePalette = () => {
    if (!overlay) return;
    overlay.hidden = true;
  };

  document.querySelectorAll("[data-open-palette]").forEach((btn) =>
    btn.addEventListener("click", openPalette)
  );

  if (paletteInput) {
    paletteInput.addEventListener("input", (e) => renderPalette(e.target.value));
    paletteInput.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setPaletteActive(Math.min(paletteActiveIndex + 1, paletteFiltered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setPaletteActive(Math.max(paletteActiveIndex - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        runPaletteItem(paletteActiveIndex);
      } else if (e.key === "Escape") {
        closePalette();
      }
    });
  }

  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closePalette();
    });
  }

  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (overlay && overlay.hidden) openPalette();
      else closePalette();
    } else if (e.key === "Escape" && overlay && !overlay.hidden) {
      closePalette();
    } else if (e.key === "Escape") {
      floatWindows.forEach((win) => closeWindow(win));
    }
  });

  /* =========================================================
   * Init
   * =======================================================*/
  const init = () => {
    setActiveSection("home");
    buildGutter();
  };

  if (document.readyState === "complete") init();
  else window.addEventListener("load", init);

  let resizeRaf = 0;
  window.addEventListener("resize", () => {
    if (resizeRaf) window.cancelAnimationFrame(resizeRaf);
    resizeRaf = window.requestAnimationFrame(buildGutter);
  });
})();
