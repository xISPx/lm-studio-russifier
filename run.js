// LM Studio Russifier — applies the Russian translation to the renderer bundle.
// Supported: LM Studio 0.4.25 (Windows x64). Node.js 18+.
//
// Usage:
//   node run.js             — apply (backs up the original on first run)
//   node run.js --restore   — restore the original bundle from the backup
//
// Idempotent: safe to run again on an already patched bundle.

const fs = require("fs");
const path = require("path");

const DATA = path.join(__dirname, "data");
const DOCS_LIT = "content:'";
const DOCS2_LIT = 'content:"';

const RESTORE = process.argv.includes("--restore");

function die(msg) {
  console.error("[ERROR] " + msg);
  process.exit(1);
}

function findSingleLiteralEnd(text, from) {
  let k = from;
  while (k < text.length) {
    const c = text[k];
    if (c === "\\") {
      k += 2;
      continue;
    }
    if (c === "'") break;
    k++;
  }
  return k;
}

function findDoubleLiteralEnd(text, from) {
  let k = from;
  while (k < text.length) {
    const c = text[k];
    if (c === "\\") {
      k += 2;
      continue;
    }
    if (c === '"') break;
    k++;
  }
  return k;
}

function jsEscapeJSON(jsonText) {
  return jsonText.split("\\").join("\\\\").split("'").join("\\'");
}

const DICTS = JSON.parse(fs.readFileSync(path.join(DATA, "dicts.json"), "utf8"));
const HC_PAIRS = JSON.parse(fs.readFileSync(path.join(DATA, "hardcode_pairs.json"), "utf8"));
const HC_PROPS = JSON.parse(fs.readFileSync(path.join(DATA, "hardcode_props.json"), "utf8"));
const TAIL_RULES = JSON.parse(fs.readFileSync(path.join(DATA, "tail_rules.json"), "utf8"));
const SPECIAL_DOCS = JSON.parse(fs.readFileSync(path.join(DATA, "special_docs.json"), "utf8"));
const DOCS_TEXTS = JSON.parse(fs.readFileSync(path.join(DATA, "docs", "docs_texts.json"), "utf8"));
const DOCS2_SAFE = JSON.parse(fs.readFileSync(path.join(DATA, "docs", "docs2_safe.json"), "utf8"));

