// builds assets/contrib.svg and assets/langs.svg from the github graphql api.
// no dependencies. runs on node 20+ (global fetch). called by .github/workflows/stats.yml

import { writeFileSync, mkdirSync } from "node:fs";

const LOGIN = process.env.GH_LOGIN || "huznot";
const TOKEN = process.env.GH_TOKEN;
if (!TOKEN) {
  console.error("GH_TOKEN is required");
  process.exit(1);
}

const QUERY = `
query($login:String!){
  user(login:$login){
    contributionsCollection{
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      totalRepositoryContributions
      contributionCalendar{
        totalContributions
        weeks{ contributionDays{ date contributionCount weekday } }
      }
    }
    repositories(first:100, ownerAffiliations:OWNER, isFork:false, orderBy:{field:PUSHED_AT,direction:DESC}){
      totalCount
      nodes{
        name
        stargazerCount
        languages(first:10, orderBy:{field:SIZE,direction:DESC}){ edges{ size node{ name } } }
      }
    }
  }
}`;

const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Authorization: `bearer ${TOKEN}`,
    "Content-Type": "application/json",
    "User-Agent": "huznot-profile-stats",
  },
  body: JSON.stringify({ query: QUERY, variables: { login: LOGIN } }),
});
const json = await res.json();
if (json.errors) {
  console.error(JSON.stringify(json.errors, null, 2));
  process.exit(1);
}

const user = json.data.user;
const cc = user.contributionsCollection;
const days = cc.contributionCalendar.weeks.flatMap((w) => w.contributionDays);

// streaks, counted back from the most recent day that could still be filled in
let longest = 0;
let run = 0;
for (const d of days) {
  run = d.contributionCount > 0 ? run + 1 : 0;
  if (run > longest) longest = run;
}
let current = 0;
for (let i = days.length - 1; i >= 0; i--) {
  if (days[i].contributionCount === 0) {
    // today not being counted yet is normal, so allow one trailing blank
    if (i === days.length - 1) continue;
    break;
  }
  current++;
}

const stars = user.repositories.nodes.reduce((a, r) => a + r.stargazerCount, 0);

const bytes = new Map();
for (const repo of user.repositories.nodes) {
  for (const e of repo.languages.edges) {
    bytes.set(e.node.name, (bytes.get(e.node.name) || 0) + e.size);
  }
}
const totalBytes = [...bytes.values()].reduce((a, b) => a + b, 0) || 1;
const langs = [...bytes.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 6)
  .map(([name, size]) => ({ name: name.toLowerCase(), pct: (size / totalBytes) * 100 }));

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const THEME = `
  svg{--paper:#f7f5ed;--grid:#d8e2ec;--major:#c2d2e0;--ink:#173a5e;--ink2:#4a6076;--pencil:#8a99a8;--margin:#d98b8b;--accent:#c0562f}
  @media (prefers-color-scheme:dark){
    svg{--paper:#0a2239;--grid:#12385c;--major:#1b4a75;--ink:#eaf4ff;--ink2:#a9c9e2;--pencil:#6f92ac;--margin:#3f7fb0;--accent:#f0a868}
  }
  .paper{fill:var(--paper)}.gl{stroke:var(--grid);stroke-width:1}.gm{stroke:var(--major);stroke-width:1}
  .ml{stroke:var(--margin);stroke-width:1.3}
  .ink{fill:var(--ink)}.ink2{fill:var(--ink2)}.pen{fill:var(--pencil)}.acc{fill:var(--accent)}
  .mono{font-family:ui-monospace,SFMono-Regular,"SF Mono",Consolas,"Liberation Mono",Menlo,monospace}
  .hand{font-family:"Segoe Print","Bradley Hand","Comic Sans MS",cursive}
  @keyframes dr{to{stroke-dashoffset:0}}
  @keyframes fade{to{opacity:1}}
  .u{fill:none;stroke:var(--accent);stroke-width:2;stroke-dasharray:220;stroke-dashoffset:220;animation:dr 1s ease-out .2s forwards}
  .cell{opacity:0;animation:fade .5s ease-out forwards}
`;

const bg = (w, h, pid) => `
<defs>
  <pattern id="${pid}f" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M18 0H0V18" class="gl" fill="none"/></pattern>
  <pattern id="${pid}b" width="90" height="90" patternUnits="userSpaceOnUse"><path d="M90 0H0V90" class="gm" fill="none"/></pattern>
</defs>
<rect class="paper" width="${w}" height="${h}"/>
<rect width="${w}" height="${h}" fill="url(#${pid}f)"/><rect width="${w}" height="${h}" fill="url(#${pid}b)"/>
<rect x="0" y="0" width="${w}" height="${h}" fill="none" class="gm" stroke-width="2"/>
<line x1="34" y1="0" x2="34" y2="${h}" class="ml"/>`;

// ---------- contribution log ----------
const weeks = cc.contributionCalendar.weeks;
const CELL = 11;
const GAP = 3;
const STEP = CELL + GAP;
const X0 = 76;
const Y0 = 82;
const W = 900;
const H = 236;

