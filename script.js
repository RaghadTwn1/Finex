/* ════════════════════════════════════════════
   FINEX – script.js
   Gamified Arabic Financial Management App
════════════════════════════════════════════ */

'use strict';

/* ───────────────────────────────────────────
   ONBOARDING
   Shows on first visit only; skipped if
   localStorage flag 'finex_onboarded' is set.
─────────────────────────────────────────── */

function initOnboarding() {
  const overlay  = document.getElementById('onboarding-overlay');
  const step1    = document.getElementById('ob-step1');
  const step2    = document.getElementById('ob-step2');
  const step3    = document.getElementById('ob-step3');
  const step4    = document.getElementById('ob-step4');
  const err1     = document.getElementById('ob-err1');
  const err2     = document.getElementById('ob-err2');

  // ── Allow reset via URL: add ?reset=1 to clear onboarding flag ──
  if (window.location.search.includes('reset=1')) {
    STATE.user = null;
    persistState();
  }

  // ── Already registered → skip straight to app ──
  if (STATE.user) {
    overlay.classList.add('ob-hidden');
    return;
  }

  // ── Helper: switch active step by index (0=step1,1=step2,2=step3,3=step4) ──
  const stepEls = [step1, step2, step3, step4];
  function showStep(idx) {
    stepEls.forEach(s => { if(s) s.classList.remove('active'); });
    if (stepEls[idx]) stepEls[idx].classList.add('active');
    overlay.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Live slider value display ──
  const sliders = [
    { input: 'sl-income',   label: 'val-income'   },
    { input: 'sl-fixed',    label: 'val-fixed'    },
    { input: 'sl-daily',    label: 'val-daily'    },
    { input: 'sl-entertain',label: 'val-entertain'},
    { input: 'sl-save',     label: 'val-save'     },
    { input: 'sl-zakat',    label: 'val-zakat'    },
  ];

  sliders.forEach(({ input, label }) => {
    const el  = document.getElementById(input);
    const lbl = document.getElementById(label);
    if (!el || !lbl) return;

    function updateSlider() {
      lbl.textContent = el.value + '%';
      const pct = el.value;
      el.style.background =
        `linear-gradient(to right, var(--green) ${pct}%, var(--border) ${pct}%)`;
    }

    el.addEventListener('input', updateSlider);
    updateSlider();
  });

  // ── Goal chips: visual toggle ──
  document.querySelectorAll('.ob-goal-chip input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      cb.closest('.ob-goal-chip').classList.toggle('selected', cb.checked);
    });
  });

  // ── STEP 1 → STEP 2 ──
  document.getElementById('ob-next1').addEventListener('click', () => {
    const name  = document.getElementById('ob-name').value.trim();
    const email = document.getElementById('ob-email').value.trim();
    const idNo  = document.getElementById('ob-id').value.trim();
    const bank  = document.getElementById('ob-bank').value;

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name)    { err1.textContent = '⚠️ الرجاء إدخال الاسم الكامل'; return; }
    if (!emailOk) { err1.textContent = '⚠️ الرجاء إدخال بريد إلكتروني صحيح'; return; }
    if (!idNo)    { err1.textContent = '⚠️ الرجاء إدخال رقم الهوية';  return; }
    if (!bank)    { err1.textContent = '⚠️ الرجاء اختيار البنك';       return; }
    err1.textContent = '';

    showStep(1);
  });

  // ── STEP 2 → STEP 3 (loading) → STEP 4 (AI result) ──
  document.getElementById('ob-analyze').addEventListener('click', () => {
    const salary = document.getElementById('ob-salary').value.trim();
    if (!salary || Number(salary) <= 0) {
      err2.textContent = '⚠️ الرجاء إدخال الراتب الشهري';
      return;
    }
    err2.textContent = '';

    showStep(2);

    // Compute dummy AI figures from user inputs
    const sal       = Number(salary);
    const savePct   = Number(document.getElementById('sl-save').value) || 25;
    const entPct    = Number(document.getElementById('sl-entertain').value) || 10;
    const monthSave = Math.round(sal * savePct / 100);
    const goalMonthly = Number(document.getElementById('ob-goal-monthly').value) || monthSave;
    const goalYearly  = Number(document.getElementById('ob-goal-yearly').value) || goalMonthly * 12;

    // Months to reach yearly goal
    const months = monthSave > 0 ? Math.ceil(goalYearly / monthSave) : 24;
    // Goal completion pct (dummy: how much of 1-year target is covered by current monthly rate × 12)
    const pct = Math.min(100, Math.round((monthSave * 12 / Math.max(goalYearly, 1)) * 100));
    // Health score: simple proxy
    const health = Math.min(100, 50 + savePct + (entPct < 10 ? 10 : 0));

    // After 1.8s loading → populate & show result
    setTimeout(() => {
      document.getElementById('ai-goal-pct').textContent   = pct + '%';
      document.getElementById('ai-goal-bar').style.width   = pct + '%';
      document.getElementById('ai-months').textContent     = months + ' شهراً';
      document.getElementById('ai-monthly-save').textContent = monthSave.toLocaleString('ar-SA') + ' ر.س';
      document.getElementById('ai-health').textContent     = health + ' / 100';

      // Dynamic spending rec
      const entSave = Math.round(sal * entPct / 100 * 0.05);
      document.getElementById('ai-rec-entertain').textContent =
        `حاول تقليص الترفيه بنسبة 5% شهرياً لتوفير ${entSave.toLocaleString('ar-SA')} ريال إضافي.`;

      // Motivation based on months
      const motivEl = document.getElementById('ai-motiv-msg');
      if (motivEl) {
        if (months <= 12) {
          motivEl.textContent = 'رائع! ستحقق هدفك خلال سنة واحدة فقط. مدينتك ستزهر! 🌟';
        } else if (months <= 24) {
          motivEl.textContent = 'أنت على الطريق الصحيح! مدينتك ستنمو وأهدافك ستتحقق قريباً.';
        } else {
          motivEl.textContent = 'كل رحلة تبدأ بخطوة. زد نسبة ادخارك قليلاً وستصل أسرع مما تتوقع! 💪';
        }
      }

      // ── Save user profile to DB ──
      const name  = document.getElementById('ob-name').value.trim();
      const email = document.getElementById('ob-email').value.trim();
      const idNo  = document.getElementById('ob-id').value.trim();
      const bank  = document.getElementById('ob-bank').value;
      const selectedGoals = [...document.querySelectorAll('.ob-goal-chip input:checked')].map(c => c.value);
      STATE.user = { name, email, idNo, bank, salary: Number(salary), savePct, entPct, registeredAt: new Date().toISOString(), selectedGoals };
      persistState();

      showStep(3);
    }, 1800);
  });

  // ── STEP 4 → Enter Dashboard ──
  document.getElementById('ob-enter-app').addEventListener('click', () => {
    overlay.style.transition = 'opacity .5s ease';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.classList.add('ob-hidden');
      overlay.style.opacity = '';
      overlay.style.transition = '';
    }, 500);
  });
}

