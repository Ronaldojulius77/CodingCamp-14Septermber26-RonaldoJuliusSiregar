/* ============================================================
   EXPENSE & BUDGET VISUALIZER — app.js
   Single JS file — Vanilla JS, no frameworks
   Features:
     • Add / delete transactions (expense & income) with validation
     • LocalStorage persistence
     • Pie chart via Chart.js (expense breakdown, auto-updates)
     • Custom categories (add / delete)
     • Monthly summary with navigation (income, expense, net)
     • Threshold highlight for large expenses
     • Dark / light mode toggle
     • Type toggle: Expense / Income
   ============================================================ */

'use strict';

/* ── CONSTANTS ── */
const LS_KEY_TX        = 'bv_transactions';
const LS_KEY_CATS      = 'bv_categories';
const LS_KEY_THRESHOLD = 'bv_threshold';
const LS_KEY_THEME     = 'bv_theme';

const BUILTIN_CATEGORIES = ['Food', 'Transport', 'Fun', 'Shopping', 'Health', 'Bills', 'Home'];

/* Colour palette for chart segments and category badges */
const PALETTE = [
  '#6c63ff', '#ff6584', '#43aa8b', '#f9a825', '#26c6da',
  '#ef5350', '#ab47bc', '#66bb6a', '#ffa726', '#29b6f6',
  '#ec407a', '#7e57c2', '#26a69a', '#ffca28', '#8d6e63',
];

/* Category emoji map */
const CAT_EMOJI = {
  food:      '🍔', transport: '🚗', fun:      '🎮',
  shopping:  '🛍️', health:    '💊', bills:    '📄',
  home:      '🏠',
};

function getCatEmoji(cat) {
  return CAT_EMOJI[cat.toLowerCase()] || '🏷️';
}

/* ── STATE ── */
let transactions  = [];        // [{id, name, amount, category, date, type}]
let categories    = [];        // full list (builtin + custom)
let threshold     = 0;
let chartInstance = null;
let summaryDate   = new Date();
let currentType   = 'expense'; // 'expense' | 'income'

/* ── DOM REFERENCES ── */
const $ = id => document.getElementById(id);

const form             = $('expenseForm');
const itemName         = $('itemName');
const itemAmount       = $('itemAmount');
const itemCategory     = $('itemCategory');
const itemDate         = $('itemDate');
const thresholdInput   = $('thresholdInput');
const submitBtn        = $('submitBtn');
const submitLabel      = $('submitLabel');

const typeExpenseBtn   = $('typeExpense');
const typeIncomeBtn    = $('typeIncome');
const categoryGroup    = $('categoryGroup');
const thresholdGroup   = $('thresholdGroup');

const totalIncomeEl    = $('totalIncome');
const totalSpentEl     = $('totalSpent');
const netBalanceEl     = $('netBalance');
const totalCountEl     = $('totalCount');
const monthlySpentEl   = $('monthlySpent');

const transactionList  = $('transactionList');
const filterType       = $('filterType');
const filterCategory   = $('filterCategory');
const clearAllBtn      = $('clearAllBtn');

const chartCanvas      = $('expenseChart');
const chartEmpty       = $('chartEmpty');
const chartLegend      = $('chartLegend');

const categoryChips    = $('categoryChips');
const newCategoryInput = $('newCategoryInput');
const addCategoryBtn   = $('addCategoryBtn');

const summaryContent   = $('monthlySummaryContent');
const summaryLabel     = $('summaryMonthLabel');
const prevMonthBtn     = $('prevMonth');
const nextMonthBtn     = $('nextMonth');

const themeToggle      = $('themeToggle');
const themeIcon        = $('themeIcon');
const toast            = $('toast');

/* ── INIT ── */
function init() {
  loadFromStorage();
  setTodayDate();
  applyTheme();
  rebuildCategorySelect();
  rebuildFilterSelect();
  renderAll();
  applyTypeUI();
}

/* ── LOCAL STORAGE ── */
function loadFromStorage() {
  try {
    transactions = JSON.parse(localStorage.getItem(LS_KEY_TX))        || [];
    const saved  = JSON.parse(localStorage.getItem(LS_KEY_CATS))      || [];
    threshold    = parseFloat(localStorage.getItem(LS_KEY_THRESHOLD)) || 0;

    /* Merge builtins + saved custom categories, avoid duplicates */
    categories = [
      ...BUILTIN_CATEGORIES,
      ...saved.filter(c => !BUILTIN_CATEGORIES.map(b => b.toLowerCase()).includes(c.toLowerCase())),
    ];

    /* Back-fill legacy transactions that have no type field */
    transactions = transactions.map(t => ({ type: 'expense', ...t }));

    if (thresholdInput) thresholdInput.value = threshold || '';
  } catch (e) {
    transactions = [];
    categories   = [...BUILTIN_CATEGORIES];
  }
}

