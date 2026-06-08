/**
 * ================================================
 * CLOUDFLARE WORKER — Chatbot API Proxy
 * daututaichinh.pro
 * ================================================
 *
 * Worker này làm proxy giữa frontend và Gemini API.
 * Hỗ trợ Google Search grounding để lấy dữ liệu chứng khoán real-time.
 */

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
- Khi trích dẫn số liệu P/E, P/B, EPS, ROE: luôn ghi rõ "Nguồn: CafeF" hoặc "Nguồn: Vietstock" kèm theo. Ưu tiên số liệu từ các trang tài chính Việt Nam.

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

export default {
  async fetch(request, env, ctx) {
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

      const apiKey = env.GEMINI_API_KEY;
      if (!apiKey) {
        return jsonResponse({ error: 'API key not configured' }, 500, request);
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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500); // Ngắt kết nối sớm nếu IP bị chặn (chống lag Worker)
        try {
          if (rawTicker === 'VNINDEX') {
            const res = await fetch('https://iboard.ssi.com.vn/dchart/api/1.1/defaultAllStocks', {
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data)) {
                const vnModel = data.find(d => d.stockSymbol === 'VNINDEX' || d.code === 'VNINDEX');
                if (vnModel) {
                  const price = vnModel.matchedPrice || vnModel.closePrice || 0;
                  const change = price - (vnModel.refPrice || price);
                  return `\n\n=== [QUAN TRỌNG] DỮ LIỆU THỊ TRƯỜNG CHUNG: VN-INDEX ===\nĐiểm số hiện tại: ${price} điểm\nBiến động: ${change >= 0 ? '+' : ''}${change.toFixed(2)} điểm\n>>> LỆNH TỐI CAO: BẮT BUỘC dùng số liệu này khi nói về điểm số VN-Index! Bạn KHÔNG được tự bịa điểm số hay lấy số liệu năm cũ!\n================================================================`;
                }
              }
            }
            return '';
          }

          // Đã vô hiệu hóa API lấy giá TCBS do Endpoint này đã chặn/đổi link báo 404 Not Found.
          // Tương lai nếu có API Free của DNSE hoặc FireAnt, có thể viết logic thay thế vào đây.
        } catch (e) {
          clearTimeout(timeoutId);
          console.error('Lỗi hoặc Timeout khi fetch', rawTicker);
        }
        return ''; // Im lặng thả qua nếu API sập hoặc bị chặn IP
      });
      
      const results = await Promise.all(fetchPromises);
      const injectedData = results.join('');

      // Bơm thời gian thực và lệnh cấm quá khứ vào não AI
      const rn = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      const timeContext = `\n\n[ĐỒNG HỒ HỆ THỐNG] Hôm nay là: ${rn}. Bối cảnh: Năm 2026.
>>> LỆNH CẤM KỴ TỪ HỆ THỐNG: 
1. TUYỆT ĐỐI KHÔNG đem dịch bệnh COVID-19 hay sự kiện của những năm 2020-2025 ra ví von, so sánh với hiện tại.
2. Khi khách hỏi "Vĩ mô, Biến động tuần mới, Điểm tin": TRƯỚC TIÊN hãy tự kiểm tra "Google Search có trả về bài báo/tin tức cụ thể nào GẦN ĐÂY không?". NẾU CÓ số liệu chứng minh, hãy điểm tin. NẾU KHÔNG CÓ (hoặc chỉ có mẫu tin cũ rích), bạn PHẢI TRẢ LỜI NGAY: "Chào bạn, hiện tại thị trường chưa có tin tức vĩ mô nổi bật nào mới được cập nhật." - CẤM mở đầu bằng "Dưới đây là một số tin..." rồi để trống.
3. TUYỆT ĐỐI KHÔNG TỰ BỊA RA XU HƯỚNG, ĐIỂM SỐ VN-INDEX (như VN-Index 1800) hay các mốc Hỗ Trợ/Kháng Cự nếu không dựa trên Dữ Liệu có thật! Mọi sai số bịa đặt mốc MA20 hay 1800 sẽ bị trừng phạt gắt gao.`;

      let finalSystemPrompt = SYSTEM_PROMPT + injectedData + timeContext;

      // Thử Google Search grounding trước
      let result = await callGemini(apiKey, history, finalSystemPrompt, true);

      // Nếu lỗi, thử lại KHÔNG kèm tìm kiếm
      if (!result.ok) {
        console.log('Google Search grounding failed, retrying without it...');
        result = await callGemini(apiKey, history, finalSystemPrompt, false);
      }

      if (!result.ok) {
        return jsonResponse({ error: 'Gemini API error', details: result.status }, 502, request);
      }

      // Log to Google Sheets asynchronously
      if (sessionId) {
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
};

