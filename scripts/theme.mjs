import { writeFileSync } from "node:fs";

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
  @keyframes rise{to{opacity:1;transform:translateY(0)}}
  .u{fill:none;stroke:var(--accent);stroke-width:2}
  .d1{animation-delay:.35s}.d2{animation-delay:.5s}.d3{animation-delay:.65s}
  .d4{animation-delay:.8s}.d5{animation-delay:.95s}.d6{animation-delay:1.1s}

  /* every intro animation lives in here on purpose. an svg used as an image has
     its animations paused when the reader asks for reduced motion, and a paused
     animation never reaches its end state, so anything starting at opacity 0
     would just stay invisible. resting state is the finished state, motion is
     only ever added on top. note for later: this is a style block inside xml,
     so no angle brackets in here or the whole file stops parsing. */
  @media (prefers-reduced-motion:no-preference){
    .u{stroke-dasharray:260;stroke-dashoffset:260;animation:dr .9s ease-out .2s forwards}
    .rise{opacity:0;transform:translateY(6px);animation:rise .5s ease-out forwards}
  }
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
export const countUp = (value, x, y, cls, size, opts = {}) => {
  const { dur = 1.1, frames = 14, weight = 700, anchor = "start", delay = 0.25 } = opts;
  const at = (i) => (delay + (i * dur) / frames).toFixed(3);
  const open = `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${cls}" font-size="${size}" font-weight="${weight}"`;

  let reel = "";
  for (let i = 0; i < frames; i++) {
    const t = (i + 1) / frames;
    const n = i === frames - 1 ? value : Math.round(value * (1 - Math.pow(1 - t, 3)));
    reel +=
      `${open} opacity="0">` +
      `<set attributeName="opacity" to="1" begin="${at(i)}s"/>` +
      (i < frames - 1 ? `<set attributeName="opacity" to="0" begin="${at(i + 1)}s"/>` : "") +
      `${n}</text>`;
  }
  // the reel is smil, and smil sits frozen at time zero for readers on reduced
  // motion, which would leave every frame hidden. so the plain number is what
  // ships by default and the reel only takes over when motion is actually on.
  return `<g class="cu-still">${open}>${value}</text></g><g class="cu-reel">${reel}</g>`;
};

export const COUNTUP_CSS = `
  .cu-reel{display:none}
  @media (prefers-reduced-motion:no-preference){
    .cu-still{display:none}
    .cu-reel{display:inline}
  }
`;

// an svg is xml, so a style block is not raw text the way it is in html: a stray
// angle bracket in a css comment silently kills the whole file. this is the one
// mistake that is easy to make and impossible to see, so every write goes
// through here.
export const writePlate = (path, markup) => {
  const style = markup.match(/<style>([\s\S]*?)<\/style>/);
  if (style && /[<>]/.test(style[1])) {
    throw new Error(`${path}: angle bracket inside the <style> block, xml will not parse`);
  }
  writeFileSync(path, markup);
};
