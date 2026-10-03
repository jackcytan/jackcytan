# ANH TÂN AI — Business Intelligence Lab

**Local Business Data Intelligence & Decision Support** · *Phát triển bởi Anh Tân AI*

Upload an Excel/CSV file (or open a demo) and the app automatically understands the structure, recognises business
fields (Vietnamese with/without accents + English), computes KPIs, finds trends, anomalies and risks, builds a dashboard,
answers natural-language questions, simulates scenarios, calculates automation ROI and writes an executive report.

**Everything runs 100% locally in the browser.** No backend, no database, no API key, no LLM / OpenAI / Claude / Gemini,
no webhooks, no upload. It is a static website (`dist/`).

> Đây không phải chatbot. Đây là **Local Business Intelligence Engine**: thống kê + quy tắc nghiệp vụ + mẫu câu có bằng chứng số liệu.

---

## 1. Features

| Module | What it does |
|---|---|
| **Import Wizard** | Drag & drop `.xlsx .xlsm .xls .csv .tsv`; sheet picker; header-row auto-detection with manual override; preview; merged cells; "Tổng cộng / Total" rows excluded; VN/EN number & date formats; ambiguous values kept as **Needs Review**. |
| **Semantic Mapping** | 700+ field aliases (VI accented / unaccented / EN / abbreviations like `DT`, `SL`, `KH`), value-based hints (cities, statuses, channels), type compatibility, confidence %, dropdown override. |
| **Business Context** | Detects Sales, Retail, Finance, Marketing, HR, Manufacturing, Operations, Inventory, Customer Service or Generic, with confidence; manual override. |
| **Command Center** | Dataset summary, Business Health, Data Quality, KPI cards, **WHAT SHOULD I LOOK AT?** focus items, risks, positive signals, trend, recent anomalies, recommended analyses. |
| **Smart Dashboard** | 4–8 KPI cards with sparklines, 3–10 charts chosen from the mapping (trend, revenue vs cost, margin, target vs actual, breakdowns, Pareto, mix, ratio hotspots, scatter, heatmap), ranking table, insights with **WHY?** drawer, statistical projection, correlation matrix, Pareto summary, CSV/XLSX export. |
| **Data Explorer** | TanStack Table (sort, global search, pagination, column visibility) + TanStack Virtual (only visible rows rendered), Column Profile panel (unique, missing %, min/max/mean/median/std, histogram, top values). |
| **Business Health** | 0–100 score from components that actually exist (growth, momentum, profitability, cost control, concentration, target, stability, quality, downtime, absence, ROAS, budget, stock, satisfaction, on-time, data quality); GOOD / WATCH / RISK; evidence per component. Data Quality 0–100 (Completeness, Consistency, Uniqueness, Validity) with 25 checks and recommendations. |
| **Anomalies** | Robust Z (MAD), IQR, Z-score, moving-average deviation, period-over-period, cross-segment Z, extreme records. Sensitive / Balanced / Conservative. Points require ≥ 2 agreeing methods; results are capped; correlated metrics in the same period are merged. |
| **Ask Your Data** | Local NL parser (normalize → accents removed → tokens → time → filter values → metrics → dimensions → operations). 18 operations (SUM, AVERAGE, COUNT, MIN, MAX, MEDIAN, TOP_N, BOTTOM_N, RANK, GROUP_BY, COMPARE, GROWTH, SHARE, TREND, ANOMALY, PARETO, CORRELATION, FORECAST). Answers include a sentence, KPI highlights, mini chart and table. Unknown questions are **not guessed** — clickable suggestions + **Query Builder**. |
| **Scenario Lab** | Revenue, price, volume, unit cost, marketing, personnel, conversion sliders (only those the data supports), variable-cost assumption, realtime CURRENT / SCENARIO / IMPACT, goal seek, save locally, compare Base vs A vs B. |
| **Automation ROI** | Manual hours, hourly cost, hours saved, FTE, gross/net saving, first-year ROI, payback, 3-year benefit, before/after & cumulative charts. |
| **Executive Report** | 13 sections generated from computed data (template engine, no LLM). **PRINT REPORT** → *Save as PDF* with a dedicated print stylesheet; CSV/XLSX summary export. |
| **Demo Center** | 8 deterministic, seeded demos generated at runtime (Executive, Sales, Retail, Finance, HR, Manufacturing, Operations, Marketing; 768–3,000 rows). They go through the same pipeline as uploaded files. |
| **Privacy Center** | Local Processing ON · External API NONE · Cloud Upload OFF · Third-party AI NONE · CLEAR LOCAL DATA. |
| **Extras** | Dark (default) & designed Light theme, Vietnamese default + English toggle, Ctrl/Cmd + K command palette, `g` + `d/a/s/r/i` shortcuts, `/` focuses Ask, About dialog, 3-step onboarding, toasts, skeletons, count-up KPIs, PWA (offline after first load). |

