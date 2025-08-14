// Chart + plan-gated data display
const COLORS = {
  btc: '#f7931a',
  ma: '#00c69e',
  avg: '#0000ff',
  forecasts: ['#ff8000','#ffff00','#80ff00','#00ff00','#00ff80','#00ffff','#0080ff','#8000ff','#ff00ff','#ff0080']
};

let chart;
let rawRows = [];
let header = [];

async function loadCSV() {
  const res = await fetch('data.csv', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load data.csv');
  const text = await res.text();
  const lines = text.trim().split('\n');
  header = lines[0].split(',').map(s=>s.trim());
  const rows = lines.slice(1).map(line => {
    const parts = line.split(',');
    const obj = {};
    header.forEach((h, i) => obj[h] = (parts[i] ?? '').trim());
    return obj;
  });
  rawRows = rows;
}

function monthsAllowed(plan) {
  if (plan === 'pro2') return 3;
  if (plan === 'pro1') return 2;
  return 1;
}

function ymKey(d){ return d.getFullYear()*12 + d.getMonth(); }

function filterRowsByPlan(rows, plan) {
  const limit = monthsAllowed(plan);
  const now = new Date();
  const startYm = ymKey(new Date(now.getFullYear(), now.getMonth(), 1));
  const maxYm = startYm + (limit - 1);

  return rows.filter(r => {
    const d = new Date(r.date);
    if (isNaN(d)) return false;
    const ymk = ymKey(d);
    if (ymk < startYm || ymk > maxYm) return false;
    // skip early bootstrap-only rows (no forecasts)
    const hasForecasts = header.some(h => /^forecast\d+$/i.test(h) && r[h]);
    const hasAvg = r['forecast_avg'];
    return hasForecasts || hasAvg || r['btc_actual'] || r['moving_average'];
  });
}

function buildDatasets(rows) {
  const labels = rows.map(r => r.date);
  const forecastCols = header.filter(h => /^forecast\d+$/i.test(h));
  const datasets = [];

  forecastCols.forEach((col, i) => {
    const color = COLORS.forecasts[i % COLORS.forecasts.length];
    datasets.push({
      label: col,
      data: rows.map(r => r[col] ? Number(r[col]) : null),
      borderColor: color,
      backgroundColor: 'transparent',
      borderWidth: 2,
      pointRadius: 0,
      spanGaps: true,
      tension: 0.2
    });
  });

  datasets.push({
    label: 'forecast_avg',
    data: rows.map(r => r['forecast_avg'] ? Number(r['forecast_avg']) : null),
    borderColor: COLORS.avg,
    backgroundColor: 'transparent',
    borderWidth: 2.2,
    pointRadius: 0,
    spanGaps: true,
    borderDash: [6,4],
    tension: 0.15
  });

  datasets.push({
    label: 'btc_actual',
    data: rows.map(r => r['btc_actual'] ? Number(r['btc_actual']) : null),
    borderColor: COLORS.btc,
    backgroundColor: 'transparent',
    borderWidth: 2.2,
    pointRadius: labels.map((_, idx, arr) => idx === arr.length-1 ? 3 : 0),
    spanGaps: true,
    tension: 0.1
  });

  datasets.push({
    label: 'moving_average',
    data: rows.map(r => r['moving_average'] ? Number(r['moving_average']) : null),
    borderColor: COLORS.ma,
    backgroundColor: 'transparent',
    borderWidth: 2,
    pointRadius: 0,
    spanGaps: true,
    tension: 0.1
  });

  return { labels, datasets };
}

function yTickFormatter(v){ return String(Math.round(v)); }

function xTicksByMonth(labels) {
  const map = new Map();
  labels.forEach((d, i) => {
    const k = d.slice(0,7);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(i);
  });
  const keep = new Set();
  for (const [_, idxs] of map) {
    const step = Math.max(1, Math.floor(idxs.length/4));
    for (let i=0; i<idxs.length; i+=step) keep.add(idxs[i]);
    keep.add(idxs[idxs.length-1]);
  }
  return keep;
}

function renderChart(rows, plan){
  const { labels, datasets } = buildDatasets(rows);
  const ctx = document.getElementById('chart').getContext('2d');
  if (chart) chart.destroy();

  const keep = xTicksByMonth(labels);
  chart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: '#fff', boxWidth: 18, boxHeight: 2, usePointStyle: false }
        },
        tooltip: {
          callbacks: {
            label: (ctx)=> `${ctx.dataset.label}: ${Math.round(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#ddd',
            callback: (val, idx) => keep.has(idx) ? labels[idx] : '',
            maxRotation: 0, autoSkip: false
          },
          grid: { color: 'rgba(255,255,255,0.06)' }
        },
        y: {
          ticks: { color: '#ddd', callback: yTickFormatter },
          grid: { color: 'rgba(255,255,255,0.06)' }
        }
      }
    }
  });

  const months = monthsAllowed(plan);
  document.getElementById('notice').textContent =
    `Your plan (${plan.toUpperCase()}) shows ${months} month${months>1?'s':''} starting from current month.`;
}

async function bootstrap(){
  try{
    await loadCSV();
    const { plan } = (window.currentSession?.() || { plan:'free' });
    const filtered = filterRowsByPlan(rawRows, plan || 'free');
    renderChart(filtered, plan || 'free');
  }catch(e){
    console.error(e);
    document.getElementById('notice').textContent = 'Failed to load data.';
  }
}

document.addEventListener('wallet-changed', (ev)=>{
  const plan = ev.detail?.plan || 'free';
  const filtered = filterRowsByPlan(rawRows, plan);
  renderChart(filtered, plan);
});

window.addEventListener('DOMContentLoaded', bootstrap);