function saveTransactions() {
  localStorage.setItem(LS_KEY_TX, JSON.stringify(transactions));
}

function saveCategories() {
  const custom = categories.filter(
    c => !BUILTIN_CATEGORIES.map(b => b.toLowerCase()).includes(c.toLowerCase())
  );
  localStorage.setItem(LS_KEY_CATS, JSON.stringify(custom));
}

function saveThreshold() {
  localStorage.setItem(LS_KEY_THRESHOLD, threshold);
}

function saveTheme(mode) {
  localStorage.setItem(LS_KEY_THEME, mode);
}

/* ── HELPERS ── */
function generateId() {
  return '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function formatRupiah(num) {
  return 'Rp ' + Math.round(Math.abs(num)).toLocaleString('id-ID');
}

function setTodayDate() {
  itemDate.value = new Date().toISOString().split('T')[0];
}

function getMonthKey(dateStr) {
  return dateStr ? dateStr.slice(0, 7) : '';
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function summaryMonthKey() {
  return `${summaryDate.getFullYear()}-${String(summaryDate.getMonth() + 1).padStart(2, '0')}`;
}

function categoryColor(cat) {
  const idx = categories.findIndex(c => c.toLowerCase() === cat.toLowerCase());
  return PALETTE[(idx >= 0 ? idx : 0) % PALETTE.length];
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── TYPE TOGGLE ── */
typeExpenseBtn.addEventListener('click', () => setType('expense'));
typeIncomeBtn.addEventListener('click',  () => setType('income'));

function setType(type) {
  currentType = type;
  applyTypeUI();
}

function applyTypeUI() {
  const isIncome = currentType === 'income';

  /* Toggle button active states */
  typeExpenseBtn.classList.toggle('active', !isIncome);
  typeIncomeBtn.classList.toggle('active',  isIncome);
  typeExpenseBtn.setAttribute('aria-pressed', String(!isIncome));
  typeIncomeBtn.setAttribute('aria-pressed',  String(isIncome));

  /* Show/hide category & threshold for income (no category needed) */
  categoryGroup.classList.toggle('hidden', isIncome);
  thresholdGroup.classList.toggle('hidden', isIncome);

  /* Update submit button appearance and label */
  submitBtn.classList.toggle('income-mode', isIncome);
  submitLabel.textContent = isIncome ? '📥 Add Income' : '📤 Add Expense';

  /* Clear category error when switching to income */
  if (isIncome) {
    itemCategory.classList.remove('invalid');
    $('categoryError').textContent = '';
  }
}

/* ── FORM VALIDATION ── */
function clearErrors() {
  ['itemName', 'itemAmount', 'itemCategory'].forEach(id => {
    const el = $(id);
    if (el) el.classList.remove('invalid');
  });
  $('nameError').textContent     = '';
  $('amountError').textContent   = '';
  $('categoryError').textContent = '';
}

function validateForm() {
  let valid = true;

  if (!itemName.value.trim()) {
    itemName.classList.add('invalid');
    $('nameError').textContent = 'Item name is required.';
    valid = false;
  }

  const amt = parseFloat(itemAmount.value);
  if (!itemAmount.value || isNaN(amt) || amt <= 0) {
    itemAmount.classList.add('invalid');
    $('amountError').textContent = 'Enter a valid amount greater than 0.';
    valid = false;
  }

  /* Category only required for expense */
  if (currentType === 'expense' && !itemCategory.value) {
    itemCategory.classList.add('invalid');
    $('categoryError').textContent = 'Please select a category.';
    valid = false;
  }

  return valid;
}

/* ── ADD TRANSACTION ── */
form.addEventListener('submit', e => {
  e.preventDefault();
  clearErrors();

  if (!validateForm()) return;

  const tx = {
    id:       generateId(),
    name:     itemName.value.trim(),
    amount:   parseFloat(itemAmount.value),
    category: currentType === 'expense' ? itemCategory.value : 'Income',
    date:     itemDate.value || new Date().toISOString().split('T')[0],
    type:     currentType,
  };

  transactions.unshift(tx);
  saveTransactions();
  renderAll();

  const label = currentType === 'income' ? 'income' : 'expense';
  showToast(`Added "${tx.name}" — ${formatRupiah(tx.amount)} (${label})`);

  /* Reset name, amount, category — keep date & threshold */
  itemName.value     = '';
  itemAmount.value   = '';
  itemCategory.value = '';
});

/* ── DELETE TRANSACTION ── */
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions();
  renderAll();
  showToast('Transaction deleted.');
}

/* ── CLEAR ALL ── */
clearAllBtn.addEventListener('click', () => {
  if (transactions.length === 0) { showToast('Nothing to clear.'); return; }
  if (!confirm('Delete ALL transactions? This cannot be undone.')) return;
  transactions = [];
  saveTransactions();
  renderAll();
  showToast('All transactions cleared.');
});

/* ── THRESHOLD ── */
thresholdInput.addEventListener('input', () => {
  threshold = parseFloat(thresholdInput.value) || 0;
  saveThreshold();
  renderTransactions();
});

/* ── RENDER ALL ── */
function renderAll() {
  renderBalances();
  renderTransactions();
  renderChart();
  renderSummary();
  renderCategoryChips();
}

/* ── BALANCES ── */
function renderBalances() {
  const totalIncome  = transactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const net = totalIncome - totalExpense;

  const monthlyExpense = transactions
    .filter(t => t.type === 'expense' && getMonthKey(t.date) === currentMonthKey())
    .reduce((s, t) => s + t.amount, 0);

  /* Animate income and expense */
  animateValue(totalIncomeEl,  parseFloat(totalIncomeEl.dataset.val)  || 0, totalIncome,  formatRupiah);
  animateValue(totalSpentEl,   parseFloat(totalSpentEl.dataset.val)   || 0, totalExpense, formatRupiah);
  animateValue(monthlySpentEl, parseFloat(monthlySpentEl.dataset.val) || 0, monthlyExpense, formatRupiah);

  totalIncomeEl.dataset.val  = totalIncome;
  totalSpentEl.dataset.val   = totalExpense;
  monthlySpentEl.dataset.val = monthlyExpense;
  totalCountEl.textContent   = transactions.length;

  /* Net balance — animate and colour */
  animateValue(netBalanceEl, parseFloat(netBalanceEl.dataset.raw) || 0, Math.abs(net), formatRupiah, net);
  netBalanceEl.dataset.raw = net;

  /* Apply positive/negative/zero colour class to net balance */
  netBalanceEl.classList.remove('positive', 'negative', 'zero');
  if (net > 0)      netBalanceEl.classList.add('positive');
  else if (net < 0) netBalanceEl.classList.add('negative');
  else              netBalanceEl.classList.add('zero');

  /* Pop animation */
  [totalIncomeEl, totalSpentEl, netBalanceEl, monthlySpentEl, totalCountEl].forEach(el => {
    el.classList.remove('updated');
    void el.offsetWidth;
    el.classList.add('updated');
  });
}

function animateValue(el, from, to, formatter, rawNet) {
  const duration = 400;
  const start    = performance.now();
  from = parseFloat(from) || 0;

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    const current  = from + (to - from) * eased;

    /* For net balance, add sign prefix */
    if (rawNet !== undefined) {
      const sign = rawNet < 0 ? '− ' : rawNet > 0 ? '+ ' : '';
      el.textContent = sign + formatter(current);
    } else {
      el.textContent = formatter(current);
    }

    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ── TRANSACTIONS LIST ── */
function renderTransactions() {
  const typeFilter = filterType.value;   // 'all' | 'expense' | 'income'
  const catFilter  = filterCategory.value; // 'all' | category name (lowercase)

  let list = transactions;

  if (typeFilter !== 'all') {
    list = list.filter(t => t.type === typeFilter);
  }
  if (catFilter !== 'all') {
    list = list.filter(t => t.category.toLowerCase() === catFilter);
  }

  transactionList.innerHTML = '';

  if (list.length === 0) {
    const p = document.createElement('p');
    p.className   = 'list-empty';
    p.textContent = transactions.length === 0
      ? 'No transactions yet. Add one above!'
      : 'No transactions match this filter.';
    transactionList.appendChild(p);
    return;
  }

  list.forEach(tx => {
    const isExpense  = tx.type === 'expense';
    const isAbove    = isExpense && threshold > 0 && tx.amount > threshold;
    const color      = isExpense ? categoryColor(tx.category) : '#00c07f';
    const emoji      = isExpense ? getCatEmoji(tx.category) : '📥';
    const dateStr    = tx.date
      ? new Date(tx.date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '';

    const item = document.createElement('div');
    item.className = [
      'tx-item',
      isExpense ? 'tx-expense' : 'tx-income',
      isAbove   ? 'above-threshold' : '',
    ].filter(Boolean).join(' ');
    item.setAttribute('role', 'listitem');
    item.dataset.id = tx.id;

    const categoryBadge = isExpense
      ? `<span class="tx-category-badge" style="background:${color}">${escapeHtml(tx.category)}</span>`
      : '';

    item.innerHTML = `
      <div class="tx-icon">${emoji}</div>
      <div class="tx-info">
        <div class="tx-name" title="${escapeHtml(tx.name)}">${escapeHtml(tx.name)}</div>
        <div class="tx-meta">
          <span class="tx-type-badge badge-${tx.type}">${tx.type}</span>
          ${categoryBadge}
          ${dateStr ? `<span>${dateStr}</span>` : ''}
        </div>
      </div>
      <div class="tx-right">
        <span class="tx-amount amount-${tx.type}">
          ${isExpense ? '−' : '+'} ${formatRupiah(tx.amount)}
        </span>
        <button class="tx-delete" title="Delete transaction" aria-label="Delete ${escapeHtml(tx.name)}">✕</button>
      </div>
    `;

    item.querySelector('.tx-delete').addEventListener('click', () => deleteTransaction(tx.id));
    transactionList.appendChild(item);
  });
}

/* ── FILTER SELECTS ── */
function rebuildFilterSelect() {
  const current = filterCategory.value;
  filterCategory.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value       = cat.toLowerCase();
    opt.textContent = cat;
    filterCategory.appendChild(opt);
  });
  if ([...filterCategory.options].some(o => o.value === current)) {
    filterCategory.value = current;
  }
}

filterType.addEventListener('change', renderTransactions);
filterCategory.addEventListener('change', renderTransactions);

/* ── PIE CHART (expense-only) ── */
function renderChart() {
  /* Only show expenses in the pie chart */
  const expenseTx = transactions.filter(t => t.type === 'expense');

  const totals = {};
  expenseTx.forEach(tx => {
    totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
  });

  const labels = Object.keys(totals);
  const data   = Object.values(totals);
  const colors = labels.map(l => categoryColor(l));

  if (labels.length === 0) {
    chartEmpty.style.display  = 'block';
    chartLegend.innerHTML     = '';
    chartCanvas.style.display = 'none';
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
    return;
  }

  chartEmpty.style.display  = 'none';
  chartCanvas.style.display = 'block';

  const config = {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor:     colors.map(c => c + 'cc'),
        borderWidth:     2,
        hoverOffset:     10,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: true,
      plugins: {
        legend:  { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = data.reduce((a, b) => a + b, 0);
              const pct   = ((ctx.parsed / total) * 100).toFixed(1);
              return ` ${formatRupiah(ctx.parsed)} (${pct}%)`;
            },
          },
        },
      },
    },
  };

  if (chartInstance) {
    chartInstance.data.labels                      = labels;
    chartInstance.data.datasets[0].data            = data;
    chartInstance.data.datasets[0].backgroundColor = colors;
    chartInstance.data.datasets[0].borderColor     = colors.map(c => c + 'cc');
    chartInstance.update('active');
  } else {
    chartInstance = new Chart(chartCanvas, config);
  }

  /* Custom legend */
  chartLegend.innerHTML = '';
  const total = data.reduce((a, b) => a + b, 0);
  labels.forEach((label, i) => {
    const pct = ((data[i] / total) * 100).toFixed(1);
    const li  = document.createElement('div');
    li.className = 'legend-item';
    li.innerHTML = `<span class="legend-dot" style="background:${colors[i]}"></span>${escapeHtml(label)} (${pct}%)`;
    chartLegend.appendChild(li);
  });
}

