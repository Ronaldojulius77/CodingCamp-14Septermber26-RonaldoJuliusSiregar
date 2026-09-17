# Design Specification
# Expense & Budget Visualizer

## 1. System Architecture

The application is a **zero-build, zero-server, single-page web app** that runs entirely in the browser.

```
┌──────────────────────────────────────────────────────┐
│                     Browser Tab                       │
│                                                       │
│  index.html ──loads──► css/style.css                  │
│               └──────► js/app.js                      │
│               └─CDN──► chart.js v4.4.0 (jsDelivr)    │
│                                                       │
│  js/app.js ◄──read/write──► localStorage (4 keys)    │
│            ◄──query/mutate──► DOM                     │
│            ◄──create/update──► Chart.js instance      │
└──────────────────────────────────────────────────────┘
```

**Entry point:** `index.html` opened directly as `file://`. Chart.js loads in `<head>` (guaranteeing the global `Chart` constructor exists). `app.js` loads at the end of `<body>` as a classic script. Execution begins when `DOMContentLoaded` fires and calls `init()`.

---

## 2. File Structure

```
project-root/
│
├── index.html                  ← App shell and all markup
├── css/
│   └── style.css               ← All styles (1 file only)
├── js/
│   └── app.js                  ← All behaviour (1 file only)
│
└── .kiro/
    └── specs/
        └── expense-budget-visualizer/
            ├── requirements.md
            ├── design.md        ← this file
            └── tasks.md
```

---

## 3. HTML Architecture (`index.html`)

### 3.1 Document Head

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Expense & Budget Visualizer</title>
  <link rel="stylesheet" href="css/style.css" />
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
</head>
```

Chart.js must be in `<head>` — `app.js` references `Chart` at call time (not at parse time), so it is safe, but loading it first is the simplest guarantee.

### 3.2 Full Body DOM Tree

```
<body class="light-mode">

  ── HEADER ──────────────────────────────────────────────────────
  <header.app-header>                         sticky, z-index 100
    <div.header-left>
      <span.app-logo>💰</span>
      <h1.app-title>Budget Visualizer</h1>
    <div.header-right>
      <button#themeToggle.btn-icon
             aria-label="Toggle theme">
        <span#themeIcon>🌙</span>

  ── MAIN ────────────────────────────────────────────────────────
  <main.app-main>                             max-width 1200 px, centred

    ── BALANCE CARD ──────────────────────────────────────────────
    <section.balance-card aria-label="Balance overview">
      <div.balance-row>
        <div.balance-block>
          <p.balance-label>Total Income</p>
          <p.balance-amount.income-amount #totalIncome>
        <div.balance-divider>
        <div.balance-block>
          <p.balance-label>Total Spent</p>
          <p.balance-amount.expense-amount #totalSpent>
        <div.balance-divider>
        <div.balance-block>
          <p.balance-label>Net Balance</p>
          <p.balance-amount #netBalance>          ← gets .positive/.negative/.zero
        <div.balance-divider>
        <div.balance-block>
          <p.balance-label>Transactions</p>
          <p.balance-amount #totalCount>
        <div.balance-divider>
        <div.balance-block>
          <p.balance-label>This Month</p>
          <p.balance-amount #monthlySpent>

    ── TWO-COLUMN GRID ───────────────────────────────────────────
    <div.content-grid>

      ── LEFT COLUMN ─────────────────────────────────────────────
      <div.left-col>

        ── ADD TRANSACTION FORM ────────────────────────────────
        <section.card#formSection>
          <h2.card-title>Add Transaction</h2>

          <div.type-toggle role="group" aria-label="Transaction type">
            <button.type-btn#typeExpense data-type="expense"
                    aria-pressed="true">  📤 Expense
            <button.type-btn#typeIncome  data-type="income"
                    aria-pressed="false"> 📥 Income

          <form#expenseForm novalidate>

            <div.form-group>
              <label for="itemName">Item Name</label>
              <input#itemName type="text" maxlength="60" />
              <span.field-error#nameError>

            <div.form-row>
              <div.form-group>
                <label for="itemAmount">Amount (Rp)</label>
                <input#itemAmount type="number" min="1" />
                <span.field-error#amountError>
              <div.form-group#categoryGroup>           ← hidden when income
                <label for="itemCategory">Category</label>
                <select#itemCategory>
                  <option value="">-- Select --</option>
                  … populated by JS …
                </select>
                <span.field-error#categoryError>

            <div.form-group>
              <label for="itemDate">Date</label>
              <input#itemDate type="date" />

            <div.form-group.threshold-row#thresholdGroup>  ← hidden when income
              <label for="thresholdInput">Alert threshold (Rp)</label>
              <input#thresholdInput type="number" min="0" />
              <span.threshold-hint>Transactions above this are highlighted</span>

            <button.btn-primary#submitBtn type="submit">
              <span#submitLabel>📤 Add Expense</span>

        ── CUSTOM CATEGORIES ───────────────────────────────────
        <section.card#categorySection>
          <h2.card-title>Custom Categories</h2>
          <div.custom-cat-form>
            <input#newCategoryInput type="text" maxlength="30" />
            <button#addCategoryBtn.btn-secondary>Add</button>
          <div.category-chips#categoryChips>   ← chip spans rendered by JS

        ── MONTHLY SUMMARY ─────────────────────────────────────
        <section.card#summarySection>
          <div.card-title-row>
            <h2.card-title>Monthly Summary</h2>
            <div.month-nav>
              <button#prevMonth.btn-icon aria-label="Previous month">←
              <span#summaryMonthLabel>—
              <button#nextMonth.btn-icon aria-label="Next month">→
          <div.summary-grid#monthlySummaryContent>  ← tiles rendered by JS

      ── RIGHT COLUMN ────────────────────────────────────────────
      <div.right-col>

        ── PIE CHART ───────────────────────────────────────────
        <section.card#chartSection>
          <h2.card-title>Spending by Category</h2>
          <div.chart-wrapper>
            <canvas#expenseChart
                    aria-label="Pie chart of expenses by category"
                    role="img">
          <div.chart-legend#chartLegend>   ← legend items rendered by JS
          <p.chart-empty#chartEmpty>
            No expense data yet — add an expense to see the chart.

        ── TRANSACTION LIST ────────────────────────────────────
        <section.card#listSection>
          <div.card-title-row>
            <h2.card-title>Transactions</h2>
            <div.list-controls>
              <select#filterType>
                All Types / Expense / Income
              <select#filterCategory>
                All Categories / … populated by JS …
              <button#clearAllBtn.btn-danger-sm>Clear All
          <div.transaction-list#transactionList role="list">
            ← transaction rows rendered by JS

  ── TOAST ───────────────────────────────────────────────────────
  <div#toast.toast role="alert" aria-live="polite">

  <script src="js/app.js">