/* ───────────────────────────────────────────
   LOCAL STORAGE "DATABASE"
   Persists all user data under one key,
   simulating a backend / Firebase store.
─────────────────────────────────────────── */
const DB_KEY = 'finex_user_db';

function dbLoad() {
  try { return JSON.parse(localStorage.getItem(DB_KEY) || 'null'); }
  catch(e) { return null; }
}
function dbSave(data) {
  try { localStorage.setItem(DB_KEY, JSON.stringify(data)); }
  catch(e) { console.warn('Finex: storage error', e); }
}

/* ───────────────────────────────────────────
   STATE  — loaded from DB on start
─────────────────────────────────────────── */
const _db = dbLoad() || {};
const STATE = {
  coins:     _db.coins     !== undefined ? _db.coins     : 2450,
  xp:        _db.xp        !== undefined ? _db.xp        : 1280,
  cityItems: Array.isArray(_db.cityItems) ? _db.cityItems : [],
  tasks:     Array.isArray(_db.tasks)     ? _db.tasks     : [],
  user:      _db.user      || null,
};

function persistState() {
  dbSave({ coins: STATE.coins, xp: STATE.xp, cityItems: STATE.cityItems, tasks: STATE.tasks, user: STATE.user });
}

/* ───────────────────────────────────────────
   SHOP CATALOG
─────────────────────────────────────────── */
const SHOP_ITEMS = [
  { id: 'tree',     emoji: '🌳', name: 'شجرة خضراء',   desc: 'أضف حياة وظلاً لمدينتك',        price: 80  },
  { id: 'house',    emoji: '🏡', name: 'منزل جميل',     desc: 'بيت مريح لسكان مدينتك',         price: 200 },
  { id: 'flower',   emoji: '🌸', name: 'زهور ملونة',    desc: 'جمّل الأرصفة بألوان الربيع',     price: 40  },
  { id: 'bench',    emoji: '🪑', name: 'مقعد الحديقة',  desc: 'مكان للراحة والاسترخاء',         price: 60  },
  { id: 'lamp',     emoji: '💡', name: 'عمود إضاءة',    desc: 'أنر شوارع مدينتك بالليل',        price: 90  },
  { id: 'fountain', emoji: '⛲', name: 'نافورة مياه',    desc: 'ميزة أنيقة في قلب المدينة',     price: 300 },
  { id: 'park',     emoji: '🌿', name: 'حديقة عامة',    desc: 'متنفس جميل لسكان المدينة',       price: 150 },
  { id: 'car',      emoji: '🚗', name: 'سيارة ملونة',   desc: 'حركة وحياة في شوارعك',           price: 120 },
];

/* ───────────────────────────────────────────
   NAVIGATION
─────────────────────────────────────────── */
function navigate(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const targetPage = document.getElementById('page-' + pageId);
  if (targetPage) {
    targetPage.classList.add('active');
  }

  const targetBtn = document.querySelector(`.nav-btn[data-page="${pageId}"]`);
  if (targetBtn) targetBtn.classList.add('active');

  // Run page-specific inits
  if (pageId === 'city')     initCity();
  if (pageId === 'analysis') initCharts();
  if (pageId === 'shop')     renderShop();
  if (pageId === 'tasks')    initTasksPage();
  if (pageId === 'profile')  initProfilePage();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Nav buttons
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => navigate(btn.dataset.page));
});

// Go-to buttons (hero CTA, etc.)
document.querySelectorAll('[data-goto]').forEach(btn => {
  btn.addEventListener('click', () => navigate(btn.dataset.goto));
});

/* ───────────────────────────────────────────
   COINS DISPLAY
─────────────────────────────────────────── */
function updateCoinsDisplay() {
  const fmt = n => n.toLocaleString('ar-SA');
  document.getElementById('nav-coins').textContent = fmt(STATE.coins);
  document.getElementById('home-coins').textContent = fmt(STATE.coins);
  const cityDisp = document.getElementById('city-coins-display');
  if (cityDisp) cityDisp.textContent = fmt(STATE.coins);
  const shopDisp = document.getElementById('shop-coins-display');
  if (shopDisp) shopDisp.textContent = fmt(STATE.coins);
  const tasksCoinsDisp = document.getElementById('tasks-coins-display');
  if (tasksCoinsDisp) tasksCoinsDisp.textContent = fmt(STATE.coins);
  const tasksXpDisp = document.getElementById('tasks-xp-display');
  if (tasksXpDisp) tasksXpDisp.textContent = fmt(STATE.xp);
}

/* ───────────────────────────────────────────
   TOAST
─────────────────────────────────────────── */
let toastTimer = null;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = 'toast'; }, 2800);
}

/* ════════════════════════════════════════════
   FINANCIAL ANALYSIS – CHARTS
════════════════════════════════════════════ */
let chartsInited = false;

function initCharts() {
  if (chartsInited) return;
  chartsInited = true;

  drawGauge();
  drawDonut();
  drawBar();
}

/* ── Gauge (half-circle) ── */
function drawGauge() {
  const canvas = document.getElementById('gauge-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H - 10;
  const r = 85;
  const score = 82;

  // Background arc
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 0, false);
  ctx.lineWidth = 18;
  ctx.strokeStyle = '#E8EEE9';
  ctx.lineCap = 'round';
  ctx.stroke();

  // Score arc
  const pct = score / 100;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, Math.PI + pct * Math.PI, false);
  ctx.lineWidth = 18;

  const grad = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
  grad.addColorStop(0,   '#3DB87A');
  grad.addColorStop(.5,  '#3DB87A');
  grad.addColorStop(1,   '#1F7A4D');
  ctx.strokeStyle = grad;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Score text
  ctx.fillStyle = '#1A2420';
  ctx.font = 'bold 32px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(score, cx, cy - 18);

  ctx.fillStyle = '#8FA89A';
  ctx.font = '14px Cairo, sans-serif';
  ctx.fillText('من 100', cx, cy + 10);

  // Ticks
  ['ضعيف','متوسط','ممتاز'].forEach((label, i) => {
    const angle = Math.PI + (i / 2) * Math.PI;
    const lx = cx + (r + 22) * Math.cos(angle);
    const ly = cy + (r + 22) * Math.sin(angle);
    ctx.fillStyle = '#8FA89A';
    ctx.font = '11px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, lx, ly);
  });
}

/* ── Donut chart ── */
function drawDonut() {
  const canvas = document.getElementById('donut-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2, r = 100, inner = 55;

  const data = [
    { label: 'التزامات', value: 37.6, color: '#3DB87A' },
    { label: 'يومية',    value: 21.8, color: '#64C8A0' },
    { label: 'ترفيه',   value: 7.3,  color: '#F5A623' },
    { label: 'مدخرات',  value: 20,   color: '#4A90D9' },
    { label: 'صدقات',   value: 5,    color: '#9B59B6' },
    { label: 'أخرى',    value: 8.3,  color: '#E8EEE9' },
  ];

  let startAngle = -Math.PI / 2;
  data.forEach(seg => {
    const sliceAngle = (seg.value / 100) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    startAngle += sliceAngle;
  });

  // Inner hole
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, 2 * Math.PI);
  ctx.fillStyle = 'white';
  ctx.fill();

  // Center text
  ctx.fillStyle = '#1A2420';
  ctx.font = 'bold 20px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('8,500', cx, cy - 8);
  ctx.fillStyle = '#8FA89A';
  ctx.font = '12px Cairo, sans-serif';
  ctx.fillText('ريال/شهر', cx, cy + 12);

  // Legend
  const legend = document.getElementById('donut-legend');
  if (legend) {
    legend.innerHTML = data.map(d => `
      <div class="legend-item">
        <div class="legend-dot" style="background:${d.color}"></div>
        <span>${d.label} (${d.value}%)</span>
      </div>
    `).join('');
  }
}