/* ── CATEGORY SELECT (form) ── */
function rebuildCategorySelect() {
  const current = itemCategory.value;
  itemCategory.innerHTML = '<option value="">-- Select --</option>';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value       = cat;
    opt.textContent = cat;
    itemCategory.appendChild(opt);
  });
  if (current && categories.find(c => c === current)) {
    itemCategory.value = current;
  }
}

/* ── CATEGORY CHIPS ── */
function renderCategoryChips() {
  categoryChips.innerHTML = '';
  categories.forEach(cat => {
    const isBuiltin = BUILTIN_CATEGORIES.map(b => b.toLowerCase()).includes(cat.toLowerCase());
    const chip      = document.createElement('span');
    chip.className  = `chip${isBuiltin ? ' chip-builtin' : ''}`;
    chip.innerHTML  = `${escapeHtml(cat)}${!isBuiltin
      ? `<button class="chip-delete" title="Remove ${escapeHtml(cat)}" aria-label="Remove ${escapeHtml(cat)}">✕</button>`
      : ''}`;
    if (!isBuiltin) {
      chip.querySelector('.chip-delete').addEventListener('click', () => removeCategory(cat));
    }
    categoryChips.appendChild(chip);
  });
}

/* ── ADD CUSTOM CATEGORY ── */
addCategoryBtn.addEventListener('click', addCustomCategory);
newCategoryInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); addCustomCategory(); }
});

