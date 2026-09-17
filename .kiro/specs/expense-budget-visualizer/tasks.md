# Task List
# Expense & Budget Visualizer

## Overview

Full implementation task breakdown across six phases. Each task maps to requirements in `requirements.md` and design decisions in `design.md`.

**Status key:** ✅ Complete · 🔲 Not started · 🔄 In progress

---

## Phase 1 — Project Setup

### Task 1.1 — Create folder structure ✅
- Create `css/` and `js/` directories in the project root
- Create `index.html` placeholder

### Task 1.2 — Set up `index.html` document shell ✅
- `<!DOCTYPE html>`, viewport meta, charset, title
- Link `css/style.css`; load Chart.js v4.4.0 CDN in `<head>`; load `js/app.js` at end of `<body>`
- `class="light-mode"` on `<body>`

---

## Phase 2 — HTML Structure

### Task 2.1 — Build sticky application header ✅
- `<header class="app-header">` with logo, `.app-title`, and `#themeToggle` button

### Task 2.2 — Build Balance Card ✅
**Updated for income feature**
- Five `.balance-block` elements: `#totalIncome`, `#totalSpent`, `#netBalance`, `#totalCount`, `#monthlySpent`
- Four `.balance-divider` separators
- `income-amount` class on `#totalIncome`; `expense-amount` class on `#totalSpent`

### Task 2.3 — Build two-column content grid ✅
- `.content-grid` → `.left-col` + `.right-col` inside `<main class="app-main">`

### Task 2.4 — Build Add Transaction form ✅
**Updated for income feature**
- `<h2>` title changed to *"Add Transaction"*
- `div.type-toggle` with `#typeExpense` and `#typeIncome` buttons (`data-type`, `aria-pressed`)
- `<form id="expenseForm" novalidate>` with:
  - `#itemName` + `#nameError`
  - `#itemAmount` + `#amountError` (in `.form-row` alongside `#categoryGroup`)
  - `#categoryGroup` — contains `#itemCategory` + `#categoryError`; hidden when income active
  - `#itemDate`
  - `#thresholdGroup` — contains `#thresholdInput`; hidden when income active
  - `#submitBtn` with `#submitLabel` span

### Task 2.5 — Build Custom Categories panel ✅
- `#newCategoryInput` + `#addCategoryBtn` + `#categoryChips`

### Task 2.6 — Build Monthly Summary panel ✅
- `#prevMonth` / `#summaryMonthLabel` / `#nextMonth` navigation
- `#monthlySummaryContent` grid container

### Task 2.7 — Build Pie Chart section ✅
**Updated for income feature**
- `<canvas id="expenseChart" aria-label="..." role="img">` inside `.chart-wrapper`
- `#chartLegend` + `#chartEmpty` with updated placeholder text

### Task 2.8 — Build Transaction List section ✅
**Updated for income feature**
- `.list-controls` now contains THREE controls: `#filterType` select, `#filterCategory` select, `#clearAllBtn`
- `#filterType` has options: All Types, Expense, Income
- `#transactionList[role=list]`

### Task 2.9 — Add toast element ✅
- `<div id="toast" role="alert" aria-live="polite">`

---

## Phase 3 — CSS Styling

### Task 3.1 — Define design tokens ✅
**Updated for income feature**
- Added `--income: #00c07f`, `--income-dark: #009960`, `--expense: #ff5252` tokens

### Task 3.2 — Reset and base styles ✅

### Task 3.3 — Style header ✅

### Task 3.4 — Style button variants ✅
**Updated for income feature**
- `.btn-primary.income-mode`: green gradient (`--income` → `--income-dark`), green shadow

### Task 3.5 — Style type toggle ✅ *(new)*
- `.type-toggle`: 2-column grid, `surface-alt` background, `border-radius: var(--radius-sm)`
- `.type-btn`: transparent, muted text; hover fills with `--border`
- `.type-btn.active[data-type="expense"]`: `--expense` fill, red shadow
- `.type-btn.active[data-type="income"]`: `--income` fill, green shadow

### Task 3.6 — Style Balance Card ✅
**Updated for income feature**
- `.balance-amount.income-amount`: `color: #a8ffdc`
- `.balance-amount.expense-amount`: `color: #ffb3b3`
- `.balance-amount.positive`: `color: #a8ffdc`
- `.balance-amount.negative`: `color: #ffb3b3`
- `.balance-amount.zero`: `color: rgba(255,255,255,.85)`

### Task 3.7 — Style content grid and card ✅

### Task 3.8 — Style form elements ✅
**Updated for income feature**
- `.form-group.hidden { display: none; }` utility class added

### Task 3.9 — Style category chips ✅

### Task 3.10 — Style Monthly Summary tiles ✅
**Updated for income feature**
- `.summary-item.summary-net .summary-amount.positive`: `color: var(--income)`
- `.summary-item.summary-net .summary-amount.negative`: `color: var(--expense)`

### Task 3.11 — Style transaction list and rows ✅
**Updated for income feature**
- `.tx-item.tx-income { border-left: 3px solid var(--income); }`
- `.tx-item.tx-expense { border-left: 3px solid var(--expense); }`
- `.tx-item.tx-income:hover { border-color: var(--income); }`
- `.tx-type-badge.badge-income { background: var(--income); color: #fff; }`
- `.tx-type-badge.badge-expense { background: var(--expense); color: #fff; }`
- `.tx-amount.amount-income { color: var(--income); }`
- `.tx-amount.amount-expense { color: var(--expense); }`

### Task 3.12 — Style toast ✅

