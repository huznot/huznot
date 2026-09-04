// builds the hand-authored plates in assets/: header, stack card, unity games,
// and the logo carousel. no network and no api key, so it can be run any time:
//   node scripts/build-plates.mjs
// the data-driven plates (contrib, langs, streak, totals) come from
// generate-stats.mjs instead, which needs a github token.

import { readFileSync, mkdirSync } from "node:fs";
import { THEME, sheet, esc, writePlate } from "./theme.mjs";

const svg = ({ w, h, label, body, css = "" }) =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(label)}">
<style>${THEME}${css}</style>
${body}
</svg>
`;

mkdirSync("assets", { recursive: true });

/* ------------------------------------------------------------------ header */

const headerCss = `
  .fillin{fill:var(--ink)}
  .trace{fill:none;stroke:var(--accent);stroke-width:2;stroke-linecap:round}
  @keyframes beat{0%,100%{r:4;opacity:1}50%{r:6.5;opacity:.45}}
  .pulse{animation:beat 2.4s ease-in-out infinite}
`;

const tags = [
  ["cmos award", 0],
  ["mss silver medal", 1],
  ["cybertitan finalist", 2],
  ["ingenious+", 3],
  ["$3.5k+ funded", 4, true],
];
let tagX = 90;
const tagRow = tags
  .map(([label, i, hot]) => {
    const w = label.length * 7.4 + 22;
    const g = `<g ><rect x="${tagX}" y="220" width="${w.toFixed(0)}" height="24" rx="4" fill="none" class="${hot ? "accs" : "gm"}" stroke-width="1.3"/><text x="${tagX + 11}" y="236" class="mono ${hot ? "acc" : "ink2"}" font-size="11.5">${label}</text></g>`;
    tagX += w + 12;
    return g;
  })
  .join("\n");

const header = svg({
  w: 900,
  h: 264,
  label: "muhammad irfan - unity games, environmental data, applied ml",
  css: headerCss,
  body: `${sheet(900, 264, "h", { margin: 72 })}
<line x1="76" y1="0" x2="76" y2="264" class="ml" opacity=".45"/>

<text x="90" y="112" class="mono fillin" font-size="52" font-weight="700" letter-spacing="-1">muhammad irfan</text>

<g>
  <text x="92" y="169" class="mono ink2" font-size="17">unity games &#183; environmental data &#183; applied ml</text>
</g>
<g>
  <text x="92" y="199" class="mono pen" font-size="13.5">winnipeg, manitoba</text>
</g>

<text x="700" y="34" class="mono pen" font-size="11.5">fig. 1 &#183; subject profile</text>
<text x="700" y="50" class="mono pen" font-size="11.5">rev. 2026.09 &#183; sheet 1/1</text>
<line x1="695" y1="58" x2="866" y2="58" class="gm" stroke-width="1.2"/>

<g transform="translate(636,96)">
  <line x1="0" y1="0" x2="0" y2="96" class="gm" stroke-width="1.3"/>
  <line x1="0" y1="96" x2="222" y2="96" class="gm" stroke-width="1.3"/>
  <path class="trace" d="M4 88 L34 82 L64 70 L94 66 L124 44 L154 36 L184 18 L214 10"/>
  <circle cx="214" cy="10" r="4" class="acc pulse"/>
  <text x="6" y="-8" class="hand pen" font-size="12.5">things shipped over time</text>
  <text x="112" y="115" class="mono pen" font-size="10.5">2023 &#183; &#183; &#183; &#183; &#183; &#183; 2026</text>
</g>

