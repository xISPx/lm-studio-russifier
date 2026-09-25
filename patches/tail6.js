const path = require("path");
const BUNDLE_PATH = process.env.LMSR_BUNDLE || path.join(process.env.LOCALAPPDATA, "Programs", "LM Studio", "resources", "app", ".webpack", "renderer", "main_window.js");
const DATA_PATH = path.join(__dirname, "..", "data");
// Tail patch #6: endpoint nav names + Copy buttons.
const fs = require("fs");

const BUNDLE =
  BUNDLE_PATH;

const R = [
  ['prettyName:"List Models"', 'prettyName:"Список моделей"', 1],
  ['prettyName:"Responses"', 'prettyName:"Responses"', 1], // API name, keep
  ['prettyName:"Chat Completions"', 'prettyName:"Chat Completions"', 1], // API name, keep
  ['prettyName:"Embeddings"', 'prettyName:"Эмбеддинги"', 1],
  ['prettyName:"Completions (Legacy)"', 'prettyName:"Completions (устаревший)"', 1],
  ['prettyName:"Messages"', 'prettyName:"Messages"', 1], // API name, keep
  ['prettyName:"Structured Output"', 'prettyName:"Структурированный вывод"', 1],
  ['prettyName:"Tools and Function Calling"', 'prettyName:"Инструменты и вызов функций"', 1],
  ['prettyName:"Load a model"', 'prettyName:"Загрузка модели"', 1],
  ['prettyName:"Download a model"', 'prettyName:"Скачивание модели"', 1],
  ['prettyName:"Unload a model"', 'prettyName:"Выгрузка модели"', 1],
  ['prettyName:"Get download status"', 'prettyName:"Статус скачивания"', 1],
  ['sectionPrettyName:"OpenAI Compatible Endpoints"', 'sectionPrettyName:"Эндпоинты, совместимые с OpenAI"', 8],
  ['sectionPrettyName:"Anthropic Compatible Endpoints"', 'sectionPrettyName:"Эндпоинты, совместимые с Anthropic"', 2],
  ['children:"Copied!"', 'children:"Скопировано!"', 0],
];

const raw = fs.readFileSync(BUNDLE);
let out = raw.toString("utf8");
let fails = [];
let applied = 0;
for (const [anchor, repl, expected] of R) {
  if (anchor === repl) continue; // keep-as-is marker
  const count = out.split(anchor).length - 1;
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
console.error("TAIL6 OK: " + applied + " replaced");
