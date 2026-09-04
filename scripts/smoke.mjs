// renders every data plate against fake api results, so a typo in a template
// literal fails here in a second instead of at 9am in the workflow. it writes
// real files into assets/, so it runs against a scratch copy of the tree:
//   node scripts/smoke.mjs
// the workflow runs it before the real build for the same reason.
const real = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  const body = JSON.parse(opts.body);
  if (!body.query.includes("contributionsCollection")) {
    return { json: async () => ({ data: { user: { createdAt: "2023-02-28T00:00:00Z" } } }) };
  }
  const years = [...body.query.matchAll(/y(\d+):contributionsCollection/g)].map((m) => +m[1]);
  const day = (d, c) => ({ date: d, contributionCount: c, weekday: new Date(d + "T00:00:00Z").getUTCDay() });
  const user = {
    repositories: {
      totalCount: 52,
      nodes: [
        { name: "a", isPrivate: false, stargazerCount: 2, languages: { edges: [{ size: 5000, node: { name: "C#" } }] } },
        { name: "b", isPrivate: true, stargazerCount: 0, languages: { edges: [{ size: 1200, node: { name: "TypeScript" } }] } },
      ],
    },
  };
  for (const y of years) {
    const days = [];
    for (let m = 1; m <= 3; m++) for (let d = 1; d <= 28; d++)
      days.push(day(`202${3 + y}-0${m}-${String(d).padStart(2, "0")}`, (d + m) % 4));
    user[`y${y}`] = {
      totalCommitContributions: 100, totalPullRequestContributions: 4,
      totalIssueContributions: 3, totalRepositoryContributions: 7,
      contributionCalendar: { totalContributions: 200, weeks: [{ contributionDays: days }] },
    };
  }
  return { json: async () => ({ data: { user } }) };
};
process.env.GH_TOKEN = "mock";
await import("./generate-stats.mjs").catch((e) => {
  console.error("FAILED:", e.message.split("\n").slice(0, 6).join("\n"));
  process.exit(1);
});
