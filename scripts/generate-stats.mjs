// builds the data-driven plates: assets/contrib.svg, langs.svg, streak.svg and
// totals.svg. .github/workflows/stats.yml runs this nightly with a token.
//
// with GH_TOKEN set it uses the graphql api. without one it falls back to the
// public contribution calendar html plus the rest api, so it can also be run
// locally with just:  node scripts/generate-stats.mjs

import { mkdirSync } from "node:fs";
import { THEME, sheet, esc, countUp, writePlate, COUNTUP_CSS } from "./theme.mjs";

mkdirSync("assets", { recursive: true });

const LOGIN = process.env.GH_LOGIN || "huznot";
const TOKEN = process.env.GH_TOKEN;
const UA = { "User-Agent": "huznot-profile-stats" };

/* ------------------------------------------------------------------ fetch */

const YEARS_QUERY = (ranges) => `
query($login:String!){
  user(login:$login){
    createdAt
    ${ranges.map((r, i) => `y${i}:contributionsCollection(from:"${r.from}",to:"${r.to}"){
      totalCommitContributions totalPullRequestContributions
      totalIssueContributions totalRepositoryContributions
      contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount weekday } } }
    }`).join("\n    ")}
    repositories(first:100, ownerAffiliations:OWNER, isFork:false, privacy:null, orderBy:{field:PUSHED_AT,direction:DESC}){
      totalCount
      nodes{ name isPrivate stargazerCount languages(first:10, orderBy:{field:SIZE,direction:DESC}){ edges{ size node{ name } } } }
    }
  }
}`;