${tagRow}`,
});
writePlate("assets/header.svg", header);

/* ------------------------------------------------------- unity games plate */
// four panels, each with a little looping animation that hints at what the game
// actually does: a lamp that flickers, a shot that arcs into a hoop, a spotlight
// crossing three museum frames, and a force vector swinging with a live readout.

const gamesCss = `
  .panel{fill:none;stroke:var(--rule);stroke-width:1.2}
  .well{fill:var(--major);opacity:.9}
  .glow{animation:flick 5.2s ease-in-out infinite}
  .bulb{animation:bulb 5.2s ease-in-out infinite}
  .net{transform-origin:center top;animation:swish 3.2s ease-out infinite}
  .spot{animation:sweep 6s ease-in-out infinite}
  .vec{transform-origin:0 0;animation:swing 3.4s ease-in-out infinite}
  .cursor{animation:blink 1.1s steps(1) infinite}
  @keyframes flick{0%,100%{opacity:.20}8%{opacity:.85}14%{opacity:.35}22%{opacity:.95}
                   40%{opacity:.6}58%{opacity:.98}72%{opacity:.5}88%{opacity:.9}}
  @keyframes bulb{0%,100%{opacity:.5}22%{opacity:1}58%{opacity:1}72%{opacity:.6}}
  @keyframes swish{0%,72%{transform:scaleY(1)}80%{transform:scaleY(1.7)}100%{transform:scaleY(1)}}
  @keyframes sweep{0%{transform:translateX(0)}45%{transform:translateX(104px)}
                   55%{transform:translateX(104px)}100%{transform:translateX(0)}}
  @keyframes swing{0%,100%{transform:rotate(-26deg)}50%{transform:rotate(26deg)}}
  @keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
`;

const GAMES = [
  {
    x: 44,
    repo: "Let-There-Be-Light",
    title: "let there be light",
    lines: ["first person story game,", "three acts, one flashback"],
    tag: "huznot/Let-There-Be-Light",
    art: `<defs><radialGradient id="lamp">
        <stop offset="0" stop-color="var(--accent)" stop-opacity=".5"/>
        <stop offset=".5" stop-color="var(--accent)" stop-opacity=".16"/>
        <stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></radialGradient></defs>
      <circle class="glow" cx="80" cy="44" r="46" fill="url(#lamp)"/>
      <line x1="80" y1="0" x2="80" y2="28" class="gm" stroke-width="1.3"/>
      <circle cx="80" cy="43" r="15" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.5"/>
      <rect x="73" y="55" width="14" height="9" rx="1.5" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.5"/>
      <path class="bulb" d="M75 46 l4 -8 l3 8 l3 -8" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linejoin="round"/>
      <ellipse class="glow" cx="80" cy="86" rx="44" ry="5" fill="var(--accent)" opacity=".25"/>
      <line x1="24" y1="86" x2="138" y2="86" class="gm" stroke-width="1.3"/>`,
  },
  {
    x: 251,
    repo: "1v1-Basketball",
    title: "1v1 basketball",
    lines: ["two players, one keyboard", "first to 10 takes it"],
    tag: "huznot/1v1-Basketball",
    art: `<path d="M40 82 Q84 6 128 54" fill="none" stroke="var(--major)" stroke-width="1.2" stroke-dasharray="3 5"/>
      <line x1="128" y1="26" x2="128" y2="54" class="gm" stroke-width="1.6"/>
      <line x1="112" y1="54" x2="140" y2="54" class="accs" stroke-width="2.4"/>
      <path class="net" d="M114 54 l4 12 h16 l4 -12" fill="none" stroke="var(--pencil)" stroke-width="1.1"/>
      <circle cx="84" cy="26" r="8" fill="var(--accent)">
        <animateMotion dur="3.2s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;0.75"
          calcMode="linear" path="M-44 56 Q0 -20 44 28"/>
        <animate attributeName="opacity" dur="3.2s" repeatCount="indefinite"
          values="1;1;0;0" keyTimes="0;0.76;0.86;1"/>
      </circle>
      <line x1="30" y1="86" x2="146" y2="86" class="gm" stroke-width="1.3"/>`,
  },
  {
    x: 458,
    repo: "Museum-Game",
    title: "museum",
    lines: ["a black history museum,", "narrated room by room"],
    tag: "huznot/Museum-Game",
    art: `<g>
        <rect x="26" y="26" width="34" height="42" rx="2" fill="none" class="rl"/>
        <rect x="72" y="26" width="34" height="42" rx="2" fill="none" class="rl"/>
        <rect x="118" y="26" width="34" height="42" rx="2" fill="none" class="rl"/>
        <rect x="30" y="30" width="26" height="34" class="well"/>
        <rect x="76" y="30" width="26" height="34" class="well"/>
        <rect x="122" y="30" width="26" height="34" class="well"/>
      </g>
      <g class="spot"><rect x="24" y="22" width="50" height="50" rx="3" fill="var(--accent)" opacity=".22"/></g>
      <line x1="20" y1="86" x2="158" y2="86" class="gm" stroke-width="1.3"/>
      <circle cx="34" cy="80" r="4" class="pen"/>`,
  },
  {
    x: 665,
    repo: "physics-sandbox",
    title: "dynamics sandbox",
    lines: ["velocity, acceleration", "and force, updating live"],
    tag: "huznot/physics-sandbox",
    art: `<line x1="26" y1="86" x2="158" y2="86" class="gm" stroke-width="1.3"/>
      <g transform="translate(64,62)">
        <g class="vec">
          <line x1="0" y1="0" x2="0" y2="-52" class="accs" stroke-width="2.4"/>
          <path d="M-5 -46 L0 -56 L5 -46 z" class="acc"/>
        </g>
        <circle cx="0" cy="0" r="6" class="ink"/>
      </g>
      <text x="98" y="34" class="mono ink2" font-size="10">v  4.21 m/s</text>
      <text x="98" y="48" class="mono ink2" font-size="10">a  1.06 m/s&#178;</text>
      <text x="98" y="62" class="mono acc" font-size="10">F  84.9 N</text>
      <rect x="150" y="55" width="5" height="9" class="acc cursor"/>`,
  },
];

const PW = 189;
const gamePanels = GAMES.map(
  (g, i) => `<g >
  <rect x="${g.x}" y="66" width="${PW}" height="184" rx="6" class="panel"/>
  <g transform="translate(${g.x + 14},80)">${g.art}</g>
  <text x="${g.x + 14}" y="196" class="mono ink" font-size="13.5" font-weight="700">${g.title}</text>
  <text x="${g.x + 14}" y="214" class="mono ink2" font-size="10.5">${g.lines[0]}</text>
  <text x="${g.x + 14}" y="228" class="mono ink2" font-size="10.5">${g.lines[1]}</text>
  <text x="${g.x + 14}" y="243" class="mono pen" font-size="9">${g.tag}</text>