### Task 3.13 — Add responsive breakpoints ✅

---

## Phase 4 — JavaScript Implementation

### Task 4.1 — Define constants and DOM references ✅
**Updated for income feature**
- Added DOM refs: `typeExpenseBtn`, `typeIncomeBtn`, `categoryGroup`, `thresholdGroup`, `submitLabel`, `totalIncomeEl`, `netBalanceEl`, `filterType`
- Added state variable: `let currentType = 'expense'`

### Task 4.2 — Implement localStorage read/write helpers ✅
**Updated for income feature**
- `loadFromStorage()`: after parsing, back-fills legacy transactions:
  ```js
  transactions = transactions.map(t => ({ type: 'expense', ...t }));
  ```
  Spread order ensures existing `type` fields are preserved.

### Task 4.3 — Implement utility functions ✅
- `formatRupiah(num)` updated to use `Math.abs(num)` so negative net values don't produce `Rp -X`
- All other helpers unchanged

### Task 4.4 — Implement type toggle ✅ *(new)*
- `setType(type)`: updates `currentType` → calls `applyTypeUI()`
- `applyTypeUI()`:
  - Toggles `.active` class on `#typeExpense` / `#typeIncome`
  - Sets `aria-pressed` on both buttons
  - Toggles `.hidden` on `#categoryGroup` and `#thresholdGroup`
  - Toggles `.income-mode` on `#submitBtn`
  - Updates `#submitLabel.textContent`
  - Clears category error when switching to income
- Click listeners on `typeExpenseBtn` and `typeIncomeBtn`

### Task 4.5 — Implement form validation ✅
**Updated for income feature**
- Category validation: `if (currentType === 'expense' && !itemCategory.value)` — category not required for income

### Task 4.6 — Implement transaction add, delete, clear ✅
**Updated for income feature**
- Add: Transaction object now includes `type: currentType` and `category: currentType === 'expense' ? itemCategory.value : 'Income'`
- Toast message now appends the type label: `"Added "..." — Rp X (income|expense)"`
- Delete and Clear All: unchanged

### Task 4.7 — Implement balance card rendering and animation ✅
**Updated for income feature**
- `renderBalances()` now computes:
  - `totalIncome` = sum of `type === 'income'` transactions
  - `totalExpense` = sum of `type === 'expense'` transactions
  - `net` = `totalIncome - totalExpense`
  - `monthlyExpense` = sum of `type === 'expense'` transactions in current month
- `animateValue()` receives new optional `rawNet` parameter; if provided, prefixes text with `+ ` / `− `
- Net balance CSS classes: `.positive` / `.negative` / `.zero` applied to `#netBalance`

### Task 4.8 — Implement transaction list rendering ✅
**Updated for income feature**
- Applies `filterType.value` filter before `filterCategory` filter (AND logic)
- Row class: `tx-income` or `tx-expense` based on `tx.type`
- Emoji: `📥` for income; `getCatEmoji()` for expense
- Type badge: `<span class="tx-type-badge badge-[type]">` always shown
- Category badge: shown only for expenses
- Amount: `+ ${formatRupiah(...)}` for income; `− ${formatRupiah(...)}` for expense
- Threshold check: `isExpense && threshold > 0 && tx.amount > threshold`
- `#filterType` change listener added

### Task 4.9 — Implement pie chart rendering ✅
**Updated for income feature**
- Pre-filters to `transactions.filter(t => t.type === 'expense')` before aggregation
- All chart logic otherwise unchanged

### Task 4.10 — Implement category management ✅
**Updated for income feature**
- `removeCategory()` guard: `t.type === 'expense' && t.category.toLowerCase() === cat.toLowerCase()` — income transactions never block category deletion

### Task 4.11 — Implement monthly summary ✅
**Updated for income feature**
- `renderSummary()` now computes `monthIncome`, `monthExpense`, `monthNet`
- Renders tiles in order:
  1. INCOME tile (green accent)
  2. EXPENSE tile (red accent)
  3. NET tile (`.summary-net`; sign prefix; `.positive`/`.negative` class on amount)
  4. Per-category expense tiles (sorted descending)
- `makeSummaryTile(label, amountStr, accentColor, isNet, extraAmountClass)` helper added

### Task 4.12 — Implement dark / light mode ✅ (unchanged)

### Task 4.13 — Implement toast ✅ (unchanged)

### Task 4.14 — Wire init and bootstrap ✅
**Updated for income feature**
- `init()` now also calls `applyTypeUI()` at the end

---

## Phase 5 — Spec Documentation

### Task 5.1 — Create spec directory ✅
### Task 5.2 — Write `requirements.md` ✅ (updated for income)
### Task 5.3 — Write `design.md` ✅ (updated for income)
### Task 5.4 — Write `tasks.md` ✅ (this document)

---

## Backlog (Future Enhancements)

| ID | Description | Effort | Priority |
|----|-------------|--------|----------|
| B-1 | Inline transaction editing | Medium | High |
| B-2 | Income sub-categories (Salary, Freelance, etc.) | Medium | Medium |
| B-3 | CSV data export | Small | Medium |
| B-4 | Income vs Expense bar chart toggle | Medium | Medium |
| B-5 | Arbitrary date range filter | Medium | Low |
| B-6 | Service Worker + PWA manifest | Small | Low |
| B-7 | Accessible data table fallback for pie chart | Small | Medium |
| B-8 | Custom confirmation modal (replace `window.confirm`) | Small | Low |
| B-9 | Recurring transaction templates | Large | Low |
