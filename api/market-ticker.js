export const config = {
  runtime: 'edge',
  regions: ['sin1'],
};

const FALLBACK_ITEMS = [
  { icon: '💧', name: 'Dầu thô (WTI)', val: '100.83', change: '▼ 0.91%', isUp: false },
  { icon: '🪙', name: 'Vàng', val: '4,025.40', change: '▼ 0.32%', isUp: false },
  { icon: '₿', name: 'Bitcoin', val: '79,786.02', change: '▼ 0.45%', isUp: false },
  { icon: '🇻🇳', name: 'VNINDEX', val: '1,763.56', change: '▲ 0.00%', isUp: true },
  { icon: '🇻🇳', name: 'VN30', val: '1,889.17', change: '▼ 0.02%', isUp: false },
  { icon: '🇺🇸', name: 'Dow Jones', val: '52,361.58', change: '▲ 0.28%', isUp: true },
  { icon: '🇺🇸', name: 'S&P 500', val: '7,676.77', change: '▲ 0.70%', isUp: true },
  { icon: '💵', name: 'USD/VND', val: '25,841', change: '▲ 0.00%', isUp: true }
];

function formatNumber(val, decimals = 2) {
  if (val === null || val === undefined || isNaN(val)) return '--';
  return Number(val).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export default async function handler(req) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 's-maxage=60, stale-while-revalidate=120'
  };

  try {
    const resp = await fetch('https://api.simplize.vn/api/company/se/market', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://simplize.vn/'
      }
    });

    if (!resp.ok) {
      throw new Error(`Simplize API HTTP ${resp.status}`);
    }

    const raw = await resp.json();
    const list = raw && raw.data ? raw.data : [];
    const map = {};
    for (const item of list) {
      if (item && item.ticker) {
        map[item.ticker] = item;
      }
    }

    const targets = [
      { ticker: 'CL=F', icon: '💧', name: 'Dầu thô (WTI)', decimals: 2 },
      { ticker: 'GC=F', icon: '🪙', name: 'Vàng', decimals: 2 },
      { ticker: 'BTCUSDT', icon: '₿', name: 'Bitcoin', decimals: 2 },
      { ticker: 'VNINDEX', icon: '🇻🇳', name: 'VNINDEX', decimals: 2 },
      { ticker: 'VN30', icon: '🇻🇳', name: 'VN30', decimals: 2 },
      { ticker: '^DJI', icon: '🇺🇸', name: 'Dow Jones', decimals: 2 },
      { ticker: '^GSPC', icon: '🇺🇸', name: 'S&P 500', decimals: 2 },
      { ticker: 'FXIDC:USDVND', icon: '💵', name: 'USD/VND', decimals: 0 }
    ];

    const items = targets.map(target => {
      const found = map[target.ticker];
      if (!found) {
        return FALLBACK_ITEMS.find(f => f.name === target.name) || {
          icon: target.icon,
          name: target.name,
          val: '--',
          change: '0.00%',
          isUp: true
        };
      }

      const closeVal = found.indexClose !== undefined ? found.indexClose : found.close;
      const pct = found.pctChange !== undefined ? found.pctChange : 0;
      const isUp = pct >= 0;
      const arrow = isUp ? '▲' : '▼';
      const absPct = Math.abs(pct).toFixed(2);

      return {
        icon: target.icon,
        name: target.name,
        val: formatNumber(closeVal, target.decimals),
        change: `${arrow} ${absPct}%`,
        isUp: isUp
      };
    });

    return new Response(JSON.stringify({
      success: true,
      updatedAt: new Date().toISOString(),
      items
    }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({
      success: true,
      fallback: true,
      updatedAt: new Date().toISOString(),
      items: FALLBACK_ITEMS
    }), { status: 200, headers });
  }
}
