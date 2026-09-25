const path = require("path");
const BUNDLE_PATH = process.env.LMSR_BUNDLE || path.join(process.env.LOCALAPPDATA, "Programs", "LM Studio", "resources", "app", ".webpack", "renderer", "main_window.js");
const DATA_PATH = path.join(__dirname, "..", "data");
// Tail patch #5: sidebar buttons + tab title.
const fs = require("fs");

const BUNDLE =
  BUNDLE_PATH;

const REPLACEMENTS = [
  [',"Local Server"]}', ',"Локальный сервер"]}', 1],
  [',"Developer Docs"]}', ',"Документация разработчика"]}', 1],
  ['children:"Developer"', 'children:"Разработка"', 1],
  ['prettyName:"Chat with a model"', 'prettyName:"Чат с моделью"', 1],
];

const raw = fs.readFileSync(BUNDLE);
let out = raw.toString("utf8");
let fails = [];
for (const [anchor, repl, expected] of REPLACEMENTS) {
  const count = out.split(anchor).length - 1;
  if (count === 0 && out.includes(repl)) continue;
  if (count !== expected) {
    fails.push(`count ${count} != ${expected} for ${anchor}`);
    continue;
  }
  out = out.split(anchor).join(repl);
}
if (fails.length) {
  console.error("ABORT, no changes written:");
  fails.forEach((f) => console.error(" - " + f));
  process.exit(1);
}
fs.writeFileSync(BUNDLE, Buffer.from(out, "utf8"));
console.error("TAIL5 PATCH OK");
