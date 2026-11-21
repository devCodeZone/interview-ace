import { copyFileSync, existsSync, mkdirSync } from "node:fs";
const src = "node_modules/pdfjs-dist/build/pdf.worker.min.mjs";
mkdirSync("public", { recursive: true });
if (existsSync(src)) copyFileSync(src, "public/pdf.worker.min.mjs");
