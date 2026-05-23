/*=== CUSTOM IMBALI SCRIPT ===========

01. ()
02. ()
03. ()
04. ()
05. ()
06. ()
07. ()
08. ()
09. ()
10. ()
11. ()
12. ()
13. ()
14. ()


==================================================*/

/**
 * IMBALI — Header Pill + Menu Panel
 * Put this in your separate .js file (NO <script> tags).
 * Requires:
 *  - header element:   id="siteHeader"
 *  - menu button:      id="menuToggle"
 *  - dropdown panel:   id="menuPanel"
 *
 * CSS classes used:
 *  - is-top            (pill visible at top of page)
 *  - is-compact        (stronger pill on scroll)
 *  - header-visible    (drop-in animation for compact state)
 *  - active            (hamburger -> X)
 *  - open              (panel expanded)
 *  - html.imbali-pill-prelude       (desktop: pre-pill — logo + MENU fade, bar slides up)
 *  - html.imbali-pill-compact-active (desktop: bar stays tucked while pill is shown)
 */


(function () {
  if (window.__imbaliHeaderPillInit) return;
  window.__imbaliHeaderPillInit = true;

  const header = document.getElementById("siteHeader");
  const menuToggle = document.getElementById("menuToggle");
  const menuPanel = document.getElementById("menuPanel");
  const root = document.documentElement;

  if (!header) return;

  const COMPACT_AFTER = 100;
  const LINKS_INWARD_AFTER = 120; // links reach full inward earlier than pill appears
  const TOP_THRESHOLD = 10;
  /** Bootstrap `md` — must match CSS: bar hidden only below 768px (`max-width: 767.98px`). */
  const MOBILE_BREAKPOINT = 768;
  /** Desktop only: duration to match CSS (fade + bar slide) before pill classes apply */
  const PILL_PRELUDE_MS = 360;
  /** Must be >= top-row close fade duration so we never drop `.menu-open` while the row is still visible */
  const TOP_ROW_CLOSE_FADE_MS = 480;
  const TOP_ROW_CLOSE_ANIM_MS = 420;

  let showTimer = null;
  let hideTimer = null;

  function clearTimers() {
    if (showTimer) {
      clearTimeout(showTimer);
      showTimer = null;
    }
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  }

  function isDesktopPill() {
    return window.innerWidth >= MOBILE_BREAKPOINT;
  }

  function isPillVisuallyShowing() {
    return header.classList.contains("is-compact") && header.classList.contains("header-visible");
  }

  /** Clears Web Animations API fades on logo link + MENU + VIEW PACKAGES (see closeMenu). */
  function imbaliCancelTopRowFade(navWrap) {
    const els = [
      navWrap && navWrap.querySelector(".main__logo > a"),
      menuToggle,
      navWrap && navWrap.querySelector(".nav-packages"),
    ];
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      if (!el) continue;
      if (typeof el.getAnimations === "function") {
        el.getAnimations().forEach(function (a) {
          a.cancel();
        });
      }
      el.style.removeProperty("opacity");
      el.style.removeProperty("transition");
    }
  }

  function imbaliStripTopRowReveal(navWrap) {
    if (!navWrap) return;
    navWrap.classList.remove("imbali-toprow-reveal", "imbali-toprow-reveal-active");
    if (navWrap._imbaliTopRevealTimer) {
      clearTimeout(navWrap._imbaliTopRevealTimer);
      navWrap._imbaliTopRevealTimer = null;
    }
  }

  /** Without this, CSS `.site-header.is-compact { opacity: 0.01 }` wins and the whole pill looks empty. */
  function imbaliEnsureCompactHeaderVisible() {
    if (header.classList.contains("is-compact") && !header.classList.contains("header-visible")) {
      header.classList.add("header-visible");
    }
  }

  /** Top-row close fade — WAAPI so theme / stacking / transition batching cannot suppress it (CSS-only fade was unreliable). */
  function imbaliStartTopRowCloseFade(navWrap) {
    if (!navWrap) return;
    imbaliCancelTopRowFade(navWrap);
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = TOP_ROW_CLOSE_ANIM_MS;
    const easing = "cubic-bezier(0.22, 0.61, 0.36, 1)";
    const els = [
      navWrap.querySelector(".main__logo > a"),
      menuToggle,
      navWrap.querySelector(".nav-packages"),
    ];
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      if (!el) continue;
      if (reduced) {
        el.style.opacity = "0";
        continue;
      }
      if (typeof el.animate === "function") {
        const raw = window.getComputedStyle(el).opacity;
        const parsed = parseFloat(raw);
        const from = Number.isFinite(parsed) ? parsed : 1;
        el.animate([{ opacity: from }, { opacity: 0 }], {
          duration: duration,
          easing: easing,
          fill: "forwards",
        });
      } else {
        el.style.transition = "opacity " + duration + "ms " + easing;
        void el.offsetWidth;
        el.style.opacity = "0";
      }
    }
  }

  function openMenu() {
    if (!menuToggle || !menuPanel) return;
    menuToggle.classList.add("active");
    menuPanel.classList.add("open");

    // add a helper class to the nav wrapper to “merge” the shape if desired
    const navWrap = menuToggle.closest(".main__nav__custom");
    if (navWrap) {
      imbaliCancelTopRowFade(navWrap);
      navWrap.classList.remove("menu-closing");
      navWrap.classList.remove("imbali-toprow-reveal");
      navWrap.classList.remove("imbali-toprow-reveal-active");
      navWrap.classList.add("menu-open");
    }
  }

  /** After closing the dropdown, softly fade logo + MENU + VIEW PACKAGES back in (CSS `.imbali-toprow-reveal` + `.imbali-toprow-reveal-active`). Pill / is-top only. */
  function scheduleTopRowReveal(navWrap) {
    if (!navWrap) return;
    const pillHeader =
      header.classList.contains("is-compact") || header.classList.contains("is-top");
    if (!pillHeader) {
      imbaliCancelTopRowFade(navWrap);
      imbaliStripTopRowReveal(navWrap);
      return;
    }
    imbaliStripTopRowReveal(navWrap);
    void navWrap.offsetWidth;
    navWrap.classList.add("imbali-toprow-reveal");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        navWrap.classList.add("imbali-toprow-reveal-active");
      });
    });
    navWrap._imbaliTopRevealTimer = setTimeout(() => {
      navWrap.classList.remove("imbali-toprow-reveal", "imbali-toprow-reveal-active");
      navWrap._imbaliTopRevealTimer = null;
    }, 850);
  }

  function closeMenu(onAfterClose) {
    if (!menuToggle || !menuPanel) return;
    const wasOpen = menuPanel.classList.contains("open");

    menuToggle.classList.remove("active");
    menuPanel.classList.remove("open");

    const navWrap = menuToggle.closest(".main__nav__custom");
    if (navWrap) {
      navWrap.classList.remove("menu-closing");
      delete navWrap._imbaliMenuCloseFadeT0;
    }
    /* Two frames after panel “open” drops so opacity:0 applies in a separate style flush — otherwise browsers often skip the transition. */
    if (wasOpen && navWrap) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          navWrap.classList.add("menu-closing");
          navWrap._imbaliMenuCloseFadeT0 = performance.now();
          imbaliStartTopRowCloseFade(navWrap);
        });
      });
    }

    const finalizeClose = () => {
      if (navWrap) {
        imbaliCancelTopRowFade(navWrap);
        navWrap.classList.remove("menu-open");
        navWrap.classList.remove("menu-closing");
        delete navWrap._imbaliMenuCloseFadeT0;
      }
      if (typeof onAfterClose === "function") onAfterClose();
      /* Second cancel + strip reveal after header classes settle (e.g. full bar); avoids stuck WAAPI opacity:0. */
      if (navWrap) {
        imbaliCancelTopRowFade(navWrap);
        imbaliStripTopRowReveal(navWrap);
      }
      imbaliEnsureCompactHeaderVisible();
      if (wasOpen && navWrap) scheduleTopRowReveal(navWrap);
    };

    if (!wasOpen) {
      finalizeClose();
      return;
    }

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      menuPanel.removeEventListener("transitionend", onEnd);
      if (menuPanel._imbaliCloseFallback) {
        clearTimeout(menuPanel._imbaliCloseFallback);
        menuPanel._imbaliCloseFallback = null;
      }
      const fadeStart =
        navWrap && typeof navWrap._imbaliMenuCloseFadeT0 === "number"
          ? navWrap._imbaliMenuCloseFadeT0
          : performance.now();
      const elapsed = performance.now() - fadeStart;
      const waitFade = Math.max(0, TOP_ROW_CLOSE_FADE_MS - elapsed);
      setTimeout(finalizeClose, waitFade);
    };

    const onEnd = (e) => {
      if (e.target !== menuPanel) return;
      if (e.propertyName !== "max-height") return;
      finish();
    };

    if (menuPanel._imbaliCloseFallback) {
      clearTimeout(menuPanel._imbaliCloseFallback);
      menuPanel._imbaliCloseFallback = null;
    }
    menuPanel.addEventListener("transitionend", onEnd);
    // Fallback in case transitionend is skipped (rare browser/layout edge cases).
    menuPanel._imbaliCloseFallback = setTimeout(finish, 520);
  }

  function isMenuOpen() {
    return !!(menuPanel && menuPanel.classList.contains("open"));
  }

  function isSamePageHashHref(href) {
    if (!href || href[0] !== "#") return false;
    if (href === "#") return false;
    return true;
  }

  function scrollToHash(href) {
    const id = href.slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    if (typeof history !== "undefined" && history.pushState) {
      try {
        history.pushState(null, "", href);
      } catch (e) {
        /* ignore */
      }
    }
  }

  function applyCompactImmediate() {
    clearTimers();
    /* Keep top bar tucked: add compact-active before dropping prelude (avoids one frame at translateY(0)). */
    if (isDesktopPill()) {
      root.classList.add("imbali-pill-compact-active");
    }
    root.classList.remove("imbali-pill-prelude");
    header.classList.remove("is-top");
    header.classList.remove("header-visible");
    header.classList.add("is-compact");
    header.classList.add("header-visible");
    if (!isDesktopPill()) {
      root.classList.remove("imbali-pill-compact-active");
    }
  }

  function setCompact(next) {
    if (next) {
      if (isPillVisuallyShowing()) {
        if (isDesktopPill()) root.classList.add("imbali-pill-compact-active");
        return;
      }

      if (showTimer !== null) {
        return;
      }

      if (!isDesktopPill()) {
        applyCompactImmediate();
        return;
      }

      clearTimers();
      root.classList.add("imbali-pill-prelude");
      root.classList.remove("imbali-pill-compact-active");
      showTimer = setTimeout(() => {
        showTimer = null;
        root.classList.add("imbali-pill-compact-active");
        root.classList.remove("imbali-pill-prelude");
        header.classList.remove("is-top");
        header.classList.remove("header-visible");
        header.classList.add("is-compact");
        header.classList.add("header-visible");
      }, PILL_PRELUDE_MS);
      return;
    }

    clearTimers();
    root.classList.remove("imbali-pill-prelude");
    root.classList.remove("imbali-pill-compact-active");
    header.classList.remove("is-compact");
    header.classList.remove("header-visible");
    header.classList.remove("is-top");
  }

  // 0 = buttons outward, 1 = buttons fully inward (links move inward over shorter scroll range)
  function getNavInwardProgress(y) {
    if (y <= TOP_THRESHOLD) return 0;
    if (y >= LINKS_INWARD_AFTER) return 1;
    return (y - TOP_THRESHOLD) / (LINKS_INWARD_AFTER - TOP_THRESHOLD);
  }

  /** Coalesce rapid scroll events to once per animation frame (less main-thread work while scrolling). */
  let scrollRaf = 0;
  function onScrollImpl() {
    const y = window.scrollY || 0;
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;

    // If menu is open, keep pill and panel open at any scroll position (no close on scroll)
    if (isMenuOpen()) {
      setCompact(true);
      header.style.setProperty("--nav-inward-progress", "1");
      return;
    }

    // On mobile, always keep the pill/compact header.
    // This prevents switching back to the desktop header styling after the top threshold.
    if (isMobile) {
      setCompact(true);
      header.style.setProperty("--nav-inward-progress", "1");
      header.style.setProperty("--header-links-opacity", "1");
      return;
    }

    // At the top (menu closed): pill disappears on desktop; on mobile keep pill
    if (y <= TOP_THRESHOLD) {
      if (window.innerWidth < MOBILE_BREAKPOINT) {
        setCompact(true);
        header.style.setProperty("--nav-inward-progress", "1");
        return;
      }
      closeMenu();
      clearTimers();
      setCompact(false);
      header.style.setProperty("--nav-inward-progress", "0");
      header.style.setProperty("--header-links-opacity", "1");
      return;
    }

    // Normal compact behavior when menu closed
    setCompact(y > COMPACT_AFTER);

    // Set progress after compact state so links don’t briefly go outward before inward
    const progress = header.classList.contains("is-compact")
      ? 1
      : getNavInwardProgress(y);
    header.style.setProperty("--nav-inward-progress", String(progress));

    // Page header (non-pill): fade out links completely by 100px scroll
    if (!header.classList.contains("is-compact")) {
      const linkOpacity = y >= 100 ? 0 : Math.max(0, 1 - y / 100);
      header.style.setProperty("--header-links-opacity", String(linkOpacity));
    }
  }

  function onScroll() {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(function () {
      scrollRaf = 0;
      onScrollImpl();
    });
  }

  // Toggle menu
  if (menuToggle && menuPanel) {
    menuToggle.addEventListener("click", function () {
      if (isMenuOpen()) {
        const atTopDesktop =
          window.scrollY <= TOP_THRESHOLD &&
          window.innerWidth >= MOBILE_BREAKPOINT;

        if (atTopDesktop) {
          // Keep pill state while panel collapses, then switch to full bar.
          closeMenu(() => {
            setCompact(false);
            header.style.setProperty("--nav-inward-progress", "0");
            header.style.setProperty("--header-links-opacity", "1");
          });
          return;
        }

        closeMenu();
      } else {
        header.style.setProperty("--nav-inward-progress", "1");
        if (isDesktopPill()) {
          /*
           * Menu from full-width header: setCompact(true) alone waits 360ms before is-compact, so the panel
           * opens on the wide bar and the pill snaps in later — reads as the expanded pill flashing.
           * applyCompactImmediate() applies pill + tucked top bar immediately (same end state as mobile).
           */
          clearTimers();
          if (isPillVisuallyShowing()) {
            root.classList.add("imbali-pill-compact-active");
          } else {
            applyCompactImmediate();
          }
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              openMenu();
            });
          });
        } else {
          setCompact(true);
          openMenu();
        }
      }
    });
  }

  /*
   * Pill expanded (menu-open): same-page # links must not scroll until the panel has finished
   * closing — otherwise layout/offset is wrong and the jump feels broken.
   */
  header.addEventListener(
    "click",
    function (e) {
      const link = e.target.closest("a");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!isSamePageHashHref(href)) return;
      const navWrap = menuToggle && menuToggle.closest(".main__nav__custom");
      if (!navWrap || !navWrap.classList.contains("menu-open")) return;
      e.preventDefault();
      closeMenu(function () {
        scrollToHash(href);
        requestAnimationFrame(function () {
          requestAnimationFrame(onScrollImpl);
        });
      });
    },
    true
  );

  // Panel only collapses when menu button is pressed or page is at top (no ESC close)

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScrollImpl();
})();

