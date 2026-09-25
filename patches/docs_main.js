const path = require("path");
const BUNDLE_PATH = process.env.LMSR_BUNDLE || path.join(process.env.LOCALAPPDATA, "Programs", "LM Studio", "resources", "app", ".webpack", "renderer", "main_window.js");
const DATA_PATH = path.join(__dirname, "..", "data");
// Docs injection: replaces content:'...' literals with translated versions.
// Normalizes real newlines to \n markers; escapes single quotes.
const fs = require("fs");

const BUNDLE =
  BUNDLE_PATH;
const W = "DATA_PATH";

let data = fs.readFileSync(BUNDLE, "utf8");

// collect spans of content:'...' literals
const lit = "content:'";
const spans = [];
let i = 0;
while (true) {
  const j = data.indexOf(lit, i);
  if (j < 0) break;
  const start = j + lit.length;
  let k = start;
  while (k < data.length) {
    const c = data[k];
    if (c === "\\") {
      k += 2;
      continue;
    }
    if (c === "'") break;
    k++;
  }
  spans.push([start, k]);
  i = k + 1;
}

const trAll = {};
for (let p = 1; p <= 6; p++) {
  const d = JSON.parse(fs.readFileSync(`${W}\\docs_part${p}_ru.json`, "utf8"));
  for (const [k, v] of Object.entries(d)) trAll[Number(k)] = v;
}
if (Object.keys(trAll).length !== spans.length) {
  console.error(`FATAL: tr ${Object.keys(trAll).length} != spans ${spans.length}`);
  process.exit(1);
}

function normalize(tr) {
  let tmp = tr.split("\\n").join("\x00"); // literal markers -> placeholder
  tmp = tmp.split("\n").join("\\n"); // real newlines -> markers
  tmp = tmp.split("\x00").join("\\n"); // markers back
  tmp = tmp.split("'").join("\\'"); // escape quotes
  if (tmp.includes("\n")) {
    console.error("FATAL: raw newline survived");
    process.exit(1);
  }
  return tmp;
}

// apply from the end
const idxs = Object.keys(trAll)
  .map(Number)
  .sort((a, b) => spans[b][0] - spans[a][0]);
let changed = 0;
for (const idx of idxs) {
  const [s, e] = spans[idx];
  const orig = data.slice(s, e);
  const nl = normalize(trAll[idx].text);
  if (nl === orig) {
    console.error(`doc ${idx}: unchanged, skip`);
    continue;
  }
  data = data.slice(0, s) + nl + data.slice(e);
  changed++;
}

fs.writeFileSync(BUNDLE, Buffer.from(data, "utf8"));
console.error(`DOCS INJECTED: ${changed} of ${spans.length} pages changed`);
