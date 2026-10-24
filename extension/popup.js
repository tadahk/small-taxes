const DEFAULTS = {
  scrollOn: true,
  tabOn: true,
  tabLimit: 10,
  sites: [
    "x.com", "twitter.com", "reddit.com", "facebook.com", "instagram.com",
    "linkedin.com", "threads.net", "threads.com", "bsky.app", "tumblr.com",
    "pinterest.com", "youtube.com", "news.ycombinator.com"
  ]
};

const $ = (id) => document.getElementById(id);

const status = (n, s) => {
  const over = Math.max(0, n - s.tabLimit);
  $("status").textContent = `${n} tab${n === 1 ? "" : "s"} open` +
    (s.tabOn && over ? ` · ${Math.min(100, over * 10)}% grey` : "");
};

chrome.storage.local.get(null, (all) => {
  const s = { ...DEFAULTS, ...all };
  $("scrollOn").checked = s.scrollOn;
  $("tabOn").checked = s.tabOn;
  $("tabLimit").value = s.tabLimit;
  $("sites").value = s.sites.join("\n");
  status(s.tabCount || 0, s);

  const save = () => {
    const next = {
      scrollOn: $("scrollOn").checked,
      tabOn: $("tabOn").checked,
      tabLimit: Math.max(1, parseInt($("tabLimit").value, 10) || 10),
      sites: $("sites").value.split(/[\s,]+/).map((x) => x.trim()).filter(Boolean)
    };
    Object.assign(s, next);
    chrome.storage.local.set(next);
    status(s.tabCount || 0, s);
  };
  for (const id of ["scrollOn", "tabOn", "tabLimit", "sites"]) $(id).addEventListener("change", save);
});