/** Studio inbox — opens mailto even if another script/CSS interferes with normal link activation */
(function () {
  var STUDIO_MAIL = "mailto:info@imbali.studio";
  document.addEventListener(
    "click",
    function (e) {
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest("a");
      if (!a) return;
      var raw = (a.getAttribute("href") || "").trim();
      if (!raw) return;
      var path = raw.split("#")[0];
      var low = path.toLowerCase();
      var q = low.indexOf("?");
      var base = q === -1 ? low : low.slice(0, q);
      if (base !== "mailto:info@imbali.studio") return;
      e.preventDefault();
      e.stopImmediatePropagation();
      window.location.href = path;
    },
    true
  );
})();

/** Back to top — vanilla, instant (main.js also binds jQuery 1000ms animate; we take the click first). */
(function () {
  const btn = document.getElementById("rts-back-to-top");
  if (!btn) return;
  btn.addEventListener(
    "click",
    function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      const html = document.documentElement;
      const body = document.body;
      const prevH = html.style.scrollBehavior;
      const prevB = body.style.scrollBehavior;
      html.style.scrollBehavior = "auto";
      body.style.scrollBehavior = "auto";
      window.scrollTo(0, 0);
      html.style.scrollBehavior = prevH;
      body.style.scrollBehavior = prevB;
    },
    { capture: true }
  );
})();

