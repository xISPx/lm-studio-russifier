const path = require("path");
const BUNDLE_PATH = process.env.LMSR_BUNDLE || path.join(process.env.LOCALAPPDATA, "Programs", "LM Studio", "resources", "app", ".webpack", "renderer", "main_window.js");
const DATA_PATH = path.join(__dirname, "..", "data");
// Restore LM Studio main_window.js from the .orig.bak backup.
const fs = require("fs");

const BUNDLE =
  BUNDLE_PATH;
const BACKUP = BUNDLE + ".orig.bak";

if (!fs.existsSync(BACKUP)) {
  console.error("FATAL: backup not found");
  process.exit(1);
}
fs.copyFileSync(BACKUP, BUNDLE);
const size = fs.statSync(BUNDLE).size;
console.error("restored from backup, size=" + size);
console.error("RESTORE OK");
