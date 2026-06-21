import { parse_pe } from "./pkg/pe_explorer_web.js";
import fs from "node:fs";

const path = process.argv[2];
if (!path) { console.error("usage: node check.mjs <file>"); process.exit(1); }
const bytes = fs.readFileSync(path);
console.log(`input: ${path} (${bytes.length} bytes)`);

const raw = parse_pe(new Uint8Array(bytes));
console.log(`raw type: ${typeof raw}`);
console.log(`raw first 120 chars: ${String(raw).slice(0, 120)}`);

const parsed = JSON.parse(raw);
console.log("\n=== parsed object keys ===");
console.log(Object.keys(parsed));
console.log("\n=== flat field values ===");
console.log("file_size:", parsed.file_size, typeof parsed.file_size);
console.log("bits:", parsed.bits, typeof parsed.bits);
console.log("machine:", parsed.machine, typeof parsed.machine);
console.log("number_of_sections:", parsed.number_of_sections, typeof parsed.number_of_sections);
console.log("characteristics:", parsed.characteristics);
console.log("sections.length:", parsed.sections?.length);
console.log("imports.length:", parsed.imports?.length);
console.log("exports.length:", parsed.exports?.length);

console.log("\n=== sanity: would formatBytes(file_size) work? ===");
const n = parsed.file_size;
console.log("n:", n, "typeof:", typeof n);
if (typeof n !== "number" && typeof n !== "bigint") {
  console.log("BUG: file_size is", typeof n, "not number");
  process.exit(2);
}
console.log("toFixed test:", (1234.5).toFixed(1), "<- works");
console.log("OK: parsed.file_size is usable");
