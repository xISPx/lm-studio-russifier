const path = require("path");
const BUNDLE_PATH = process.env.LMSR_BUNDLE || path.join(process.env.LOCALAPPDATA, "Programs", "LM Studio", "resources", "app", ".webpack", "renderer", "main_window.js");
const DATA_PATH = path.join(__dirname, "..", "data");
// Tail patch #7: replace damaged/EN content of llmster guide + Completions (Legacy).
const fs = require("fs");

const BUNDLE =
  BUNDLE_PATH;

const NL = "\\n";

const LLMSTER = [
  NL + "`llmster`, головной демон LM Studio, можно настроить на автозапуск. Это руководство описывает настройку `llmster` для запуска, загрузки модели и старта HTTP-сервера автоматически через `systemctl` в Linux.",
  NL + NL + "```lms_info",
  NL + "Это руководство для Linux-систем без графического интерфейса. Для машин с GUI можно настроить LM Studio на [запуск как сервиса при входе в систему](/docs/developer/core/headless).",
  NL + "```",
  NL + NL + "## Установка демона",
  NL + NL + "Выполните следующую команду для установки `llmster`:",
  NL + NL + "```bash",
  NL + "curl -fsSL https://lmstudio.ai/install.sh | bash",
  NL + "```",
  NL + NL + "Проверьте установку:",
  NL + NL + "```bash",
  NL + "lms --help",
  NL + "```",
  NL + NL + "## Скачивание модели",
  NL + NL + "Скачайте модель для работы с сервером:",
  NL + NL + "```bash",
  NL + "lms get openai/gpt-oss-20b",
  NL + "```",
  NL + NL + "В выводе будет путь к модели. Он понадобится для конфигурации systemd.",
  NL + NL + "## Ручная проверка",
  NL + NL + "Перед настройкой systemd убедитесь, что всё работает вручную.",
  NL + "Загрузите модель:",
  NL + NL + "```bash",
  NL + "lms load openai/gpt-oss-20b",
  NL + "```",
  NL + NL + "Запустите сервер:",
  NL + NL + "```bash",
  NL + "lms server start",
  NL + "```",
  NL + NL + "Проверьте, что API отвечает:",
  NL + NL + "```bash",
  NL + "curl http://localhost:1234/v1/models",
  NL + "```",
  NL + NL + "Остановите сервер после проверки:",
  NL + NL + "```bash",
  NL + "lms server stop",
  NL + "```",
  NL + NL + "## Создание службы Systemd",
  NL + NL + "Создайте `/etc/systemd/system/lmstudio.service`. Замените `YOUR_USERNAME` на ваше имя пользователя.",
  NL + NL + "```ini",
  NL + "[Unit]",
  NL + "Description=LM Studio Server",
  NL + "",
  NL + "[Service]",
  NL + "Type=oneshot",
  NL + "RemainAfterExit=yes",
  NL + "User=YOUR_USERNAME",
  NL + 'Environment=\\"HOME=/home/YOUR_USERNAME\\"',
  NL + "ExecStartPre=/home/YOUR_USERNAME/.lmstudio/bin/lms daemon up",
  NL + "ExecStartPre=/home/YOUR_USERNAME/.lmstudio/bin/lms load openai/gpt-oss-20b --yes",
  NL + "ExecStart=/home/YOUR_USERNAME/.lmstudio/bin/lms server start",
  NL + "ExecStop=/home/YOUR_USERNAME/.lmstudio/bin/lms daemon down",
  NL + "",
  NL + "[Install]",
  NL + "WantedBy=multi-user.target",
  NL + "```",
  NL + NL + "Этот юнит автоматически загружает модель `openai/gpt-oss-20b` при запуске. Вместо этого можно не загружать конкретную модель на старте и положиться на [загрузку Just-In-Time (JIT) и автовыгрузку](/docs/developer/core/ttl-and-auto-evict) на сервере.",
  NL + NL + "## Включение и запуск службы",
  NL + NL + "```bash",
  NL + "sudo systemctl daemon-reload",
  NL + "sudo systemctl enable lmstudio.service",
  NL + "sudo systemctl start lmstudio.service",
  NL + "```",
  NL + NL + "## Проверка",
  NL + NL + "Проверьте статус службы:",
  NL + NL + "```bash",
  NL + "systemctl status lmstudio",
  NL + "```",
  NL + NL + "Проверьте API:",
  NL + NL + "```bash",
  NL + "curl http://localhost:1234/v1/models",
  NL + "```",
  NL + NL + "## Управление службой",
  NL + NL + "```bash",
  NL + "# Остановить службу",
  NL + "sudo systemctl stop lmstudio",
  NL + "",
  NL + "# Перезапустить службу",
  NL + "sudo systemctl restart lmstudio",
  NL + "",
  NL + "# Отключить автозапуск",
  NL + "sudo systemctl disable lmstudio",
  NL + "```",
  NL + NL + "## Сообщество",
  NL + NL + "Общайтесь с другими разработчиками LM Studio, обсуждайте LLM, железо и многое другое в [Discord-сервере LM Studio](https://discord.gg/aPQfnNkxGC).",
  NL + NL + "Об ошибках сообщайте в GitHub-репозитории [lmstudio-bug-tracker](https://github.com/lmstudio-ai/lmstudio-bug-tracker/issues).",
].join("");

const COMPLETIONS = [
  NL + "```lms_warning",
  NL + "Этот эндпоинт больше не поддерживается OpenAI. LM Studio продолжает его поддерживать.",
  NL + NL + "Использование этого эндпоинта с моделями, дообученными для чата, может привести к неожиданным токенам. Предпочтительны базовые модели.",
  NL + "```",
  NL + NL + "- Метод: `POST`",
  NL + "- Шаблон промпта не применяется",
  NL + "- См. документацию OpenAI: https://platform.openai.com/docs/api-reference/completions",
].join("");

const raw = fs.readFileSync(BUNDLE);
let out = raw.toString("utf8");

function repairDoc(anchor, tailAnchor, newText) {
  const ai = out.indexOf(anchor);
  if (ai < 0) return "anchor not found: " + anchor.slice(0, 40);
  const ti = out.indexOf(tailAnchor, ai);
  if (ti < 0) return "tail not found after anchor: " + anchor.slice(0, 40);
  const ci = out.indexOf('content:"', ai);
  out = out.slice(0, ai) + out.slice(ai, ti).replace(/content:"[\s\S]*?$/, 'content:"' + newText) + out.slice(ti);
  return null;
}

const errs = [];
const e1 = repairDoc("headless_llmster:{metadata:", '",pageRelUrl:"1_developer/0_core/headless_llmster.md"', LLMSTER);
if (e1) errs.push(e1);
const e2 = repairDoc('prettyName:"Completions (устаревший)"', '",pageRelUrl:"1_developer/3_openai-compat/completions.md"', COMPLETIONS);
if (e2) errs.push(e2);

if (errs.length) {
  console.error("ABORT, no changes written:");
  errs.forEach((x) => console.error(" - " + x));
  process.exit(1);
}
fs.writeFileSync(BUNDLE, Buffer.from(out, "utf8"));
console.error("TAIL7 OK: 2 pages replaced");