const gql = async (query, variables) => {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { ...UA, Authorization: `bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors, null, 2));
  return json.data;
};

const yearRanges = (startYear) => {
  const now = new Date();
  const out = [];
  for (let y = startYear; y <= now.getUTCFullYear(); y++) {
    out.push({ from: `${y}-01-01T00:00:00Z`, to: `${y}-12-31T23:59:59Z` });
  }
  return out;
};

async function viaGraphql() {
  // one cheap call to find the account's first year, then one call for all years
  const { user: seed } = await gql(
    `query($login:String!){ user(login:$login){ createdAt } }`,
    { login: LOGIN }
  );
  const start = new Date(seed.createdAt).getUTCFullYear();
  const ranges = yearRanges(start);
  const { user } = await gql(YEARS_QUERY(ranges), { login: LOGIN });

  const years = ranges.map((_, i) => user[`y${i}`]);
  const days = years.flatMap((y) =>
    y.contributionCalendar.weeks.flatMap((w) => w.contributionDays)
  );
  const sum = (k) => years.reduce((a, y) => a + y[k], 0);
  return {
    days,
    totals: {
      contributions: years.reduce((a, y) => a + y.contributionCalendar.totalContributions, 0),
      commits: sum("totalCommitContributions"),
      prs: sum("totalPullRequestContributions"),
      issues: sum("totalIssueContributions"),
      repos: user.repositories.totalCount,
      stars: user.repositories.nodes.reduce((a, r) => a + r.stargazerCount, 0),
    },
    repos: user.repositories.nodes,
  };
}

// the public calendar page renders one cell per day plus a <tool-tip> holding the
// exact count, which is the only place the number is exposed without a token
async function scrapeYear(year) {
  const res = await fetch(
    `https://github.com/users/${LOGIN}/contributions?from=${year}-01-01&to=${year}-12-31`,
    { headers: { ...UA, "x-requested-with": "XMLHttpRequest" } }
  );
  const html = await res.text();
  const counts = new Map();
  for (const m of html.matchAll(/<tool-tip[^>]*for="(contribution-day-component-[^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const n = /^No contributions/.test(m[2]) ? 0 : parseInt(m[2], 10) || 0;
    counts.set(m[1], n);
  }
  const days = [];
  for (const m of html.matchAll(/<td[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*id="(contribution-day-component-[^"]+)"[^>]*>/g)) {
    days.push({ date: m[1], contributionCount: counts.get(m[2]) ?? 0 });
  }
  return days;
}

async function viaPublic() {
  const created = await fetch(`https://api.github.com/users/${LOGIN}`, { headers: UA })
    .then((r) => r.json())
    .then((u) => new Date(u.created_at).getUTCFullYear());
  const thisYear = new Date().getUTCFullYear();
  const days = [];
  for (let y = created; y <= thisYear; y++) days.push(...(await scrapeYear(y)));
  days.sort((a, b) => a.date.localeCompare(b.date));

  const repoList = await fetch(
    `https://api.github.com/users/${LOGIN}/repos?per_page=100&type=owner&sort=pushed`,
    { headers: UA }
  ).then((r) => r.json());
  const repos = [];
  for (const r of repoList.filter((r) => !r.fork)) {
    const langs = await fetch(r.languages_url, { headers: UA }).then((x) => x.json());
    repos.push({
      name: r.name,
      isPrivate: false,
      stargazerCount: r.stargazers_count,
      languages: { edges: Object.entries(langs).map(([name, size]) => ({ size, node: { name } })) },
    });
  }
  return {
    days,
    totals: {
      contributions: days.reduce((a, d) => a + d.contributionCount, 0),
      commits: null,
      prs: null,
      issues: null,
      repos: repos.length,
      stars: repos.reduce((a, r) => a + r.stargazerCount, 0),
    },
    repos,
  };
}

const data = TOKEN ? await viaGraphql() : await viaPublic();
if (!TOKEN) console.log("no GH_TOKEN, used the public calendar and rest api");

/* ---------------------------------------------------------------- reshape */

const days = data.days.filter((d) => d.date <= new Date().toISOString().slice(0, 10));

// a streak is a run of days with at least one contribution. today being empty is
// normal (nothing pushed yet), so a trailing blank today doesn't end the run.
const runs = [];
let run = null;
for (const d of days) {
  if (d.contributionCount > 0) {
    run = run ?? { start: d.date, end: d.date, len: 0 };
    run.end = d.date;
    run.len++;
  } else if (run) {
    runs.push(run);
    run = null;
  }
}
if (run) runs.push(run);

const longest = runs.reduce((a, r) => (r.len > a.len ? r : a), { len: 0, start: "", end: "" });
const last = days[days.length - 1];
const current =
  runs.length && (runs[runs.length - 1].end === last?.date || last?.contributionCount === 0)
    ? runs[runs.length - 1]
    : { len: 0, start: "", end: "" };

const firstActive = days.find((d) => d.contributionCount > 0)?.date || days[0]?.date;

const bytes = new Map();
for (const repo of data.repos) {
  for (const e of repo.languages.edges) bytes.set(e.node.name, (bytes.get(e.node.name) || 0) + e.size);
}
const privateCount = data.repos.filter((r) => r.isPrivate).length;
const totalBytes = [...bytes.values()].reduce((a, b) => a + b, 0) || 1;
const langs = [...bytes.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 7)
  .map(([name, size]) => ({ name: name.toLowerCase(), pct: (size / totalBytes) * 100 }));

const MN = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
const pretty = (iso) => {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00Z");
  return `${MN[d.getUTCMonth()]} ${d.getUTCDate()} ${String(d.getUTCFullYear()).slice(2)}`;
};
const generated = new Date().toISOString().slice(0, 10);

const svg = ({ w, h, label, body, css = "" }) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(label)}">
<style>${THEME}${css}</style>
${body}
</svg>
`;

/* ------------------------------------------------- plate 1: the log (12 mo) */

const CELL = 11, GAP = 3, STEP = CELL + GAP, X0 = 76, Y0 = 82, W = 900, H = 236;

// last 53 columns, sunday aligned, so the grid lines up the way the one on the
// profile page does
const recent = days.slice(-371);
const weeks = [];
for (const d of recent) {
  const weekday = new Date(d.date + "T00:00:00Z").getUTCDay();
  if (!weeks.length || weekday === 0) weeks.push([]);
  weeks[weeks.length - 1].push({ ...d, weekday });
}

const active = recent.map((d) => d.contributionCount).filter((c) => c > 0).sort((a, b) => a - b);
const q = (p) => (active.length ? active[Math.min(active.length - 1, Math.floor(active.length * p))] : 1);
const [t1, t2, t3] = [q(0.25), q(0.5), q(0.8)];
const level = (c) => (c === 0 ? 0 : c <= t1 ? 1 : c <= t2 ? 2 : c <= t3 ? 3 : 4);
const OP = [0, 0.24, 0.46, 0.72, 1];

const cells = weeks
  .map((week, wi) =>
    week
      .map((d) => {
        const lv = level(d.contributionCount);
        const x = X0 + wi * STEP, y = Y0 + d.weekday * STEP;
        const delay = (0.25 + wi * 0.012).toFixed(3);
        const base = `class="cell" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2"`;
        return lv === 0
          ? `<rect ${base} fill="var(--major)" fill-opacity=".55"/>`
          : `<rect ${base} fill="var(--accent)" fill-opacity="${OP[lv]}"><title>${esc(d.date)}: ${d.contributionCount}</title></rect>`;
      })
      .join("")
  )
  .join("");

