import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("dist", { recursive: true });
copyFileSync("src/styles.css", "dist/styles.css");
copyFileSync("src/morph.css", "dist/morph.css");