/* ── Bar chart ── */
function drawBar() {
  const canvas = document.getElementById('bar-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو'];
  const values = [1200, 1350, 1100, 1600, 1450, 1700];
  const maxV = 2000;

  const pad = { top: 24, bottom: 48, left: 20, right: 20 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const barW = (chartW / months.length) * 0.55;
  const gap = chartW / months.length;

  // Grid lines
  ctx.strokeStyle = '#E8EEE9';
  ctx.lineWidth = 1;
  [0, .25, .5, .75, 1].forEach(frac => {
    const y = pad.top + chartH * (1 - frac);
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(pad.left, y);
    ctx.lineTo(W - pad.right, y);
    ctx.stroke();

    ctx.fillStyle = '#8FA89A';
    ctx.font = '11px Cairo, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText((maxV * frac).toLocaleString(), pad.left - 4, y + 4);
  });
  ctx.setLineDash([]);

  // Bars
  months.forEach((month, i) => {
    const x = pad.left + i * gap + (gap - barW) / 2;
    const barH = (values[i] / maxV) * chartH;
    const y = pad.top + chartH - barH;

    // Shadow / background bar
    ctx.fillStyle = '#E8F7EF';
    ctx.beginPath();
    roundRect(ctx, x, pad.top, barW, chartH, 6);
    ctx.fill();

    // Gradient bar
    const grad = ctx.createLinearGradient(0, y, 0, y + barH);
    grad.addColorStop(0, '#3DB87A');
    grad.addColorStop(1, '#1F7A4D');
    ctx.fillStyle = grad;
    ctx.beginPath();
    roundRect(ctx, x, y, barW, barH, 6);
    ctx.fill();

    // Value label on top
    ctx.fillStyle = '#1A2420';
    ctx.font = 'bold 12px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(values[i].toLocaleString(), x + barW / 2, y - 6);

    // Month label
    ctx.fillStyle = '#8FA89A';
    ctx.font = '12px Cairo, sans-serif';
    ctx.fillText(month, x + barW / 2, pad.top + chartH + 18);
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ════════════════════════════════════════════
   CITY – CLEAN GRID-BASED LAYOUT
   The city is laid out as an organized grid of
   blocks separated by straight roads. Each block
   holds either a pre-built structure or an empty
   plot reserved for purchased items.
════════════════════════════════════════════ */
let cityInited = false;

/* Layout constants (canvas is 1400 × 1000) */
const CITY = {
  W: 1400,
  H: 1000,
  road: 70,          // road width
  margin: 60,        // outer grass margin
};

/*
  Grid plan: 3 columns × 3 rows of blocks.
  Roads run between them. Each block is a "plot"
  that can be: a fixed building, a park, the lake,
  or an empty buildable plot.
*/
function getCityPlots() {
  const { margin, road } = CITY;
  const cols = 3, rows = 3;
  const usableW = CITY.W - margin * 2 - road * (cols - 1);
  const usableH = CITY.H - margin * 2 - road * (rows - 1);
  const plotW = usableW / cols;
  const plotH = usableH / rows;

  const plots = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = margin + c * (plotW + road);
      const y = margin + r * (plotH + road);
      plots.push({ r, c, x, y, w: plotW, h: plotH, cx: x + plotW / 2, cy: y + plotH / 2 });
    }
  }
  return { plots, plotW, plotH };
}

/* Assign a content type to each of the 9 plots (designed, not random) */
const PLOT_PLAN = [
  'house',   'park',    'bank',    // row 0
  'empty',   'plaza',   'empty',   // row 1  (plaza = fountain centre)
  'shop',    'empty',   'lake',    // row 2
];

function initCity() {
  if (cityInited) {
    updateCoinsDisplay();
    updateCityProgress();
    return;
  }
  cityInited = true;

  const canvas = document.getElementById('city-canvas');
  const ctx = canvas.getContext('2d');
  drawCity(ctx, canvas.width, canvas.height);
  renderSavedCityItems();
  initCityDrag();
  updateCoinsDisplay();
  updateCityProgress();
}

/* ── City growth progress indicator ── */
function updateCityProgress() {
  const totalSlots = 18; // 3 empty plots × 6 slots
  const placed = STATE.cityItems.length;
  const pct = Math.min(100, Math.round((placed / totalSlots) * 100));

  const countEl = document.getElementById('city-progress-count');
  const fillEl  = document.getElementById('city-progress-fill');
  const hintEl  = document.getElementById('city-progress-hint');

  if (countEl) countEl.textContent = `${placed} / ${totalSlots} عنصر`;
  if (fillEl)  fillEl.style.width = pct + '%';

  if (hintEl) {
    if (placed === 0) {
      hintEl.textContent = 'ابدأ بشراء أول عنصر من المتجر لتنمو مدينتك! 🌿';
    } else if (placed < 6) {
      hintEl.textContent = 'بداية رائعة! واصل إكمال مهامك لشراء المزيد. 🌱';
    } else if (placed < 12) {
      hintEl.textContent = 'مدينتك تزدهر! أنت تبني عادات مالية قوية. 🌳';
    } else if (placed < totalSlots) {
      hintEl.textContent = 'مدينتك على وشك الاكتمال — استمر! 🏙️';
    } else {
      hintEl.textContent = 'أحسنت! اكتملت مدينتك بالكامل 🎉 استمر في عاداتك الرائعة!';
    }
  }
}

/* ── Main city drawing ── */
function drawCity(ctx, W, H) {
  const { plots } = getCityPlots();

  /* 1. Grass base */
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#82CC63');
  g.addColorStop(1, '#6BBF52');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  /* subtle grass texture stripes */
  ctx.fillStyle = 'rgba(255,255,255,.04)';
  for (let y = 0; y < H; y += 46) {
    ctx.fillRect(0, y, W, 22);
  }

  /* 2. Road network (straight, between blocks) */
  drawGridRoads(ctx, plots);

  /* 3. Draw each plot's content */
  plots.forEach((plot, i) => {
    const type = PLOT_PLAN[i];
    drawPlotBase(ctx, plot, type);

    switch (type) {
      case 'house': drawHouseBlock(ctx, plot); break;
      case 'bank':  drawBankBlock(ctx, plot);  break;
      case 'shop':  drawShopBlock(ctx, plot);  break;
      case 'park':  drawParkBlock(ctx, plot);  break;
      case 'plaza': drawPlazaBlock(ctx, plot); break;
      case 'lake':  drawLakeBlock(ctx, plot);  break;
      case 'empty': drawEmptyPlot(ctx, plot);  break;
    }
  });

  /* 4. Decorative street lamps at road intersections */
  drawIntersectionLamps(ctx, plots);
}

/* ── Plot base (grass tile / soil for empties) ── */
function drawPlotBase(ctx, plot, type) {
  if (type === 'lake') return; // lake fills itself
  // Soft rounded grass tile to define the block
  ctx.fillStyle = type === 'empty' ? '#7AC659' : '#74C254';
  roundRectFill(ctx, plot.x, plot.y, plot.w, plot.h, 16);
}

/* ── Grid roads ── */
function drawGridRoads(ctx, plots) {
  const { margin, road } = CITY;

  // Find road centre-lines between plots
  ctx.fillStyle = '#CFC2AE';

  // Vertical roads (2 internal)
  const colXs = [];
  for (let c = 1; c < 3; c++) {
    const leftPlot = plots.find(p => p.c === c - 1 && p.r === 0);
    const x = leftPlot.x + leftPlot.w + 2;
    colXs.push(x);
    ctx.fillStyle = '#CFC2AE';
    roundRectFill(ctx, x, margin - 10, road - 4, CITY.H - margin * 2 + 20, 8);
  }

  // Horizontal roads (2 internal)
  const rowYs = [];
  for (let r = 1; r < 3; r++) {
    const topPlot = plots.find(p => p.r === r - 1 && p.c === 0);
    const y = topPlot.y + topPlot.h + 2;
    rowYs.push(y);
    ctx.fillStyle = '#CFC2AE';
    roundRectFill(ctx, margin - 10, y, CITY.W - margin * 2 + 20, road - 4, 8);
  }

  // Dashed centre markings
  ctx.strokeStyle = '#F0E8D8';
  ctx.lineWidth = 3;
  ctx.setLineDash([24, 18]);
  colXs.forEach(x => {
    ctx.beginPath();
    ctx.moveTo(x + (road - 4) / 2, margin);
    ctx.lineTo(x + (road - 4) / 2, CITY.H - margin);
    ctx.stroke();
  });
  rowYs.forEach(y => {
    ctx.beginPath();
    ctx.moveTo(margin, y + (road - 4) / 2);
    ctx.lineTo(CITY.W - margin, y + (road - 4) / 2);
    ctx.stroke();
  });
  ctx.setLineDash([]);
}

/* ── Building label tag drawn on canvas ── */
function drawCanvasLabel(ctx, cx, y, name, level) {
  ctx.font = '700 16px Cairo, sans-serif';
  const tw = ctx.measureText(name).width;
  const padX = 12, boxW = Math.max(tw + padX * 2, 80), boxH = 38;
  const bx = cx - boxW / 2, by = y;

  // White rounded tag with shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.18)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = '#FFFFFF';
  roundRectFill(ctx, bx, by, boxW, boxH, 10);
  ctx.restore();

  ctx.fillStyle = '#1A2420';
  ctx.font = '700 14px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, cx, by + 13);

  ctx.fillStyle = '#8FA89A';
  ctx.font = '700 12px Cairo, sans-serif';
  ctx.fillText('Lv. ' + level, cx, by + 28);
}

/* ── House block ── */
function drawHouseBlock(ctx, plot) {
  const cx = plot.cx, baseY = plot.cy + 20;
  drawDetailedHouse(ctx, cx, baseY, 150, 120, '#F3E2C0', '#C75B3B');
  // surrounding trees
  drawTreeAt(ctx, plot.x + 40, plot.y + 50, 26);
  drawTreeAt(ctx, plot.x + plot.w - 40, plot.y + 50, 24);
  drawFlowerBed(ctx, cx, baseY + 70, 5);
  drawCanvasLabel(ctx, cx, plot.y + plot.h - 46, 'منزلي', 2);
}

/* ── Bank block ── */
function drawBankBlock(ctx, plot) {
  const cx = plot.cx, baseY = plot.cy + 20;
  drawBankBuilding(ctx, cx, baseY, 160, 120);
  drawTreeAt(ctx, plot.x + 40, plot.y + 50, 26);
  drawTreeAt(ctx, plot.x + plot.w - 40, plot.y + 55, 24);
  drawCanvasLabel(ctx, cx, plot.y + plot.h - 46, 'البنك', 1);
}

/* ── Shop block ── */
function drawShopBlock(ctx, plot) {
  const cx = plot.cx, baseY = plot.cy + 20;
  drawShopBuilding(ctx, cx, baseY, 150, 115);
  drawTreeAt(ctx, plot.x + 40, plot.y + 55, 25);
  drawFlowerBed(ctx, cx, baseY + 68, 4);
  drawCanvasLabel(ctx, cx, plot.y + plot.h - 46, 'المتجر', 1);
}

/* ── Park block ── */
function drawParkBlock(ctx, plot) {
  // Green park ground
  ctx.fillStyle = '#5FB83F';
  roundRectFill(ctx, plot.x + 10, plot.y + 10, plot.w - 20, plot.h - 20, 14);

  // Path cross
  ctx.fillStyle = '#D8CCB4';
  roundRectFill(ctx, plot.cx - 8, plot.y + 20, 16, plot.h - 40, 4);
  roundRectFill(ctx, plot.x + 20, plot.cy - 8, plot.w - 40, 16, 4);

  // Trees + flowers
  drawTreeAt(ctx, plot.x + 45, plot.y + 45, 28);
  drawTreeAt(ctx, plot.x + plot.w - 45, plot.y + 45, 26);
  drawTreeAt(ctx, plot.x + 45, plot.y + plot.h - 55, 26);
  drawTreeAt(ctx, plot.x + plot.w - 45, plot.y + plot.h - 55, 28);
  drawBenchAt(ctx, plot.cx - 60, plot.cy + 4);
  drawBenchAt(ctx, plot.cx + 60, plot.cy + 4);
  drawFlowerBed(ctx, plot.cx, plot.cy - 50, 5);
  drawCanvasLabel(ctx, plot.cx, plot.y + plot.h - 44, 'الحديقة', 1);
}

/* ── Central plaza with fountain ── */
function drawPlazaBlock(ctx, plot) {
  // Paved plaza
  ctx.fillStyle = '#E3D8C2';
  roundRectFill(ctx, plot.x + 14, plot.y + 14, plot.w - 28, plot.h - 28, 18);
  // Paving ring
  ctx.strokeStyle = '#D2C4A8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(plot.cx, plot.cy, Math.min(plot.w, plot.h) / 2 - 30, 0, Math.PI * 2);
  ctx.stroke();
  // Fountain in centre
  drawFountainAt(ctx, plot.cx, plot.cy, 1.25);
  // Corner lamps + benches
  drawLampAt(ctx, plot.x + 36, plot.y + 60);
  drawLampAt(ctx, plot.x + plot.w - 36, plot.y + 60);
  drawBenchAt(ctx, plot.cx, plot.y + plot.h - 40);
}

/* ── Lake block ── */
function drawLakeBlock(ctx, plot) {
  // Grass surround
  ctx.fillStyle = '#74C254';
  roundRectFill(ctx, plot.x, plot.y, plot.w, plot.h, 16);
  // Water body
  const lg = ctx.createRadialGradient(plot.cx - 20, plot.cy - 20, 10, plot.cx, plot.cy, plot.w / 2);
  lg.addColorStop(0, '#A8D8EA');
  lg.addColorStop(.6, '#62B8D4');
  lg.addColorStop(1, '#4A9AB8');
  ctx.fillStyle = lg;
  roundRectFill(ctx, plot.x + 26, plot.y + 26, plot.w - 52, plot.h - 52, 28);
  // Shimmer
  ctx.strokeStyle = 'rgba(255,255,255,.45)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(plot.cx - 20 + i * 14, plot.cy - 16 + i * 10, 20 - i * 3, 5, -0.3, 0, Math.PI * 1.4);
    ctx.stroke();
  }
  // Lily pads
  ctx.fillStyle = '#3DB87A';
  ctx.beginPath(); ctx.arc(plot.cx + 45, plot.cy + 25, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FF6B9D';
  ctx.beginPath(); ctx.arc(plot.cx + 45, plot.cy + 25, 5, 0, Math.PI * 2); ctx.fill();
  drawTreeAt(ctx, plot.x + 36, plot.y + 40, 24);
  drawCanvasLabel(ctx, plot.cx, plot.y + plot.h - 44, 'البحيرة', 1);
}

/* ── Empty buildable plot ── */
function drawEmptyPlot(ctx, plot) {
  const ix = plot.x + 22, iy = plot.y + 22, iw = plot.w - 44, ih = plot.h - 44;
  // Soil tone
  ctx.fillStyle = 'rgba(180,150,110,.18)';
  roundRectFill(ctx, ix, iy, iw, ih, 12);
  // Dashed border
  ctx.strokeStyle = 'rgba(255,255,255,.65)';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 9]);
  ctx.beginPath();
  roundRectStroke(ctx, ix, iy, iw, ih, 12);
  ctx.stroke();
  ctx.setLineDash([]);
  // Plus icon
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.font = '700 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+', plot.cx, plot.cy - 6);
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  ctx.font = '700 14px Cairo, sans-serif';
  ctx.fillText('قطعة فارغة', plot.cx, plot.cy + 26);
}

