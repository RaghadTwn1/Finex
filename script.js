/* ════════════════════════════════════════════
   FINEX – script.js
   Gamified Arabic Financial Management App
════════════════════════════════════════════ */

'use strict';

/* ───────────────────────────────────────────
   STATE
─────────────────────────────────────────── */
const STATE = {
  coins: 2450,
  cityItems: JSON.parse(localStorage.getItem('finex_city_items') || '[]'),
};

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
  if (pageId === 'city') initCity();
  if (pageId === 'analysis') initCharts();
  if (pageId === 'shop') renderShop();

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
   CITY – CANVAS DRAWING
════════════════════════════════════════════ */
let cityInited = false;

function initCity() {
  if (cityInited) {
    // Still refresh coins display
    updateCoinsDisplay();
    return;
  }
  cityInited = true;

  const canvas = document.getElementById('city-canvas');
  const ctx = canvas.getContext('2d');
  drawCity(ctx, canvas.width, canvas.height);
  renderSavedCityItems();
  initCityDrag();
  updateCoinsDisplay();
}

/* ── Main city drawing ── */
function drawCity(ctx, W, H) {

  /* ── 1. Grass base ── */
  const grassGrad = ctx.createLinearGradient(0, 0, W, H);
  grassGrad.addColorStop(0, '#7DC95E');
  grassGrad.addColorStop(.4, '#6BBF52');
  grassGrad.addColorStop(1, '#5CAE40');
  ctx.fillStyle = grassGrad;
  ctx.fillRect(0, 0, W, H);

  /* ── 2. Grass texture patches ── */
  const grassPatches = [
    [100,100],[400,80],[750,60],[1100,90],[1450,70],
    [200,350],[600,320],[950,300],[1300,340],[1500,310],
    [150,600],[500,580],[900,560],[1250,590],[1520,570],
    [100,850],[450,820],[800,840],[1150,810],[1480,830],
    [300,1050],[700,1020],[1050,1060],[1400,1030],
  ];
  grassPatches.forEach(([px, py]) => {
    ctx.fillStyle = 'rgba(255,255,255,.06)';
    ctx.beginPath();
    ctx.ellipse(px, py, 70, 40, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  /* ── 3. Lake ── */
  drawLake(ctx, 1100, 820, 200, 120);

  /* ── 4. Park / green zones ── */
  drawPark(ctx, 60, 880, 220, 160);
  drawPark(ctx, 1340, 60, 180, 130);

  /* ── 5. Roads ── */
  drawRoads(ctx, W, H);

  /* ── 6. Buildings, trees, decorations ── */
  drawBuildings(ctx);
  drawTrees(ctx);
  drawFlowers(ctx);
  drawLamps(ctx);
  drawBenches(ctx);
  drawFences(ctx);

  /* ── 7. Empty lot markers ── */
  drawEmptyLots(ctx);
}

/* ── Lake ── */
function drawLake(ctx, cx, cy, rx, ry) {
  // Water
  const lakeGrad = ctx.createRadialGradient(cx - 30, cy - 30, 10, cx, cy, rx);
  lakeGrad.addColorStop(0, '#A8D8EA');
  lakeGrad.addColorStop(.6, '#62B8D4');
  lakeGrad.addColorStop(1, '#4A9AB8');
  ctx.fillStyle = lakeGrad;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shimmer
  ctx.strokeStyle = 'rgba(255,255,255,.4)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.ellipse(cx - 20 + i * 10, cy - 20 + i * 8, 18 - i * 2, 5, -0.3, 0, Math.PI * 1.5);
    ctx.stroke();
  }

  // Border
  ctx.strokeStyle = '#4A9AB8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx + 6, ry + 6, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Lily pad
  ctx.fillStyle = '#3DB87A';
  ctx.beginPath();
  ctx.arc(cx + 40, cy + 20, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FF6B9D';
  ctx.beginPath();
  ctx.arc(cx + 40, cy + 20, 5, 0, Math.PI * 2);
  ctx.fill();
}

/* ── Park ── */
function drawPark(ctx, x, y, w, h) {
  ctx.fillStyle = '#5BAE3C';
  roundRectFill(ctx, x, y, w, h, 18);

  // Internal paths
  ctx.strokeStyle = '#4A9A2C';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y + h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y + h / 2);
  ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Park flowers
  const parkFlowers = [
    [x + 40, y + 40], [x + w - 40, y + 40],
    [x + 40, y + h - 40], [x + w - 40, y + h - 40],
    [x + w / 2, y + h / 2],
  ];
  parkFlowers.forEach(([fx, fy]) => {
    drawFlowerAt(ctx, fx, fy, 10, '#FF9FF3');
  });
}

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

/* ── Roads ── */
function drawRoads(ctx, W, H) {
  // Road base colour
  ctx.strokeStyle = '#C4B5A0';
  ctx.lineWidth = 52;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Main horizontal road
  ctx.beginPath();
  ctx.moveTo(0, 500);
  ctx.bezierCurveTo(300, 480, 600, 520, W, 490);
  ctx.stroke();

  // Main vertical road (from top-centre curving right)
  ctx.beginPath();
  ctx.moveTo(650, 0);
  ctx.bezierCurveTo(680, 200, 700, 400, 720, 500);
  ctx.bezierCurveTo(740, 620, 760, 750, 800, H);
  ctx.stroke();

  // Secondary diagonal road
  ctx.lineWidth = 40;
  ctx.beginPath();
  ctx.moveTo(0, 900);
  ctx.bezierCurveTo(200, 880, 400, 860, 650, 880);
  ctx.stroke();

  // Short connector
  ctx.beginPath();
  ctx.moveTo(650, 880);
  ctx.bezierCurveTo(680, 870, 710, 800, 720, 500);
  ctx.stroke();

  // Top horizontal
  ctx.lineWidth = 36;
  ctx.beginPath();
  ctx.moveTo(0, 200);
  ctx.bezierCurveTo(200, 195, 400, 205, 650, 200);
  ctx.stroke();

  /* Road markings */
  ctx.strokeStyle = '#E8DCC8';
  ctx.lineWidth = 3;
  ctx.setLineDash([28, 22]);
  ctx.lineCap = 'butt';

  // Dashes on main horiz
  ctx.beginPath();
  ctx.moveTo(0, 500);
  ctx.bezierCurveTo(300, 480, 600, 520, W, 490);
  ctx.stroke();

  // Dashes on vertical
  ctx.beginPath();
  ctx.moveTo(650, 0);
  ctx.bezierCurveTo(680, 200, 700, 400, 720, 500);
  ctx.bezierCurveTo(740, 620, 760, 750, 800, H);
  ctx.stroke();

  ctx.setLineDash([]);

  /* Roundabout at intersection */
  ctx.fillStyle = '#B8A898';
  ctx.beginPath();
  ctx.arc(720, 490, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5BAE3C';
  ctx.beginPath();
  ctx.arc(720, 490, 26, 0, Math.PI * 2);
  ctx.fill();
  // Roundabout flower
  drawFlowerAt(ctx, 720, 490, 12, '#FF6B9D');

  /* Sidewalks */
  ctx.strokeStyle = '#D8CCBC';
  ctx.lineWidth = 10;
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.moveTo(0, 468);
  ctx.bezierCurveTo(300, 448, 600, 488, W, 458);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, 532);
  ctx.bezierCurveTo(300, 512, 600, 552, W, 522);
  ctx.stroke();
}

/* ── Buildings ── */
function drawBuildings(ctx) {
  const buildings = [
    // x, y, w, h, color, roofColor, windows
    [80,  80,  90, 110, '#F5E6CC', '#E05A00', 3],
    [200, 100, 70,  90, '#FCCF8A', '#C44000', 2],
    [300, 70, 100, 130, '#C8E6FF', '#2E7ACC', 3],
    [430, 90,  80, 100, '#FFD4D4', '#CC3333', 2],
    [550, 80,  90, 110, '#D4FFD4', '#228B22', 3],

    [80,  560,  90, 100, '#FDEEC8', '#D4862A', 2],
    [210, 550,  80,  90, '#E8D8F8', '#7B3ACC', 2],
    [330, 565, 100, 120, '#FFE8E8', '#CC4444', 3],
    [480, 555,  75,  85, '#D8F4D8', '#2A8A2A', 2],

    [830, 80,   90, 110, '#FFF0CC', '#C48A00', 3],
    [960, 70,  100, 130, '#D0E8FF', '#1A6ABF', 3],
    [1100,90,   80, 100, '#FFE0E0', '#BB3333', 2],
    [1230,80,   90, 110, '#E0FFE0', '#2A7A2A', 3],
    [1370,100,  70,  90, '#FFD8F0', '#BB4499', 2],
    [1490,80,   80, 100, '#E8E0FF', '#6644AA', 2],

    [830, 560,  85, 105, '#FFF8E0', '#BB8800', 2],
    [960, 550,  90, 115, '#E0F0FF', '#2255BB', 3],
    [1100,565,  80,  90, '#FFE8F0', '#AA3355', 2],
    [1480,555,  80, 100, '#E8FFE8', '#228844', 2],

    [100, 960,  90, 110, '#FFEEDD', '#CC6600', 2],
    [240, 950,  80,  95, '#E0E8FF', '#3344CC', 2],
    [380, 965, 100, 120, '#FFE0F0', '#CC3388', 3],
    [960, 960, 100, 115, '#E0FFF0', '#228855', 3],
    [1100,950,  80,  95, '#FFF0E0', '#BB7700', 2],
    [1240,965,  90, 110, '#F0E0FF', '#7733BB', 2],
  ];

  buildings.forEach(([bx, by, bw, bh, wall, roof, wins]) => {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,.08)';
    roundRectFill(ctx, bx + 6, by + 6, bw, bh, 6);

    // Wall
    ctx.fillStyle = wall;
    roundRectFill(ctx, bx, by, bw, bh, 6);

    // Roof (triangle)
    ctx.fillStyle = roof;
    ctx.beginPath();
    ctx.moveTo(bx - 8, by);
    ctx.lineTo(bx + bw / 2, by - 28);
    ctx.lineTo(bx + bw + 8, by);
    ctx.closePath();
    ctx.fill();

    // Door
    ctx.fillStyle = '#8B6B4A';
    roundRectFill(ctx, bx + bw / 2 - 10, by + bh - 28, 20, 28, 4);

    // Windows
    const wCols = Math.min(wins, 3);
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < wCols; col++) {
        const wx = bx + 12 + col * ((bw - 24) / (wCols));
        const wy = by + 15 + row * 32;
        ctx.fillStyle = 'rgba(255,240,180,.9)';
        roundRectFill(ctx, wx, wy, 14, 14, 3);
        ctx.strokeStyle = '#8B6B4A';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(wx, wy, 14, 14);
      }
    }
  });
}