### Built-in intelligence library (TypeScript, a few hundred KB)

| Library | Count | Location |
|---|---|---|
| Field aliases | 738 | `src/intelligence/dictionaries/fieldAliases.ts` |
| KPI definitions | 91 | `src/intelligence/metrics/kpiLibrary.ts` |
| Business rules | 368 (10 domains) | `src/intelligence/rules/ruleLibrary.ts` |
| Insight templates | 98 | `src/intelligence/insights/templates.ts` |
| Recommended-action templates | 39 | `src/intelligence/insights/recommendations.ts` |
| Data-quality checks | 25 | `src/intelligence/quality/qualityEngine.ts` |
| Anomaly methods / segment diagnostics | 7 / 52 | `src/intelligence/anomalies`, `src/intelligence/analysis/ratioFacts.ts` |
| Query operations / vocabulary | 18 / 1,000+ phrases, 165+ tested combinations | `src/intelligence/query/` |
| Business domains | 9 + generic | `src/intelligence/semantic/domain.ts` |

## 2. Technology

Vite · React 19 · TypeScript · Tailwind CSS 4 · Apache ECharts (`echarts/core`, only Line/Bar/Pie/Scatter/Heatmap + Canvas renderer, lazy-loaded) ·
SheetJS (`@e965/xlsx` = SheetJS 0.20.3 republished on npm, loaded only inside the worker / on export) · Papa Parse (inside the worker) ·
simple-statistics (only `linearRegression`, `linearRegressionLine`, `rSquared`) · TanStack Table v9 + TanStack Virtual (Explorer chunk only) ·
Motion (`LazyMotion` + `domAnimation`) · Lucide icons · Inter Variable (self-hosted). Tests: Vitest + Playwright (`playwright-core`).

Every dependency has a job; nothing else is installed.

## 3. Privacy model

* Files are read with the File API, transferred to a **Web Worker** and parsed there. No network request is made with your data.
* A strict **Content-Security-Policy** is injected at build time: `connect-src 'self'`, `script-src 'self'`, `object-src 'none'` — the app cannot send data to third parties even by mistake.
* SheetJS reads **cached cell values only**: formulas are not executed, macros/VBA are not loaded (`bookVBA: false`), no HTML is generated. No `eval` / `new Function` (enforced by ESLint).
* User text is rendered as React text (escaped). CSV/XLSX exports neutralise formula injection (`=`, `+`, `-`, `@`).
* Uploaded data is **never persisted**. Reload = data gone. Only optional settings ("Remember settings") and saved scenarios live in `localStorage`. **CLEAR LOCAL DATA** removes them.

## 4. Install, run, test, build

Requirements: Node.js 20+ (tested on Node 22).

```bash
cd bi-lab
npm install
npm run dev          # http://localhost:5173
npm test             # 153 unit tests (parsing, semantics, KPI, rules, anomalies, queries, ROI, scenario, quality, demos)
npm run bench        # real timings on 1k / 10k / 50k / 100k synthetic rows
npm run typecheck    # TypeScript
npm run lint         # ESLint
npm run build        # → dist/
npm run size         # bundle report
npx vite preview --port 4173 &  npm run e2e   # 27 browser checks (needs Chromium; set CHROME=/path/to/chrome)
```

## 5. Deploy (static hosting)

The production output is the **`dist/`** folder. No server is needed.

### Cloudflare Pages
* **Git integration:** Framework preset *None* (or *Vite*) · **Root directory:** `bi-lab` · **Build command:** `npm run build` · **Build output directory:** `dist`.
* **Direct upload:** run `npm run build` and drag the **`bi-lab/dist`** folder into *Workers & Pages → Create → Pages → Upload assets*. A ready-made build is also committed as **`bi-lab/anh-tan-bi-lab-cloudflare.zip`** (unzip it and upload the extracted files, or upload the zip directly).

### Vercel / Netlify
Root directory `bi-lab`, build command `npm run build`, output directory `dist`. Routing is hash-based (`#/dashboard`), so no rewrite rules are required.

### Any static host
Upload the contents of `dist/` (paths are relative, so sub-folders work too). HTTPS enables the offline service worker.

## 6. Performance (measured, `npm run bench`, Node 22)

| Rows | CSV parse | Profiling | Semantic | Full analysis | 6 queries |
|---|---|---|---|---|---|
| 1,000 | 4 ms | 62 ms | 7 ms | 26 ms | 55 ms |
| 10,000 | 17 ms | 310 ms | 3 ms | 36 ms | 43 ms |
| 50,000 | 100 ms | 756 ms | 1 ms | 149 ms | 84 ms |
| 100,000 | 225 ms | 1.4 s | 1 ms | 255 ms | 136 ms |

