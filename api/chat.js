export const config = {
  runtime: 'edge',
  regions: ['sin1'],
};

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzR7DDuzrT-noGp5phOjcj_3rXbBfL10gOJf7VGUFZd2E0r5yntQIpmq7AHSaU1C_0ung/exec';

export default async function handler(request, ctx) {
  // Preflight CORS (giữ nguyên)
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(request) });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  }

  try {
    const { history, systemPrompt, sessionId } = await request.json();

    if (!history || !Array.isArray(history)) {
      return jsonResponse({ error: 'Invalid request: history required' }, 400, request);
    }

    // Trên Vercel, biến môi trường được gọi bằng process.env
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return jsonResponse({ error: 'API key not configured in Vercel' }, 500, request);
    }

    // (Giữ nguyên logic fetch song song SSI/TCBS và prompt...)
    // Lấy 3 tin nhắn gần nhất của user để làm "Bộ nhớ ngắn hạn"
    const recentUserMessages = history
      .filter(msg => msg.role === 'user')
      .slice(-3)
      .flatMap(msg => msg.parts || [])
      .map(part => part.text || '')
      .join(' ');

    const matches = [...recentUserMessages.matchAll(/\b([a-zA-Z]{3}|[a-zA-Z]{2}\s?[0-9])\b/gi)];
    const candidates = ['VNINDEX', ...new Set(matches.map(m => m[1].replace(/\s+/g, '').toUpperCase()))];
    const excludeList = ['CHO', 'MUA', 'BAN', 'BÁN', 'GIA', 'GIÁ', 'XEM', 'HAY', 'TIN', 'BAO', 'BÁO', 'VOI', 'THI', 'LAI', 'SAO', 'NAO', 'MAI', 'XIN', 'BAI', 'NEN', 'TUC', 'ANH', 'CHI', 'EM ', 'NAY', 'QUA', 'DAU', 'ROI', 'GIO', 'LEN', 'XUONG', 'CAI', 'CON', 'CHI', 'HON', 'THE'];
    
    const fetchPromises = candidates.map(async (rawTicker) => {
      if (excludeList.includes(rawTicker)) return '';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      try {
        if (rawTicker === 'VNINDEX') {
          const res = await fetch('https://iboard.ssi.com.vn/dchart/api/1.1/defaultAllStocks', { signal: controller.signal });
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              const vnModel = data.find(d => d.stockSymbol === 'VNINDEX' || d.code === 'VNINDEX');
              if (vnModel) {
                const price = vnModel.matchedPrice || vnModel.closePrice || 0;
                const change = price - (vnModel.refPrice || price);
                return `\n\n=== [QUAN TRỌNG] DỮ LIỆU THỊ TRƯỜNG CHUNG: VN-INDEX ===\nĐiểm số hiện tại: ${price} điểm\nBiến động: ${change >= 0 ? '+' : ''}${change.toFixed(2)} điểm\n>>> LỆNH TỐI CAO: BẮT BUỘC dùng số liệu này khi nói về điểm số VN-Index!\n================================================================`;
              }
            }
          }
          return '';
        }
        const res = await fetch(`https://apipubaws.tcbs.com.vn/tcanalysis/v1/ticker/${rawTicker}/overview`, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data && data.ticker === rawTicker && data.price) {
            return `\n\n=== [QUAN TRỌNG] DỮ LIỆU BẢNG ĐIỆN TỬ: MÃ ${rawTicker} ===\nGiá hiện tại (VND): ${data.price} đồng\nBiến động giá: ${data.change} đồng\n>>> LỆNH TỐI CAO: BẮT BUỘC dùng số liệu này khi nói về giá mã ${rawTicker}! [Xem chi tiết mã ${rawTicker} tại mục Phân Tích](https://fireant.vn/dashboard/content/symbols/${rawTicker})\n================================================================`;
          }
        }
      } catch (e) {
        clearTimeout(timeoutId);
      }
      return ''; 
    });
    
    const results = await Promise.all(fetchPromises);
    const injectedData = results.join('');
    const rn = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const timeContext = `\n\n[ĐỒNG HỒ HỆ THỐNG] Hôm nay là: ${rn}. Bối cảnh: Năm 2026.\n1. TUYỆT ĐỐI KHÔNG đem dịch bệnh COVID-19 ra ví von.\n2. Phải kiểm tra tin tức vĩ mô trước khi nói.\n3. TUYỆT ĐỐI KHÔNG TỰ BỊA RA XU HƯỚNG.`;
    let finalSystemPrompt = systemPrompt + injectedData + timeContext;

    // Call Gemini
    let result = await callGemini(apiKey, history, finalSystemPrompt, true);
    if (!result.ok) {
      result = await callGemini(apiKey, history, finalSystemPrompt, false);
    }

    if (!result.ok) {
      return jsonResponse({ error: 'Gemini API error', details: result.status }, 502, request);
    }

    // Log to Google Sheets (Background)
    if (sessionId && ctx && typeof ctx.waitUntil === 'function') {
      const logData = {
        action: 'log_chat',
        sessionId: sessionId,
        userMessage: history[history.length - 1]?.parts?.[0]?.text || '',
        botReply: result.reply,
        timestamp: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
      };
      
      ctx.waitUntil(
        fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(logData),
          redirect: 'follow'
        }).catch(e => console.error('Sheet Log Error:', e))
      );
    }

    return jsonResponse({ reply: result.reply }, 200, request);

  } catch (error) {
    console.error('API proxy error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500, request);
  }
}

// ─── Call Gemini API ────────────────────────────────────
async function callGemini(apiKey, history, systemPrompt, useSearch) {
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const geminiBody = {
    system_instruction: {
      parts: [{ text: systemPrompt || 'Bạn là trợ lý tài chính thông minh.' }]
    },
    contents: history,
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 2048
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
    ]
  };

  // Add Google Search tool if enabled
  if (useSearch) {
    geminiBody.tools = [{ googleSearch: {} }];
  }

  try {
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody)
    });

    if (!response.ok) {
      return { ok: false, status: response.status };
    }

    const data = await response.json();
    let reply = data?.candidates?.[0]?.content?.parts?.[0]?.text
      || 'Xin lỗi, mình không thể trả lời lúc này.';

    // Bóc tách siêu dữ liệu Grounding (Google Search URLs) từ Gemini API và nối vào đuôi tin nhắn
    const chunks = data?.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && chunks.length > 0) {
      reply += "\n\n**🔗 Nguồn tham khảo:**\n";
      const seenUrls = new Set();
      chunks.forEach((chunk) => {
        if (chunk.web && chunk.web.uri && !seenUrls.has(chunk.web.uri)) {
          seenUrls.add(chunk.web.uri);
          reply += `- [${chunk.web.title || 'Đọc chi tiết tại đây'}](${chunk.web.uri})\n`;
        }
      });
    }

    return { ok: true, reply };

  } catch (error) {
    console.error(`Fetch error (search=${useSearch}):`, error);
    return { ok: false, status: 0 };
  }
}

// ─── Helpers ────────────────────────────────────────────
function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

function jsonResponse(data, status, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(request)
    }
  });
}
