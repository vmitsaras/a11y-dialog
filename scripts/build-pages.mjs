import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const pagesDir = resolve(repoRoot, "pages-dist");

const targets = [
  ["index.html", "index.html"],
  ["favicon.svg", "favicon.svg"],
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
console.log("Built GitHub Pages artifact in pages-dist.");