let lastMonth = -1;
const months = weeks
  .map((week, wi) => {
    const m = new Date(week[0].date + "T00:00:00Z").getUTCMonth();
    if (m === lastMonth) return "";
    lastMonth = m;
    return `<text x="${X0 + wi * STEP}" y="${Y0 - 10}" class="mono pen" font-size="10">${MN[m]}</text>`;
  })
  .join("");

const dayLabels = [[1, "mon"], [3, "wed"], [5, "fri"]]
  .map(([i, l]) => `<text x="${X0 - 10}" y="${Y0 + i * STEP + 9}" text-anchor="end" class="mono pen" font-size="9.5">${l}</text>`)
  .join("");

const legend = OP.map(
  (o, i) => `<rect x="${756 + i * 15}" y="${Y0 + 7 * STEP + 14}" width="11" height="11" rx="2" fill="${i === 0 ? "var(--major)" : "var(--accent)"}" fill-opacity="${i === 0 ? 0.55 : o}"/>`
).join("");

const yearTotal = recent.reduce((a, d) => a + d.contributionCount, 0);

writePlate(
  "assets/contrib.svg",
  svg({
    w: W,
    h: H,
    label: `contribution log, ${yearTotal} contributions in the last twelve months`,
    css: `@media (prefers-reduced-motion:no-preference){.cell{opacity:0;animation:fade .5s ease-out forwards}}`,
    body: `${sheet(W, H, "c")}
<text x="46" y="34" class="mono ink" font-size="16" font-weight="700">the log &#183; last 12 months</text>
<path class="u" d="M46 42 H300"/>
<text x="${W - 108}" y="34" class="mono pen" font-size="11">fig. 6 &#183; plate a</text>
<text x="46" y="58" class="mono ink2" font-size="11.5">${yearTotal} contributions this year &#183; ${data.totals.contributions} since ${pretty(firstActive)}</text>
${months}${dayLabels}${cells}
<text x="46" y="${Y0 + 7 * STEP + 24}" class="mono pen" font-size="10.5">longest streak ${longest.len}d &#183; current streak ${current.len}d</text>
<text x="700" y="${Y0 + 7 * STEP + 24}" class="mono pen" font-size="10">less</text>
${legend}
<text x="836" y="${Y0 + 7 * STEP + 24}" class="mono pen" font-size="10">more</text>
<text x="46" y="${H - 14}" class="hand pen" font-size="11.5">plotted ${generated} &#183; a github action redraws this every night</text>`,
  })
);

/* -------------------------------------------------------- plate 2: streaks */
// replaces the third party streak card. same three numbers, but drawn on the
// same paper as everything else and sized to its content, so there is no dead
// strip underneath it.

const SW = 440, SH = 292;
const R = 40, C = 2 * Math.PI * R;
const frac = longest.len ? Math.min(1, current.len / longest.len) : 0;

