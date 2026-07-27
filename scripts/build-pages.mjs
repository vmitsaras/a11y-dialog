import {
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const pagesDir = resolve(repoRoot, "docs");

const targets = [
  ["index.html", "index.html"],
  ["favicon.svg", "favicon.svg"],
  [".github/social-preview.png", "social-preview.png"],
  ["demo-theme.css", "demo-theme.css"],
  ["site-header.css", "site-header.css"],
  ["examples", "examples"],
  ["dist", "dist"]
];

rmSync(pagesDir, { recursive: true, force: true });
mkdirSync(pagesDir, { recursive: true });

for (const [source, destination] of targets) {
  cpSync(resolve(repoRoot, source), resolve(pagesDir, destination), {
    recursive: true
  });
}

writeFileSync(resolve(pagesDir, ".nojekyll"), "");

if (!existsSync(resolve(pagesDir, "index.html"))) {
  throw new Error("GitHub Pages output is missing docs/index.html.");
}

console.log("Built GitHub Pages site in docs.");
