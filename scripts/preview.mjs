// local only, never committed. writes preview.html plus a copy of every plate
// with the dark palette forced on, so both themes can be checked side by side
// without flipping the whole operating system over.
//
//   node scripts/preview.mjs
//   python -m http.server 8731      then open /preview.html
//
// it has to be served over http rather than opened as a file, because the marks
// in the carousel are inlined and some browsers block that on file://.

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";

const plates = [
  ...readdirSync("assets").filter((f) => f.endsWith(".svg")),
  ...readdirSync("assets/projects").filter((f) => f.endsWith(".svg")).map((f) => "projects/" + f),
];

mkdirSync("preview-dark/projects", { recursive: true });
for (const rel of plates) {
  const src = readFileSync(`assets/${rel}`, "utf8");
  // re-declare the dark palette after the media query so it wins unconditionally
  const dark = src.match(/prefers-color-scheme:dark\)\s*\{\s*svg\{([^}]*)\}/);
  if (!dark) continue;
  writeFileSync(`preview-dark/${rel}`, src.replace("</style>", `svg{${dark[1]}}</style>`));
}

const row = (label, imgs) => `<h2>${label}</h2><div class=row>${imgs}</div>`;
const img = (name, w) => `<img src="assets/${name}" width="${w}">`;

const body = [
  row("header", img("header.svg", 900)),
  row("games", img("games.svg", 900)),
  row("worked with", img("logos.svg", 900)),
  row("mosi", img("mosi.svg", 900)),
  row("contributions", img("contrib.svg", 900)),
  row("languages / streak", img("langs.svg", 440) + img("streak.svg", 440)),
  row("crosswalk / stack", img("crosswalk.svg", 440) + img("card.svg", 440)),
  row("totals", img("totals.svg", 900)),
  row("marks", ["mosi", "ram", "light", "basketball", "museum", "physics"]
    .map((n) => img(`projects/${n}.svg`, 64)).join("")),
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
 .row{display:flex;gap:16px;align-items:flex-start}
 img{display:block}
</style>
<div class="pane light" id=L></div>
<div class="pane dark" id=D></div>
<script>
const t = ${JSON.stringify(body)};
L.innerHTML = t;
D.innerHTML = t.replace(/assets\\//g, "preview-dark/");
</script>
`
);

console.log(`mirrored ${plates.length} plates and wrote preview.html`);