</g>`
).join("\n");

writePlate(
  "assets/games.svg",
  svg({
    w: 900,
    h: 286,
    label: "four unity games: let there be light, 1v1 basketball, museum, dynamics sandbox",
    css: gamesCss,
    body: `${sheet(900, 286, "g")}
<text x="46" y="34" class="mono ink" font-size="16" font-weight="700">games, made in unity</text>
<path class="u" d="M46 42 H262"/>
<text x="800" y="34" class="mono pen" font-size="11">fig. 2 &#183; plate a</text>
<text x="46" y="56" class="mono ink2" font-size="11.5">c# &#183; unity 6000.2 and 2022.3 &#183; windows builds, museum runs in the browser</text>
${gamePanels}`,
  })
);

/* ---------------------------------------------------------- logo carousel */
// one row of marks, drawn once into defs and used twice side by side, then slid
// left by exactly one row width so the loop has no seam. the marks are black on
// transparent silhouettes from scripts/prep-logos.py, inlined as base64 because
// an svg used as an image cannot fetch anything. on a dark readme they get
// inverted to white, which is the whole reason for flattening them in the first
// place.

const logos = JSON.parse(readFileSync("scripts/logos.json", "utf8"));

const SLOT = 190, STRIP_H = 60, STRIP_Y = 52;
const ROW_W = logos.length * SLOT;

const chips = logos
  .map((l, i) => {
    const x = i * SLOT + (SLOT - l.w) / 2;
    const y = (STRIP_H - l.h) / 2;
    return `<image x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${l.w}" height="${l.h}" href="${l.data}" xlink:href="${l.data}"><title>${esc(l.name)}</title></image>`;
  })
  .join("");

