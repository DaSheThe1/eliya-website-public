import path from "node:path";
import process from "node:process";

import { validateJson } from "./lib/schema.mjs";

const briefPath = process.argv[2];

if (!briefPath) {
  console.error("Usage: node scripts/validate-brief.mjs <site-brief.json>");
  process.exit(2);
}

validateJson(path.resolve(briefPath), "site-brief.schema.json");
console.log(`Validated site brief: ${briefPath}`);
