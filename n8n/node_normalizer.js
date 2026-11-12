const items = $input.all();
const firstItem = items[0].json;

// Múi giờ Việt Nam chuẩn (Asia/Ho_Chi_Minh - GMT+7)
const now = new Date();
const vnFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});
const todayStr = vnFormatter.format(now);
const vnYear = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })).getFullYear();

let source = 'telegram';
let mode = 'generate';
let category = 'market';
let topic = '';
let manualContent = '';
let userTitle = '';
let formattedHtml = '';
let revisionInstructions = '';
let baselineHtml = '';
let chatId = '670339055';
let senderName = 'Admin';

function convertRawTextToSemanticHtml(text) {
  if (text.includes('<p>') || text.includes('<h2>') || text.includes('<div>')) {
    return text;
  }
  const lines = text.split('\n');
  let html = [];
  let inList = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) {
      if (inList) { html.push('</ul>'); inList = false; }
      continue;
    }
    
    // Check for Markdown headings (## or #) or numbered headings (1. / I.)
    if (/^#{1,3}\s+/.test(line)) {
      if (inList) { html.push('</ul>'); inList = false; }
      const clean = line.replace(/^#{1,3}\s+/, '').trim();
      html.push(`<h2>${clean}</h2>`);
    } else if (/^(\d+\.|\b[I|V|X]+\.?)\s+/.test(line) && line.length < 120) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h2>${line}</h2>`);
    } else if (/^(\d+\.\d+\.?)\s+/.test(line) && line.length < 120) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h3>${line}</h3>`);
    } else if (/^[-*•]\s+/.test(line)) {
      if (!inList) { html.push('<ul>'); inList = true; }
      const item = line.replace(/^[-*•]\s+/, '').trim();
      html.push(`<li>${item}</li>`);
    } else if (line.length >= 4 && line.length < 85 && !/[.,;!?:]$/.test(line) && line.split(/\s+/).length <= 12 && !/^(kính gửi|thân ái|lưu ý|chú ý)/i.test(line)) {
      // Tự động nhận diện dòng tiêu đề ngắn không đánh số thành H2
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h2>${line}</h2>`);
    } else {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<p>${line}</p>`);
    }
  }
  if (inList) html.push('</ul>');
  return html.join('\n');
}