function addCustomCategory() {
  const val = newCategoryInput.value.trim();
  if (!val) { showToast('Enter a category name first.'); return; }
  if (categories.find(c => c.toLowerCase() === val.toLowerCase())) {
    showToast(`"${val}" already exists.`);
    return;
  }
  categories.push(val);
  saveCategories();
  newCategoryInput.value = '';
  rebuildCategorySelect();
  rebuildFilterSelect();
  renderCategoryChips();
  showToast(`Category "${val}" added!`);
}

/* ── REMOVE CUSTOM CATEGORY ── */
function removeCategory(cat) {
  const hasUsage = transactions.some(
    t => t.type === 'expense' && t.category.toLowerCase() === cat.toLowerCase()
  );
  if (hasUsage) {
    showToast(`Cannot remove — "${cat}" is used in transactions.`);
    return;
  }
  categories = categories.filter(c => c.toLowerCase() !== cat.toLowerCase());
  saveCategories();
  rebuildCategorySelect();
  rebuildFilterSelect();
  renderCategoryChips();
  showToast(`Category "${cat}" removed.`);
}

/* ── MONTHLY SUMMARY ── */
prevMonthBtn.addEventListener('click', () => {
  summaryDate.setMonth(summaryDate.getMonth() - 1);
  renderSummary();
});

