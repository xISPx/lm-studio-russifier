const path = require("path");
const BUNDLE_PATH = process.env.LMSR_BUNDLE || path.join(process.env.LOCALAPPDATA, "Programs", "LM Studio", "resources", "app", ".webpack", "renderer", "main_window.js");
const DATA_PATH = path.join(__dirname, "..", "data");
// Restore docs2 literals from backup at recorded spans (undo), then allow
// batch-application of translated pages with syntax check between batches.
const fs = require("fs");

const BUNDLE =
  BUNDLE_PATH;
const BAK = BUNDLE + ".orig.bak";
const W = "DATA_PATH";

const MODE = process.argv[2]; // "undo" | "apply"
const IDS = process.argv[3] ? process.argv[3].split(",").map(Number) : null; // ids for apply

const spanMap = JSON.parse(fs.readFileSync(`${W}\\docs2_spans.json`, "utf8"));
const trAll = {};
for (let p = 1; p <= 2; p++) {
  const d = JSON.parse(fs.readFileSync(`${W}\\docs2_part${p}_ru.json`, "utf8"));
  for (const [k, v] of Object.entries(d)) trAll[Number(k)] = v;
}
const bak = fs.readFileSync(BAK, "utf8");

function normalize(tr) {
  let tmp = tr.split("\\n").join("\x00");
  tmp = tmp.split("\n").join("\\n");
  tmp = tmp.split("\x00").join("\\n");
  tmp = tmp.split('"').join('\\"');
  if (tmp.includes("\n")) {
    console.error("FATAL: raw newline survived (id " + ids + ")");
    process.exit(1);
  }
  return tmp;
}

let data = fs.readFileSync(BUNDLE, "utf8");
const ids = Object.keys(spanMap).map(Number).sort((a, b) => spanMap[b][0] - spanMap[a][0]);
let changed = 0;
for (const id of ids) {
  if (MODE === "apply" && IDS && !IDS.includes(id)) continue;
  if (MODE === "apply" && ![5, 6, 7, 8].includes(id)) continue;
  const [s, e] = spanMap[id];
  const newText = MODE === "undo" ? bak.slice(s, e) : normalize(trAll[id].text);
  const cur = data.slice(s, e);
  if (cur === newText) continue;
  data = data.slice(0, s) + newText + data.slice(e);
  changed++;
}
fs.writeFileSync(BUNDLE, Buffer.from(data, "utf8"));
console.error(`${MODE.toUpperCase()} OK: ${changed} pages touched`);