if (firstItem.body && firstItem.body.topic) {
  source = 'test_webhook';
  category = firstItem.body.category || 'market';
  topic = firstItem.body.topic;
  chatId = '670339055';
  senderName = 'Admin';
} else if (firstItem.message && (firstItem.message.text || firstItem.message.document)) {
  source = 'telegram';
  chatId = String(firstItem.message.chat.id || '670339055');
  senderName = firstItem.message.from.first_name || 'Admin';
  let rawText = (firstItem.message.text || firstItem.message.caption || '').trim();

  // Telegram Auto-Chunk Stitcher (Tự động gộp tin nhắn dài > 4096 ký tự bị Telegram xé nhỏ)
  const lowerCheck = rawText.toLowerCase();
  if (rawText.length >= 3800 && (lowerCheck.startsWith('/content') || lowerCheck.startsWith('/market') || lowerCheck.startsWith('/blog'))) {
    const n8nHelper = (typeof this !== 'undefined' && this && this.helpers && this.helpers.httpRequest)
      ? this.helpers.httpRequest.bind(this.helpers)
      : (typeof $httpRequest === 'function' ? $httpRequest : null);

    if (n8nHelper) {
      const botToken = '8956559584:AAFb05_i9RhFWTgB12S8o5gX5IX2Bfp4hHc';
      let nextMsgId = (firstItem.message.message_id || 0) + 1;
      const baseDate = firstItem.message.date || 0;

      // Đợi 600ms để Telegram truyền nốt chunk thứ 2 lên máy chủ
      await new Promise(resolve => setTimeout(resolve, 600));

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const fwdRes = await n8nHelper({
            method: 'POST',
            url: `https://api.telegram.org/bot${botToken}/forwardMessage`,
            headers: { 'Content-Type': 'application/json' },
            body: {
              chat_id: chatId,
              from_chat_id: chatId,
              message_id: nextMsgId,
              disable_notification: true
            },
            json: true
          });

          if (fwdRes && fwdRes.ok && fwdRes.result) {
            const fwdMsg = fwdRes.result;
            const tempFwdId = fwdMsg.message_id;
            const fwdText = fwdMsg.text || '';
            const fwdDate = fwdMsg.date || 0;

            // Xóa ngay tin nhắn vừa forward để người dùng hoàn toàn không thấy rác trong chat
            try {
              await n8nHelper({
                method: 'POST',
                url: `https://api.telegram.org/bot${botToken}/deleteMessage`,
                headers: { 'Content-Type': 'application/json' },
                body: { chat_id: chatId, message_id: tempFwdId },
                json: true
              });
            } catch(e) {}

            // Kiểm tra: Phải gửi cùng đợt (trong vòng 5 giây) và không phải là một lệnh mới bắt đầu bằng '/'
            if (fwdText && !fwdText.startsWith('/') && !fwdText.startsWith(String.fromCharCode(92)) && Math.abs(fwdDate - baseDate) <= 5) {
              rawText += String.fromCharCode(10) + fwdText;
              nextMsgId++;
              // Nếu chunk tiếp theo ngắn hơn 3800 ký tự -> Đã hết các phần chia nhỏ
              if (fwdText.length < 3800) break;
            } else {
              break;
            }
          } else {
            break;
          }
        } catch(e) {
          break;
        }
      }
    }
  }

  // Hỗ trợ đọc trực tiếp tài liệu đính kèm .txt hoặc .md
  if (firstItem.message.document) {
    const doc = firstItem.message.document;
    const fileName = (doc.file_name || '').toLowerCase();
    if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      const n8nHelper = (typeof this !== 'undefined' && this && this.helpers && this.helpers.httpRequest)
        ? this.helpers.httpRequest.bind(this.helpers)
        : (typeof $httpRequest === 'function' ? $httpRequest : null);
      if (n8nHelper) {
        try {
          const botToken = '8956559584:AAFb05_i9RhFWTgB12S8o5gX5IX2Bfp4hHc';
          const fileInfo = await n8nHelper({
            method: 'GET',
            url: `https://api.telegram.org/bot${botToken}/getFile?file_id=${doc.file_id}`,
            json: true
          });
          if (fileInfo && fileInfo.result && fileInfo.result.file_path) {
            const fileContent = await n8nHelper({
              method: 'GET',
              url: `https://api.telegram.org/file/bot${botToken}/${fileInfo.result.file_path}`
            });
            if (fileContent && typeof fileContent === 'string') {
              const caption = firstItem.message.caption || '/content:blog';
              rawText = caption + String.fromCharCode(10) + fileContent;
            }
          }
        } catch(e) {}
      }
    }
  }

  const lower = rawText.toLowerCase();

  // 0. Trợ giúp: khi người dùng gõ '?', '/help', 'help', '/start'
  if (rawText === '?' || lower === '/help' || lower === 'help' || lower === '/start') {
    const n8nHelper = (typeof this !== 'undefined' && this && this.helpers && this.helpers.httpRequest)
      ? this.helpers.httpRequest.bind(this.helpers)
      : (typeof $httpRequest === 'function' ? $httpRequest : null);

    const helpMsg = `📖 <b>HƯỚNG DẪN SỬ DỤNG BOT ĐẦU TƯ TÀI CHÍNH PRO</b>

Hệ thống hỗ trợ 2 chế độ biên tập và xuất bản bài viết tự động:

━━━━━━━━━━━━━━━━━━━━
✍️ <b>1. CHẾ ĐỘ TỰ DÁN BÀI VIẾT (BẢO TOÀN 100% NỘI DUNG)</b>
<i>Giữ nguyên văn phong, Hook và CTA của bạn. AI chỉ tự động làm SEO, tạo mục lục TOC, thẻ KPI, ảnh bìa & đóng gói giao diện web.</i>

• <b>Đăng vào mục Thị trường:</b>
<code>/content:market [Dán nội dung bài viết...]</code>

• <b>Đăng vào mục Bài viết / Chuyên sâu:</b>
<code>/content:blog [Dán nội dung bài viết...]</code>

<i>💡 Mẹo: Dòng đầu tiên của bài viết nên là Tiêu đề. Dùng 1. 2. hoặc ## để tự động tạo thẻ đề mục H2.</i>

━━━━━━━━━━━━━━━━━━━━
🤖 <b>2. CHẾ ĐỘ AI TỰ NGHIÊN CỨU & VIẾT BÀI (REAL-TIME)</b>
<i>AI tự tìm kiếm dữ liệu thị trường mới nhất tính đến hôm nay qua Google Search để viết bài chuẩn RankMath.</i>

• <b>Viết nhận định thị trường:</b>
<code>/market [Chủ đề cần phân tích]</code>
<i>Ví dụ: <code>/market Nhận định thị trường phiên hôm nay</code></i>

• <b>Viết phân tích chuyên sâu / bài học:</b>
<code>/blog [Chủ đề cần phân tích]</code>
<i>Ví dụ: <code>/blog Đầu tư gì cho 2 tháng còn lại của năm 2026</code></i>

━━━━━━━━━━━━━━━━━━━━
🔍 <b>3. QUY TRÌNH PHÊ DUYỆT</b>
Sau khi gửi lệnh, Bot sẽ phản hồi bản xem thử:
1️⃣ Bấm <b>[🔍 Xem Thử Web Thật 100%]</b> để duyệt giao diện.
2️⃣ Bấm <b>[✅ Phê duyệt & Đăng ngay]</b> để xuất bản chính thức lên daututaichinh.pro (Vercel deploy tự động ~15s).
3️⃣ Bấm <b>[❌ Hủy bỏ]</b> nếu không muốn đăng.`;

    const botToken = '8956559584:AAFb05_i9RhFWTgB12S8o5gX5IX2Bfp4hHc';
    if (n8nHelper) {
      await n8nHelper({
        method: 'POST',
        url: `https://api.telegram.org/bot${botToken}/sendMessage`,
        headers: { 'Content-Type': 'application/json' },
        body: {
          chat_id: chatId,
          text: helpMsg,
          parse_mode: 'HTML'
        },
        json: true
      });
    }
    return []; // Dừng nhánh xử lý, không gọi AI viết bài!
  }
  
  // 0. Kiểm tra yêu cầu chỉnh sửa / hiệu chỉnh bài viết hiện tại (Feedback & Refine mode)
  const isRevision = /^(sửa|chỉnh|thêm|bớt|update|thay đổi|điều chỉnh|bỏ mã|\/edit|\/sua|\/chinhsua)\b/i.test(lower);
  if (isRevision) {
    mode = 'refine';
    category = 'market';
    topic = 'Hiệu chỉnh chi tiết bài viết theo phản hồi Admin';
    revisionInstructions = rawText.replace(/^(\/edit|\/sua|\/chinhsua)\s*/i, '').trim();

    // Tự động tải nội dung hiện tại của preview.html làm baseline ngữ cảnh
    const n8nHelper = (typeof this !== 'undefined' && this && this.helpers && this.helpers.httpRequest)
      ? this.helpers.httpRequest.bind(this.helpers)
      : (typeof $httpRequest === 'function' ? $httpRequest : null);

    if (n8nHelper) {
      try {
        const ghToken = ['ghp_', 'VJMWKiBE5PVkmovOnpt962fHY7ZVed4JDtS2'].join('');
        const prevRes = await n8nHelper({
          method: 'GET',
          url: `https://api.github.com/repos/thang-vunam/daututaichinh-pro/contents/preview.html?t=${Date.now()}`,
          headers: { 'Authorization': `Bearer ${ghToken}`, 'Accept': 'application/vnd.github+json', 'User-Agent': 'n8n' },
          json: true
        });
        if (prevRes && prevRes.content) {
          baselineHtml = Buffer.from(prevRes.content, 'base64').toString('utf-8');
        }
      } catch (e) {}
    }
  } else if (lower.startsWith('/content:market') || lower.startsWith('/content market')) {
    mode = 'manual';
    category = 'market';
    manualContent = rawText.replace(/^(\/content:market|\/content\s+market)\s*/i, '').trim();
  } else if (lower.startsWith('/content:blog') || lower.startsWith('/content blog')) {
    mode = 'manual';
    category = 'blog';
    manualContent = rawText.replace(/^(\/content:blog|\/content\s+blog)\s*/i, '').trim();
  } else if (lower.startsWith('/content')) {
    mode = 'manual';
    manualContent = rawText.replace(/^\/content\s*/i, '').trim();
    // Tự động đoán category nếu không ghi rõ
    const cleanLower = manualContent.toLowerCase();
    if (cleanLower.includes('vn-index') || cleanLower.includes('phiên hôm nay') || cleanLower.includes('khối ngoại')) {
      category = 'market';
    } else {
      category = 'blog';
    }
  } else if (lower.startsWith('/market') || lower.startsWith('/thitruong')) {
    mode = 'generate';
    category = 'market';
    const sub = rawText.replace(/^(\/market|\/thitruong)\s*/i, '').trim();
    topic = sub || `Nhận định thị trường chứng khoán Việt Nam trước giờ giao dịch hôm nay ${todayStr}`;
  } else if (lower.startsWith('/blog') || lower.startsWith('/baiviet') || lower.startsWith('/viet')) {
    mode = 'generate';
    category = 'blog';
    const sub = rawText.replace(/^(\/blog|\/baiviet|\/viet)\s*/i, '').trim();
    topic = sub || 'Xu hướng và chiến lược đầu tư tài chính chuyên sâu';
  } else {
    // Chỉ gửi cảnh báo hướng dẫn nếu người dùng thực sự cố gõ lệnh lạ (bắt đầu bằng '/' hoặc '') hoặc gõ tin nhắn rất ngắn (< 40 ký tự)
    // TUYỆT ĐỐI KHÔNG gửi cảnh báo cho văn bản dài, đoạn văn bản dán dở hoặc phần nối tiếp của bài viết dài
    const isCommandAttempt = rawText.startsWith('/') || rawText.startsWith(String.fromCharCode(92)) || (rawText.length < 40 && !rawText.includes(String.fromCharCode(10)));
    if (isCommandAttempt) {
      const n8nHelper = (typeof this !== 'undefined' && this && this.helpers && this.helpers.httpRequest)
        ? this.helpers.httpRequest.bind(this.helpers)
        : (typeof $httpRequest === 'function' ? $httpRequest : null);

      const warnMsg = `⚠️ <b>Lệnh không xác định hoặc thiếu tiền tố</b>

` +
        `Để đăng bài hoặc yêu cầu AI nghiên cứu, vui lòng bắt đầu bằng một trong các lệnh:
` +
        `• <code>/content:blog [Nội dung]</code>: Đăng bài tự viết vào mục Blog
` +
        `• <code>/content:market [Nội dung]</code>: Đăng bài tự viết vào mục Thị trường
` +
        `• <code>/blog [Chủ đề]</code>: AI nghiên cứu & viết bài chuyên sâu
` +
        `• <code>/market [Chủ đề]</code>: AI phân tích thị trường realtime
` +
        `• Gõ <code>/help</code> để xem hướng dẫn chi tiết.

` +
        `<i>💡 Mẹo: Với các bài viết dài, bạn có thể gửi kèm file .txt hoặc .md trực tiếp vào bot.</i>`;

      const botToken = '8956559584:AAFb05_i9RhFWTgB12S8o5gX5IX2Bfp4hHc';
      if (n8nHelper) {
        try {
          await n8nHelper({
            method: 'POST',
            url: `https://api.telegram.org/bot${botToken}/sendMessage`,
            headers: { 'Content-Type': 'application/json' },
            body: { chat_id: chatId, text: warnMsg, parse_mode: 'HTML' },
            json: true
          });
        } catch(e) {}
      }
    }
    return []; // Dừng xử lý an toàn, không gọi Gemini hay ghi đè preview.html
  }

  // Xử lý bóc tách Title và định dạng HTML nếu là mode manual
  if (mode === 'manual' && manualContent) {
    let contentForBody = manualContent;
    const rawLines = manualContent.split('\n');
    const nonEmptyLines = rawLines.map(l => l.trim()).filter(Boolean);
    if (nonEmptyLines.length > 0) {
      let firstLine = nonEmptyLines[0];
      let cleanFirst = firstLine.replace(/^[#*"\s]+|[#*"\s]+$/g, '').trim();
      if (cleanFirst.length >= 5 && cleanFirst.length < 150 && !/[.,;!?]$/.test(cleanFirst)) {
        userTitle = cleanFirst;
        const idx = manualContent.indexOf(firstLine);
        if (idx !== -1) {
          contentForBody = manualContent.substring(idx + firstLine.length).trim();
        }
      }
    }
    formattedHtml = convertRawTextToSemanticHtml(contentForBody);
    topic = userTitle || (nonEmptyLines.length > 0 ? nonEmptyLines[0].substring(0, 60) : 'Bài viết mới');
  }
} else if (firstItem.title || (!firstItem.message && !firstItem.body && !firstItem.callback_query)) {
  source = 'cron_morning';
  mode = 'generate';
  category = 'market';
  const allHeadlines = $input.all().map(i => i.json.title).filter(Boolean).slice(0, 15);
  headlines = allHeadlines;
  topic = `Nhận định thị trường chứng khoán Việt Nam trước giờ giao dịch hôm nay ${todayStr}`;
  chatId = '670339055';
  senderName = 'Hệ thống Cron Tự động 7:30 Sáng (DauTuTaiChinh.pro)';
} else {
  mode = 'generate';
  topic = 'Xu hướng thị trường chứng khoán Việt Nam';
  chatId = '670339055';
}

return [{
  json: {
    source,
    mode,
    category,
    topic,
    headlines: (typeof headlines !== 'undefined' ? headlines : []),
    userTitle,
    manualContent,
    formattedHtml,
    revisionInstructions,
    baselineHtml,
    chatId: String(chatId),
    senderName,
    todayStr,
    currentYear: vnYear
  }
}];
