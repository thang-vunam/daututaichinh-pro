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

    // Lấy 3 tin nhắn gần nhất của user để làm "Bộ nhớ ngắn hạn" cho việc tìm mã
    const recentUserMessages = history
      .filter(msg => msg.role === 'user')
      .slice(-3) // Lấy 3 câu gần nhất
      .flatMap(msg => msg.parts || [])
      .map(part => part.text || '')
      .join(' ');

    // Regex lấy tất cả từ 3 chữ cái (VNM), hoặc 2 chữ cái + 1 số có/không có khoảng trắng (PC1, pc 1, nt 2)
    const matches = [...recentUserMessages.matchAll(/\b([a-zA-Z]{3}|[a-zA-Z]{2}\s?[0-9])\b/gi)];
    // Luôn luôn nạp VNINDEX vào danh sách cào dữ liệu để AI luôn biết điểm số thị trường thật, chống bịa đặt Hỗ trợ/Kháng cự.
    const candidates = ['VNINDEX', ...new Set(matches.map(m => m[1].replace(/\s+/g, '').toUpperCase()))];
    
    // Loại trừ các từ phổ biến 3 chữ trong tiếng Việt
    const excludeList = ['CHO', 'MUA', 'BAN', 'BÁN', 'GIA', 'GIÁ', 'XEM', 'HAY', 'TIN', 'BAO', 'BÁO', 'VOI', 'THI', 'LAI', 'SAO', 'NAO', 'MAI', 'XIN', 'BAI', 'NEN', 'TUC', 'ANH', 'CHI', 'EM ', 'NAY', 'QUA', 'DAU', 'ROI', 'GIO', 'LEN', 'XUONG', 'CAI', 'CON', 'CHI', 'HON', 'THE'];
    
    // Xử lý fetch song song để giảm lag, loại bỏ các kết quả lỗi/rỗng môt cách im lặng
    const fetchPromises = candidates.map(async (rawTicker) => {
      if (excludeList.includes(rawTicker)) return '';
      try {
        const res = await fetch(`https://finfo-api.vndirect.com.vn/v4/stock_prices?sort=-date&q=code:${rawTicker}&size=1`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': 'application/json'
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.data?.length > 0) {
            const s = data.data[0];
            return `\n\n=== [QUAN TRỌNG] DỮ LIỆU BẢNG ĐIỆN TỬ: MÃ ${rawTicker} ===\nGiá đóng cửa gần nhất (VND): ${s.close * 1000} đồng\nBiến động giá: ${s.change * 1000} đồng (${s.pctChange}% so với phiên trước)\nNgày ghi nhận: ${s.date}\n>>> LỆNH TỐI CAO: BẮT BUỘC dùng số liệu này khi nói về giá mã ${rawTicker}! Không tự bịa hay dùng số Google!\n================================================================`;
          }
        }
      } catch (e) {
        console.error('Lỗi khi fetch', rawTicker);
      }
      return ''; // Im lặng thả qua nếu API sập hoặc chữ đó không phải là mã chứng khoán (data.length = 0)
    });
    
    const results = await Promise.all(fetchPromises);
    const injectedData = results.join('');

    // Bơm thời gian thực và lệnh cấm quá khứ vào não AI
    const rn = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const timeContext = `\n\n[ĐỒNG HỒ HỆ THỐNG] Hôm nay là: ${rn}. Bối cảnh: Năm 2026.
>>> LỆNH CẤM KỴ TỪ HỆ THỐNG: 
1. TUYỆT ĐỐI KHÔNG đem dịch bệnh COVID-19 hay sự kiện của những năm 2020-2025 ra ví von, so sánh với hiện tại.
2. Khi khách hỏi "Vĩ mô, Biến động tuần mới, Điểm tin": TRƯỚC TIÊN hãy tự kiểm tra "Google Search có trả về bài báo/tin tức cụ thể nào GẦN ĐÂY không?". NẾU CÓ số liệu chứng minh, hãy điểm tin. NẾU KHÔNG CÓ (hoặc chỉ có mẫu tin cũ rích), bạn PHẢI TRẢ LỜI NGAY: "Chào bạn, hiện tại thị trường chưa có tin tức vĩ mô nổi bật nào mới được cập nhật." - CẤM mở đầu bằng "Dưới đây là một số tin..." rồi để trống.
3. TUYỆT ĐỐI KHÔNG TỰ BỊA RA XU HƯỚNG, ĐIỂM SỐ VN-INDEX (như VN-Index 1800) hay các mốc Hỗ Trợ/Kháng Cự nếu không dưa trên Dữ Liệu Bảng Điện Tử mà hệ thống vừa cung cấp!`;

    let finalSystemPrompt = systemPrompt + injectedData + timeContext;

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
