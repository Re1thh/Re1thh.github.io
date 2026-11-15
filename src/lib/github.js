// Build-time GitHub data. Never throws: on any failure (offline, rate limit,
// timeout, bad JSON) it returns an empty map and the curated JSON fallbacks win.
//
// Env:
//   GITHUB_TOKEN    optional; raises the rate limit (passed in by the deploy workflow).
//                   Sent only when non-empty; if it is rejected (401/403) the request is
//                   retried once without it before falling back.
//   GITHUB_API_URL  optional; overrides the repos endpoint (handy for testing the fallback)

const DEFAULT_URL = "https://api.github.com/users/Re1thh/repos?per_page=100";
const TIMEOUT_MS = 10000;

let cached;

export async function fetchRepos() {
  if (cached) return cached;
  cached = load();
  return cached;
}

// Read at build time from the Node process only. Never via import.meta.env, so the
// value can not be inlined into a bundle, and never logged.
function readToken() {
  const env = globalThis.process?.env ?? {};
  const t = env["GITHUB_TOKEN"];
  return typeof t === "string" ? t.trim() : "";
}

async function request(url, token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "re1thh-portfolio-build",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { headers, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function load() {
  const env = globalThis.process?.env ?? {};
  const url = env["GITHUB_API_URL"] || DEFAULT_URL;
  const token = readToken();
  let mode = token ? "authenticated" : "unauthenticated (no token set)";
  try {
    let res = await request(url, token);
    if (token && (res.status === 401 || res.status === 403)) {
      const rejected = res.status;
      console.warn(`[github] token rejected (${rejected}); retrying once without a token`);
      res = await request(url, "");
      mode = `unauthenticated retry after the token was rejected (${rejected})`;
    }
    if (!res.ok) {
      const left = res.headers.get("x-ratelimit-remaining");
      console.warn(`[github] ${res.status}${left === "0" ? " (rate limit reached)" : ""}; using fallback data from projects.json`);
      return new Map();
    }
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("unexpected response shape");
    console.log(`[github] live data: fetched ${data.length} repos, ${mode}`);
    return new Map(data.map((r) => [String(r.name).toLowerCase(), r]));
  } catch (err) {
    console.warn(`[github] request failed (${err?.name === "AbortError" ? `timeout after ${TIMEOUT_MS / 1000}s` : err?.cause?.code || err?.message || err}); using fallback data from projects.json`);
    return new Map();
  }
}

/** Merge live repo data into curated entries, falling back field by field. */
export async function getProjects(curated) {
  const repos = await fetchRepos();
  return [...curated]
    .sort((a, b) => (a.featured ?? 99) - (b.featured ?? 99))
    .map((p) => {
      const live = repos.get(p.repo.toLowerCase());
      const fb = p.fallback || {};
      const pushed = live?.pushed_at ? new Date(live.pushed_at) : null;
      return {
        ...p,
        url: live?.html_url || `https://github.com/Re1thh/${p.repo}`,
        language: live?.language || fb.language || p.stack?.[0] || "",
        year: pushed && !isNaN(pushed) ? String(pushed.getUTCFullYear()) : fb.year || "",
        // "pushed" = year of the latest push (live data); "built" = curated fallback year.
        yearKind: pushed && !isNaN(pushed) ? "pushed" : "built",
        stars: typeof live?.stargazers_count === "number" ? live.stargazers_count : fb.stars ?? 0,
        live: Boolean(live),
      };
    });
}