```

### 3.3 Responsive Grid Breakpoints

| Viewport | `.content-grid` | Notes |
|---|---|---|
| > 900 px | `grid-template-columns: 380px 1fr` | Fixed left, fluid right |
| ≤ 900 px | `grid-template-columns: 1fr` | Single column; `.balance-divider` hidden |
| ≤ 560 px | `grid-template-columns: 1fr` | Compact padding; `.form-row` collapses to 1 col |

---

## 4. CSS Architecture (`css/style.css`)

### 4.1 Design Token System

All visual values are CSS custom properties on `:root`. `body.dark-mode` overrides only the surface/text/shadow tokens — colour tokens remain the same in both themes.

```css
:root {
  /* ── Brand ── */
  --primary:       #6c63ff;
  --primary-light: #a59eff;
  --primary-dark:  #4b44cc;

  /* ── Semantic ── */
  --danger:        #ff5252;
  --warning:       #ffb300;
  --success:       #00c07f;
  --income:        #00c07f;   /* income green */
  --income-dark:   #009960;   /* darker green for gradients */
  --expense:       #ff5252;   /* expense red (alias of --danger) */

  /* ── Light mode surfaces ── */
  --bg:            #f4f6fb;
  --surface:       #ffffff;
  --surface-alt:   #f0f2f8;
  --border:        #e2e6f0;
  --text-main:     #1a1d2e;
  --text-muted:    #6b7280;

  /* ── Typography ── */
  --font: 'Segoe UI', system-ui, -apple-system, sans-serif;
  --fs-xs:   0.72rem;
  --fs-sm:   0.85rem;
  --fs-base: 1rem;
  --fs-lg:   1.15rem;
  --fs-xl:   1.4rem;
  --fs-2xl:  1.75rem;

  /* ── Spacing / Shape ── */
  --gap:         1rem;
  --gap-lg:      1.5rem;
  --radius:      14px;
  --radius-sm:   8px;
  --radius-pill: 999px;

  /* ── Shadows ── */
  --shadow-sm: 0 1px 4px rgba(0,0,0,.06);
  --shadow:    0 4px 18px rgba(0,0,0,.08);
  --shadow-lg: 0 8px 32px rgba(0,0,0,.12);

  /* ── Transition ── */
  --transition: 0.22s ease;
}

