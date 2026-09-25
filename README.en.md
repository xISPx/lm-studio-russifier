# LM Studio Russifier — unofficial Russian translation for LM Studio

**English | [Русский](README.md)**

[![Release](https://img.shields.io/github/v/release/xISPx/lm-studio-russifier)](https://github.com/xISPx/lm-studio-russifier/releases)
[![Platform](https://img.shields.io/badge/platform-Windows-blue)](https://github.com/xISPx/lm-studio-russifier)
[![Node](https://img.shields.io/badge/node-18%2B-green)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![LM Studio](https://img.shields.io/badge/LM%20Studio-0.4.25-orange)](https://lmstudio.ai)

An unofficial Russian translation for [LM Studio](https://lmstudio.ai), the desktop app for running local LLMs. The app ships with 39 built-in locales, but Russian is marked "Beta" and lags behind: ~430 untranslated strings, outdated wording, and a significant part of the UI is hardcoded outside the localization system entirely. This script replaces English strings with Russian ones in place, inside `main_window.js`.

What is translated:

- **the full i18next dictionaries**: 1441 strings across 10 namespaces; the missing `shared` namespace is added as a new webpack module, 430 gaps are closed, and the official "Beta" translation is proofread;
- **hardcoded UI strings** (~1700): settings headers and tabs, chat panel, model card, buttons and tooltips — everything the official localization never touches;
- **the entire Developer Docs**: 126 pages (~430 KB) — guides, REST API, MCP, the `lms` CLI; code blocks, commands and links are preserved untouched.

Intentionally **not** translated: API endpoint names (Responses, Chat Completions), brands (LM Studio, LM Link, Hub), language names in the selector (kept in their native locales), and screenshots inside the docs.

> ⚠️ **Important**
> - This tool modifies application files. Use at your own risk.
> - **LM Studio auto-updates wipe the translation.** Re-run the script after every update.
> - Roll back any time: `node run.js --restore` (or reinstall LM Studio).
> - Tested on **LM Studio 0.4.25 (Windows x64)**. On other versions the script reports an error and changes nothing (module ids and anchors differ).

## Requirements

- Windows
- [Node.js](https://nodejs.org/) 18+
- LM Studio installed

## Apply the Russian language

Download the repository (**Code → Download ZIP**) or clone it, then run a single command (or double-click `run.cmd`):

```
node run.js
```

The script finds LM Studio in `%LOCALAPPDATA%\Programs\LM Studio`, backs up `main_window.js` to `main_window.js.orig.bak`, and applies the translation. Restart LM Studio.

## Rollback

```
node run.js --restore
```

## How it works

All of the LM Studio UI lives in a single file, `resources\app\.webpack\renderer\main_window.js` (~35 MB). The script:

1. replaces the JSON dictionaries of 9 localization namespaces and adds the missing `shared` namespace as a new webpack module;
2. replaces hardcoded strings by `prop:"string"` anchors (only when every occurrence of a string is display-only);
3. replaces `content:'...'` literals of the documentation pages with translations (code blocks untouched);
4. verifies the result and prints a report.

Re-running is safe: already translated strings are skipped.

## License

MIT — see [LICENSE](LICENSE).