const logosCss = `
  .mark{opacity:.72}
  @media (prefers-color-scheme:dark){.mark{filter:invert(1);opacity:.8}}
  @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-${ROW_W}px)}}
  .track{animation:marquee ${(logos.length * 5.5).toFixed(0)}s linear infinite}
`;

writePlate(
  "assets/logos.svg",
  svg({
    w: 900,
    h: 138,
    label: "worked with: " + logos.map((l) => l.name).join(", "),
    css: logosCss,
    body: `<defs>
  <clipPath id="strip"><rect x="1" y="${STRIP_Y}" width="898" height="${STRIP_H}"/></clipPath>
  <g id="row">
  ${chips}
  </g>
  <linearGradient id="fadeL" x1="0" x2="1"><stop offset="0" stop-color="var(--paper)"/><stop offset="1" stop-color="var(--paper)" stop-opacity="0"/></linearGradient>
  <linearGradient id="fadeR" x1="0" x2="1"><stop offset="0" stop-color="var(--paper)" stop-opacity="0"/><stop offset="1" stop-color="var(--paper)"/></linearGradient>
</defs>
${sheet(900, 138, "w", { margin: 0 })}
<text x="26" y="32" class="mono ink" font-size="15" font-weight="700">worked with</text>
<path class="u" d="M26 40 H172"/>
<text x="816" y="32" class="mono pen" font-size="11">fig. 3</text>
<g class="mark" clip-path="url(#strip)">
  <g transform="translate(0,${STRIP_Y})">
    <g class="track">
      <use href="#row" xlink:href="#row"/>
      <use href="#row" xlink:href="#row" transform="translate(${ROW_W},0)"/>
    </g>
  </g>
</g>
<rect x="1" y="${STRIP_Y}" width="60" height="${STRIP_H}" fill="url(#fadeL)"/>
<rect x="839" y="${STRIP_Y}" width="60" height="${STRIP_H}" fill="url(#fadeR)"/>`,
  })
);

/* -------------------------------------------------------------- stack card */

const cardCss = `
  .track2{fill:var(--major);opacity:.5}
  .bar{fill:var(--bar)}
  .tick{fill:none;stroke:var(--accent);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
`;

const STACK = [
  ["c# · unity", 1.0],
  ["typescript", 0.97],
  ["react native · expo", 0.9],
  ["javascript · html · css", 0.94],
  ["python", 0.76],
  ["r", 0.62],
  ["php · mysql", 0.56],
];
const BENCH = [
  "leaflet · geospatial mapping",
  "rest apis · live data pipelines",
  "sentence embeddings · retrieval",
  "retrospective model validation",
  "shaders, physics and game feel",
];

const CW_ = 900, CH_ = 240, TRACK = 190;
const stackRows = STACK.map(([name, frac], i) => {
  const y = 82 + i * 22;
  const w = (TRACK * frac).toFixed(1);
  return `<g><text x="46" y="${y}" class="mono ink2" font-size="12">${name}</text>
  <rect x="212" y="${y - 9}" width="${TRACK}" height="7" rx="3.5" class="track2"/>
  <rect x="212" y="${y - 9}" width="${w}" height="7" rx="3.5" class="bar"><animate attributeName="width" from="0" to="${w}" dur=".8s" begin="${(0.3 + i * 0.07).toFixed(2)}s" fill="freeze"/></rect></g>`;
}).join("");

const benchRows = BENCH.map((name, i) => {
  const y = 104 + i * 24;
  return `<g><path class="tick" d="M474 ${y - 4} l5 6 l10 -13"/>
  <text x="498" y="${y}" class="mono ink2" font-size="12.5">${name}</text></g>`;
}).join("");