// ─── Call Gemini API ────────────────────────────────────
async function callGemini(apiKey, history, systemPrompt, useSearch) {
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;

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

    // ─── POST-PROCESSING: Lọc nội dung reply bằng CODE ───────────
    // Danh sách trắng (Whitelist) các domain Việt Nam được phép hiển thị
    const APPROVED_DOMAINS = [
      'cafef.vn', 'vietstock.vn', 'fireant.vn', 'ssi.com.vn',
      'hsx.vn', 'hnx.vn', 'vnexpress.net', 'tuoitre.vn',
      'thanhnien.vn', 'vietnamnet.vn', 'baodautu.vn',
      'tinnhanhchungkhoan.vn', 'ndh.vn', 'stockbiz.vn',
      'dnse.com.vn', 'vcbs.com.vn', 'mbs.com.vn',
      'youtube.com', 'daututaichinh.pro'
    ];

    // Danh sách đen các trang nước ngoài hay bị AI trích dẫn sai
    const BLOCKED_SOURCES = [
      'companiesmarketcap.com', 'simplywall.st', 'tradingview.com',
      'investing.com', 'alphaspread.com', 'pocketoption.com',
      'macrotrends.net', 'wisesheets.io', 'stockanalysis.com',
      'marketbeat.com', 'yahoo.com', 'finance.yahoo.com',
      'gurufocus.com', 'wallstreetzen.com'
    ];

    // Bước 1: Quét nội dung reply, xóa mọi dòng/đoạn nhắc đến trang nước ngoài
    reply = sanitizeReply(reply, BLOCKED_SOURCES);

    // Bước 2: Bóc tách Grounding URLs, CHỈ giữ lại link từ domain Việt Nam
    const chunks = data?.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && chunks.length > 0) {
      const seenDomains = new Set();
      let approvedLinks = '';
      chunks.forEach((chunk) => {
        if (chunk.web && chunk.web.uri) {
          try {
            const urlObj = new URL(chunk.web.uri);
            const domain = urlObj.hostname.replace('www.', '');
            // CHỈ cho phép domain nằm trong whitelist
            const isApproved = APPROVED_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));
            if (isApproved && !seenDomains.has(domain)) {
              seenDomains.add(domain);
              approvedLinks += `- [${chunk.web.title || domain}](${chunk.web.uri})\n`;
            }
          } catch(e) { /* Bỏ qua URL lỗi parse */ }
        }
      });
      // Chỉ thêm phần "Nguồn tham khảo" nếu CÒN link hợp lệ sau khi lọc
      if (approvedLinks) {
        reply += "\n\n**🔗 Nguồn tham khảo:**\n" + approvedLinks;
      }
    }

    return { ok: true, reply };

  } catch (error) {
    console.error(`Fetch error (search=${useSearch}):`, error);
    return { ok: false, status: 0 };
  }
}

// ─── Sanitize Reply: Lọc nội dung AI xóa tên trang nước ngoài ─────
function sanitizeReply(reply, blockedSources) {
  // Bước A: Xóa toàn bộ dòng nào có chứa tên domain bị chặn
  // (VD: "* **P/B:** Theo CompaniesMarketCap, P/B..." → xóa cả dòng)
  let lines = reply.split('\n');
  lines = lines.filter(line => {
    const lowerLine = line.toLowerCase();
    return !blockedSources.some(src => lowerLine.includes(src.toLowerCase()));
  });
  reply = lines.join('\n');

  // Bước B: Xóa các cụm inline nhắc tên nguồn nước ngoài còn sót
  // VD: "Theo CompaniesMarketCap," → "" hoặc "theo Investing.com" → ""
  blockedSources.forEach(src => {
    // Tên domain không có đuôi (VD: "CompaniesMarketCap", "Alpha Spread")
    const name = src.replace('.com', '').replace('.net', '').replace('.io', '').replace('.st', '');
    // Regex: bắt cả "Theo X," hoặc "(theo X)" hoặc "trên X" hoặc "từ X" (case insensitive)
    const patterns = [
      new RegExp(`(?:theo|trên|từ|tại|của|website|trang)\\s+(?:\\*\\*)?${escapeRegex(name)}(?:\\.\\w+)?(?:\\*\\*)?[,.]?\\s*`, 'gi'),
      new RegExp(`(?:theo|trên|từ|tại|của|website|trang)\\s+(?:\\*\\*)?${escapeRegex(src)}(?:\\*\\*)?[,.]?\\s*`, 'gi'),
      new RegExp(`\\[${escapeRegex(src)}\\]\\([^)]*\\)`, 'gi'),  // Markdown link [domain](url)
      new RegExp(`\\[${escapeRegex(name)}\\]\\([^)]*\\)`, 'gi')
    ];
    patterns.forEach(p => {
      reply = reply.replace(p, '');
    });
  });

  // Bước C: Dọn sạch các dòng trống thừa liên tiếp do bị xóa
  reply = reply.replace(/\n{3,}/g, '\n\n');

  return reply.trim();
}

// Escape ký tự đặc biệt cho regex
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
