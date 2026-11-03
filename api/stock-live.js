export const config = {
  runtime: 'edge',
  regions: ['sin1'],
};

export default async function handler(req) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 's-maxage=10, stale-while-revalidate=20'
  };

  try {
    const urlObj = new URL(req.url);
    const ticker = (urlObj.searchParams.get('ticker') || 'HDB').toUpperCase();

    // 1. Primary Source: VPS Real-time Data Feed (100% accurate live board with exact Ref, Last, Change)
    try {
      const vpsResp = await fetch(`https://bgapidatafeed.vps.com.vn/getliststockdata/${ticker}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (vpsResp.ok) {
        const vpsData = await vpsResp.json();
        if (vpsData && vpsData.length > 0) {
          const item = vpsData[0];
          const lastPrice = Math.round(parseFloat(item.lastPrice || 0) * 1000);
          const refPrice = Math.round(parseFloat(item.r || 0) * 1000);
          const ceiling = Math.round(parseFloat(item.c || 0) * 1000);
          const floor = Math.round(parseFloat(item.f || 0) * 1000);
          const change = Math.round(parseFloat(item.ot || 0) * 1000);
          const changePct = parseFloat(item.changePc || 0);
          const high = Math.round(parseFloat(item.highPrice || 0) * 1000);
          const low = Math.round(parseFloat(item.lowPrice || 0) * 1000);
          const volume = parseFloat(item.lot || 0);

          if (lastPrice > 0 || refPrice > 0) {
            return new Response(JSON.stringify({
              success: true,
              source: 'vps',
              ticker: ticker,
              currentPrice: lastPrice > 0 ? lastPrice : refPrice,
              refPrice: refPrice,
              ceiling: ceiling,
              floor: floor,
              priceChange: change,
              priceChangePct: changePct,
              totalVolume: volume,
              high: high,
              low: low,
              time: new Date().toISOString()
            }), { status: 200, headers });
          }
        }
      }
    } catch (vpsErr) {
      console.warn("VPS fallback to Vietcap:", vpsErr);
    }

    // 2. Secondary Fallback Source: Vietcap LEData
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

    if (vciResp.ok) {
      const data = await vciResp.json();
      if (data && data.length > 0) {
        const item = data[0];
        const matchPrice = parseFloat(item.matchPrice || 0);
        const finalPrice = matchPrice > 1000 ? matchPrice : matchPrice * 1000;

        return new Response(JSON.stringify({
          success: true,
          source: 'vietcap',
          ticker: ticker,
          currentPrice: finalPrice,
          volume: parseFloat(item.matchVol || 0),
          accumulatedVolume: parseFloat(item.accumulatedVolume || 0),
          matchType: item.matchType,
          time: item.createdAt || new Date().toISOString()
        }), { status: 200, headers });
      }
    }

    return new Response(JSON.stringify({
      success: false,
      message: `No live trade data found for ${ticker}`
    }), { status: 404, headers });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), { status: 500, headers });
  }
}
