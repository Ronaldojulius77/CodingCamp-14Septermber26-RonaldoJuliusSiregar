# Requirements Document
# Expense & Budget Visualizer

## Introduction

The **Expense & Budget Visualizer** is a client-side web application that enables users to record, categorise, and visualise both their spending and their income, track their net balance, and review monthly financial summaries. It is delivered as a single HTML page with one CSS file and one JavaScript file. It runs entirely in the browser, persists all data through the Web Storage API, and has no external runtime dependencies beyond Chart.js v4.4.0 loaded from a CDN. No backend server or user account is required.

**Target users:** Anyone who wants a quick, zero-setup tool to track personal income and expenses on desktop or mobile. No technical knowledge required.

---

## Requirements

### FR-1 · Transaction Input Form

- **FR-1.1** The form MUST be headed by a **type toggle** — a grouped pair of mutually exclusive buttons (`role="group"`, `aria-label="Transaction type"`): **📤 Expense** (`id="typeExpense"`, `data-type="expense"`) and **📥 Income** (`id="typeIncome"`, `data-type="income"`). Only one button may be active at a time. Both carry `aria-pressed` attributes that reflect their state.

- **FR-1.2** The active type button MUST be visually highlighted: red fill (`#ff5252`) with drop shadow for Expense; green fill (`#00c07f`) with drop shadow for Income.

- **FR-1.3** The form MUST contain the following fields:
  - **Item Name** (`#itemName`) — text, required, max 60 characters, always visible
  - **Amount** (`#itemAmount`) — number, min 1, required, always visible
  - **Category** (`#itemCategory`) — select dropdown, required only when type is Expense, visible only when type is Expense
  - **Date** (`#itemDate`) — date, defaults to today's date, always visible
  - **Alert Threshold** (`#thresholdInput`) — number, min 0, optional, visible only when type is Expense

- **FR-1.4** When the type toggle is set to **Income**, the `#categoryGroup` and `#thresholdGroup` form groups MUST be hidden (CSS class `hidden` → `display: none`). They MUST reappear when type switches back to Expense. Switching to Income MUST clear any existing category validation error.

- **FR-1.5** The form MUST validate all required fields on every submit attempt. If any required field fails validation, the form MUST NOT create a transaction.

- **FR-1.6** On validation failure the application MUST add class `.invalid` to each failing field and set text in the corresponding `<span class="field-error">`:
  - Item Name empty → *"Item name is required."*
  - Amount not a positive number → *"Enter a valid amount greater than 0."*
  - Category empty (expense only) → *"Please select a category."*

- **FR-1.7** On successful submission the application MUST:
  - Build a Transaction object `{ id, name, amount, category, date, type }` where `category = "Income"` for income transactions and `type = "expense" | "income"`
  - Prepend to `transactions[]` via `unshift`, save to `bv_transactions` in `localStorage`
  - Call `renderAll()` to refresh all panels immediately
  - Show toast: `Added "[name]" — Rp X (expense|income)`
  - Reset Item Name, Amount, Category fields; retain Date and Threshold

- **FR-1.8** The submit button (`#submitBtn`) label and colour MUST reflect the active type:
  - Expense: `"📤 Add Expense"`, purple gradient
  - Income: `"📥 Add Income"`, green gradient, class `income-mode`

- **FR-1.9** Pressing **Escape** at any time MUST call `clearErrors()`, removing `.invalid` from all fields and clearing all error span text.

---

### FR-2 · Transaction List

- **FR-2.1** All transactions (expense and income) MUST be displayed in a scrollable `div#transactionList[role=list]`, ordered newest-first.

- **FR-2.2** Each row (`div.tx-item[role=listitem]`) MUST display:
  - Icon tile: `📥` for income; category emoji for expenses (from `CAT_EMOJI` map; default `🏷️`)
  - Item name: truncated with `text-overflow: ellipsis`
  - Type badge (`span.tx-type-badge.badge-[type]`): green pill `"income"` or red pill `"expense"`
  - Category badge (`span.tx-category-badge`): coloured pill — shown for expenses only
  - Date: formatted as `DD Mon YYYY`
  - Amount (`span.tx-amount.amount-[type]`): `+ Rp X` green for income; `− Rp X` red for expense

- **FR-2.3** Each row MUST have a left-border accent: `3px solid #00c07f` for income rows; `3px solid #ff5252` for expense rows.

- **FR-2.4** Each row MUST include a `button.tx-delete` (✕) with `aria-label="Delete [name]"`. Activating it MUST remove the transaction, save to `localStorage`, call `renderAll()`, and show toast *"Transaction deleted."*

