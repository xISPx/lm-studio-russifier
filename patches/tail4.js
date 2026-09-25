const path = require("path");
const BUNDLE_PATH = process.env.LMSR_BUNDLE || path.join(process.env.LOCALAPPDATA, "Programs", "LM Studio", "resources", "app", ".webpack", "renderer", "main_window.js");
const DATA_PATH = path.join(__dirname, "..", "data");
// Tail patch #4: Developer tab, My Models page, settings page titles, docs nav.
const fs = require("fs");

const BUNDLE =
  BUNDLE_PATH;

const R = [
  // settings page titles
  ['title:"Chat"', 'title:"Чат"', 1],
  ['title:"Integrations"', 'title:"Интеграции"', 3],
  ['title:"Developer"', 'title:"Разработка"', 2],
  ['title:"Appearance"', 'title:"Оформление"', 1],
  ['title:"Model Defaults"', 'title:"Параметры моделей"', 1],
  ['title:"Hardware"', 'title:"Оборудование"', 1],
  ['title:"Runtime"', 'title:"Рантайм"', 1],
  // developer tab
  ['server:"Local Server"', 'server:"Локальный сервер"', 1],
  ['developer:"Developer Docs"', 'developer:"Документация разработчика"', 1],
  ['title:"Developer Logs"', 'title:"Журналы разработки"', 1],
  ['title:"Server Settings"', 'title:"Настройки сервера"', 1],
  ['prettyName:"Server Settings"', 'prettyName:"Настройки сервера"', 1],
  ['children:"Require Authentication"', 'children:"Требовать аутентификацию"', 1],
  ['children:["Active API Keys:"," ', 'children:["Активные API-ключи:"," ', 1],
  ['children:"Allow per-request MCPs"', 'children:"Разрешать MCP для отдельных запросов"', 1],
  ['title:"Allow calling servers from mcp.json"', 'title:"Разрешить вызов серверов из mcp.json"', 1],
  ['children:"Allow calling servers from mcp.json"', 'children:"Разрешить вызов серверов из mcp.json"', 1],
  ['children:"Show advanced settings"', 'children:"Показать расширенные настройки"', 1],
  ['children:["When enabled, only requests that include the"', 'children:["Если включено, разрешаются только запросы, содержащие заголовок"', 1],
  ['" header with a "', '" со значением"', 1],
  ['"value will be allowed."', '"."', 1],
  // model loader / config
  ['displayName:"Speculative Decoding"', 'displayName:"Спекулятивное декодирование"', 2],
  ['displayName:"Context Checkpoints"', 'displayName:"Контрольные точки контекста"', 2],
  ['tooltipOverride:"Configure load-time speculative decoding."', 'tooltipOverride:"Настроить спекулятивное декодирование при загрузке."', 1],
  ['hint:"Configure load-time speculative decoding."', 'hint:"Настроить спекулятивное декодирование при загрузке."', 2],
  ['placeholder:t.typeParam.placeholder??"Enter text here"', 'placeholder:t.typeParam.placeholder??"Введите текст здесь"', 2],
  ['children:"Show advanced settings"', null, 0], // placeholder, replaced above
  // my models page
  ['name:"My Models"', 'name:"Мои модели"', 1],
  ['children:"My Models"', 'children:"Мои модели"', 2],
  ['ariaLabel:"My Models"', 'ariaLabel:"Мои модели"', 1],
  ['title:"My Models"', 'title:"Мои модели"', 1],
  ['children:"Text Embedding"', 'children:"Текстовые эмбеддинги"', 1],
  ['sectionPrettyName:"Text Embedding"', 'sectionPrettyName:"Текстовые эмбеддинги"', 2],
  ['," Use in New Chat"]}', '," Использовать в новом чате"]}', 1],
  [',"View All"]', ',"Все модели"]', 1],
  [',"LLMs"]', ',"LLM"]', 1],
  [',"Text Embedding"]', ',"Текстовые эмбеддинги"]', 1],
  [',"Drafters"]', ',"Черновые модели"]', 1],
  ['label:"Load Model"', 'label:"Загрузить модель"', 1],
  ['"aria-label":"Load Model"', '"aria-label":"Загрузить модель"', 1],
  ['children:"Load Model"', 'children:"Загрузить модель"', 1],
  ['deviceName:"This device"', 'deviceName:"Этот компьютер"', 3],
  ['children:"This device"', 'children:"Этот компьютер"', 2],
  ['label:"Chat Settings"', 'label:"Настройки чата"', 1],
  ['sectionTitle:"Chat Settings"', 'sectionTitle:"Настройки чата"', 1],
  ['title:0===r.length?"Tools you allow to run without confirmation will appear here"',
   'title:0===r.length?"Инструменты, разрешённые к запуску без подтверждения, появятся здесь"', 1],
  // right panel of a selected model
  ['displayName:"Info"', 'displayName:"Инфо"', 2],
  ['thisTab:"Info"', 'thisTab:"Инфо"', 2],
  ['children:"Info"', 'children:"Инфо"', 3],
  ['displayName:"Load"', 'displayName:"Загрузить"', 2],
  ['thisTab:"Load"', 'thisTab:"Загрузить"', 2],
  ['children:"Load"', 'children:"Загрузить"', 2],
  ['displayName:"Inference"', 'displayName:"Инференс"', 2],
  ['thisTab:"Inference"', 'thisTab:"Инференс"', 2],
  ['children:"Inference"', 'children:"Инференс"', 2],
  ['label:"Format"', 'label:"Формат"', 2],
  ['children:"Format"', 'children:"Формат"', 2],
  ['children:"Quantization"', 'children:"Квантование"', 1],
  ['children:"Arch"', 'children:"Архитектура"', 2],
  ['children:"File"', 'children:"Файл"', 1],
  ['displayName:"Model"', 'displayName:"Модель"', 1],
  ['children:"Model"', 'children:"Модель"', 1],
  ['alt:"Model"', 'alt:"Модель"', 1],
  // docs navigation
  ['prettyName:"Introduction"', 'prettyName:"Введение"', 9],
  ['title:"Introduction"', 'title:"Введение"', 3],
  ['title:"API Changelog"', 'title:"История изменений API"', 1],
  ['prettyName:"API Changelog"', 'prettyName:"История изменений API"', 1],
  ['prettyName:"Quickstart"', 'prettyName:"Быстрый старт"', 1],
  ['title:"Stateful Chats"', 'title:"Чаты с сохранением состояния"', 1],
  ['prettyName:"Stateful Chats"', 'prettyName:"Чаты с сохранением состояния"', 1],
  ['title:"Streaming events"', 'title:"События стриминга"', 1],
  ['prettyName:"Streaming events"', 'prettyName:"События стриминга"', 1],
  ['title:"List your models"', 'title:"Список ваших моделей"', 1],
  ['prettyName:"List your models"', 'prettyName:"Список ваших моделей"', 1],
  ['prettyName:"Running the Server"', 'prettyName:"Запуск сервера"', 1],
  ['title:"Serve on Local Network"', 'title:"Сервер в локальной сети"', 1],
  ['prettyName:"Serve on Local Network"', 'prettyName:"Сервер в локальной сети"', 1],
  ['title:"Idle TTL and Auto-Evict"', 'title:"Простой (TTL) и автовыгрузка"', 1],
  ['prettyName:"Idle TTL and Auto-Evict"', 'prettyName:"Простой (TTL) и автовыгрузка"', 1],
  ['prettyName:"Using with LM Link"', 'prettyName:"Использование с LM Link"', 1],
  ['title:"Using MCP via API"', 'title:"Использование MCP через API"', 1],
  ['prettyName:"Using MCP via API"', 'prettyName:"Использование MCP через API"', 1],
  ['prettyName:"Linux Startup Task"', 'prettyName:"Задача автозапуска Linux"', 1],
  ['title:"Authentication"', 'title:"Аутентификация"', 3],
  ['prettyName:"Authentication"', 'prettyName:"Аутентификация"', 3],
  ['prettyName:"Overview"', 'prettyName:"Обзор"', 5],
  ['sectionPrettyName:"Core"', 'sectionPrettyName:"Ядро"', 9],
  ['children:"Core"', 'children:"Ядро"', 1],
  // misc
  ['placeholder:"Search the docs..."', 'placeholder:"Поиск по документации..."', 2],
  ['?"Copied!":"Copy as Markdown"', '?"Скопировано!":"Копировать как Markdown"', 1],
  ['children:"Show on Web"', 'children:"Показать в браузере"', 1],
  ['"aggregate_one":"You have {{count}} local model, taking up {{size}} of disk space"',
   '"aggregate_one":"У вас {{count}} локальная модель, занимает {{size}} на диске"', 1],
  ['"aggregate_other":"You have {{count}} local models, taking up {{size}} of disk space."',
   '"aggregate_other":"У вас {{count}} локальных моделей, суммарно {{size}} на диске."', 1],
];

const raw = fs.readFileSync(BUNDLE);
let out = raw.toString("utf8");
let fails = [];
let applied = 0;
for (const [anchor, repl, expected] of R) {
  if (repl === null) continue;
  let count = out.split(anchor).length - 1;
  if (count === 0 && out.includes(repl)) continue; // already applied
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
console.error("TAIL4 PATCH OK: " + applied + " occurrences across " + R.filter((r) => r[1]).length + " rules");
