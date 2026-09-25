const path = require("path");
const BUNDLE_PATH = process.env.LMSR_BUNDLE || path.join(process.env.LOCALAPPDATA, "Programs", "LM Studio", "resources", "app", ".webpack", "renderer", "main_window.js");
const DATA_PATH = path.join(__dirname, "..", "data");
// Tail patch #8: developer tab leftovers (status, buttons, hint).
const fs = require("fs");

const BUNDLE =
  BUNDLE_PATH;

const R = [
  ['i="running"===r?"Running":"starting"===r?"Starting":"stopped"===r?"Stopped":"Stopping"',
   'i="running"===r?"Работает":"starting"===r?"Запускается":"stopped"===r?"Остановлен":"Останавливается"', 1],
  [',"Server Settings"]', ',"Настройки сервера"]', 1],
  ['tabs:["Developer Logs"]', 'tabs:["Журналы разработки"]', 1],
  ['children:["Press "', 'children:["Нажмите "', 1],
  ['"L to load a model"]', '"L для загрузки модели"]', 1],
  ['children:"Open in new window"', 'children:"Открыть в новом окне"', 1],
];

const raw = fs.readFileSync(BUNDLE);
let out = raw.toString("utf8");
let fails = [];
let applied = 0;
for (const [anchor, repl, expected] of R) {
  let count = out.split(anchor).length - 1;
  if (count === 0 && out.includes(repl)) continue;
  if (count !== expected) {
    fails.push(`count ${count} != ${expected} for ${anchor.slice(0, 70)}`);
    continue;
  }
  out = out.split(anchor).join(repl);
  applied += count;
}
if (fails.length) {
  console.error("ABORT, no changes written:");
  fails.forEach((f) => console.error(" - " + f));
  process.exit(1);
}
fs.writeFileSync(BUNDLE, Buffer.from(out, "utf8"));
console.error("TAIL8 OK: " + applied + " replaced");