function applyTranslation(bundleText) {
  let out = bundleText;
  const report = [];

  // ru namespace module ids (bundle-specific, LM Studio 0.4.25)
  const RU_NS = {
    sidebar: 95728, chat: 51187, config: 10402, discover: 41692, developer: 14151,
    download: 52155, settings: 31687, models: 41906, onboarding: 48135,
  };
  const NEW_SHARED_ID = 43210;

  // ---- step 1: dictionaries --------------------------------------------------
  for (const [ns, mid] of Object.entries(RU_NS)) {
    const re = new RegExp(String(mid) + String.raw`:\(?t=>\)?\{"use strict";t\.exports=JSON\.parse\('`);
    const m = out.match(re);
    if (!m) die("dict module " + mid + " (" + ns + ") not found");
    const start = m.index + m[0].length;
    const end = findSingleLiteralEnd(out, start);
    const newJson = JSON.stringify(DICTS[ns]);
    if (out.slice(start, end) === jsEscapeJSON(newJson)) {
      report.push(ns + ": already translated");
      continue;
    }
    out = out.slice(0, start) + jsEscapeJSON(newJson) + out.slice(end);
    report.push(ns + ": dictionary replaced");
  }

  // add the shared namespace module if missing
  if (!out.includes(String(NEW_SHARED_ID) + ":t=>")) {
    const sharedJson = JSON.stringify(DICTS.shared);
    const newMod =
      NEW_SHARED_ID + ':t=>{"use strict";t.exports=JSON.parse(\'' + jsEscapeJSON(sharedJson) + "\')},";
    const chatAnchor = "51187:t=>";
    if (out.split(chatAnchor).length - 1 !== 1) die("chat anchor count");
    out = out.replace(chatAnchor, newMod + chatAnchor);
    const impAnchor = "Ur=n(a(18224))";
    if (out.split(impAnchor).length - 1 !== 1) die("import anchor count");
    out = out.replace(impAnchor, impAnchor + ",ruSH=n(a(" + NEW_SHARED_ID + "))");
    const asmAnchor =
      "mo={sidebar:Bt.default,chat:yt.default,config:kt.default,discover:zt.default,developer:Ht.default,download:_t.default,settings:At.default,models:Vt.default,onboarding:St.default,shared:void 0}";
    if (out.split(asmAnchor).length - 1 !== 1) die("assembly anchor count");
    out = out.replace(asmAnchor, asmAnchor.replace("shared:void 0}", "shared:ruSH.default}"));
    report.push("shared: new module added and wired");
  }

  // ---- step 2: hardcoded UI strings (paired en->ru by prop) ------------------
  let hcApplied = 0;
  for (const [en, ru] of Object.entries(HC_PAIRS)) {
    const props = HC_PROPS[en];
    if (!props) continue;
    const enLit = en.split("\\").join("\\\\").split("'").join("\\'");
    const ruLit = ru.split("\\").join("\\\\").split("'").join("\\'");
    for (const prop of props) {
      const anchor = prop + ':"' + enLit + '"';
      if (!out.includes(anchor)) continue; // already applied or variant
      out = out.split(anchor).join(prop + ':"' + ruLit + '"');
      hcApplied++;
    }
  }
  report.push("hardcode pairs applied: " + hcApplied);

  // ---- step 3: anchor rules (tails) ------------------------------------------
  let tailApplied = 0;
  for (const [anchor, repl] of TAIL_RULES) {
    if (out.includes(repl)) continue; // already applied
    const count = out.split(anchor).length - 1;
    if (count === 0) continue; // variant without this occurrence
    out = out.split(anchor).join(repl);
    tailApplied += count;
  }
  report.push("tail rules applied: " + tailApplied);

  // ---- step 4: special docs (llmster guide, completions legacy) --------------
  let specApplied = 0;
  for (const sp of SPECIAL_DOCS) {
    const ai = out.indexOf(sp.anchor);
    if (ai < 0) continue;
    const ci = out.indexOf(DOCS2_LIT, ai);
    if (ci < 0 || ci - ai > 5000) continue;
    const end = findDoubleLiteralEnd(out, ci + DOCS2_LIT.length);
    const curContent = out.slice(ci + DOCS2_LIT.length, end);
    if (curContent === sp.ru) continue;
    if (!curContent.startsWith(sp.enPrefix.slice(0, 40))) continue;
    out = out.slice(0, ci + DOCS2_LIT.length) + sp.ru + out.slice(end);
    specApplied++;
  }
  report.push("special docs replaced: " + specApplied + "/" + SPECIAL_DOCS.length);

  // ---- step 5: documentation pages (content:'...' literals, by scan order) ---
  const spans = [];
  let si = 0;
  while (true) {
    const j = out.indexOf(DOCS_LIT, si);
    if (j < 0) break;
    const start = j + DOCS_LIT.length;
    const end = findSingleLiteralEnd(out, start);
    spans.push([start, end]);
    si = end + 1;
  }
  const docIds = Object.keys(DOCS_TEXTS).map(Number);
  if (docIds.length !== spans.length) {
    report.push("docs: page count mismatch (" + spans.length + " vs " + docIds.length + ") — skipped");
  } else {
  let docsApplied = 0;
  for (let idx = spans.length - 1; idx >= 0; idx--) {
    const [s, e] = spans[idx];
    const tr = DOCS_TEXTS[String(idx)];
    if (!tr) continue;
    // single quotes must be escaped inside the content:'...' literal
    const trLit = tr.split("'").join("\\'");
    if (out.slice(s, e) === trLit) continue;
    out = out.slice(0, s) + trLit + out.slice(e);
    docsApplied++;
  }
    report.push("docs pages applied: " + docsApplied + "/" + spans.length);
  }

// ---- step 6: additional docs pages (content:"..." literals, by prefix) -----
let docs2Applied = 0;
for (const page of Object.values(DOCS2_SAFE)) {
  const marker = DOCS2_LIT + page.prefix;
  const ci = out.indexOf(marker);
  if (ci < 0) continue; // already applied or not present
  const start = ci + DOCS2_LIT.length;
  // only replace while the literal still holds the ORIGINAL english prefix
  if (!out.slice(start, start + page.prefix.length).startsWith(page.prefix)) continue;
  const end = findDoubleLiteralEnd(out, start);
  out = out.slice(0, start) + page.ru + out.slice(end);
  docs2Applied++;
}
  report.push("docs2 pages applied: " + docs2Applied + "/" + Object.keys(DOCS2_SAFE).length);

  return { out, report };
}

// ---- entry: locate the LM Studio bundle ------------------------------------
const appdata = process.env.LOCALAPPDATA || "";
if (!appdata) die("LOCALAPPDATA is not set");

const lmsInstallDir = [appdata, "Programs", "LM Studio"].join(path.sep);
const rendererDir = [lmsInstallDir, "resources", "app", ".webpack", "renderer"].join(path.sep);
const bundlePath = rendererDir + path.sep + "main_window.js";
const backupPath = bundlePath + ".orig.bak";

// guard: the computed path must stay inside the LM Studio directory
if (!path.resolve(bundlePath).startsWith(path.resolve(lmsInstallDir) + path.sep)) {
  die("bundle path escaped the LM Studio directory");
}

if (!fs.existsSync(bundlePath)) die("main_window.js not found: " + bundlePath);

if (RESTORE) {
  if (!fs.existsSync(backupPath)) die("backup not found: " + backupPath);
  fs.copyFileSync(backupPath, bundlePath);
  console.error("[OK] bundle restored from backup");
  process.exit(0);
}

const original = fs.readFileSync(bundlePath, "utf8");
const sizeBefore = Buffer.byteLength(original, "utf8");
const { out, report } = applyTranslation(original);

if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(bundlePath, backupPath);
  report.push("backup created: main_window.js.orig.bak");
}
fs.writeFileSync(bundlePath, Buffer.from(out, "utf8"));

for (const r of report) console.error(" - " + r);
console.error("size: " + sizeBefore + " -> " + Buffer.byteLength(out, "utf8") + " bytes");
console.error("PATCH OK. Restart LM Studio to see the Russian interface.");
