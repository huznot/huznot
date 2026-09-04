// mosi.svg is drawn by hand and keeps its own local classes, so this only swaps
// the two `svg{--var:...}` palette declarations for the shared ones and leaves the
// rest of its <style> block alone. it also moves mosi's two intro animations
// which start at invisible, for the reason explained in theme.mjs.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { THEME } from "./theme.mjs";

const pick = (mode) => {
  const m = THEME.match(
    mode === "light" ? /^\s*svg\{([\s\S]*?)\}/m : /prefers-color-scheme:dark\)\{\s*svg\{([\s\S]*?)\}/
  );
  return m[1].replace(/\s+/g, "");
};
const [light, dark] = [pick("light"), pick("dark")];

const OLD_U = ".u{fill:none;stroke:var(--accent);stroke-width:2;stroke-dasharray:200;stroke-dashoffset:200;animation:dr 1s ease-out .2s forwards}";
const OLD_ROW = ".row{opacity:0;animation:fade .5s ease-out forwards}";
const GUARDED = [
  ".row{}",
  "  @media (prefers-reduced-motion:no-preference){",
  "    .u{stroke-dasharray:200;stroke-dashoffset:200;animation:dr 1s ease-out .2s forwards}",
  "    " + OLD_ROW,
  "  }",
].join("\n");

for (const file of ["assets/mosi.svg"]) {
  let src = readFileSync(file, "utf8");

  // the light declaration is the first `svg{--...}`, the dark one is inside the
  // media query and always comes second
  let hits = 0;
  src = src.replace(/svg\{--[^}]*\}/g, () => `svg{${++hits === 1 ? light : dark}}`);
  if (hits !== 2) {
    console.error(`${file}: expected 2 palette blocks, found ${hits}`);
    process.exit(1);
  }

  src = src.replace("gaps flagged, not filled", "gaps flagged");
  src = src.replace(OLD_U, ".u{fill:none;stroke:var(--accent);stroke-width:2}");
  src = src.replace(OLD_ROW, GUARDED);

  writeFileSync(file, src);
  // same two file trick as writePlate in theme.mjs: the readme pairs them with
  // <picture> because github mobile ignores the query inside the svg
  const pinned = src.match(/prefers-color-scheme:dark\)\s*\{\s*svg\{([^}]*)\}/);
  mkdirSync("assets/dark", { recursive: true });
  writeFileSync("assets/dark/mosi.svg", src.replace("</style>", `svg{${pinned[1]}}</style>`));
  console.log(`rethemed ${file}`);
}