/** About section — slight image parallax (scroll-linked translate; no Jarallax). */
(function () {
  const frame = document.querySelector(
    ".about__area.is__home__one .imbali-about-parallax-frame"
  );
  const shift = document.querySelector(
    ".about__area.is__home__one .imbali-about-parallax-shift"
  );
  if (!frame || !shift) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let ticking = false;
  const MAX_SHIFT = 52;
  const SCALE = 1.16;

  function update() {
    ticking = false;
    const rect = frame.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const mid = rect.top + rect.height / 2;
    const dist = mid - vh * 0.5;
    let y = (-dist / vh) * (MAX_SHIFT * 1.68);
    y = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, y));
    shift.style.transform =
      "translate3d(0, " + y.toFixed(2) + "px, 0) scale(" + SCALE + ")";
  }

  function onScrollOrResize() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  function nudgeWowLayout() {
    window.dispatchEvent(new Event("resize"));
    window.dispatchEvent(new Event("scroll"));
  }

  /* Defer scripts run after DOM parse — attach immediately (do not wait for `load`,
   * or parallax may never arm if `load` was missed or delayed). */
  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize, { passive: true });
  requestAnimationFrame(function () {
    requestAnimationFrame(update);
  });

  window.addEventListener(
    "load",
    function () {
      nudgeWowLayout();
      update();
    },
    { once: true }
  );
})();

