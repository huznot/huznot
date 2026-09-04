import { writeFileSync, mkdirSync } from "node:fs";

// one palette and one sheet of graph paper, shared by every plate in assets/.
// --paper is github's own canvas colour in both modes, so the plates sit on the
// readme with no seam. everything else is pulled from github's primer tokens.

export const THEME = `
  svg{--paper:#ffffff;--grid:#eff2f5;--major:#dfe4ea;--rule:#d1d9e0;
      --ink:#1f2328;--ink2:#59636e;--pencil:#818b98;--margin:#f0cdb6;
      --accent:#bc4c00;--blue:#0969da;--green:#1a7f37;--purple:#8250df;
      --chip:#ffffff;--chipline:#d1d9e0;--bar:#59636e;--base:#8c959f;--wire:#d1d9e0}
  @media (prefers-color-scheme:dark){
    svg{--paper:#0d1117;--grid:#151b23;--major:#21262d;--rule:#30363d;
        --ink:#f0f6fc;--ink2:#9198a1;--pencil:#6e7681;--margin:#4a2f1d;
        --accent:#f0883e;--blue:#4493f8;--green:#3fb950;--purple:#ab7df8;
        --chip:#f6f8fa;--chipline:#30363d;--bar:#7d8590;--base:#6e7681;--wire:#30363d}
  }
  .paper{fill:var(--paper)}
  .gl{stroke:var(--grid);stroke-width:1}
  .gm{stroke:var(--major);stroke-width:1}
  .rl{stroke:var(--rule);stroke-width:1}
  .ml{stroke:var(--margin);stroke-width:1.3}
  .ink{fill:var(--ink)}.ink2{fill:var(--ink2)}.pen{fill:var(--pencil)}
  .acc{fill:var(--accent)}.accs{stroke:var(--accent)}
  .blu{fill:var(--blue)}.grn{fill:var(--green)}.pur{fill:var(--purple)}
  .mono{font-family:ui-monospace,SFMono-Regular,"SF Mono",Consolas,"Liberation Mono",Menlo,monospace}
  .hand{font-family:"Segoe Print","Bradley Hand","Comic Sans MS",cursive}
  @keyframes dr{to{stroke-dashoffset:0}}
  @keyframes fade{to{opacity:1}}
  .u{fill:none;stroke:var(--accent);stroke-width:2}

  /* nothing on these plates is allowed to start invisible and animate itself in.
     an svg used as an image reports prefers-reduced-motion as no-preference and
     then declines to run the animation anyway, on github mobile and on any
     machine with animations turned off, which leaves that content hidden for
     good. so intro animations are gone and only looping decoration is left,
     since a paused loop just sits on its first frame and still looks right. */
`;

// the sheet itself: fine grid, heavy grid every five squares, a ruled border and
// a margin line down the left. `id` just has to be unique per file.
export const sheet = (w, h, id, { margin = 34 } = {}) => `
<defs>
  <pattern id="${id}f" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M18 0H0V18" class="gl" fill="none"/></pattern>
  <pattern id="${id}b" width="90" height="90" patternUnits="userSpaceOnUse"><path d="M90 0H0V90" class="gm" fill="none"/></pattern>
</defs>
<rect class="paper" width="${w}" height="${h}" rx="6"/>
<rect width="${w}" height="${h}" fill="url(#${id}f)" rx="6"/>
<rect width="${w}" height="${h}" fill="url(#${id}b)" rx="6"/>
${margin ? `<line x1="${margin}" y1="0" x2="${margin}" y2="${h}" class="ml"/>` : ""}
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="6" fill="none" class="rl"/>`;

export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// pull a number up from 0 on load. svg in an <img> can't run js, so each frame is
// its own <text> that shows for one tick. separate elements, not tspans, because
// hidden tspans still take up horizontal space and the number would jitter.
// kept as a helper so callers stay tidy. it used to swap through a reel of smil
// frames to count the number up, which broke the moment the renderer froze the
// timeline, so it now just draws the number.
export const countUp = (value, x, y, cls, size, opts = {}) => {
  const { weight = 700, anchor = "start" } = opts;
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${cls}" font-size="${size}" font-weight="${weight}">${value}</text>`;
};

export const COUNTUP_CSS = "";

// an svg is xml, so a style block is not raw text the way it is in html: a stray
// angle bracket in a css comment silently kills the whole file. this is the one
// mistake that is easy to make and impossible to see, so every write goes
// through here.
//
// every plate is also written twice. the media query inside an svg is only
// evaluated when the renderer bothers to, and on github's mobile clients it does
// not, so a plate that relies on it shows up light on a dark page. the readme
// pairs the two files with <picture>, whose media query the page itself
// evaluates, and that github always gets right.
export const writePlate = (path, markup) => {
  const style = markup.match(/<style>([\s\S]*?)<\/style>/);
  if (style && /[<>]/.test(style[1])) {
    throw new Error(`${path}: angle bracket inside the style block, xml will not parse`);
  }
  writeFileSync(path, markup);

  const dark = markup.match(/prefers-color-scheme:dark\)\s*\{\s*svg\{([^}]*)\}/);
  if (!dark) {
    throw new Error(`${path}: no dark palette to build a dark variant from`);
  }
  const parts = path.split("/");
  const darkPath = [...parts.slice(0, -1), "dark", parts[parts.length - 1]].join("/");
  mkdirSync(darkPath.split("/").slice(0, -1).join("/"), { recursive: true });
  // re-declaring the dark palette after the query pins it on unconditionally
  writeFileSync(darkPath, markup.replace("</style>", `svg{${dark[1]}}</style>`));
};
