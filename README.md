# BTC Forecasts (Professional Minimalist)

This repo hosts a static site (Netlify-ready) that renders BTC forecasts, forecast average,
daily actuals, and a 30-day moving average with **Chart.js**. Access to months is gated by
plan: **Free / Pro1 / Pro2**.

## Plans
- **Free** — current month
- **Pro1** — current + 1 month
- **Pro2** — current + 2 months

In this prototype, plans are mocked:
- by URL: `?plan=pro1` / `?plan=pro2`
- or derived from wallet address (last hex digit)

## Files
- `index.html` — page
- `style.css` — design (Menlo, dark minimalist)
- `script.js` — chart + gating
- `wallet.js` — connect wallet + mock plan
- `data.csv` — data source
- `update-data.js` — Node script to append btc_actual and moving_average for **yesterday**
- `netlify.toml` — static hosting config
- `.github/workflows/update.yml` — optional GitHub Action to run `update-data.js` daily
- `package.json` — to install `node-fetch@2` for the update script

## Deploy
Push to GitHub → connect repo to Netlify → deploy.

## Data format
`data.csv` headers:
```
date,forecast1,forecast2,forecast3,forecast_avg,btc_actual,moving_average
```
- First **30 rows**: only `btc_actual` (seed MA), no forecasts.
- Row 31+ : forecasts + `forecast_avg`. `btc_actual` and `moving_average` are filled daily by `update-data.js`.

## Run daily updater locally
```
npm install
npm run update
```
Or rely on the included GitHub Action (runs at 00:10 UTC).

## Notes
- Chart colors: btc_actual `#f7931a`, moving_average `#00c69e`, forecast_avg `#0000ff`, forecasts palette provided.
- X axis shows only several ticks per month; Y axis is raw numbers (no commas).
- Canvas and page background `#3e3e3e`.