/** Feature cards — parallax inside each window (.imbali-feature-thumb-parallax-shift), synced scroll vs section. */
(function () {
  const section = document.querySelector(".imbali-feature-cards-section");
  const shifts = document.querySelectorAll(".imbali-feature-thumb-parallax-shift");
  if (!section || !shifts.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let ticking = false;
  const MAX_SHIFT = 72;
  const mqParallax = window.matchMedia("(min-width: 768px)");

  function update() {
    ticking = false;
    if (!mqParallax.matches) {
      shifts.forEach(function (el) {
        el.style.transform = "";
      });
      return;
    }
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const mid = rect.top + rect.height / 2;
    const dist = mid - vh * 0.5;
    let y = (-dist / vh) * (MAX_SHIFT * 1.85);
    y = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, y));
    const t = "translate3d(0, " + y.toFixed(2) + "px, 0)";
    shifts.forEach(function (el) {
      el.style.transform = t;
    });
  }

  function onScrollOrResize() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize, { passive: true });
  if (typeof mqParallax.addEventListener === "function") {
    mqParallax.addEventListener("change", onScrollOrResize);
  } else if (typeof mqParallax.addListener === "function") {
    mqParallax.addListener(onScrollOrResize);
  }
  requestAnimationFrame(function () {
    requestAnimationFrame(update);
  });

  window.addEventListener(
    "load",
    function () {
      update();
    },
    { once: true }
  );
})();

