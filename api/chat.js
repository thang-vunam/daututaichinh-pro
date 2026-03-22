export const config = {
  runtime: 'edge',
  regions: ['sin1'], // BẮT BUỘC: Gắn cứng máy chủ ở Singapore để Gemini AI luôn cấp phép
};

export default async function handler(request) {
  // Preflight CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(request) });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  }

  try {
    const { history, systemPrompt } = await request.json();

    if (!history || !Array.isArray(history)) {
      return jsonResponse({ error: 'Invalid request: history required' }, 400, request);
    }

    // Trên Vercel, biến môi trường được gọi bằng process.env
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return jsonResponse({ error: 'API key not configured in Vercel' }, 500, request);
    }

    // Lọc ra câu hỏi cuối cùng của user để bắt mã cổ phiếu
    let lastUserMessage = '';
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === 'user') {
        const parts = history[i].parts || [];
        lastUserMessage = parts.map(p => p.text).join(' ');
        break;
      }
    }

    // Regex thông minh: Tìm các từ có 3 chữ cái viết liền (giả định là mã CK)
    const tickerMatch = lastUserMessage.match(/\b([a-zA-Z]{3})\b/i);
    let injectedData = '';
    
    if (tickerMatch) {
      const ticker = tickerMatch[1].toUpperCase();
      // Loại trừ các chữ 3 âm tiết phổ biến trong tiếng Việt để tránh nhận diện nhầm
      const excludeList = ['CHO', 'MUA', 'BÁN', 'GIA', 'XEM', 'HAY', 'TIN', 'BAO', 'VOI', 'THI', 'LAI', 'SAO', 'NAO', 'MAI', 'XIN'];
      
      if (!excludeList.includes(ticker)) {
        console.log('Detected potential ticker in user message:', ticker);
        try {
          const res = await fetch(`https://finfo-api.vndirect.com.vn/v4/stock_prices?sort=-date&q=code:${ticker}&size=1`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.data && data.data.length > 0) {
              const s = data.data[0];
              injectedData = `\n\n=== [QUAN TRỌNG] DỮ LIỆU API HỆ THỐNG NẠP TỰ ĐỘNG KHÔNG ĐƯỢC CÃI ===\nMã cổ phiếu: ${ticker}\nGiá đóng cửa gần nhất (VND): ${s.close * 1000} đồng\nBiến động giá: ${s.change * 1000} đồng (${s.pctChange}% so với phiên trước)\nNgày giao dịch gần nhất: ${s.date}\n>>> CHỈ THỊ CHO AI: Khi trả lời khách hàng về mã ${ticker}, BẮT BUỘC dùng số liệu từ [DỮ LIỆU API HỆ THỐNG] này! Không cần dùng Google Search nữa! Báo cáo rõ ngày giao dịch gần nhất cho khách.\n================================================================`;
              console.log('Successfully injected API data for', ticker);
            }
          }
        } catch (e) {
          console.error('Lỗi khi tự động fetch mã cổ phiếu:', e);
        }
      }
    }

    let finalSystemPrompt = systemPrompt + injectedData;

    // Thử Google Search grounding trước
    let result = await callGemini(apiKey, history, finalSystemPrompt, true);

    // Nếu lỗi, thử lại KHÔNG kèm tìm kiếm
    if (!result.ok) {
      console.log('Google Search grounding failed, retrying without it...');
      result = await callGemini(apiKey, history, finalSystemPrompt, false);
    }

    if (!result.ok) {
      return jsonResponse({
        error: 'Gemini API error',
        details: result.status
      }, 502, request);
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
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text
      || 'Xin lỗi, mình không thể trả lời lúc này.';

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