writePlate(
  "assets/streak.svg",
  svg({
    w: SW,
    h: SH,
    label: `${data.totals.contributions} contributions total, ${current.len} day current streak, ${longest.len} day longest streak`,
    css: `${COUNTUP_CSS}
          .rtrack{fill:none;stroke:var(--major);stroke-width:6}
          .ring{fill:none;stroke:var(--accent);stroke-width:6;stroke-linecap:round}
          @keyframes sweepring{from{stroke-dashoffset:${(C * frac).toFixed(1)}}to{stroke-dashoffset:0}}
          @media (prefers-reduced-motion:no-preference){
            .ring{animation:sweepring 1.2s cubic-bezier(.2,.7,.3,1) .3s both}
          }`,
    body: `${sheet(SW, SH, "k", { margin: 0 })}
<text x="26" y="32" class="mono ink" font-size="15" font-weight="700">still showing up</text>
<path class="u" d="M26 40 H228"/>
<text x="392" y="32" class="mono pen" font-size="11">fig. 7</text>

<line x1="152" y1="66" x2="152" y2="228" class="gm"/>
<line x1="288" y1="66" x2="288" y2="228" class="gm"/>

${countUp(data.totals.contributions, 88, 130, "mono ink", 30, { anchor: "middle" })}
<text x="88" y="156" text-anchor="middle" class="mono ink2" font-size="11">contributions</text>
<text x="88" y="174" text-anchor="middle" class="mono pen" font-size="9.5">since ${pretty(firstActive)}</text>

<g transform="translate(220,120)">
  <circle class="rtrack" r="${R}"/>
  <circle class="ring" r="${R}" transform="rotate(-90)"
    stroke-dasharray="${(C * frac).toFixed(1)} ${C.toFixed(1)}"/>
</g>
${countUp(current.len, 220, 128, "mono acc", 30, { anchor: "middle", delay: 0.4 })}
<text x="220" y="192" text-anchor="middle" class="mono acc" font-size="11" font-weight="700">current streak</text>
<text x="220" y="209" text-anchor="middle" class="mono pen" font-size="9.5">${current.len ? `${pretty(current.start)} &#8594; now` : "warming back up"}</text>

${countUp(longest.len, 352, 130, "mono ink", 30, { anchor: "middle", delay: 0.35 })}
<text x="352" y="156" text-anchor="middle" class="mono ink2" font-size="11">longest streak</text>
<text x="352" y="174" text-anchor="middle" class="mono pen" font-size="9.5">${longest.len ? `${pretty(longest.start)} &#8211; ${pretty(longest.end)}` : "&#8212;"}</text>

<line x1="26" y1="250" x2="414" y2="250" class="gm" stroke-dasharray="4 4"/>
<text x="26" y="272" class="hand pen" font-size="11.5">counted ${generated}</text>`,
  })
);

/* ------------------------------------------------------ plate 3: languages */

const LW = 440, LH = 292;
const bars = langs
  .map((l, i) => {
    const y = 80 + i * 26;
    const w = Math.max(3, (l.pct / 100) * 200);
    return `<text x="46" y="${y + 8}" class="mono ink2" font-size="12">${esc(l.name)}</text>
<rect x="176" y="${y}" width="200" height="8" rx="4" fill="var(--major)" fill-opacity=".7"/>
<rect x="176" y="${y}" width="${w.toFixed(1)}" height="8" rx="4" fill="var(--accent)" fill-opacity=".9"><animate attributeName="width" from="0" to="${w.toFixed(1)}" dur=".9s" begin="${(0.3 + i * 0.1).toFixed(2)}s" fill="freeze"/></rect>
<text x="394" y="${y + 8}" text-anchor="end" class="mono pen" font-size="10.5">${l.pct.toFixed(1)}%</text>`;
  })
  .join("\n");

writePlate(
  "assets/langs.svg",
  svg({
    w: LW,
    h: LH,
    label: "language distribution across public repositories",
    body: `${sheet(LW, LH, "l")}
<text x="46" y="34" class="mono ink" font-size="15" font-weight="700">what it is written in</text>
<path class="u" d="M46 42 H262"/>
<text x="358" y="34" class="mono pen" font-size="11">fig. 8</text>
<text x="46" y="58" class="mono pen" font-size="10">by bytes, across ${data.repos.length} repos${privateCount ? `, ${privateCount} of them private` : ", all public"}</text>
${bars}
<text x="46" y="${LH - 14}" class="hand pen" font-size="11">measured ${generated}</text>`,
  })
);

/* --------------------------------------------------------- plate 4: totals */

const tally = [
  ["repos", data.totals.repos],
  ["commits", data.totals.commits],
  ["pull requests", data.totals.prs],
  ["issues", data.totals.issues],
  ["stars", data.totals.stars],
  ["contributions", data.totals.contributions],
].filter(([, v]) => v);  // a tile reading zero is worse than no tile

const TW = 900, TH = 96;
const CW = (TW - 58 - 34) / tally.length;
const tiles = tally
  .map(([label, value], i) => {
    const cx = 58 + CW * i + CW / 2;
    return `${countUp(value, cx, 56, "mono ink", 26, { anchor: "middle", delay: 0.25 + i * 0.06 })}
<text x="${cx}" y="76" text-anchor="middle" class="mono pen" font-size="10.5">${label}</text>
${i ? `<line x1="${(58 + CW * i).toFixed(1)}" y1="26" x2="${(58 + CW * i).toFixed(1)}" y2="76" class="gm"/>` : ""}`;
  })
  .join("\n");

writePlate(
  "assets/totals.svg",
  svg({
    w: TW,
    h: TH,
    label: tally.map(([l, v]) => `${v} ${l}`).join(", "),
    css: COUNTUP_CSS,
    body: `${sheet(TW, TH, "t")}
${tiles}`,
  })
);

console.log(
  `wrote contrib, streak, langs and totals for ${LOGIN} - ` +
    `${data.totals.contributions} contributions, ${current.len}d current, ${longest.len}d longest`
);