function roundRectStroke(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

/* ── Intersection lamps ── */
function drawIntersectionLamps(ctx, plots) {
  const { margin, road } = CITY;
  const topPlot = plots.find(p => p.r === 0 && p.c === 0);
  const colX1 = topPlot.x + topPlot.w + road / 2;
  const colX2 = colX1 + topPlot.w + road;
  const leftPlot = plots.find(p => p.r === 0 && p.c === 0);
  const rowY1 = leftPlot.y + leftPlot.h + road / 2;
  const rowY2 = rowY1 + leftPlot.h + road;
  [[colX1,rowY1],[colX2,rowY1],[colX1,rowY2],[colX2,rowY2]].forEach(([x,y]) => {
    drawLampAt(ctx, x, y + 20);
  });
}

/* ════════════════════════════════════════════
   DETAILED STRUCTURE DRAWERS
   (cx = horizontal centre, baseY = bottom of building)
════════════════════════════════════════════ */

/* House — cottage style */
function drawDetailedHouse(ctx, cx, baseY, w, h, wall, roof) {
  const x = cx - w / 2, y = baseY - h;
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,.12)';
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 6, w / 2, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  // Wall
  ctx.fillStyle = wall;
  roundRectFill(ctx, x, y + h * 0.32, w, h * 0.68, 8);
  // Roof
  ctx.fillStyle = roof;
  ctx.beginPath();
  ctx.moveTo(x - 12, y + h * 0.38);
  ctx.lineTo(cx, y - 6);
  ctx.lineTo(x + w + 12, y + h * 0.38);
  ctx.closePath();
  ctx.fill();
  // Roof highlight
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  ctx.beginPath();
  ctx.moveTo(cx, y - 6);
  ctx.lineTo(x + w + 12, y + h * 0.38);
  ctx.lineTo(cx, y + h * 0.38);
  ctx.closePath();
  ctx.fill();
  // Door
  ctx.fillStyle = '#8B5E3C';
  roundRectFill(ctx, cx - 16, baseY - h * 0.42, 32, h * 0.42, 5);
  ctx.fillStyle = '#FFD27A';
  ctx.beginPath(); ctx.arc(cx + 8, baseY - h * 0.2, 2.5, 0, Math.PI * 2); ctx.fill();
  // Windows
  [-1, 1].forEach(s => {
    const wx = cx + s * w * 0.26 - 13;
    const wy = y + h * 0.42;
    ctx.fillStyle = '#BFE6FF';
    roundRectFill(ctx, wx, wy, 26, 26, 4);
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3;
    ctx.strokeRect(wx, wy, 26, 26);
    ctx.beginPath();
    ctx.moveTo(wx + 13, wy); ctx.lineTo(wx + 13, wy + 26);
    ctx.moveTo(wx, wy + 13); ctx.lineTo(wx + 26, wy + 13);
    ctx.stroke();
  });
}