writePlate(
  "assets/card.svg",
  svg({
    w: CW_,
    h: CH_,
    label: "what i build with",
    css: cardCss,
    body: `${sheet(CW_, CH_, "s")}
<text x="46" y="34" class="mono ink" font-size="16" font-weight="700">what i build with</text>
<path class="u" d="M46 42 H236"/>
<text x="838" y="34" class="mono pen" font-size="11">fig. 4</text>
<text x="46" y="58" class="mono ink2" font-size="11.5">everything on this page</text>
${stackRows}
<line x1="440" y1="70" x2="440" y2="212" class="gm"/>
<text x="470" y="82" class="mono ink" font-size="13" font-weight="700">also on the bench</text>
${benchRows}`,
  })
);

/* ------------------------------------------------------ icd crosswalk plate */
// the point of the project, not the leaderboard: an old code goes in, the model
// puts every code in the same vector space, the modern equivalent comes out.

const xwCss = `
  .chip{fill:var(--paper);stroke:var(--ink);stroke-width:1.5}
  .chipa{fill:var(--paper);stroke:var(--accent);stroke-width:1.8}
  .modelbox{fill:var(--paper);stroke:var(--rule);stroke-width:1.3}
  .arrow{fill:none;stroke:var(--accent);stroke-width:1.8;stroke-linecap:round}
  .dot{fill:var(--pencil)}
  @keyframes drift{0%,100%{transform:translate(0,0)}50%{transform:translate(2px,-3px)}}
  .v1{animation:drift 4s ease-in-out infinite}
  .v2{animation:drift 4s ease-in-out .6s infinite}
  .v3{animation:drift 4s ease-in-out 1.2s infinite}
`;

const arrowDown = (y) =>
  `<path class="arrow" d="M220 ${y} v22"/><path class="arrow" d="M214 ${y + 16} l6 6 l6 -6"/>`;

writePlate(
  "assets/crosswalk.svg",
  svg({
    w: 440,
    h: 400,
    label: "icd crosswalk: an old diagnosis code is embedded and matched to its modern equivalent",
    css: xwCss,
    body: `${sheet(440, 400, "x", { margin: 0 })}
<text x="26" y="32" class="mono ink" font-size="15" font-weight="700">icd crosswalk</text>
<path class="u" d="M26 40 H176"/>
<text x="392" y="32" class="mono pen" font-size="11">fig. 5</text>
<text x="26" y="56" class="mono ink2" font-size="10.5">matches retired diagnosis codes to current ones</text>
<text x="26" y="70" class="mono pen" font-size="9.5">university of manitoba &#183; centre for healthcare innovation</text>

<rect x="140" y="76" width="160" height="36" rx="5" class="chip"/>
<text x="220" y="100" text-anchor="middle" class="mono ink" font-size="16" font-weight="700">250.00</text>
<text x="220" y="128" text-anchor="middle" class="mono pen" font-size="10">icd-9-cm, retired in 2015</text>
${arrowDown(142)}

<rect x="86" y="180" width="268" height="88" rx="6" class="modelbox"/>
<text x="104" y="204" class="mono ink" font-size="12" font-weight="700">sapbert embeddings</text>
<g transform="translate(326,200)">
  <circle class="dot v1" cx="-8" cy="-7" r="2.6"/>
  <circle class="dot v2" cx="9" cy="-1" r="2.6"/>
  <circle class="dot v3" cx="-3" cy="9" r="2.6"/>
  <circle cx="1" cy="0" r="3.6" class="acc"/>
</g>
<text x="104" y="224" class="mono ink2" font-size="10.5">turns every code into a point in one</text>
<text x="104" y="238" class="mono ink2" font-size="10.5">space and picks the closest match</text>
<text x="104" y="258" class="mono pen" font-size="9.5">trained on the code text</text>
${arrowDown(284)}

<rect x="140" y="322" width="160" height="36" rx="5" class="chipa"/>
<text x="220" y="346" text-anchor="middle" class="mono acc" font-size="16" font-weight="700">E11.9</text>
<text x="220" y="374" text-anchor="middle" class="mono ink2" font-size="10.5">icd-10-ca, type 2 diabetes</text>
<text x="220" y="386" text-anchor="middle" class="mono pen" font-size="9.5">a clinical coder does this by hand, one at a time</text>`,
  })
);


