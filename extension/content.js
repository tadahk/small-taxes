// small taxes — content script
// doomscroll tax: on feed sites, the longer you scroll, the slower the page scrolls. resets when the tab closes.
// tab tax: every tab past the limit makes pages a little greyer.

const taxes = {
  DEFAULTS: {
    scrollOn: true,
    tabOn: true,
    tabLimit: 10,
    sites: [
      "x.com", "twitter.com", "reddit.com", "facebook.com", "instagram.com",
      "linkedin.com", "threads.net", "threads.com", "bsky.app", "tumblr.com",
      "pinterest.com", "youtube.com", "news.ycombinator.com"
    ]
  },

  GRACE_SECONDS: 60,   // first minute of scrolling is free
  FLOOR: 0.1,          // never slower than 10% speed

  // speed multiplier for a given number of seconds spent scrolling
  speed(seconds) {
    const over = Math.max(0, seconds - taxes.GRACE_SECONDS) / 60; // minutes past the grace period
    return Math.max(taxes.FLOOR, 1 / (1 + over / 2));            // 3 min: 50%, 5 min: 33%, 9 min: 20%
  },

  // greyscale amount (0 to 1) for a tab count
  grey(tabCount, limit) {
    return Math.min(1, Math.max(0, tabCount - limit) * 0.1);
  },

  // does this hostname fall under one of the listed sites
  isListed(hostname, sites) {
    const host = String(hostname || "").toLowerCase().replace(/^www\./, "");
    return (sites || []).some((raw) => {
      const d = String(raw).trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
      return d && (host === d || host.endsWith("." + d));
    });
  },

  // wheel delta in pixels
  pixels(delta, mode, pageHeight) {
    if (mode === 1) return delta * 16;
    if (mode === 2) return delta * pageHeight;
    return delta;
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = taxes;
} else if (window.top === window) {
  (() => {
    let s = { ...taxes.DEFAULTS };
    let tabCount = 0;

    // ---------- tab tax ----------
    const style = document.createElement("style");
    style.id = "small-taxes";
    let shown = 0;
    const applyGrey = () => {
      const g = s.tabOn ? taxes.grey(tabCount, s.tabLimit) : 0;
      if (g === shown && style.isConnected) return;
      shown = g;
      style.textContent = g
        ? `html{filter:grayscale(${g.toFixed(2)}) !important;transition:filter .8s ease}`
        : "";
      if (!style.isConnected) (document.head || document.documentElement).appendChild(style);
    };

    // ---------- doomscroll tax ----------
    const KEY = "small-taxes:scroll-seconds";
    let seconds = 0;
    try { seconds = Number(sessionStorage.getItem(KEY)) || 0; } catch (e) {}
    let last = 0;
    let saved = 0;
    let dirty = false;
    const tick = () => {
      dirty = true;
      const now = performance.now();
      if (last) seconds += Math.min((now - last) / 1000, 1);
      last = now;
      if (now - saved > 2000) {
        saved = now;
        try { sessionStorage.setItem(KEY, String(seconds)); } catch (e) {}
      }
    };
    const save = () => { if (dirty) try { sessionStorage.setItem(KEY, String(seconds)); } catch (e) {} };
    addEventListener("pagehide", save);

    const taxing = () => s.scrollOn && taxes.isListed(location.hostname, s.sites);

    const canScroll = (el, dy) => {
      if (dy > 0) return el.scrollTop + el.clientHeight < el.scrollHeight - 1;
      return el.scrollTop > 0;
    };
    const scroller = (start, dy) => {
      for (let el = start; el && el.nodeType === 1; el = el.parentElement) {
        if (el === document.body || el === document.documentElement) break;
        const oy = getComputedStyle(el).overflowY;
        if ((oy === "auto" || oy === "scroll" || oy === "overlay") &&
            el.scrollHeight > el.clientHeight + 1 && canScroll(el, dy)) return el;
      }
      return document.scrollingElement || document.documentElement;
    };

    const owed = new WeakMap(); // fractional pixels carried over per element
    const move = (el, dy) => {
      const total = (owed.get(el) || 0) + dy;
      const step = Math.trunc(total);
      owed.set(el, total - step);
      if (step) el.scrollBy({ top: step, behavior: "instant" });
    };

    addEventListener("wheel", (e) => {
      if (!taxing() || e.ctrlKey || e.defaultPrevented) return;
      const dy = taxes.pixels(e.deltaY, e.deltaMode, innerHeight);
      const dx = taxes.pixels(e.deltaX, e.deltaMode, innerWidth);
      if (!dy || Math.abs(dx) > Math.abs(dy)) return; // leave sideways scrolling alone
      tick();
      const f = taxes.speed(seconds);
      if (f >= 0.999) return;
      e.preventDefault();
      move(scroller(e.target, dy), dy * f);
    }, { capture: true, passive: false });

    const KEYS = { ArrowDown: 40, ArrowUp: -40, PageDown: 0.85, PageUp: -0.85, " ": 0.85 };
    addEventListener("keydown", (e) => {
      if (!taxing() || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (!(e.key in KEYS)) return;
      const a = document.activeElement;
      if (a && a !== document.body && a !== document.documentElement) return; // focus is in something else
      let dy = KEYS[e.key];
      if (Math.abs(dy) < 1) dy = dy * innerHeight;
      if (e.key === " " && e.shiftKey) dy = -dy;
      tick();
      const f = taxes.speed(seconds);
      if (f >= 0.999) return;
      e.preventDefault();
      move(document.scrollingElement || document.documentElement, dy * f);
    }, { capture: true });

    // ---------- settings ----------
    const load = (all) => {
      for (const k of Object.keys(taxes.DEFAULTS)) if (all[k] !== undefined) s[k] = all[k];
      if (all.tabCount !== undefined) tabCount = all.tabCount;
      applyGrey();
    };
    try {
      chrome.storage.local.get(null, load);
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== "local") return;
        const next = {};
        for (const k in changes) next[k] = changes[k].newValue;
        load(next);
      });
    } catch (e) {}
  })();
}
