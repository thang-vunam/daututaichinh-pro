import { FIREANT_FULL_SECTORS } from './_sectors_data.js';

export const config = {
  runtime: 'edge',
  regions: ['sin1'],
};

// Danh sách toàn bộ các mã cổ phiếu thành phần cần kéo giá Realtime
const ALL_TICKERS = [
  'ACB', 'ACV', 'ADG', 'ANV', 'BFC', 'BHN', 'BID', 'BMI', 'BMP', 'BSR', 
  'BVH', 'BWE', 'CAR', 'CC1', 'CII', 'CLC', 'CMG', 'CNG', 'CRE', 'CSM', 
  'CSV', 'CTD', 'CTG', 'CTR', 'DAH', 'DCL', 'DCM', 'DGC', 'DGW', 'DHG', 
  'DHP', 'DIG', 'DPM', 'DRC', 'DXG', 'DXS', 'EID', 'ELC', 'FIT', 'FOX', 
  'FPT', 'FRT', 'GAS', 'GEE', 'GEG', 'GEX', 'GIL', 'GMD', 'GVR', 'HAH', 
  'HAP', 'HCM', 'HHS', 'HHV', 'HNG', 'HPG', 'HSG', 'HT1', 'HTL', 'HVN', 
  'IMP', 'INN', 'IPA', 'JVC', 'KDC', 'KDH', 'KHG', 'KSB', 'KSV', 'LIX', 
  'MBB', 'MCH', 'MIG', 'MSH', 'MSN', 'MSR', 'MWG', 'NBC', 'NET', 'NKG', 
  'NLG', 'NT2', 'NVL', 'OCH', 'PDR', 'PET', 'PGV', 'PNJ', 'POW', 'PVB', 
  'PVC', 'PVD', 'PVI', 'PVS', 'PVT', 'QNS', 'REE', 'SAB', 'SAM', 'SAV', 
  'SBT', 'SHS', 'SKG', 'SMB', 'SSI', 'STB', 'STC', 'TCB', 'TCM', 'TCX', 
  'TDM', 'THD', 'TLG', 'TNG', 'TNH', 'TRA', 'TTN', 'TVC', 'VCB', 'VCG', 
  'VCI', 'VCS', 'VEF', 'VGC', 'VGI', 'VGS', 'VHC', 'VHM', 'VIC', 'VIP', 
  'VIX', 'VJC', 'VNB', 'VND', 'VNM', 'VOS', 'VPB', 'VSC', 'VTC'
];

export default async function handler(req) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 's-maxage=10, stale-while-revalidate=20'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    let sectors = JSON.parse(JSON.stringify(FIREANT_FULL_SECTORS));

    // Kéo dữ liệu giá trực tiếp từ Cổng dữ liệu khớp lệnh Realtime
    try {
      const liveResp = await fetch(`https://bgapidatafeed.vps.com.vn/getliststockdata/${ALL_TICKERS.join(',')}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(2800)
      });

      if (liveResp.ok) {
        const liveStocks = await liveResp.json();
        if (Array.isArray(liveStocks) && liveStocks.length > 0) {
          const priceMap = {};
          liveStocks.forEach(item => {
            const sym = item.sym;
            const last = item.lastPrice || item.r || 0;
            const ref = item.r || 0;
            const pct = ref > 0 ? parseFloat((((last - ref) / ref) * 100).toFixed(2)) : 0;
            const lot = item.lot || 0;
            const volStr = lot >= 1000000 ? `${(lot / 1000000).toFixed(1)}M` : (lot >= 1000 ? `${(lot / 1000).toFixed(0)}K` : `${lot}`);

            priceMap[sym] = {
              price: last,
              pct: pct,
              vol: volStr
            };
          });

          // Cập nhật giá và % biến động từng cổ phiếu
          sectors.forEach(sec => {
            if (sec.stocks) {
              sec.stocks.forEach(stk => {
                if (priceMap[stk.ticker]) {
                  stk.price = priceMap[stk.ticker].price;
                  stk.pct = priceMap[stk.ticker].pct;
                  stk.vol = priceMap[stk.ticker].vol;
                }
              });
            }

            if (sec.subSectors) {
              sec.subSectors.forEach(sub => {
                if (sub.stocks) {
                  sub.stocks.forEach(stk => {
                    if (priceMap[stk.ticker]) {
                      stk.price = priceMap[stk.ticker].price;
                      stk.pct = priceMap[stk.ticker].pct;
                      stk.vol = priceMap[stk.ticker].vol;
                    }
                  });
                }
              });
            }
          });
        }
      }
    } catch (liveErr) {
      console.warn('Realtime live stock feed skipped:', liveErr.message);
    }

    return new Response(JSON.stringify({
      success: true,
      updatedAt: new Date().toISOString(),
      timestamp: Date.now(),
      totalSectors: sectors.length,
      data: sectors
    }), {
      status: 200,
      headers
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: true,
      isFallback: true,
      updatedAt: new Date().toISOString(),
      data: FIREANT_FULL_SECTORS
    }), {
      status: 200,
      headers
    });
  }
}