/* ── Trees ── */
function drawTrees(ctx) {
  const treePos = [
    [160,240],[240,250],[380,260],[500,245],[570,255],
    [780,140],[860,170],[940,155],[1020,165],[1150,140],
    [1260,170],[1400,155],[1530,145],
    [130,420],[280,400],[460,415],[560,405],
    [40,750],[160,780],[280,760],[350,740],
    [920,720],[1000,700],[1150,730],[1270,710],[1410,720],[1540,740],
    [40,1040],[200,1060],[480,1050],[600,1100],[740,1080],
    [1000,1050],[1180,1080],[1400,1060],[1560,1040],
    [860,290],[880,380],[860,600],[880,700],
  ];

  treePos.forEach(([tx, ty]) => {
    drawTreeAt(ctx, tx, ty, 22 + Math.random() * 12);
  });
}

function drawTreeAt(ctx, x, y, size) {
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

/* ── Flowers ── */
function drawFlowers(ctx) {
  const flowerSpots = [
    [170,290],[200,280],[230,300],
    [390,310],[420,295],[450,315],
    [790,190],[820,175],[850,200],
    [1160,190],[1190,175],[1220,200],
    [30,460],[60,450],[90,475],
    [600,450],[630,435],[660,455],
    [1000,750],[1030,735],[1060,755],
    [200,1010],[230,995],[260,1015],
    [520,1100],[550,1085],[580,1105],
  ];

  const colors = ['#FF9FF3','#FF6B6B','#FFD93D','#FF8C42','#A8FF78','#79E7FF'];
  flowerSpots.forEach(([fx, fy], i) => {
    drawFlowerAt(ctx, fx, fy, 7 + Math.random() * 4, colors[i % colors.length]);
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

/* ── Street lamps ── */
function drawLamps(ctx) {
  const lampPos = [
    [100,450],[250,460],[400,445],[550,455],
    [730,250],[730,380],[730,620],[730,740],
    [900,450],[1050,455],[1200,445],[1380,450],
  ];

  lampPos.forEach(([lx, ly]) => {
    drawLampAt(ctx, lx, ly);
  });
}

function drawLampAt(ctx, x, y) {
  // Pole
  ctx.fillStyle = '#888888';
  ctx.fillRect(x - 2, y - 40, 4, 40);

  // Arm
  ctx.beginPath();
  ctx.strokeStyle = '#888888';
  ctx.lineWidth = 3;
  ctx.moveTo(x, y - 40);
  ctx.quadraticCurveTo(x + 12, y - 50, x + 20, y - 44);
  ctx.stroke();

  // Light globe
  ctx.fillStyle = '#FFF3A3';
  ctx.beginPath();
  ctx.arc(x + 20, y - 44, 7, 0, Math.PI * 2);
  ctx.fill();

  // Glow
  const glow = ctx.createRadialGradient(x + 20, y - 44, 2, x + 20, y - 44, 20);
  glow.addColorStop(0, 'rgba(255,243,163,.4)');
  glow.addColorStop(1, 'rgba(255,243,163,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x + 20, y - 44, 20, 0, Math.PI * 2);
  ctx.fill();
}

/* ── Benches ── */
function drawBenches(ctx) {
  const benchPos = [
    [170,470],[320,458],[490,468],
    [770,320],[770,680],
    [1000,465],[1200,460],
  ];

  benchPos.forEach(([bx, by]) => {
    drawBenchAt(ctx, bx, by);
  });
}

function drawBenchAt(ctx, x, y) {
  // Legs
  ctx.fillStyle = '#8B6B3A';
  ctx.fillRect(x - 16, y, 4, 10);
  ctx.fillRect(x + 12, y, 4, 10);

  // Seat
  ctx.fillStyle = '#C49A6A';
  roundRectFill(ctx, x - 20, y - 6, 40, 8, 2);

  // Backrest
  ctx.fillStyle = '#C49A6A';
  roundRectFill(ctx, x - 18, y - 18, 36, 5, 2);
}

/* ── Fences ── */
function drawFences(ctx) {
  // Fence segments along roads
  const fenceSegments = [
    { x: 50, y: 440, length: 600, dir: 'h' },
    { x: 700, y: 50, length: 400, dir: 'v' },
    { x: 50, y: 880, length: 560, dir: 'h' },
  ];

  fenceSegments.forEach(seg => {
    const posts = Math.floor(seg.length / 30);
    for (let p = 0; p < posts; p++) {
      const fx = seg.dir === 'h' ? seg.x + p * 30 : seg.x;
      const fy = seg.dir === 'v' ? seg.y + p * 30 : seg.y;

      // Post
      ctx.fillStyle = '#D4A96A';
      ctx.fillRect(fx - 2, fy - 18, 4, 22);

      // Rail (between posts)
      if (p < posts - 1) {
        ctx.fillStyle = '#C49A5A';
        if (seg.dir === 'h') {
          ctx.fillRect(fx + 2, fy - 14, 26, 3);
          ctx.fillRect(fx + 2, fy - 7, 26, 3);
        } else {
          ctx.fillRect(fx - 14, fy + 2, 3, 26);
          ctx.fillRect(fx - 7,  fy + 2, 3, 26);
        }
      }
    }
  });
}

/* ── Empty lots ── */
function drawEmptyLots(ctx) {
  const lots = [
    [900, 100, 140, 90, 'قطعة أرض فارغة'],
    [1350, 240, 120, 80, 'موقع مستقبلي'],
    [150, 620, 120, 80, 'موقع مستقبلي'],
    [1350, 620, 120, 80, 'قطعة أرض فارغة'],
    [600, 960, 140, 90, 'موقع مستقبلي'],
  ];

  lots.forEach(([lx, ly, lw, lh, label]) => {
    // Dashed border
    ctx.strokeStyle = '#A8C890';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(lx, ly, lw, lh);
    ctx.setLineDash([]);

    // Light fill
    ctx.fillStyle = 'rgba(168,200,144,.2)';
    ctx.fillRect(lx, ly, lw, lh);

    // Plus icon
    ctx.fillStyle = '#A8C890';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', lx + lw / 2, ly + lh / 2 - 10);

    // Label
    ctx.font = '11px Cairo, sans-serif';
    ctx.fillStyle = '#7A9870';
    ctx.fillText(label, lx + lw / 2, ly + lh / 2 + 12);
  });
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
    offsetX = clampOffset(startOX + dx, viewport.clientWidth, 1600);
    offsetY = clampOffset(startOY + dy, viewport.clientHeight, 1200);
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
    offsetX = clampOffset(startOX + dx, viewport.clientWidth, 1600);
    offsetY = clampOffset(startOY + dy, viewport.clientHeight, 1200);
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
  el.style.right = x + 'px';
  el.style.top = y + 'px';
  if (!animate) el.style.animation = 'none';
  layer.appendChild(el);
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

  // Place in city at random position (on grass / off roads)
  const positions = [
    [120, 130], [300, 120], [480, 130], [900, 120], [1060, 130],
    [1280, 120], [1440, 130], [120, 590], [300, 580], [500, 595],
    [900, 590], [1050, 580], [1300, 590], [1480, 580],
    [120, 1000], [300, 980], [500, 1000], [700, 1050],
    [1020, 1000], [1180, 980], [1400, 990], [1550, 1010],
  ];

  const pos = positions[Math.floor(Math.random() * positions.length)];
  const jitter = [
    pos[0] + Math.floor(Math.random() * 40 - 20),
    pos[1] + Math.floor(Math.random() * 40 - 20),
  ];

  // Save
  STATE.cityItems.push({ id: itemId, emoji: item.emoji, x: jitter[0], y: jitter[1] });
  localStorage.setItem('finex_city_items', JSON.stringify(STATE.cityItems));

  // If city is visible, place it immediately
  if (document.getElementById('page-city').classList.contains('active')) {
    placeCityItemDOM(item.emoji, jitter[0], jitter[1], true);
  }

  showToast(`✅ تم شراء "${item.name}" وإضافته لمدينتك!`, 'green');
  renderShop(); // Refresh buttons
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
   INIT
════════════════════════════════════════════ */
function init() {
  updateCoinsDisplay();
  drawMiniCityPreview();

  // Start on home
  navigate('home');
}

document.addEventListener('DOMContentLoaded', init);
