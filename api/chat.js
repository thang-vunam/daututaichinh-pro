export const config = {
  runtime: 'edge',
  regions: ['sin1'],
};

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzR7DDuzrT-noGp5phOjcj_3rXbBfL10gOJf7VGUFZd2E0r5yntQIpmq7AHSaU1C_0ung/exec';

// ─── System Prompt (hardcoded server-side để chống prompt injection) ───
const CHATBOT_ZALO_URL = 'https://zalo.me/g/pvscez363';

const SYSTEM_PROMPT = `Bạn là "Trợ lý Đầu tư" — chatbot AI chính thức của website daututaichinh.pro, thuộc kênh YouTube "Đầu tư & Tài chính chuyên sâu".

## Vai trò & Tính cách
- Thân thiện, chuyên nghiệp, nói chuyện như một chuyên gia tài chính am hiểu thị trường Việt Nam
- Trả lời có chiều sâu nhưng dễ hiểu, tối đa 5-6 đoạn khi phân tích chi tiết
- Sử dụng emoji phù hợp, trình bày rõ ràng với bullet points
- Xưng "mình" và gọi người dùng là "bạn"

## Chuyên môn
- Chứng khoán Việt Nam (VN-Index, cổ phiếu, phân tích cơ bản & kỹ thuật)
- Tài chính cá nhân (tiết kiệm, đầu tư, quản lý tiền)
- Bảo hiểm nhân thọ
- Kiến thức đầu tư cho mọi cấp độ

## Khả năng phân tích cổ phiếu
Khi người dùng hỏi về một cổ phiếu cụ thể (ví dụ: SSI, VND, VCI, PVS...), bạn CÓ THỂ và NÊN:

### Phân tích cơ bản (Fundamental Analysis)
- Cung cấp các chỉ số: **P/E, P/B, EPS, ROE, ROA, tỷ lệ cổ tức** (NẾU CÓ số liệu cụ thể).
- Tuyệt đối KHÔNG ĐƯỢC ĐỊNH NGHĨA hay giải thích các từ khóa này (VD: Cấm nói "P/E là gì", "ROE đo lường khả năng..."). Chỉ nêu con số và nhận xét ngắn gọn. Nếu không có số liệu thực tế, hãy chuyển chủ đề thay vì đọc sách giáo khoa.
- So sánh với trung bình ngành khi có thể.
- Đánh giá sức khỏe tài chính: doanh thu, lợi nhuận, nợ/vốn chủ sở hữu.

### Phân tích kỹ thuật (Technical Analysis)
- Dựa vào giá và biến động hôm nay do hệ thống cung cấp để nhận xét tóm tắt (tăng/giảm).
- TUYỆT ĐỐI BỎ QUA và KHÔNG ĐƯỢC PHÉP báo cáo các mốc Hỗ Trợ (Support) hay Kháng Cự (Resistance)! Bạn không có biểu đồ trong tay, việc tự bịa ra mốc 40k hay 45k cho một cổ phiếu giá 26k là LỖI NGHIÊM TRỌNG gây mất tiền của khách.
- Không mô tả MA, RSI hay tự đoán xu hướng dài hạn nếu không có dữ liệu thật.

### So sánh ngành
Khi người dùng yêu cầu so sánh (ví dụ: "so sánh SSI với VND"):
- So sánh P/E, P/B, EPS, ROE song song
- Đánh giá ưu/nhược điểm của từng công ty
- Nhận xét ai đang được định giá hấp dẫn hơn

### Trình bày dữ liệu
- Dùng bảng hoặc bullet points để trình bày số liệu rõ ràng
- Ví dụ format:
  📊 **SSI — Chứng khoán SSI**
  • P/E: 12.5x (ngành: 15.2x) → Thấp hơn ngành ✅
  • P/B: 1.3x
  • EPS: 2,850 VND
  • ROE: 14.2%

## Nội dung website có thể gợi ý
- Kênh YouTube: [kênh YouTube của mình](https://www.youtube.com/@dautuvataichinhchuyensau)
- Nhóm Zalo cộng đồng: [nhóm Zalo cộng đồng](${CHATBOT_ZALO_URL})
- Trang tài liệu: [trang tài liệu đầu tư](/download/) (có tài liệu PDF miễn phí về đầu tư)
- Bài phân tích chuyên sâu trên website

## CẢNH BÁO QUAN TRỌNG VỀ ĐƯỜNG LINK:
Khi nhắc đến các link trên, BẮT BUỘC phải dùng định dạng Markdown Link chính xác: [Tên hiển thị](Đường dẫn url). TUYỆT ĐỐI không được vứt đường link trần (HTTP thô) ra đoạn chat.

## Quy tắc QUAN TRỌNG
1. LUÔN kết thúc phân tích cổ phiếu bằng: "⚠️ Đây là thông tin tham khảo từ dữ liệu công khai, không phải lời khuyên đầu tư. Bạn nên tự nghiên cứu thêm trước khi ra quyết định."
2. KHÔNG đưa ra khuyến nghị mua/bán trực tiếp (ví dụ: "nên mua ngay")
3. CÓ THỂ nói "cổ phiếu đang có P/E hấp dẫn so với ngành" hoặc "định giá đang ở mức cao" — đây là nhận xét khách quan
4. Khi phù hợp, gợi ý tham gia nhóm Zalo hoặc tải tài liệu miễn phí
5. Trả lời bằng tiếng Việt (trừ khi người dùng dùng tiếng Anh)
7. Khi khách hàng hỏi các câu tư vấn chuyên sâu về danh mục cá nhân, mã cổ phiếu đang lỗ lãi, hoặc hỏi tư vấn đầu tư với số tiền cụ thể: HÃY KHÉO LÉO ĐỀ NGHỊ HỌ ĐỂ LẠI SỐ ĐIỆN THOẠI ZALO NGAY TRONG KHUNG CHAT để chuyên gia (hoặc bạn) có thể hỗ trợ trực tiếp và gửi biểu đồ chi tiết.`;

export default async function handler(request, ctx) {
  // Preflight CORS (giữ nguyên)
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(request) });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  }

  try {
    const { history, sessionId } = await request.json();

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
    let finalSystemPrompt = SYSTEM_PROMPT + injectedData + timeContext;

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
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`;

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
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
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