/* ------------------------------------------------ combustion engine exhibit */
// the exhibit is a co-op puzzle: one big display counts the room down, four
// kiosks each hold one stroke of the cycle, and the room has to press them in
// order. every clean cycle reshuffles which kiosk is which, so it never turns
// into muscle memory.

const exCss = `
  .screen{fill:none;stroke:var(--rule);stroke-width:1.3}
  .glass{fill:var(--major);opacity:.55}
  .track3{fill:var(--major)}
  .btn{fill:none;stroke:var(--pencil);stroke-width:1.6}
  .btnnext{fill:none;stroke:var(--accent);stroke-width:2}
  @keyframes ping{0%{r:13;opacity:.55}70%,100%{r:20;opacity:0}}
  .halo{fill:none;stroke:var(--accent);stroke-width:1.6;animation:ping 2.2s ease-out infinite}
  @keyframes creep{0%,100%{width:150px}50%{width:186px}}
  .fill{fill:var(--accent);animation:creep 6s ease-in-out infinite}
`;

// order is the press order the room is currently being asked for, which is the
// point: it is not the order the kiosks are sitting in
const KIOSKS = [
  { label: "intake", order: 3 },
  { label: "compress", order: 1 },
  { label: "power", order: 4 },
  { label: "exhaust", order: 2 },
];

const KW = 88, KGAP = 12, KY = 206;
const kiosks = KIOSKS.map((k, i) => {
  const x = 26 + i * (KW + KGAP);
  const cx = x + KW / 2;
  const next = k.order === 1;
  return `<g>
  <rect x="${x}" y="${KY}" width="${KW}" height="80" rx="5" class="screen"/>
  <rect x="${x + 10}" y="${KY + 10}" width="${KW - 20}" height="26" rx="3" class="glass"/>
  <text x="${cx}" y="${KY + 27}" text-anchor="middle" class="mono ink2" font-size="9">${k.label}</text>
  ${next ? `<circle cx="${cx}" cy="${KY + 58}" r="13" class="halo"/>` : ""}
  <circle cx="${cx}" cy="${KY + 58}" r="13" class="${next ? "btnnext" : "btn"}"/>
  <text x="${cx}" y="${KY + 62}" text-anchor="middle" class="mono ${next ? "acc" : "pen"}" font-size="12" font-weight="700">${k.order}</text>
</g>`;
}).join("");

writePlate(
  "assets/exhibit.svg",
  svg({
    w: 440,
    h: 400,
    label: "combustion engine exhibit: one big display and four kiosks pressed in the order of the engine cycle",
    css: exCss,
    body: `${sheet(440, 400, "e", { margin: 0 })}
<text x="26" y="32" class="mono ink" font-size="15" font-weight="700">combustion engine exhibit</text>
<path class="u" d="M26 40 H286"/>
<text x="392" y="32" class="mono pen" font-size="11">fig. 6</text>
<text x="26" y="56" class="mono ink2" font-size="10.5">a puzzle the whole room has to solve together</text>
<text x="26" y="70" class="mono pen" font-size="9.5">royal aviation museum of western canada</text>

<rect x="70" y="86" width="300" height="94" rx="6" class="screen"/>
<text x="220" y="134" text-anchor="middle" class="mono acc" font-size="34" font-weight="700">62%</text>
<rect x="100" y="150" width="240" height="8" rx="4" class="track3"/>
<rect x="100" y="150" height="8" rx="4" class="fill" width="150"/>
<text x="220" y="172" text-anchor="middle" class="mono pen" font-size="9">cycle completion, readable from across the gallery</text>
<text x="220" y="196" text-anchor="middle" class="mono pen" font-size="9">four kiosks, one big display</text>

${kiosks}

<text x="26" y="318" class="mono ink2" font-size="10.5">press the kiosks in the order of the engine cycle:</text>
<text x="26" y="334" class="mono ink" font-size="10.5" font-weight="700">intake &#183; compression &#183; power &#183; exhaust</text>
<text x="26" y="356" class="mono ink2" font-size="10.5">get it right and the four reshuffle, so nobody can</text>
<text x="26" y="370" class="mono ink2" font-size="10.5">just remember which button to hit</text>
<text x="26" y="388" class="mono pen" font-size="9.5">one python backend serving all five screens</text>`,
  })
);

