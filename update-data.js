const fs = require('fs');
const fetch = require('node-fetch');
const path = './data.csv';

(async () => {
  const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
  const data = await response.json();
  const btcPrice = data.bitcoin.usd;

  let rows = fs.readFileSync(path, 'utf-8').split('\n').filter(row => row.trim() !== '');
  const headers = rows[0].split(',');
  const btcIndex = headers.indexOf('btc_actual');
  const maIndex = headers.indexOf('moving_average');

  let updated = false;

  // write to yesterday's row (index shift -1)
  for (let i = 2; i < rows.length; i++) {
    let prevRow = rows[i - 1].split(',');
    if (prevRow[btcIndex] === '') {
      prevRow[btcIndex] = btcPrice.toString();

      // compute MA over previous 30 btc_actual values (ending at prevRow-1)
      const btc_values = [];
      for (let j = Math.max(1, i - 31); j < i - 1; j++) {
        const val = parseFloat(rows[j].split(',')[btcIndex]);
        if (!isNaN(val)) btc_values.push(val);
      }
      const avg = btc_values.length > 0 ? btc_values.reduce((a, b) => a + b) / btc_values.length : '';
      prevRow[maIndex] = avg ? avg.toFixed(2) : '';

      rows[i - 1] = prevRow.join(',');
      updated = true;
      break;
    }
  }

  if (updated) {
    fs.writeFileSync(path, rows.join('\n'), 'utf-8');
    console.log('✅ Updated yesterday: btc_actual + moving_average');
  } else {
    console.log('⚠️ Nothing to update.');
  }
})();