All of this runs inside the Web Worker, so the UI stays responsive. Charts use aggregated data; the Explorer renders only visible rows.
Datasets > 50,000 rows switch on **Large Dataset Mode** (no count-up animation, badge in Explorer). Previews state "x of N rows".

## 7. Bundle (production build)

* Total `dist/`: **≈ 2.8 MB** (budget 20 MB) — incl. self-hosted fonts.
* Initial JS: **≈ 520 KB (≈ 158 KB gzip)**: React, app shell, Motion.
* Lazy chunks: ECharts (≈ 690 KB, first chart), SheetJS (worker / export only), TanStack (Explorer), each page.
* Largest dependency: ECharts (core + 5 chart types + needed components only).

## 8. Extending the engine

| To add… | Edit | How |
|---|---|---|
| **Semantic aliases** | `src/intelligence/dictionaries/fieldAliases.ts` | Append strings under the role, written naturally (accents OK — they are normalized). Longer aliases win. Abbreviations go in `ABBREVIATIONS`. Value hints in `valueHints.ts`. |
| **A KPI** | `src/intelligence/metrics/kpiLibrary.ts` | Add `{ id, name, description, formula, format, domain, required, direction, priority, trend, compute }`. `compute` uses the `Ctx` helpers (`sum`, `avg`, `distinct`, `topShare`, `statusShare`…). It is only computed when all `required` roles exist. |
| **A business rule** | `src/intelligence/rules/ruleLibrary.ts` | `add({ id, domain, requires: [factKeys], condition, severity, template, recommendations, metric, when, params })`. Facts available: `kpi.<id>[.cur/.prev/.chg]`, `g.<measure>`, `g3.`, `yoy.`, `trend.`, `cv.`, `decl.`, `seg.<dim>.*`, `pareto.<dim>.*`, `ratio.<metric>.<dim>.*`, `margin.*`, `dq.*`. Or reuse a factory (`goodMeasureFamily`, `riskMeasureFamily`, `segmentFamily`). |
| **Insight / recommendation text** | `insights/templates.ts`, `insights/recommendations.ts` | VI + EN strings with `{placeholders}` filled only from computed params. |
| **A query pattern** | `src/intelligence/query/lexicon.ts` | Add phrases to `OP_WORDS`, `METRICS`, `DIM_EXTRA`, `TIME_DIM_WORDS` or `VALUE_SYNONYMS`. Add a test in `tests/query.test.ts`. |
| **A demo dataset** | `src/demo/generator.ts` | Add an id to `DEMOS`, a generator function returning `Cell[][]` (header row first) and a seed in `SEEDS`. |

## 9. Project structure

```
bi-lab/
  src/
    app/            store (single source of truth), actions, navigation
    components/     ui primitives, layout, charts (ECharts wrapper), insight cards & WHY drawer
    pages/          Overview/Command Center, Import, Dashboard, Explorer, Health, Anomalies, Ask, Scenario, ROI, Report, Demo, Privacy, Settings
    workers/        engine.worker.ts (parse + profile + analyze), protocol, client, safe file reader
    demo/           seeded deterministic demo generator
    intelligence/   dictionaries, semantic, profiling, metrics, analysis, rules, insights, anomalies, quality, scoring, forecasting, query, scenario, roi
    lib/            parsing (numbers/dates), formatting, statistics, text normalization, export
  tests/            unit tests + perf benchmarks
  scripts/          e2e.mjs (Playwright), size-report.mjs
```
Business logic never lives in UI components.

## 10. Known limitations

* Very large files: files up to ~200 MB are accepted; above ~100k rows profiling takes a few seconds (in the worker). Browser memory is the practical limit (≈ 1–2 M cells is comfortable).
* Excel: cached formula values are used (formulas are not recalculated). Password-protected workbooks must be unlocked first. Legacy `.xls` uses SheetJS' BIFF reader without extra codepages.
* Ambiguous dates where no day > 12 exists default to dd/mm/yyyy (flagged in Data Quality); ambiguous numbers are kept as *Needs Review* rather than converted.
* The query engine understands business questions about the loaded dataset (metrics × dimensions × filters × time × 18 operations). It is not a general chatbot and intentionally refuses unrelated questions.
* Projections are statistical (linear regression + WMA) and need ≥ 6 periods; correlations are associations, not causation.
* Service worker (offline) is active only over HTTPS (e.g. Cloudflare Pages).

---
ANH TÂN AI · Business Intelligence Lab · *Phát triển bởi Anh Tân AI* · 100% Local Processing
