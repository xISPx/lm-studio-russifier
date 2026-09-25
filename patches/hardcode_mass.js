const path = require("path");
const BUNDLE_PATH = process.env.LMSR_BUNDLE || path.join(process.env.LOCALAPPDATA, "Programs", "LM Studio", "resources", "app", ".webpack", "renderer", "main_window.js");
const DATA_PATH = path.join(__dirname, "..", "data");
// Hardcode patch v2: mass replacement of hardcoded display strings.
// For each en->ru pair, replaces ONLY in the display-prop contexts recorded
// during extraction (prop:"en" -> prop:"ru"). Idempotent.
const fs = require("fs");

const BUNDLE =
  BUNDLE_PATH;
const PROPS_MAP = DATA_PATH + "\\hardcode_strings.json";
const RU1 = DATA_PATH + "\\hardcode_part1_ru.json";
const RU2 = DATA_PATH + "\\hardcode_part2_ru.json";

function toJsLiteral(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

const propsMap = JSON.parse(fs.readFileSync(PROPS_MAP, "utf8"));
const ru = {
  ...JSON.parse(fs.readFileSync(RU1, "utf8")),
  ...JSON.parse(fs.readFileSync(RU2, "utf8")),
};

const raw = fs.readFileSync(BUNDLE);
let out = raw.toString("utf8");

let applied = 0;
let skippedSame = 0;
let skippedAbsent = 0;
let skippedMulti = 0;
const problems = [];

const entries = Object.entries(ru).sort((a, b) => b[0].length - a[0].length);
for (const [en, tr] of entries) {
  if (en === tr) {
    skippedSame++;
    continue;
  }
  const props = propsMap[en];
  if (!props) {
    problems.push("no props recorded for: " + en.slice(0, 60));
    continue;
  }
  const enLit = toJsLiteral(en);
  const trLit = toJsLiteral(tr);
  let done = 0;
  for (const prop of props) {
    const anchor = prop + ':"' + enLit + '"';
    const repl = prop + ':"' + trLit + '"';
    const c = out.split(anchor).length - 1;
    if (c === 0) {
      // maybe already replaced in a previous run
      if (out.split(repl).length - 1 > 0) {
        skippedAbsent++;
        continue;
      }
      problems.push("anchor not found: " + anchor.slice(0, 80));
      continue;
    }
    if (c > 1) {
      skippedMulti += c;
    }
    out = out.split(anchor).join(repl);
    done += c;
    applied += c;
  }
  if (done === 0 && !problems.some((p) => p.includes(enLit.slice(0, 30)))) {
    // nothing replaced anywhere
  }
}

fs.writeFileSync(BUNDLE, Buffer.from(out, "utf8"));
console.error(
  `HARDCODE2 OK: ${applied} occurrences replaced, ${skippedSame} identical skipped, ${skippedAbsent} already replaced, ${skippedMulti} multi-context`
);
if (problems.length) {
  console.error(problems.length + " problems (first 10):");
  problems.slice(0, 10).forEach((p) => console.error(" - " + p));
}
