// local only, never committed. writes preview.html, which shows every plate in
// both themes at once by pairing assets/x.svg with the assets/dark/x.svg that
// writePlate built alongside it, the same two files the readme serves.
//
//   node scripts/preview.mjs
//   python -m http.server 8731      then open /preview.html
//
// it has to be served over http rather than opened as a file, because the marks
// in the carousel are inlined and some browsers block that on file://.

import { writeFileSync } from "node:fs";

const row = (label, imgs) => `<h2>${label}</h2><div class=row>${imgs}</div>`;
// data-dark is what the dark pane swaps in, so the pane really is showing the
// file a dark client would get, not a copy made here
const img = (name, w) =>
  `<img src="assets/${name}" data-dark="assets/${name.replace(/([^/]+\.svg)$/, "dark/$1")}" width="${w}">`;

const marks = ["mosi", "ram", "light", "basketball", "museum", "physics"];

const body = [
  row("header", img("header.svg", 900)),
  row("what i build with", img("card.svg", 900)),
  row("games", img("games.svg", 900)),
  row("worked with", img("logos.svg", 900)),
  row("mosi", img("mosi.svg", 900)),
  row("crosswalk / exhibit", img("crosswalk.svg", 440) + img("exhibit.svg", 440)),
  row("contributions", img("contrib.svg", 900)),
  row("languages / streak", img("langs.svg", 440) + img("streak.svg", 440)),
  row("totals", img("totals.svg", 900)),
  row("marks", marks.map((n) => img(`projects/${n}.svg`, 64)).join("")),
].join("\n");

writeFileSync(
  "preview.html",
  `<!doctype html><meta charset=utf-8><title>plates</title>
<style>
 body{margin:0;font:14px ui-monospace,monospace}
 .pane{padding:24px 32px}
 .light{background:#fff;color:#1f2328;color-scheme:light}
 .dark{background:#0d1117;color:#e6edf3;color-scheme:dark}
 h2{font-size:12px;opacity:.55;font-weight:400;margin:22px 0 6px}
 .row{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap}
 img{display:block}
</style>
<div class="pane light" id=L></div>
<div class="pane dark" id=D></div>
<script>
const t = ${JSON.stringify(body)};
L.innerHTML = t;
D.innerHTML = t;
for (const i of D.querySelectorAll("img[data-dark]")) i.src = i.dataset.dark;
</script>
`
);

console.log("wrote preview.html");
