// Renders public/og.png (1200x630) with a locally installed Chrome/Chromium/Edge in headless mode.
// No npm dependency: the page below is plain HTML using the self-hosted fonts from node_modules.
//
//   node scripts/og.mjs            (set CHROME_PATH if the browser is not found)
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const out = join(root, "public", "og.png");

const candidates = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);
const browser = candidates.find((p) => existsSync(p));
if (!browser) throw new Error("No Chrome/Chromium/Edge found; set CHROME_PATH.");

const font = (pkg, file) =>
  readFileSync(join(root, "node_modules", "@fontsource-variable", pkg, "files", file)).toString("base64");
const sans = font("public-sans", "public-sans-latin-wght-normal.woff2");
const mono = font("geist-mono", "geist-mono-latin-wght-normal.woff2");

// Dot field like the site's generated covers (fixed seed, so output is reproducible).
let h = 2166136261;
for (const ch of "Revanth Reddy") h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
const rand = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0), h / 4294967296);
let dots = "";
for (let y = 0; y < 14; y++)
  for (let x = 0; x < 30; x++)
    if (rand() < 0.2) dots += `<circle cx="${x * 40 + 20}" cy="${y * 40 + 20}" r="${rand() < 0.07 ? 3.2 : 1.4}"/>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:"PS";src:url(data:font/woff2;base64,${sans}) format("woff2");font-weight:100 900}
@font-face{font-family:"GM";src:url(data:font/woff2;base64,${mono}) format("woff2");font-weight:100 900}
html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#0c0c0c}
.f{position:relative;width:1200px;height:630px;box-sizing:border-box;padding:84px 96px;font-family:"PS";color:#8a8a8a}
svg{position:absolute;inset:0;fill:#5c5c5c;opacity:.55}
.fade{position:absolute;inset:0;background:linear-gradient(90deg,#0c0c0c 38%,#0c0c0c00 100%)}
.c{position:relative;display:flex;flex-direction:column;height:100%}
.chip{align-self:flex-start;display:flex;align-items:center;gap:14px;font:500 22px "GM";color:#f5f5f5;background:#161616;border-radius:999px;padding:10px 22px 10px 18px;box-shadow:0 0 0 1px #1e1e1e inset}
.dot{width:12px;height:12px;border-radius:50%;background:#8f8fff}
h1{margin:auto 0 0;font-weight:650;font-size:104px;letter-spacing:-.04em;line-height:1;color:#f5f5f5}
p{margin:22px 0 0;font-size:34px;line-height:1.3;color:#c8c8c8}
.m{margin-top:40px;font:400 24px "GM";color:#8a8a8a;letter-spacing:.01em}
.m b{color:#8f8fff;font-weight:400}
</style></head><body><div class="f">
<svg viewBox="0 0 1200 630" aria-hidden="true">${dots}<circle cx="1020" cy="140" r="9" fill="#8f8fff" opacity="1"/></svg>
<div class="fade"></div>
<div class="c">
<div class="chip"><span class="dot"></span>Open to full-stack roles</div>
<h1>Revanth Reddy</h1>
<p>Full-stack developer · Java, Spring Boot, React</p>
<div class="m">re1thh.github.io <b>/</b> Bengaluru, India</div>
</div></div></body></html>`;

const dir = mkdtempSync(join(tmpdir(), "og-"));
try {
  const page = join(dir, "og.html");
  writeFileSync(page, html);
  execFileSync(browser, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--no-default-browser-check",
    `--user-data-dir=${join(dir, "profile")}`,
    "--force-device-scale-factor=1", "--window-size=1200,630", "--virtual-time-budget=2000",
    `--screenshot=${out}`, pathToFileURL(page).href,
  ], { stdio: "inherit" });
  console.log(`wrote ${out}`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
