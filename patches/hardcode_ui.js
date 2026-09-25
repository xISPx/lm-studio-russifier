const path = require("path");
const BUNDLE_PATH = process.env.LMSR_BUNDLE || path.join(process.env.LOCALAPPDATA, "Programs", "LM Studio", "resources", "app", ".webpack", "renderer", "main_window.js");
const DATA_PATH = path.join(__dirname, "..", "data");
// Point fixes for hardcoded (non-i18n) UI strings in LM Studio 0.4.25.
// Each entry: [exactAnchor, replacement, expectedCount]. Abort if any count differs.
const fs = require("fs");

const BUNDLE =
  BUNDLE_PATH;

const REPLACEMENTS = [
  ['label:"My Models"', 'label:"Мои модели"', 2],
  ['text:"App Settings"', 'text:"Настройки приложения"', 1],
  ['tooltip:"App Settings"', 'tooltip:"Настройки приложения"', 1],
  ['label:"App Settings"', 'label:"Настройки приложения"', 1],
  ['?"Hide Sidebar":"Show Sidebar"', '?"Скрыть боковую панель":"Показать боковую панель"', 1],
  ['?"Hide sidebar":"Show sidebar"', '?"Скрыть боковую панель":"Показать боковую панель"', 2],
  ['"aria-label":"Split view"', '"aria-label":"Разделённый вид"', 1],
  ['tooltip:"Split view"', 'tooltip:"Разделённый вид"', 1],
  ['?"Cancel model load":void 0!==x?"Disable generator plugin":"Unload model"',
   '?"Отмена загрузки модели":void 0!==x?"Отключить плагин-генератор":"Выгрузить модель"', 1],
  [',"New Folder"]', ',"Новая папка"]', 1],
  ['children:"New chat"', 'children:"Новый чат"', 1],
  ['placeholder:"Search"', 'placeholder:"Поиск"', 1],
  ['clearTooltip:d="Clear search"', 'clearTooltip:d="Очистить поиск"', 1],
  ['"aria-label":"Clear search"', '"aria-label":"Очистить поиск"', 2],
  ['tooltip:"Clear search"', 'tooltip:"Очистить поиск"', 3],
  ['label:"Model Search"', 'label:"Поиск моделей"', 1],
  ['name:"Model Search"', 'name:"Поиск моделей"', 1],
  ['children:"Model Search"', 'children:"Поиск моделей"', 1],
  [',"Model Search"]', ',"Поиск моделей"]', 1],
  ['tooltip:"Sidebar options"', 'tooltip:"Настройки боковой панели"', 1],
  ['label:"Welcome"', 'label:"Начало"', 1],
  ['label:"Developer"', 'label:"Разработка"', 2],
  ['label:"Chat"', 'label:"Чат"', 2],
  ['tooltip:"Downloads"', 'tooltip:"Скачивания"', 2],
  ['children:"Downloads"', 'children:"Скачивания"', 1],
];

const raw = fs.readFileSync(BUNDLE);
let out = raw.toString("utf8");
let fails = [];
let applied = 0;
let skipped = 0;
for (const [anchor, repl, expected] of REPLACEMENTS) {
  let count = out.split(anchor).length - 1;
  if (count === 0 && out.includes(repl)) {
    skipped++; // already applied in a previous run
    continue;
  }
  if (count !== expected) {
    fails.push(`count ${count} != ${expected} for ${anchor}`);
    continue;
  }
  out = out.split(anchor).join(repl);
  applied++;
}
if (fails.length) {
  console.error("ABORT, no changes written:");
  for (const f of fails) console.error(" - " + f);
  process.exit(1);
}
fs.writeFileSync(BUNDLE, Buffer.from(out, "utf8"));
console.error(`HARDCODE PATCH OK: ${applied} applied, ${skipped} already in place (${REPLACEMENTS.length} rules total)`);
