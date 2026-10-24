# small taxes (thanks claude)

two small inconveniences for your browser:

- **doomscroll tax** — the longer you scroll a feed, the slower the page scrolls. close the tab and it resets.
- **tab tax** — every tab past ten makes all your pages a little greyer, until you close some.

get it: https://tadahk.github.io/small-taxes/

install: unzip, open `chrome://extensions`, turn on developer mode, load unpacked, pick the folder. works in chrome, brave, edge, arc, dia, vivaldi.

the first minute of scrolling is free, then it slows (half speed at 3 min, a fifth at 9). feeds are x, reddit, facebook, instagram, linkedin, threads, bluesky, tumblr, pinterest, youtube and hn; edit the list from the icon. nothing leaves your browser.

tests: `node tests/test.js`

MIT.
