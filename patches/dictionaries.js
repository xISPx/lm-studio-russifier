const path = require("path");
const BUNDLE_PATH = process.env.LMSR_BUNDLE || path.join(process.env.LOCALAPPDATA, "Programs", "LM Studio", "resources", "app", ".webpack", "renderer", "main_window.js");
const DATA_PATH = path.join(__dirname, "..", "data");
// LM Studio 0.4.25 Russian localization patcher.
// Replaces the 9 ru i18n dictionaries in renderer/main_window.js and
// adds a new module for the missing "shared" namespace, then wires it
// into the RussianStrings assembly. Keeps a .orig.bak backup.

const fs = require("fs");

const BUNDLE =
  BUNDLE_PATH;
const MERGED = DATA_PATH + "\\dicts.json";

const RU_NS = {
  sidebar: 95728,
  chat: 51187,
  config: 10402,
  discover: 41692,
  developer: 14151,
  download: 52155,
  settings: 31687,
  models: 41906,
  onboarding: 48135,
};
const NEW_SHARED_ID = 43210;

function fail(msg) {
  console.error("FATAL: " + msg);
  process.exit(1);
}

function findModuleLiteralSpan(text, moduleId) {
  const re = new RegExp(
    String(moduleId) +
      String.raw`:\(?t=>\)?\{"use strict";t\.exports=JSON\.parse\('`
  );
  const m = text.match(re);
  if (!m) return null;
  const start = m.index + m[0].length;
  let i = start;
  while (true) {
    const j = text.indexOf("')", i);
    if (j < 0) return null;
    let k = j - 1;
    let bs = 0;
    while (k >= start && text[k] === "\\") {
      bs++;
      k--;
    }
    if (bs % 2 === 0) return [start, j];
    i = j + 2;
  }
}

function jsEscape(jsonText) {
  return jsonText.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function jsUnescape(lit) {
  let out = "";
  for (let i = 0; i < lit.length; i++) {
    const c = lit[i];
    if (c === "\\" && i + 1 < lit.length && (lit[i + 1] === "\\" || lit[i + 1] === "'")) {
      out += lit[i + 1];
      i++;
    } else out += c;
  }
  return out;
}

function extractObj(text, moduleId) {
  const span = findModuleLiteralSpan(text, moduleId);
  if (!span) fail("extract module " + moduleId + ": not found");
  try {
    return JSON.parse(jsUnescape(text.slice(span[0], span[1])));
  } catch (e) {
    fail("extract/parse module " + moduleId + ": " + e.message);
  }
}

const merged = JSON.parse(fs.readFileSync(MERGED, "utf8"));
const raw = fs.readFileSync(BUNDLE);
let out = raw.toString("utf8"); // throws on invalid utf-8
const sizeBefore = raw.length;

const report = [];

// 1) replace the 9 existing ru dictionaries
for (const [ns, mid] of Object.entries(RU_NS)) {
  const span = findModuleLiteralSpan(out, mid);
  if (!span) fail("module " + mid + " (" + ns + ") not found");
  const newJson = JSON.stringify(merged[ns]);
  report.push(ns + ": module " + mid + " replaced, " + (span[1] - span[0]) + " -> " + newJson.length + " chars");
  out = out.slice(0, span[0]) + jsEscape(newJson) + out.slice(span[1]);
}

// 2) insert the new shared module before the ru chat module
const modProbe = new RegExp(String(NEW_SHARED_ID) + String.raw`:t=>|a\(` + NEW_SHARED_ID + String.raw`\)`);
if (modProbe.test(out)) fail("module id " + NEW_SHARED_ID + " is not free");
const sharedJson = JSON.stringify(merged.shared);
const newMod = NEW_SHARED_ID + ':t=>{"use strict";t.exports=JSON.parse(\'' + jsEscape(sharedJson) + "\')},";
const chatAnchor = "51187:t=>";
if (out.split(chatAnchor).length - 1 !== 1) fail("chat anchor count " + (out.split(chatAnchor).length - 1));
out = out.replace(chatAnchor, newMod + chatAnchor);
report.push("shared: new module " + NEW_SHARED_ID + " inserted before 51187");

// 3) wire import + assembly
const impAnchor = "Ur=n(a(18224))";
if (out.split(impAnchor).length - 1 !== 1) fail("import anchor count " + (out.split(impAnchor).length - 1));
out = out.replace(impAnchor, impAnchor + ",ruSH=n(a(43210))");

const asmAnchor =
  "mo={sidebar:Bt.default,chat:yt.default,config:kt.default,discover:zt.default,developer:Ht.default,download:_t.default,settings:At.default,models:Vt.default,onboarding:St.default,shared:void 0}";
if (out.split(asmAnchor).length - 1 !== 1) fail("russian assembly anchor count " + (out.split(asmAnchor).length - 1));
out = out.replace(asmAnchor, asmAnchor.replace("shared:void 0}", "shared:ruSH.default}"));
report.push("shared: ruSH.default wired into RussianStrings assembly");

// 4) in-memory round-trip against merged
const RU_ALL = { ...RU_NS, shared: NEW_SHARED_ID };
for (const [ns, mid] of Object.entries(RU_ALL)) {
  const got = extractObj(out, mid);
  if (JSON.stringify(got) !== JSON.stringify(merged[ns]))
    fail("round-trip mismatch in " + ns);
}
report.push("round-trip: all 10 namespaces equal to merged");

// 5) backup + write
const backup = BUNDLE + ".orig.bak";
if (!fs.existsSync(backup)) {
  fs.copyFileSync(BUNDLE, backup);
  report.push("backup created: main_window.js.orig.bak");
} else {
  report.push("backup already exists, kept as is");
}

fs.writeFileSync(BUNDLE, Buffer.from(out, "utf8"));

const sizeAfter = Buffer.byteLength(out, "utf8");
for (const r of report) console.error(r);
console.error("size: " + sizeBefore + " -> " + sizeAfter + " bytes");
console.error("PATCH OK");