- **FR-2.5** A `select#filterType` MUST appear above the list with options: All Types, Expense, Income.

- **FR-2.6** A `select#filterCategory` MUST appear alongside the type filter. Its options MUST stay in sync with the full category list (built-ins + custom).

- **FR-2.7** Both filters use AND logic. Either filter changing MUST immediately re-render the list.

- **FR-2.8** `#clearAllBtn` MUST: show toast *"Nothing to clear."* when `transactions.length === 0`; otherwise show `window.confirm()`; on confirm: clear, save, `renderAll()`, toast.

- **FR-2.9** When the filtered list is empty, show: *"No transactions yet. Add one above!"* (no transactions) or *"No transactions match this filter."* (filtered out).

- **FR-2.10** Any expense transaction with `amount > threshold` (when `threshold > 0`) MUST receive class `.above-threshold`: warning border (`#ffb300`), tinted background, and `⚠` appended to the amount via CSS `::after`. Income transactions are never threshold-highlighted.

---

### FR-3 · Balance Card

- **FR-3.1** The `.balance-card` MUST permanently display five metric blocks:
  - `#totalIncome` — sum of all `type === "income"` amounts (class `income-amount`, tint `#a8ffdc`)
  - `#totalSpent` — sum of all `type === "expense"` amounts (class `expense-amount`, tint `#ffb3b3`)
  - `#netBalance` — `totalIncome − totalExpense`
  - `#totalCount` — count of all transactions
  - `#monthlySpent` — sum of expense transactions in the current calendar month

- **FR-3.2** All five metrics MUST update automatically on every add or delete.

- **FR-3.3** `#totalIncome`, `#totalSpent`, `#netBalance`, and `#monthlySpent` MUST animate over 400 ms using ease-out cubic via `requestAnimationFrame`.

- **FR-3.4** `#netBalance` MUST show a sign prefix and colour based on the net value:
  - net > 0 → prefix `+ `, class `.positive`, tint `#a8ffdc`
  - net < 0 → prefix `− `, class `.negative`, tint `#ffb3b3`
  - net = 0 → no prefix, class `.zero`, colour `rgba(255,255,255,.85)`

---

### FR-4 · Spending Pie Chart

- **FR-4.1** A Chart.js v4.4.0 pie chart MUST visualise **expense-only** transactions by category. Income transactions MUST NOT appear in the chart.

- **FR-4.2** The chart MUST update on every add or delete: update existing `chartInstance` via `.update('active')` if it exists; create new via `new Chart()` if null; destroy and set to null when expense data drops to zero.

- **FR-4.3** When no expense transactions exist, the canvas MUST be hidden and `#chartEmpty` MUST show: *"No expense data yet — add an expense to see the chart."*

- **FR-4.4** `#chartLegend` MUST render one entry per category: a 10 px colour swatch (`span.legend-dot`), category name, and percentage to one decimal place.

- **FR-4.5** Tooltips MUST show `Rp X (Y.Y%)` on hover.

- **FR-4.6** Colours are assigned via `categoryColor(cat)` = `PALETTE[indexOf(cat) % 15]` — deterministic and consistent.

---

### FR-5 · Custom Categories

- **FR-5.1** The Custom Categories panel MUST allow adding a category name (max 30 chars) via `#addCategoryBtn` or Enter key on `#newCategoryInput`.

- **FR-5.2** Reject with toast: empty/whitespace input → *"Enter a category name first."*; duplicate (case-insensitive) → *`"[name]" already exists.`*

- **FR-5.3** On successful add: push to `categories[]`, save to `bv_categories`, clear input, rebuild selects and chips, show toast.

- **FR-5.4** All categories MUST render as `span.chip` in `#categoryChips`:
  - Built-in: `chip chip-builtin`, no delete button
  - Custom: `chip`, with `button.chip-delete` (✕)

- **FR-5.5** Custom category deletion MUST be blocked (toast error) if any expense transaction uses it. `transactions.some(t => t.type === 'expense' && t.category.toLowerCase() === cat.toLowerCase())`. If not in use: remove, save, rebuild.

- **FR-5.6** Custom categories persist in `bv_categories`. On load, merged after built-ins with case-insensitive dedup.

---

### FR-6 · Monthly Summary

- **FR-6.1** The Monthly Summary panel MUST display a financial breakdown for a navigable calendar month.

