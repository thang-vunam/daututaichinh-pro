export const config = {
  runtime: 'edge',
  regions: ['sin1'],
};

export default async function handler(req) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 's-maxage=15, stale-while-revalidate=30'
  };

  try {
    const urlObj = new URL(req.url);
    const ticker = (urlObj.searchParams.get('ticker') || 'HDB').toUpperCase();

    const vciResp = await fetch('https://trading.vietcap.com.vn/api/market-watch/LEData/getAll', {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        symbol: ticker,
        limit: 1
      })
    });

    if (!vciResp.ok) {
      throw new Error(`Vietcap HTTP ${vciResp.status}`);
    }

    const data = await vciResp.json();
    if (!data || data.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: `No live trade data found for ${ticker}`
      }), { status: 404, headers });
    }

    const item = data[0];
    const matchPrice = parseFloat(item.matchPrice || 0);
    const finalPrice = matchPrice > 1000 ? matchPrice : matchPrice * 1000;

    return new Response(JSON.stringify({
      success: true,
      ticker: ticker,
      currentPrice: finalPrice,
      volume: parseFloat(item.matchVol || 0),
      accumulatedVolume: parseFloat(item.accumulatedVolume || 0),
      matchType: item.matchType,
      time: item.createdAt || new Date().toISOString()
    }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), { status: 500, headers });
  }
}