/* Bank — classical columns */
function drawBankBuilding(ctx, cx, baseY, w, h) {
  const x = cx - w / 2, y = baseY - h;
  ctx.fillStyle = 'rgba(0,0,0,.12)';
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 6, w / 2, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body
  ctx.fillStyle = '#EFF2F6';
  roundRectFill(ctx, x, y + h * 0.28, w, h * 0.72, 6);
  // Roof pediment
  ctx.fillStyle = '#5B7CA8';
  ctx.beginPath();
  ctx.moveTo(x - 10, y + h * 0.32);
  ctx.lineTo(cx, y - 4);
  ctx.lineTo(x + w + 10, y + h * 0.32);
  ctx.closePath();
  ctx.fill();
  // Columns
  ctx.fillStyle = '#FFFFFF';
  const colN = 4, span = w * 0.78, startX = cx - span / 2;
  for (let i = 0; i < colN; i++) {
    const px = startX + i * (span / (colN - 1)) - 5;
    roundRectFill(ctx, px, y + h * 0.42, 10, h * 0.46, 2);
  }
  // Steps
  ctx.fillStyle = '#D8DDE4';
  roundRectFill(ctx, x + 6, baseY - 10, w - 12, 10, 3);
  // $ emblem
  ctx.fillStyle = '#3DB87A';
  ctx.beginPath(); ctx.arc(cx, y + h * 0.12, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFF';
  ctx.font = '700 16px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('$', cx, y + h * 0.12 + 1);
}

/* Shop — awning storefront */
function drawShopBuilding(ctx, cx, baseY, w, h) {
  const x = cx - w / 2, y = baseY - h;
  ctx.fillStyle = 'rgba(0,0,0,.12)';
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 6, w / 2, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body
  ctx.fillStyle = '#FBF0DA';
  roundRectFill(ctx, x, y + h * 0.22, w, h * 0.78, 8);
  // Flat roof band
  ctx.fillStyle = '#A8693C';
  roundRectFill(ctx, x - 4, y + h * 0.16, w + 8, h * 0.12, 5);
  // Striped awning
  const awY = y + h * 0.42, awH = 22, stripes = 6, sw = w / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 ? '#E8513C' : '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(x + i * sw, awY);
    ctx.lineTo(x + (i + 1) * sw, awY);
    ctx.lineTo(x + (i + 1) * sw - 6, awY + awH);
    ctx.lineTo(x + i * sw - 6, awY + awH);
    ctx.closePath();
    ctx.fill();
  }
  // Window + door
  ctx.fillStyle = '#BFE6FF';
  roundRectFill(ctx, x + 14, awY + awH + 8, w * 0.42, h * 0.28, 4);
  ctx.fillStyle = '#8B5E3C';
  roundRectFill(ctx, cx + 12, awY + awH + 8, w * 0.3, h * 0.34, 4);
}