const counts = days.map((d) => d.contributionCount).filter((c) => c > 0).sort((a, b) => a - b);
const q = (p) => counts.length ? counts[Math.min(counts.length - 1, Math.floor(counts.length * p))] : 1;
const t1 = q(0.25), t2 = q(0.5), t3 = q(0.8);
const level = (c) => (c === 0 ? 0 : c <= t1 ? 1 : c <= t2 ? 2 : c <= t3 ? 3 : 4);
const OP = [0, 0.22, 0.44, 0.7, 1];

let cells = "";
weeks.forEach((week, wi) => {
  week.contributionDays.forEach((d) => {
    const lv = level(d.contributionCount);
    const x = X0 + wi * STEP;
    const y = Y0 + d.weekday * STEP;
    const delay = (0.25 + wi * 0.012).toFixed(3);
    cells +=
      lv === 0
        ? `<rect class="cell" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="var(--major)" fill-opacity=".22"/>`
        : `<rect class="cell" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="var(--accent)" fill-opacity="${OP[lv]}"><title>${esc(d.date)}: ${d.contributionCount}</title></rect>`;
  });
});

// month ruler
let months = "";
let lastMonth = -1;
const MN = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
weeks.forEach((week, wi) => {
  const first = week.contributionDays[0];
  if (!first) return;
  const m = new Date(first.date + "T00:00:00Z").getUTCMonth();
  if (m !== lastMonth) {
    lastMonth = m;
    months += `<text x="${X0 + wi * STEP}" y="${Y0 - 10}" class="mono pen" font-size="10">${MN[m]}</text>`;
  }
});

const dayLabels = [[1, "mon"], [3, "wed"], [5, "fri"]]
  .map(([i, l]) => `<text x="${X0 - 10}" y="${Y0 + i * STEP + 9}" text-anchor="end" class="mono pen" font-size="9.5">${l}</text>`)
  .join("");

const legend = OP.map(
  (o, i) =>
    `<rect x="${756 + i * 15}" y="${Y0 + 7 * STEP + 14}" width="11" height="11" rx="2" fill="${i === 0 ? "var(--major)" : "var(--accent)"}" fill-opacity="${i === 0 ? 0.22 : o}"/>`
).join("");

const generated = new Date().toISOString().slice(0, 10);

const contrib = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="contribution log, ${cc.contributionCalendar.totalContributions} contributions in the last year">
<style>${THEME}</style>
${bg(W, H, "c")}
<text x="46" y="34" class="mono ink" font-size="16" font-weight="700">the log · last 12 months</text>
<path class="u" d="M46 42 H300"/>
<text x="${W - 100}" y="34" class="mono pen" font-size="11">fig. 5 · plate a</text>
<text x="46" y="58" class="mono ink2" font-size="11.5">${cc.contributionCalendar.totalContributions} contributions · ${cc.totalCommitContributions} commits · ${cc.totalPullRequestContributions} pull requests · ${cc.totalIssueContributions} issues · ${user.repositories.totalCount} repos · ${stars} stars</text>
${months}
${dayLabels}
${cells}
<text x="46" y="${Y0 + 7 * STEP + 24}" class="mono pen" font-size="10.5">longest streak ${longest}d · current streak ${current}d</text>
<text x="700" y="${Y0 + 7 * STEP + 24}" class="mono pen" font-size="10">less</text>
${legend}
<text x="836" y="${Y0 + 7 * STEP + 24}" class="mono pen" font-size="10">more</text>
<text x="46" y="${H - 12}" class="hand pen" font-size="11.5">plotted ${generated} · regenerated daily by a github action</text>
</svg>
`;

// ---------- language plate ----------
const LW = 440, LH = 260;
let bars = "";
langs.forEach((l, i) => {
  const y = 76 + i * 28;
  const w = Math.max(3, (l.pct / 100) * 220);
  bars += `<text x="46" y="${y + 8}" class="mono ink2" font-size="12">${esc(l.name)}</text>
<rect x="160" y="${y}" width="220" height="8" rx="4" fill="var(--major)" fill-opacity=".35"/>
<rect x="160" y="${y}" width="0" height="8" rx="4" fill="var(--accent)" fill-opacity=".85"><animate attributeName="width" from="0" to="${w.toFixed(1)}" dur=".9s" begin="${(0.3 + i * 0.12).toFixed(2)}s" fill="freeze"/></rect>
<text x="390" y="${y + 8}" class="mono pen" font-size="10.5">${l.pct.toFixed(1)}%</text>`;
});

const langsSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LW} ${LH}" width="${LW}" height="${LH}" role="img" aria-label="language distribution across public repositories">
<style>${THEME}</style>
${bg(LW, LH, "l")}
<text x="46" y="34" class="mono ink" font-size="15" font-weight="700">what it is written in</text>
<path class="u" d="M46 42 H262"/>
<text x="356" y="34" class="mono pen" font-size="11">fig. 6</text>
<text x="46" y="56" class="mono pen" font-size="10">by bytes, public non-fork repos</text>
${bars}
<text x="46" y="${LH - 14}" class="hand pen" font-size="11">measured ${generated}</text>
</svg>
`;

mkdirSync("assets", { recursive: true });
writeFileSync("assets/contrib.svg", contrib);
writeFileSync("assets/langs.svg", langsSvg);
console.log(`wrote assets/contrib.svg and assets/langs.svg for ${LOGIN}`);
