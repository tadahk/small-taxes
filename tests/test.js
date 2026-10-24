// unit checks: node tests/test.js
const assert = require("assert");
const t = require("../extension/content.js");

let n = 0;
const check = (name, fn) => { fn(); n++; console.log("ok -", name); };

check("first minute is free", () => {
  assert.strictEqual(t.speed(0), 1);
  assert.strictEqual(t.speed(60), 1);
});
check("slows over time", () => {
  assert(Math.abs(t.speed(180) - 0.5) < 1e-9);
  assert(Math.abs(t.speed(300) - 1 / 3) < 1e-9);
  assert(t.speed(240) < t.speed(120));
});
check("never below floor", () => assert.strictEqual(t.speed(1e6), 0.1));

check("no grey at or under limit", () => {
  assert.strictEqual(t.grey(10, 10), 0);
  assert.strictEqual(t.grey(3, 10), 0);
});
check("grey per extra tab, capped", () => {
  assert(Math.abs(t.grey(11, 10) - 0.1) < 1e-9);
  assert(Math.abs(t.grey(15, 10) - 0.5) < 1e-9);
  assert.strictEqual(t.grey(40, 10), 1);
});

check("site matching", () => {
  const s = ["x.com", "reddit.com", "https://www.youtube.com/"];
  assert(t.isListed("x.com", s));
  assert(t.isListed("www.reddit.com", s));
  assert(t.isListed("old.reddit.com", s));
  assert(t.isListed("m.youtube.com", s));
  assert(!t.isListed("box.com", s));
  assert(!t.isListed("notreddit.com", s));
  assert(!t.isListed("example.org", s));
});

check("wheel units", () => {
  assert.strictEqual(t.pixels(3, 1, 800), 48);
  assert.strictEqual(t.pixels(1, 2, 800), 800);
  assert.strictEqual(t.pixels(100, 0, 800), 100);
});

console.log(`${n} checks passed`);