/* Fountain (scalable) */
function drawFountainAt(ctx, cx, cy, scale = 1) {
  const s = scale;
  // Base pool
  ctx.fillStyle = '#C9D9E2';
  ctx.beginPath(); ctx.ellipse(cx, cy, 50 * s, 34 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7FC4E0';
  ctx.beginPath(); ctx.ellipse(cx, cy, 42 * s, 27 * s, 0, 0, Math.PI * 2); ctx.fill();
  // Tier
  ctx.fillStyle = '#E3ECF1';
  ctx.beginPath(); ctx.ellipse(cx, cy - 4 * s, 20 * s, 13 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#9AD2E8';
  ctx.beginPath(); ctx.ellipse(cx, cy - 6 * s, 13 * s, 8 * s, 0, 0, Math.PI * 2); ctx.fill();
  // Spout
  ctx.fillStyle = '#E3ECF1';
  roundRectFill(ctx, cx - 3 * s, cy - 26 * s, 6 * s, 20 * s, 3);
  // Water droplets
  ctx.fillStyle = 'rgba(180,225,245,.9)';
  [-10, 0, 10].forEach(dx => {
    ctx.beginPath();
    ctx.arc(cx + dx * s, cy - 30 * s, 3 * s, 0, Math.PI * 2);
    ctx.fill();
  });
}

/* Small flower bed cluster */
function drawFlowerBed(ctx, cx, cy, n) {
  const colors = ['#FF9FF3','#FF6B6B','#FFD93D','#FF8C42','#79E7FF'];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    drawFlowerAt(ctx, cx + Math.cos(a) * 16, cy + Math.sin(a) * 10, 7, colors[i % colors.length]);
  }
}

/* ════════════════════════════════════════════
   SHARED CANVAS HELPERS
════════════════════════════════════════════ */
function roundRectFill(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function drawTreeAt(ctx, x, y, size) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,.1)';
  ctx.beginPath();
  ctx.ellipse(x, y + size * 0.6, size * 0.6, size * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  // Trunk
  ctx.fillStyle = '#8B6B3A';
  roundRectFill(ctx, x - 4, y, 8, size * 0.7, 2);
  // Canopy layers
  const greens = ['#2A8A2A', '#3DA83D', '#50C850'];
  greens.forEach((g, i) => {
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y - size * 0.3 - i * size * 0.3, size * (0.7 - i * 0.1), 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawFlowerAt(ctx, x, y, size, color) {
  const petals = 5;
  ctx.fillStyle = color;
  for (let p = 0; p < petals; p++) {
    const angle = (p / petals) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(
      x + Math.cos(angle) * size * 0.8,
      y + Math.sin(angle) * size * 0.8,
      size * 0.55, size * 0.35,
      angle, 0, Math.PI * 2
    );
    ctx.fill();
  }
  ctx.fillStyle = '#FFD93D';
  ctx.beginPath();
  ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawLampAt(ctx, x, y) {
  // Pole
  ctx.fillStyle = '#5A6470';
  ctx.fillRect(x - 2.5, y - 46, 5, 46);
  // Base
  ctx.fillStyle = '#454D58';
  roundRectFill(ctx, x - 6, y - 4, 12, 6, 2);
  // Lantern head
  ctx.fillStyle = '#3A4049';
  roundRectFill(ctx, x - 8, y - 56, 16, 14, 3);
  // Light globe
  ctx.fillStyle = '#FFF3A3';
  ctx.beginPath();
  ctx.arc(x, y - 49, 5, 0, Math.PI * 2);
  ctx.fill();
  // Glow
  const glow = ctx.createRadialGradient(x, y - 49, 2, x, y - 49, 22);
  glow.addColorStop(0, 'rgba(255,243,163,.4)');
  glow.addColorStop(1, 'rgba(255,243,163,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y - 49, 22, 0, Math.PI * 2);
  ctx.fill();
}

function drawBenchAt(ctx, x, y) {
  // Legs
  ctx.fillStyle = '#6E4F2E';
  ctx.fillRect(x - 16, y, 4, 11);
  ctx.fillRect(x + 12, y, 4, 11);
  // Seat
  ctx.fillStyle = '#C49A6A';
  roundRectFill(ctx, x - 20, y - 6, 40, 8, 2);
  // Backrest
  ctx.fillStyle = '#B5895A';
  roundRectFill(ctx, x - 18, y - 18, 36, 5, 2);
}

/* ── City drag ── */
function initCityDrag() {
  const viewport = document.getElementById('city-viewport');
  const map = document.getElementById('city-map');

  // Start centered (show middle of map)
  let offsetX = -300;
  let offsetY = -200;

  applyMapTransform();

  let dragging = false;
  let startX, startY, startOX, startOY;

  viewport.addEventListener('mousedown', e => {
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startOX = offsetX;
    startOY = offsetY;
    viewport.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    offsetX = clampOffset(startOX + dx, viewport.clientWidth, 1400);
    offsetY = clampOffset(startOY + dy, viewport.clientHeight, 1000);
    applyMapTransform();
  });

  window.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    viewport.style.cursor = 'grab';
  });

  // Touch support
  let touchSX, touchSY;
  viewport.addEventListener('touchstart', e => {
    touchSX = e.touches[0].clientX;
    touchSY = e.touches[0].clientY;
    startOX = offsetX;
    startOY = offsetY;
  }, { passive: true });

  viewport.addEventListener('touchmove', e => {
    const dx = e.touches[0].clientX - touchSX;
    const dy = e.touches[0].clientY - touchSY;
    offsetX = clampOffset(startOX + dx, viewport.clientWidth, 1400);
    offsetY = clampOffset(startOY + dy, viewport.clientHeight, 1000);
    applyMapTransform();
  }, { passive: true });

  function applyMapTransform() {
    map.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  }

  function clampOffset(val, viewSize, mapSize) {
    return Math.min(0, Math.max(viewSize - mapSize, val));
  }
}

/* ── Render saved city items ── */
function renderSavedCityItems() {
  const layer = document.getElementById('city-items-layer');
  STATE.cityItems.forEach(item => {
    placeCityItemDOM(item.emoji, item.x, item.y, false);
  });
}

function placeCityItemDOM(emoji, x, y, animate = true) {
  const layer = document.getElementById('city-items-layer');
  const el = document.createElement('div');
  el.className = 'city-item';
  el.textContent = emoji;
  el.style.left = x + 'px';
  el.style.top  = y + 'px';
  if (!animate) el.style.animation = 'none';
  layer.appendChild(el);
}

/* ════════════════════════════════════════════
   CITY PLACEMENT SYSTEM (grid-aware)
   Purchased items fill the 3 empty plots in a
   neat internal grid, one slot at a time, so the
   city grows in an organized, non-overlapping way.
════════════════════════════════════════════ */

// Build an ordered list of slot positions inside the empty plots.
// Each empty plot gets an internal 3×2 grid of slots.
function buildPlacementSlots() {
  const { plots } = getCityPlots();
  const emptyPlots = plots.filter((p, i) => PLOT_PLAN[i] === 'empty');

  const slots = [];
  emptyPlots.forEach(plot => {
    const cols = 3, rows = 2;
    const padX = 46, padY = 56;
    const innerW = plot.w - padX * 2;
    const innerH = plot.h - padY * 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = plot.x + padX + (cols === 1 ? innerW / 2 : (innerW / (cols - 1)) * c);
        const y = plot.y + padY + (rows === 1 ? innerH / 2 : (innerH / (rows - 1)) * r);
        slots.push({ x: Math.round(x), y: Math.round(y) });
      }
    }
  });
  return slots; // 3 plots × 6 = 18 slots
}

// Persisted count of how many slots are already filled
function getPlacedCount() {
  try {
    const db = dbLoad() || {};
    return parseInt(db.placedCount || '0', 10);
  } catch (e) { return 0; }
}
function setPlacedCount(n) {
  try {
    const db = dbLoad() || {};
    db.placedCount = n;
    dbSave(db);
  } catch (e) {}
}

// Get the next free slot position (organized order)
function getNextSlot() {
  const slots = buildPlacementSlots();
  const idx = getPlacedCount() % slots.length;
  setPlacedCount(getPlacedCount() + 1);
  return slots[idx];
}

/* ════════════════════════════════════════════
   SHOP
════════════════════════════════════════════ */
function renderShop() {
  const grid = document.getElementById('shop-grid');
  updateCoinsDisplay();

  grid.innerHTML = SHOP_ITEMS.map(item => `
    <div class="shop-item-card" data-id="${item.id}">
      <div class="shop-item-emoji">${item.emoji}</div>
      <div class="shop-item-name">${item.name}</div>
      <div class="shop-item-desc">${item.desc}</div>
      <div class="shop-item-price">🪙 ${item.price.toLocaleString('ar-SA')}</div>
      <button
        class="shop-buy-btn"
        data-id="${item.id}"
        ${STATE.coins < item.price ? 'disabled' : ''}
      >
        ${STATE.coins >= item.price ? 'شراء الآن' : 'رصيد غير كافٍ'}
      </button>
    </div>
  `).join('');

  grid.querySelectorAll('.shop-buy-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => buyItem(btn.dataset.id));
  });
}

function buyItem(itemId) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item || STATE.coins < item.price) return;

  // Deduct coins
  STATE.coins -= item.price;
  updateCoinsDisplay();

  // ── Place item in next free plot slot (organized grid) ──
  const pos = getNextSlot();

  // Save via persistState
  STATE.cityItems.push({ id: itemId, emoji: item.emoji, x: pos.x, y: pos.y });
  persistState();

  // If city page is open, show item immediately with animation
  if (document.getElementById('page-city').classList.contains('active')) {
    placeCityItemDOM(item.emoji, pos.x, pos.y, true);
  }

  // Refresh the city growth progress indicator
  updateCityProgress();

  showToast(`✅ تم شراء "${item.name}" وإضافته لمدينتك!`, 'green');
  renderShop(); // Refresh buy buttons
}

