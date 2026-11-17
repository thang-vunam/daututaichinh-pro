import { FIREANT_FULL_SECTORS } from './_sectors_data.js';

export const config = {
  runtime: 'edge',
  regions: ['sin1'],
};

export default async function handler(req) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 's-maxage=15, stale-while-revalidate=30'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    // 1. Thử kéo dữ liệu live từ endpoint thị trường
    // Nếu có mạng và nguồn phản hồi tốt, đồng bộ % thay đổi và độ rộng
    let liveData = JSON.parse(JSON.stringify(FIREANT_FULL_SECTORS));

    try {
      const resp = await fetch('https://restv2.fireant.vn/icb/latest-index', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
          'Referer': 'https://fireant.vn/'
        },
        signal: AbortSignal.timeout(3500)
      });

      if (resp.ok) {
        const rawItems = await resp.json();
        if (Array.isArray(rawItems) && rawItems.length > 0) {
          const indexMap = {};
          rawItems.forEach(item => {
            if (item.industryCode && item.indexValues) {
              const v = item.indexValues;
              const close = v.IndexClose || 0;
              const prev = v.IndexPrev || 0;
              const pct = prev > 0 ? ((close - prev) / prev) * 100 : 0;
              indexMap[item.industryCode] = {
                pct: parseFloat(pct.toFixed(2)),
                close,
                prev,
                vol: v.Volume || 0,
                mcap: v.MarketCap || 0
              };
            }
          });

          // Cập nhật giá trị vào cây ngành nếu có mã tương ứng
          const codeMap = {
            'bds': '3510',
            'nganhang': '3010',
            'thucpham': '4510',
            'taichinh': '3020',
            'congnghiep': '5020',
            'hatang': '6510',
            'dulich': '4050',
            'tainguyen': '5510',
            'vienthong': '1510',
            'banle': '4040',
            'xaydung': '5010',
            'nangluong': '6010',
            'hoachat': '5520',
            'cntt': '1010',
            'baohiem': '3030',
            'suckhoe': '2010',
            'tieudung': '4020',
            'cuahang': '4520',
            'oto': '4010',
            'truyenthong': '4030'
          };

          liveData.forEach(sec => {
            const icb = codeMap[sec.id];
            if (icb && indexMap[icb]) {
              sec.today = indexMap[icb].pct;
            }
          });
        }
      }
    } catch (fetchErr) {
      // Fallback êm ái sang dữ liệu chuẩn đã lưu nếu kết nối ngoài chậm
      console.warn('Realtime fetch fallback:', fetchErr.message);
    }

    const payload = {
      success: true,
      updatedAt: new Date().toISOString(),
      timestamp: Date.now(),
      totalSectors: liveData.length,
      data: liveData
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers
    });
  } catch (error) {
    // Trả về bản snapshot chuẩn hóa, đảm bảo client KHÔNG BAO GIỜ bị lỗi 500
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