nextMonthBtn.addEventListener('click', () => {
  summaryDate.setMonth(summaryDate.getMonth() + 1);
  renderSummary();
});

function renderSummary() {
  const mk = summaryMonthKey();
  summaryLabel.textContent = summaryDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const monthTx = transactions.filter(t => getMonthKey(t.date) === mk);

  summaryContent.innerHTML = '';

  if (monthTx.length === 0) {
    const p = document.createElement('p');
    p.className   = 'summary-empty';
    p.textContent = 'No transactions for this month.';
    summaryContent.appendChild(p);
    return;
  }

  const monthIncome  = monthTx.filter(t => t.type === 'income') .reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const monthNet     = monthIncome - monthExpense;

  /* Income tile */
  summaryContent.appendChild(makeSummaryTile('INCOME', formatRupiah(monthIncome), '#00c07f', false));

  /* Expense tile */
  summaryContent.appendChild(makeSummaryTile('EXPENSE', formatRupiah(monthExpense), '#ff5252', false));

  /* Net balance tile */
  const netSign  = monthNet >= 0 ? '+ ' : '− ';
  const netClass = monthNet > 0 ? 'positive' : monthNet < 0 ? 'negative' : '';
  const netTile  = makeSummaryTile(
    'NET',
    netSign + formatRupiah(monthNet),
    monthNet >= 0 ? '#00c07f' : '#ff5252',
    true,
    netClass
  );
  summaryContent.appendChild(netTile);

  /* Per-category breakdown (expenses only) */
  const expenseTx = monthTx.filter(t => t.type === 'expense');
  const catTotals = {};
  expenseTx.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + t.amount; });

  Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, amt]) => {
      summaryContent.appendChild(makeSummaryTile(cat, formatRupiah(amt), categoryColor(cat), false));
    });
}

function makeSummaryTile(label, amountStr, accentColor, isNet, extraAmountClass) {
  const item = document.createElement('div');
  item.className = `summary-item${isNet ? ' summary-net' : ''}`;
  item.style.borderLeft = `3px solid ${accentColor}`;
  item.innerHTML = `
    <div class="summary-cat">${escapeHtml(label)}</div>
    <div class="summary-amount${extraAmountClass ? ' ' + extraAmountClass : ''}">${escapeHtml(amountStr)}</div>
  `;
  return item;
}

/* ── DARK / LIGHT MODE ── */
themeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark-mode');
  document.body.classList.toggle('light-mode', !isDark);
  themeIcon.textContent = isDark ? '☀️' : '🌙';
  saveTheme(isDark ? 'dark' : 'light');
  if (chartInstance) renderChart();
});

function applyTheme() {
  const saved = localStorage.getItem(LS_KEY_THEME);
  if (saved === 'dark') {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
    themeIcon.textContent = '☀️';
  } else {
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
    themeIcon.textContent = '🌙';
  }
}

/* ── TOAST ── */
let toastTimer = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

/* ── KEYBOARD: Escape clears form errors ── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') clearErrors();
});

/* ── BOOTSTRAP ── */
document.addEventListener('DOMContentLoaded', init);