/* ------------------------------------------------------------ project marks */
// small square tiles for the highlight cards. the ones with a real logo are
// built by scripts/prep-project-logos.py; these are the ones that have none.

const mark = (name, label, body) =>
  writePlate(
    `assets/projects/${name}.svg`,
    svg({
      w: 96,
      h: 96,
      label,
      body: `<rect width="96" height="96" rx="18" fill="var(--major)" fill-opacity=".55"/>
${body}`,
    })
  );

mkdirSync("assets/projects", { recursive: true });

mark("mosi", "mosi", `<path d="M24 62 a24 24 0 0 1 48 0" fill="none" stroke="var(--rule)" stroke-width="7" stroke-linecap="round"/>
<path d="M24 62 a24 24 0 0 1 18 -23" fill="none" stroke="var(--accent)" stroke-width="7" stroke-linecap="round"/>
<line x1="48" y1="62" x2="62" y2="44" stroke="var(--ink)" stroke-width="3.4" stroke-linecap="round"/>
<circle cx="48" cy="62" r="4" fill="var(--ink)"/>`);

mark("ram", "ram combustion engine exhibit", `<rect x="30" y="20" width="36" height="34" rx="4" fill="none" stroke="var(--ink)" stroke-width="3.4"/>
<line x1="48" y1="54" x2="48" y2="70" stroke="var(--ink)" stroke-width="3.4"/>
<path d="M48 70 l14 8" stroke="var(--accent)" stroke-width="3.4" stroke-linecap="round" fill="none"/>
<circle cx="62" cy="78" r="4.5" fill="var(--accent)"/>
<path d="M38 30 v8 M48 26 v12 M58 30 v8" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>`);

mark("light", "let there be light", `<line x1="48" y1="16" x2="48" y2="30" stroke="var(--ink)" stroke-width="3.2"/>
<circle cx="48" cy="46" r="16" fill="none" stroke="var(--ink)" stroke-width="3.4"/>
<rect x="41" y="61" width="14" height="10" rx="2" fill="none" stroke="var(--ink)" stroke-width="3.2"/>
<path d="M43 49 l4 -9 l3 9 l3 -9" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linejoin="round"/>`);

mark("basketball", "1v1 basketball", `<circle cx="48" cy="48" r="24" fill="none" stroke="var(--accent)" stroke-width="3.6"/>
<path d="M48 24 v48 M24 48 h48" stroke="var(--accent)" stroke-width="2.6"/>
<path d="M31 31 a34 34 0 0 0 34 34 M65 31 a34 34 0 0 1 -34 34" fill="none" stroke="var(--accent)" stroke-width="2.6"/>`);

mark("museum", "museum", `<path d="M22 38 L48 22 L74 38" fill="none" stroke="var(--ink)" stroke-width="3.4" stroke-linejoin="round"/>
<line x1="20" y1="72" x2="76" y2="72" stroke="var(--ink)" stroke-width="3.4" stroke-linecap="round"/>
<path d="M32 44 v22 M48 44 v22 M64 44 v22" stroke="var(--accent)" stroke-width="3.4" stroke-linecap="round"/>`);

mark("physics", "dynamics sandbox", `<line x1="26" y1="72" x2="76" y2="72" stroke="var(--ink)" stroke-width="3.2" stroke-linecap="round"/>
<line x1="34" y1="66" x2="62" y2="28" stroke="var(--accent)" stroke-width="3.6" stroke-linecap="round"/>
<path d="M52 26 L64 24 L62 36" fill="none" stroke="var(--accent)" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round"/>
<circle cx="34" cy="66" r="5" fill="var(--ink)"/>`);

console.log("wrote header, games, logos, card, crosswalk, exhibit and the project marks");