/* ════════════════════════════════════════════
   MINI CITY PREVIEW (hero)
════════════════════════════════════════════ */
function drawMiniCityPreview() {
  const container = document.getElementById('hero-city-mini');
  if (!container) return;

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 200" width="100%" height="100%">
    <!-- Sky/bg -->
    <defs>
      <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#D4EDFF"/>
        <stop offset="100%" stop-color="#A8D8EA"/>
      </linearGradient>
      <linearGradient id="grassG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#7DC95E"/>
        <stop offset="100%" stop-color="#5CAE40"/>
      </linearGradient>
    </defs>
    <rect width="280" height="200" fill="url(#skyG)"/>
    <!-- Clouds -->
    <ellipse cx="50" cy="30" rx="30" ry="14" fill="white" opacity=".8"/>
    <ellipse cx="70" cy="24" rx="20" ry="12" fill="white" opacity=".8"/>
    <ellipse cx="200" cy="40" rx="26" ry="12" fill="white" opacity=".7"/>
    <ellipse cx="220" cy="33" rx="18" ry="10" fill="white" opacity=".7"/>
    <!-- Ground -->
    <rect x="0" y="130" width="280" height="70" fill="url(#grassG)"/>
    <!-- Road -->
    <rect x="0" y="148" width="280" height="20" fill="#C4B5A0" rx="4"/>
    <line x1="0" y1="158" x2="280" y2="158" stroke="#E8DCC8" stroke-width="2" stroke-dasharray="20,14"/>
    <!-- Buildings -->
    <rect x="30" y="80" width="50" height="70" fill="#F5E6CC" rx="4"/>
    <polygon points="22,80 55,52 83,80" fill="#E05A00"/>
    <rect x="40" y="90" width="12" height="12" fill="#FFF3A3" rx="2"/>
    <rect x="60" y="90" width="12" height="12" fill="#FFF3A3" rx="2"/>
    <rect x="50" y="122" width="14" height="28" fill="#8B6B4A" rx="2"/>

    <rect x="110" y="70" width="60" height="80" fill="#C8E6FF" rx="4"/>
    <polygon points="102,70 140,40 178,70" fill="#2E7ACC"/>
    <rect x="118" y="82" width="12" height="12" fill="#FFF3A3" rx="2"/>
    <rect x="140" y="82" width="12" height="12" fill="#FFF3A3" rx="2"/>
    <rect x="130" y="118" width="16" height="32" fill="#8B6B4A" rx="2"/>

    <rect x="198" y="85" width="50" height="65" fill="#FFD4D4" rx="4"/>
    <polygon points="190,85 223,60 256,85" fill="#CC3333"/>
    <rect x="206" y="95" width="11" height="11" fill="#FFF3A3" rx="2"/>
    <rect x="227" y="95" width="11" height="11" fill="#FFF3A3" rx="2"/>
    <rect x="213" y="122" width="14" height="28" fill="#8B6B4A" rx="2"/>

    <!-- Trees -->
    <rect x="88" y="110" width="5" height="22" fill="#8B6B3A"/>
    <circle cx="90" cy="102" r="14" fill="#3DA83D"/>
    <circle cx="90" cy="94" r="11" fill="#50C850"/>

    <rect x="183" y="112" width="5" height="20" fill="#8B6B3A"/>
    <circle cx="185" cy="104" r="13" fill="#3DA83D"/>
    <circle cx="185" cy="96" r="10" fill="#50C850"/>

    <!-- Flowers -->
    <circle cx="22" cy="135" r="4" fill="#FF9FF3"/>
    <circle cx="32" cy="132" r="3" fill="#FFD93D"/>
    <circle cx="260" cy="133" r="4" fill="#FF6B6B"/>
    <circle cx="270" cy="130" r="3" fill="#FFD93D"/>

    <!-- Lake -->
    <ellipse cx="35" cy="175" rx="28" ry="14" fill="#A8D8EA" opacity=".8"/>
    <ellipse cx="245" cy="178" rx="22" ry="10" fill="#A8D8EA" opacity=".8"/>

    <!-- Sun -->
    <circle cx="248" cy="28" r="18" fill="#FFD93D" opacity=".9"/>
    <line x1="248" y1="4" x2="248" y2="0" stroke="#FFD93D" stroke-width="2"/>
    <line x1="268" y1="8" x2="272" y2="5" stroke="#FFD93D" stroke-width="2"/>
    <line x1="272" y1="28" x2="276" y2="28" stroke="#FFD93D" stroke-width="2"/>
    <line x1="268" y1="48" x2="272" y2="51" stroke="#FFD93D" stroke-width="2"/>

    <!-- Lamp post -->
    <rect x="160" y="122" width="3" height="28" fill="#888"/>
    <circle cx="168" cy="122" r="5" fill="#FFF3A3"/>
  </svg>`;

  container.innerHTML = svg;
}

/* ════════════════════════════════════════════
   TASKS PAGE
════════════════════════════════════════════ */

// Completed task IDs stored in STATE (persisted via persistState)
function getCompletedTasks() {
  return Array.isArray(STATE.tasks) ? STATE.tasks : [];
}
function saveCompletedTasks(arr) {
  STATE.tasks = arr;
  persistState();
}

function initTasksPage() {
  const done = getCompletedTasks();

  // Restore visual state for already-completed tasks
  document.querySelectorAll('.task-item').forEach(item => {
    const id = item.dataset.id;
    if (done.includes(id)) {
      item.classList.add('task-done');
      item.querySelector('.task-check').classList.add('checked');
    }
  });

  updateTasksBadges();
  updateCoinsDisplay();
}

// Called from onclick in HTML
function toggleTask(checkEl) {
  const item   = checkEl.closest('.task-item');
  const id     = item.dataset.id;
  const coins  = parseInt(item.dataset.coins, 10);
  const xp     = parseInt(item.dataset.xp,    10);
  const done   = getCompletedTasks();
  const isDone = done.includes(id);

  if (!isDone) {
    // Mark complete
    item.classList.add('task-done');
    checkEl.classList.add('checked');
    done.push(id);
    saveCompletedTasks(done);

    // Fill progress bar to 100%
    const fill = item.querySelector('.task-progress-fill');
    const lbl  = item.querySelector('.task-progress-lbl');
    if (fill) fill.style.width = '100%';
    if (lbl)  lbl.textContent  = '100%';

    // Award coins + XP
    STATE.coins += coins;
    STATE.xp    += xp;
    persistState();
    updateCoinsDisplay();
    document.getElementById('nav-xp').textContent = STATE.xp.toLocaleString('ar-SA');

    showToast(`🎉 أحسنت! +${coins} 🪙  +${xp} ⚡`, 'green');
  } else {
    // Un-complete
    item.classList.remove('task-done');
    checkEl.classList.remove('checked');
    done.splice(done.indexOf(id), 1);
    saveCompletedTasks(done);

    STATE.coins = Math.max(0, STATE.coins - coins);
    STATE.xp    = Math.max(0, STATE.xp    - xp);
    persistState();
    updateCoinsDisplay();
    document.getElementById('nav-xp').textContent = STATE.xp.toLocaleString('ar-SA');
  }

  updateTasksBadges();
}

function updateTasksBadges() {
  const done = getCompletedTasks();

  const dailyIds   = ['d1','d2','d3'];
  const monthlyIds = ['m1','m2','m3'];
  const yearlyIds  = ['y1','y2','y3'];

  const dDone = dailyIds.filter(id => done.includes(id)).length;
  const mDone = monthlyIds.filter(id => done.includes(id)).length;
  const yDone = yearlyIds.filter(id => done.includes(id)).length;
  const total = dDone + mDone + yDone;

  const db = document.getElementById('daily-badge');
  const mb = document.getElementById('monthly-badge');
  const yb = document.getElementById('yearly-badge');
  const tb = document.getElementById('tasks-done-display');

  if (db) db.textContent = `${dDone} / 3`;
  if (mb) mb.textContent = `${mDone} / 3`;
  if (yb) yb.textContent = `${yDone} / 3`;
  if (tb) tb.textContent = `${total} / 9`;
}

/* ════════════════════════════════════════════
   MY ACCOUNT / PROFILE PAGE
════════════════════════════════════════════ */
const BANK_NAMES = { a:'بنك أ', b:'بنك ب', c:'بنك ج', d:'بنك ح', e:'بنك خ' };

function initProfilePage() {
  const u = STATE.user || {};
  const fmt = n => (n || 0).toLocaleString('ar-SA');
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  // Header
  set('profile-name', u.name || 'مستخدم Finex');
  set('profile-email', u.email || '—');

  // Avatar: use first letter of the name, or default icon
  const avatar = document.getElementById('profile-avatar');
  if (avatar) {
    if (u.picture) {
      avatar.style.backgroundImage = `url(${u.picture})`;
      avatar.style.backgroundSize = 'cover';
      avatar.textContent = '';
    } else if (u.name) {
      avatar.textContent = u.name.trim().charAt(0);
    } else {
      avatar.textContent = '👤';
    }
  }

  // Account info rows
  set('pi-name',   u.name || '—');
  set('pi-email',  u.email || '—');
  set('pi-id',     u.idNo || '—');
  set('pi-bank',   BANK_NAMES[u.bank] || '—');
  set('pi-salary', u.salary ? fmt(u.salary) + ' ر.س' : '—');
  if (u.registeredAt) {
    const d = new Date(u.registeredAt);
    set('pi-joined', d.toLocaleDateString('ar-SA'));
  } else {
    set('pi-joined', '—');
  }

  // Stats
  set('ps-coins', fmt(STATE.coins));
  set('ps-xp',    fmt(STATE.xp));
  set('ps-buildings', fmt(STATE.cityItems.length));
  set('ps-goals', fmt((u.selectedGoals || []).length));
}

// Logout / re-register button
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('profile-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      STATE.user = null;
      persistState();
      // Reload to show the registration overlay again
      window.location.href = window.location.pathname;
    });
  }
});

/* ════════════════════════════════════════════
   INIT
════════════════════════════════════════════ */
function init() {
  // Onboarding runs first. It shows the registration overlay on first
  // launch, or hides it instantly if the user is already registered.
  initOnboarding();

  updateCoinsDisplay();
  drawMiniCityPreview();

  // Always land on Home as the base page. When the user is not yet
  // registered, the full-screen onboarding overlay covers Home until
  // they finish signing up — then it fades out, revealing Home.
  navigate('home');
}

document.addEventListener('DOMContentLoaded', init);