body.dark-mode {
  --bg:          #0f1117;
  --surface:     #1a1d2e;
  --surface-alt: #222538;
  --border:      #2e3150;
  --text-main:   #e8eaf6;
  --text-muted:  #9095b0;
  --shadow-sm:   0 1px 4px rgba(0,0,0,.3);
  --shadow:      0 4px 18px rgba(0,0,0,.4);
  --shadow-lg:   0 8px 32px rgba(0,0,0,.55);
}
```

Theme switching = toggle one class on `<body>`. Zero JS colour logic needed.

### 4.2 Section Order in `style.css`

| # | Section | Key selectors |
|---|---------|---------------|
| 1 | CSS Custom Properties | `:root`, `body.dark-mode` |
| 2 | Reset & Base | `*`, `html`, `body`, `button`, `input`, `::-webkit-scrollbar` |
| 3 | Header | `.app-header`, `.app-title` (gradient text), `.app-logo` |
| 4 | Buttons | `.btn-icon`, `.btn-primary`, `.btn-primary.income-mode`, `.btn-secondary`, `.btn-danger-sm` |
| 5 | Type Toggle | `.type-toggle`, `.type-btn`, `.type-btn.active[data-type="expense"]`, `.type-btn.active[data-type="income"]` |
| 6 | Main Layout | `.app-main` |
| 7 | Balance Card | `.balance-card`, `.balance-row`, `.balance-block`, `.balance-amount`, `.income-amount`, `.expense-amount`, `.positive`, `.negative`, `.zero` |
| 8 | Content Grid | `.content-grid` |
| 9 | Card Component | `.card`, `.card-title`, `.card-title-row` |
| 10 | Form | `.form-group`, `.form-row`, `label`, `input`, `select`, `:focus`, `.invalid`, `.field-error`, `.threshold-row`, `.form-group.hidden` |
| 11 | Custom Categories | `.custom-cat-form`, `.chip`, `.chip-builtin`, `.chip-delete` |
| 12 | Monthly Summary | `.month-nav`, `.summary-grid`, `.summary-item`, `.summary-item.summary-net`, `.summary-cat`, `.summary-amount`, `.summary-empty` |
| 13 | Chart | `.chart-wrapper`, `.chart-legend`, `.legend-item`, `.legend-dot`, `.chart-empty` |
| 14 | Transaction List | `.list-controls`, `.transaction-list`, `.tx-item`, `.tx-item.tx-income`, `.tx-item.tx-expense`, `.tx-item.above-threshold`, `.tx-icon`, `.tx-info`, `.tx-name`, `.tx-meta`, `.tx-category-badge`, `.tx-type-badge`, `.tx-right`, `.tx-amount`, `.amount-income`, `.amount-expense`, `.tx-delete` |
| 15 | Toast | `.toast`, `.toast.show` |
| 16 | Animations | `@keyframes slideIn`, `@keyframes pop`, `.balance-amount.updated` |
| 17 | Responsive | `@media (max-width: 900px)`, `@media (max-width: 560px)` |

### 4.3 Critical CSS Rules Reference

```css
/* ── Type Toggle ── */
.type-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.3rem;
  gap: 0.4rem;
}
.type-btn.active[data-type="expense"] { background: var(--expense); color: #fff; box-shadow: 0 2px 8px rgba(255,82,82,.35); }
.type-btn.active[data-type="income"]  { background: var(--income);  color: #fff; box-shadow: 0 2px 8px rgba(0,192,127,.35); }

/* ── Income submit button ── */
.btn-primary.income-mode {
  background: linear-gradient(135deg, var(--income), var(--income-dark));
  box-shadow: 0 4px 14px rgba(0,192,127,.35);
}

/* ── Balance card tints (white text on gradient background) ── */
.balance-amount.income-amount  { color: #a8ffdc; }
.balance-amount.expense-amount { color: #ffb3b3; }
.balance-amount.positive       { color: #a8ffdc; }
.balance-amount.negative       { color: #ffb3b3; }
.balance-amount.zero           { color: rgba(255,255,255,.85); }

/* ── Hidden form groups ── */
.form-group.hidden { display: none; }

/* ── Transaction row left-border accents ── */
.tx-item.tx-income  { border-left: 3px solid var(--income); }
.tx-item.tx-expense { border-left: 3px solid var(--expense); }

/* ── Amount colours ── */
.tx-amount.amount-income  { color: var(--income); }
.tx-amount.amount-expense { color: var(--expense); }

/* ── Type badges ── */
.tx-type-badge.badge-income  { background: var(--income);  color: #fff; }
.tx-type-badge.badge-expense { background: var(--expense); color: #fff; }

/* ── Threshold highlight ── */
.tx-item.above-threshold {
  border-color: var(--warning);
  background: color-mix(in srgb, var(--surface-alt) 85%, var(--warning) 15%);
}
.above-threshold .tx-amount::after { content: ' ⚠'; color: var(--warning); }

/* ── Monthly Summary net tile ── */
.summary-item.summary-net .summary-amount.positive { color: var(--income); }
.summary-item.summary-net .summary-amount.negative { color: var(--expense); }
```

---

## 5. JavaScript Architecture (`js/app.js`)

### 5.1 Module Pattern

Flat module pattern. `'use strict'` at the top. All state is held in module-level `let` variables. Functions are grouped into labelled sections with `/* ── SECTION ── */` comment headers.

### 5.2 Constants

```js
const LS_KEY_TX        = 'bv_transactions';
const LS_KEY_CATS      = 'bv_categories';
const LS_KEY_THRESHOLD = 'bv_threshold';
const LS_KEY_THEME     = 'bv_theme';

const BUILTIN_CATEGORIES = ['Food','Transport','Fun','Shopping','Health','Bills','Home'];

const PALETTE = [
  '#6c63ff','#ff6584','#43aa8b','#f9a825','#26c6da',
  '#ef5350','#ab47bc','#66bb6a','#ffa726','#29b6f6',
  '#ec407a','#7e57c2','#26a69a','#ffca28','#8d6e63',
];  // 15 entries — category colour mapped by index % 15

const CAT_EMOJI = {
  food:'🍔', transport:'🚗', fun:'🎮',
  shopping:'🛍️', health:'💊', bills:'📄', home:'🏠',
};
```

### 5.3 Application State

```js
let transactions  = [];         // Transaction[] — master list, newest-first
let categories    = [];         // string[] — BUILTIN_CATEGORIES + custom (expense only)
let threshold     = 0;          // number — Rp alert threshold for expenses
let chartInstance = null;       // Chart | null — singleton
let summaryDate   = new Date(); // Date — month currently shown in summary
let currentType   = 'expense';  // 'expense' | 'income' — drives form behaviour
```

### 5.4 Transaction Object

```js
{
  id:       string,   // '_' + Math.random().toString(36).slice(2,10) + Date.now().toString(36)
  name:     string,   // trimmed, 1–60 chars
  amount:   number,   // positive float
  category: string,   // expense → display-case category name; income → "Income"
  date:     string,   // "YYYY-MM-DD"
  type:     string,   // "expense" | "income"
}
```

### 5.5 Initialisation Sequence

```
DOMContentLoaded
  └─► init()
        ├─► loadFromStorage()          parse localStorage; back-fill legacy type
        ├─► setTodayDate()             set #itemDate to today's ISO date
        ├─► applyTheme()               read bv_theme; toggle body class + icon
        ├─► rebuildCategorySelect()    populate #itemCategory
        ├─► rebuildFilterSelect()      populate #filterCategory
        ├─► renderAll()
        │     ├─► renderBalances()
        │     ├─► renderTransactions()
        │     ├─► renderChart()
        │     ├─► renderSummary()
        │     └─► renderCategoryChips()
        └─► applyTypeUI()              sync toggle buttons + form visibility
```

### 5.6 Type Toggle Mechanism

```
User clicks #typeExpense or #typeIncome
  └─► setType('expense' | 'income')
        └─► currentType = type
        └─► applyTypeUI()
              ├─ typeExpenseBtn.classList.toggle('active', !isIncome)
              ├─ typeIncomeBtn.classList.toggle('active', isIncome)
              ├─ typeExpenseBtn.setAttribute('aria-pressed', !isIncome)
              ├─ typeIncomeBtn.setAttribute('aria-pressed', isIncome)
              ├─ categoryGroup.classList.toggle('hidden', isIncome)
              ├─ thresholdGroup.classList.toggle('hidden', isIncome)
              ├─ submitBtn.classList.toggle('income-mode', isIncome)
              └─ submitLabel.textContent = isIncome
                   ? '📥 Add Income'
                   : '📤 Add Expense'
```

### 5.7 Add Transaction Flow

```
form 'submit' event
  ├─► e.preventDefault()
  ├─► clearErrors()
  ├─► validateForm()
  │     ├─ name empty           → mark invalid, set nameError
  │     ├─ amount ≤ 0 or NaN   → mark invalid, set amountError
  │     └─ category empty
  │         (expense only)      → mark invalid, set categoryError
  │     → return false if any fail; stop here
  ├─► build Transaction {
  │     id:       generateId(),
  │     name:     itemName.value.trim(),
  │     amount:   parseFloat(itemAmount.value),
  │     category: currentType === 'expense' ? itemCategory.value : 'Income',
  │     date:     itemDate.value || today,
  │     type:     currentType,
  │   }
  ├─► transactions.unshift(tx)
  ├─► saveTransactions()
  ├─► renderAll()
  ├─► showToast(`Added "${name}" — Rp X (type)`)
  └─► reset itemName, itemAmount, itemCategory (keep date + threshold)
```

### 5.8 Render Pipeline

`renderAll()` calls every render function. Targeted functions are called directly for partial updates.

| Function | Called when |
|---|---|
| `renderBalances()` | add, delete, clear all |
| `renderTransactions()` | add, delete, clear all, `#filterType` change, `#filterCategory` change, `#thresholdInput` input |
| `renderChart()` | add, delete, clear all, theme toggle |
| `renderSummary()` | add, delete, clear all, `#prevMonth` click, `#nextMonth` click |
| `renderCategoryChips()` | add category, remove category, page load |
| `rebuildCategorySelect()` | add category, remove category, page load |
| `rebuildFilterSelect()` | add category, remove category, page load |

---

## 6. Component Designs

### 6.1 Balance Card

Five metric blocks separated by four vertical dividers (hidden ≤ 900 px via `display:none`).

```
[ Total Income ] | [ Total Spent ] | [ Net Balance ] | [ Transactions ] | [ This Month ]
   .income-amount   .expense-amount  .positive/        white               white
   tint: #a8ffdc    tint: #ffb3b3    .negative/.zero
```

**Amount animation** (`animateValue`):
```
requestAnimationFrame loop, 400 ms
  progress = clamp((now − start) / 400, 0, 1)
  eased    = 1 − (1 − progress)³      ← ease-out cubic
  display  = formatter(from + (to − from) × eased)
```

For `#netBalance`, `animateValue` receives the optional `rawNet` parameter. When provided:
- Prefix `'+ '` if `rawNet > 0`, `'− '` if `rawNet < 0`, `''` if `rawNet === 0`
- The `formatter` receives `Math.abs(net)` so no negative sign appears from `toLocaleString`

A `pop` keyframe (`scale 1 → 1.06 → 1`, 300 ms) re-fires on each update via forced reflow `void el.offsetWidth`.

### 6.2 Type Toggle

```
div.type-toggle [role="group"] [aria-label="Transaction type"]
  button.type-btn#typeExpense [data-type="expense"] [aria-pressed]
  button.type-btn#typeIncome  [data-type="income"]  [aria-pressed]
```

CSS selects fill colour via `[data-type]` attribute — no JS inline style needed. Only one button holds `.active` at a time. The default on page load is `currentType = 'expense'`, so `#typeExpense` starts with `.active`.

### 6.3 Form Field Visibility

| `currentType` | `#categoryGroup` | `#thresholdGroup` | Category validation |
|---|---|---|---|
| `'expense'` | visible | visible | required |
| `'income'` | `display:none` | `display:none` | skipped |

Toggled via `classList.toggle('hidden', isIncome)` in `applyTypeUI()`. The `.hidden` CSS rule: `display: none`.

### 6.4 Add Expense Form Validation

| Field | Rule | Error message |
|---|---|---|
| `#itemName` | Non-empty after `.trim()` | `"Item name is required."` |
| `#itemAmount` | Parseable float and `> 0` | `"Enter a valid amount greater than 0."` |
| `#itemCategory` | Non-empty value (expense only) | `"Please select a category."` |

On failure: add `.invalid` class (red border + red focus ring) to the input; set `.field-error` span text. `clearErrors()` removes all `.invalid` classes and clears all spans. Triggered at the start of each submit attempt and on `keydown Escape`.

### 6.5 Transaction Row Anatomy

```
div.tx-item .tx-[type] [.above-threshold?]
  role="listitem"  data-id="..."

  div.tx-icon
    → "📥" (income) or getCatEmoji(category) (expense)

  div.tx-info
    div.tx-name            (ellipsis overflow)
    div.tx-meta
      span.tx-type-badge .badge-[type]    always shown; green/red pill
      span.tx-category-badge              expense only; background = categoryColor()
      span                                date "DD Mon YYYY"

  div.tx-right
    span.tx-amount .amount-[type]
      income:  "+ Rp X,XXX"   (green)
      expense: "− Rp X,XXX"  (red)
      above-threshold: CSS ::after appends " ⚠"
    button.tx-delete  aria-label="Delete [name]"
```

All user strings (`tx.name`, `tx.category`) pass through `escapeHtml()` before `innerHTML`. Each delete button gets an inline `addEventListener` pointing to `deleteTransaction(tx.id)`.

### 6.6 Pie Chart

**Library:** Chart.js v4.4.0, `type: 'pie'`, loaded from CDN. Income transactions are **excluded** from the chart entirely.

**Colour assignment:** `categoryColor(cat)` → `PALETTE[categories.findIndex(...) % 15]`. Deterministic: same category always gets the same colour.

**Lifecycle:**
```
renderChart() called
  ├─ filter: expenseTx = transactions.filter(t => t.type === 'expense')
  ├─ aggregate: totals = { [category]: sum }
  │
  ├─ if no labels:
  │    chartCanvas.style.display = 'none'
  │    chartEmpty.style.display  = 'block'
  │    if chartInstance: chartInstance.destroy(); chartInstance = null
  │
  └─ if labels exist:
       chartCanvas.style.display = 'block'
       chartEmpty.style.display  = 'none'
       if !chartInstance: chartInstance = new Chart(canvas, config)
       else: mutate chartInstance.data.* → chartInstance.update('active')
       rebuild #chartLegend HTML
```

**Tooltip callback:**
```js
label: ctx => ` ${formatRupiah(ctx.parsed)} (${((ctx.parsed / total) * 100).toFixed(1)}%)`
```

**Custom legend:** One `div.legend-item` per category — `span.legend-dot` (coloured circle) + label + `(X.X%)`.

### 6.7 Custom Categories Panel

```
categories[] = [
  ...BUILTIN_CATEGORIES,           // always first; 7 entries
  ...saved custom (deduped)        // 0–n user-added entries
]
```

`saveCategories()` writes only the non-builtin slice to `bv_categories`.

**Add flow:**
```
trim input → empty? → toast "Enter a category name first." → return
→ case-insensitive dupe in categories[]? → toast '"X" already exists.' → return
→ categories.push(val)
→ saveCategories()
→ rebuildCategorySelect() + rebuildFilterSelect() + renderCategoryChips()
→ showToast('Category "X" added!')
```

**Delete guard:** Category cannot be deleted if:
```js
transactions.some(t => t.type === 'expense' && t.category.toLowerCase() === cat.toLowerCase())
```
Income transactions do **not** use the category system and therefore never block deletion.

**Chip rendering:**
- Built-in → `span.chip.chip-builtin` (reduced opacity, no delete button)
- Custom → `span.chip` + `button.chip-delete` with event listener

### 6.8 Monthly Summary

`summaryDate` (module-level `Date` object) is mutated in place by `setMonth()`.

```
prevMonthBtn click → summaryDate.setMonth(getMonth() − 1) → renderSummary()
nextMonthBtn click → summaryDate.setMonth(getMonth() + 1) → renderSummary()
```

**`renderSummary()` logic:**
```
mk = summaryMonthKey()          → "YYYY-MM"
monthTx = transactions where getMonthKey(date) === mk

if monthTx.length === 0 → render single .summary-empty paragraph

else:
  monthIncome  = sum of type==='income'  in monthTx
  monthExpense = sum of type==='expense' in monthTx
  monthNet     = monthIncome − monthExpense

  Tile 1: INCOME   → green accent (#00c07f)
  Tile 2: EXPENSE  → red accent (#ff5252)
  Tile 3: NET (.summary-net)
            → accentColor = monthNet >= 0 ? '#00c07f' : '#ff5252'
            → amountStr   = (monthNet >= 0 ? '+ ' : '− ') + formatRupiah(monthNet)
            → .summary-amount class = monthNet > 0 ? 'positive' : 'negative'
  Tiles 4+: per-category expense totals, sorted descending, each with categoryColor() accent
```

**`makeSummaryTile(label, amountStr, accentColor, isNet, extraAmountClass)`** helper builds and returns the tile DOM element.

### 6.9 Toast Notification

```js
let toastTimer = null;

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');     // CSS: translateY(0) + opacity 1
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}
```

One toast at a time. Rapid successive calls restart the 2.8 s timer.

---

## 7. Storage Design

### 7.1 localStorage Schema

| Key | Type | Example value |
|---|---|---|
| `bv_transactions` | JSON string | `[{"id":"_abc","name":"Salary","amount":5000000,"category":"Income","date":"2026-09-17","type":"income"},...]` |
| `bv_categories` | JSON string | `["Gym","Hobbies"]` |
| `bv_threshold` | Numeric string | `"100000"` |
| `bv_theme` | String | `"dark"` |

`bv_categories` stores **custom categories only** — built-ins are never persisted.

### 7.2 Read Safety

All four keys parsed inside a single `try/catch` in `loadFromStorage()`. On any JSON error, state resets to safe defaults (`transactions = []`, `categories = [...BUILTIN_CATEGORIES]`).

**Legacy back-fill** (transactions saved before `type` field was introduced):
```js
transactions = transactions.map(t => ({ type: 'expense', ...t }));
// Spread order: defaults first, then t's own properties override them.
// If t already has type: it wins. If not: defaults to 'expense'.
```

### 7.3 Write Strategy

Every mutation triggers an immediate synchronous write to exactly the affected key:

| User action | Storage call |
|---|---|
| Add / delete / clear transactions | `saveTransactions()` |
| Add / remove custom category | `saveCategories()` |
| Change threshold value | `saveThreshold()` |
| Toggle theme | `saveTheme()` |

---

## 8. Security

| Threat | Mitigation |
|---|---|
| XSS via transaction name or category | `escapeHtml()` encodes `& < > "` — applied to every user string before `innerHTML` insertion |
| XSS via custom category name | Same `escapeHtml()` applied in chips, dropdowns, and badges |
| Storage corruption / injection | `localStorage` reads wrapped in `try/catch`; malformed JSON silently resets to safe defaults |
| Accidental bulk data loss | Clear All guarded by `window.confirm()` dialog |
| Category data loss (in-use guard) | `removeCategory()` blocks deletion if any expense transaction references the category |

---

## 9. Known Limitations & Future Work

| Area | Current behaviour | Suggested next step |
|---|---|---|
| Transaction editing | Not supported — delete and re-add | Inline edit with save/cancel (Backlog B-1) |
| Income sub-categories | All income uses `"Income"` label | Support Salary, Freelance, etc. (Backlog B-2) |
| Chart scope | Expense-only pie chart | Add income vs expense bar/doughnut toggle (Backlog B-4) |
| Data export | None | CSV download via `Blob` + `URL.createObjectURL` (Backlog B-3) |
| Date filtering | Monthly navigation only | Arbitrary date range picker (Backlog B-5) |
| Offline install | Works offline; no install prompt | Add Service Worker + Web App Manifest (Backlog B-6) |
| Chart accessibility | Canvas not keyboard-navigable | Data table fallback (Backlog B-7) |
| Confirmation dialogs | Browser-native `window.confirm` | Custom modal component (Backlog B-8) |