/** Hero background video — inline playback + muted autoplay on mobile; defer heavy MP4 on narrow viewports. */
(function () {
  var hero = document.getElementById("imbali-hero");
  var v = document.getElementById("imbali-hero-video");
  if (!hero || !v) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    try {
      v.pause();
      v.removeAttribute("autoplay");
    } catch (e) {}
    return;
  }

  v.muted = true;
  v.defaultMuted = true;
  v.setAttribute("muted", "");

  function attemptPlay() {
    var p = v.play();
    if (p && typeof p.then === "function") {
      p.catch(function () {});
    }
  }

  var mqMobile = window.matchMedia("(max-width: 767.98px)");
  function heroVideoUrl() {
    return window.matchMedia("(max-width: 576px)").matches
      ? "assets/images/video/Imbali_Hero_576.mp4"
      : "assets/images/video/Imbali_Hero.mp4";
  }
  var deferMobileLoad = mqMobile.matches;

  if (deferMobileLoad) {
    while (v.firstChild) {
      v.removeChild(v.firstChild);
    }
    v.removeAttribute("src");
    try {
      v.load();
    } catch (e2) {}

    var attached = false;

    function attachSrc() {
      if (attached) return;
      attached = true;
      v.src = heroVideoUrl();
      try {
        v.load();
      } catch (e3) {}
      attemptPlay();
    }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              attachSrc();
              io.disconnect();
            }
          });
        },
        { rootMargin: "100px 0px", threshold: 0.01 }
      );
      io.observe(hero);
    }

    window.addEventListener(
      "load",
      function () {
        if (!attached) attachSrc();
      },
      { once: true }
    );
  }

  v.addEventListener("loadeddata", attemptPlay);
  v.addEventListener("canplay", attemptPlay);
  window.addEventListener("load", attemptPlay, { once: true });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && v.paused) attemptPlay();
  });

  if (!deferMobileLoad) {
    attemptPlay();
  }
})();