- **FR-6.2** For any month with transactions, render tiles in this order:
  1. **INCOME** tile — total income that month, green accent `#00c07f`
  2. **EXPENSE** tile — total expenses that month, red accent `#ff5252`
  3. **NET** tile (`.summary-net`) — `monthIncome − monthExpense`; prefix `+ ` if ≥ 0, `− ` if < 0; green accent if ≥ 0, red if < 0; `.positive` or `.negative` class on amount
  4. Per-category expense tiles — sorted descending by amount, each with `categoryColor(cat)` left-border accent

- **FR-6.3** Default to the current calendar month (`summaryDate = new Date()`) on page load.

- **FR-6.4** `#prevMonth` and `#nextMonth` step `summaryDate` by one month; `#summaryMonthLabel` updates (e.g. *"September 2026"*).

- **FR-6.5** No transactions for the selected month → show *"No transactions for this month."*

- **FR-6.6** `renderSummary()` is called inside `renderAll()` — refreshes automatically on every add or delete.

---

### FR-7 · Dark / Light Mode

- **FR-7.1** `#themeToggle` (🌙 / ☀️) MUST toggle `dark-mode` class on `<body>`.

- **FR-7.2** Active theme saved to `bv_theme` (`"light"` or `"dark"`), restored via `applyTheme()` on load.

- **FR-7.3** Every theme toggle MUST call `renderChart()` to repaint the canvas.

---

### NFR-1 · Technology Stack

- HTML5 — single file: `index.html`
- CSS3 — exactly one file: `css/style.css`
- Vanilla JavaScript ES2020+, `'use strict'` — exactly one file: `js/app.js`
- No frameworks (React, Vue, Angular, Svelte, etc.)
- External: Chart.js v4.4.0 via jsDelivr CDN only
- No build tools — opens directly as `file://`

### NFR-2 · Data Persistence

All state in `localStorage` under four keys:

| Key | Contents |
|-----|---------|
| `bv_transactions` | `JSON.stringify(Transaction[])` |
| `bv_categories` | `JSON.stringify(string[])` — custom names only |
| `bv_threshold` | Numeric string |
| `bv_theme` | `"light"` or `"dark"` |

All reads wrapped in `try/catch`. Legacy transactions without `type` back-filled to `"expense"`.

### NFR-3 · Browser Compatibility
Current Chrome, Firefox, Edge, Safari. Works as local `file://` with no server.

### NFR-4 · Responsive Design

| Viewport | Layout |
|----------|--------|
| ≥ 901 px | CSS Grid `380px 1fr` |
| ≤ 900 px | Single column; balance dividers hidden |
| ≤ 560 px | Compact padding; form row collapses to 1 column |

### NFR-5 · Performance
All interactions instantaneous. Animations via `requestAnimationFrame`.

### NFR-6 · Security
All user strings through `escapeHtml()` before `innerHTML`. All `localStorage` reads in `try/catch`.

### NFR-7 · Accessibility
- `#themeToggle`: `aria-label="Toggle theme"`
- `#prevMonth`, `#nextMonth`: appropriate `aria-label`
- Type toggle: `role="group"`, `aria-label="Transaction type"`; each button: `aria-pressed`
- `#transactionList`: `role="list"`; rows: `role="listitem"`
- `#expenseChart`: `role="img"`, `aria-label`
- `#toast`: `role="alert"`, `aria-live="polite"`
- Delete buttons: `aria-label="Delete [name]"`

### NFR-8 · Code Quality
- `'use strict'` at top of `app.js`
- Descriptive comment block headers in all source files
- camelCase for variables/functions; SCREAMING_SNAKE_CASE for constants
- No minification

---

## Glossary

| Term | Definition |
|------|------------|
| Transaction | A single financial entry (expense or income) stored as `{ id, name, amount, category, date, type }` |
| Expense | A `type: "expense"` transaction; reduces net balance |
| Income | A `type: "income"` transaction; increases net balance; uses `category: "Income"` internally |
| Net Balance | `totalIncome − totalExpense` across all time |
| Built-in category | One of 7 permanent expense categories: Food, Transport, Fun, Shopping, Health, Bills, Home |
| Custom category | User-defined expense category, persisted in `bv_categories` |
| Threshold | Rp amount above which expense transactions are highlighted in warning colour |
| Toast | Slide-up notification at bottom of screen, auto-dismissed after 2.8 s |
| Type toggle | Expense / Income switcher in the form; controls field visibility and transaction type |
| `renderAll()` | Master render function calling `renderBalances`, `renderTransactions`, `renderChart`, `renderSummary`, `renderCategoryChips` |
| `escapeHtml()` | XSS-prevention function encoding `& < > "` to HTML entities |