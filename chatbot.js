/**
 * ================================================
 * AI CHATBOT — daututaichinh.pro
 * Gemini API via Cloudflare Workers Proxy
 * ================================================
 *
 * FLOW: User sends message → Cloudflare Worker → Gemini API → Response
 * FEATURES: AI Chat, Lead Collection, Content Suggestions
 */

// ─── Configuration ───────────────────────────────────────
// Endpoint Vercel Serverless Function (đã gom cứng ở Singapore)
const CHATBOT_WORKER_URL = '/api/chat';

// Google Sheets endpoint (dùng chung với lead-form.js)
const CHATBOT_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxD7TnNMKJGKb-ZOLKj1QESmy_c3bQ6lrXjlwn4fVbQh1yXcubwLnM19ellixFLjYOYog/exec';

// Zalo group
const CHATBOT_ZALO_URL = 'https://zalo.me/g/pvscez363';

// ─── System Prompt ──────────────────────────────────────
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
- Xu hướng giá (uptrend, downtrend, sideway)
- Các mức hỗ trợ/kháng cự quan trọng. Tuyệt đối không "bịa" ra mức hỗ trợ nếu không chắc chắn. Dùng mức giá gần nhất làm mốc.
- Chỉ mô tả ngắn gọn, không định nghĩa lại MA, RSI.

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
6. Nếu câu hỏi ngoài chuyên môn tài chính → trả lời ngắn gọn và hướng lại về chủ đề tài chính
7. Khi search Google để lấy dữ liệu, hãy ưu tiên nguồn: CafeF, VnDirect, TCBS, Fireant, Simplize, VNExpress
8. 📌 QUY TẮC PHÂN TÍCH GIÁ: Hệ thống sẽ tự động cung cấp [DỮ LIỆU BẢNG ĐIỆN TỬ] cho bạn ở hậu đài. Khi được cấp số liệu này, BẮT BUỘC dùng nó để lập tức trả lời khách hàng. Nếu ngày giao dịch là hôm qua, hãy trả lời tự nhiên: "Vì hôm nay cuối tuần, giá đóng cửa tại ngày... là..."`;

// ─── State ──────────────────────────────────────────────
let chatHistory = [];
let messageCount = 0;
let formDone = false;   // User đã submit form nhận tài liệu
let zaloDone = false;   // User đã click tham gia Zalo
let isWaitingResponse = false;
let chatbotInitialized = false;
let welcomeShown = false;

// ─── Build UI ───────────────────────────────────────────
function initChatbot() {
  if (chatbotInitialized) return;
  chatbotInitialized = true;

  // Check saved states separately
  formDone = localStorage.getItem('formSubmitted') === 'yes'
           || localStorage.getItem('chatbotLeadCollected') === 'yes';
  zaloDone = localStorage.getItem('zaloJoined') === 'yes';

  // Create toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'chatbot-toggle';
  toggleBtn.id = 'chatbot-toggle';
  toggleBtn.setAttribute('aria-label', 'Mở chatbot');
  toggleBtn.innerHTML = `
    <span class="chat-icon">💬</span>
    <span class="close-icon">✕</span>
    <span class="chatbot-badge" id="chatbot-badge" style="display:none">1</span>
    <span class="chatbot-label">Chat với AI</span>
  `;
  document.body.appendChild(toggleBtn);

  // Create chat window
  const chatWindow = document.createElement('div');
  chatWindow.className = 'chatbot-window';
  chatWindow.id = 'chatbot-window';
  chatWindow.innerHTML = `
    <!-- Header -->
    <div class="chatbot-header">
      <div class="chatbot-avatar">🤖</div>
      <div class="chatbot-header-info">
        <div class="chatbot-header-title">Trợ lý Đầu tư AI</div>
        <div class="chatbot-header-status">Đang hoạt động</div>
      </div>
      <button class="chatbot-header-close" id="chatbot-close" aria-label="Đóng chat">✕</button>
    </div>

    <!-- Messages -->
    <div class="chatbot-messages" id="chatbot-messages"></div>

    <!-- Quick Actions -->
    <div class="chat-quick-actions" id="chat-quick-actions">
      <button class="chat-quick-btn" data-msg="Phân tích cổ phiếu SSI">📊 Phân tích cổ phiếu</button>
      <button class="chat-quick-btn" data-msg="Tôi muốn bắt đầu đầu tư, nên làm gì?">🚀 Bắt đầu đầu tư</button>
      <button class="chat-quick-btn" data-msg="Có tài liệu miễn phí nào không?">📥 Tài liệu miễn phí</button>
    </div>

    <!-- Input -->
    <div class="chatbot-input-area">
      <textarea
        class="chatbot-input"
        id="chatbot-input"
        placeholder="Hỏi bất kỳ câu hỏi nào về đầu tư..."
        rows="1"
      ></textarea>
      <button class="chatbot-send" id="chatbot-send" aria-label="Gửi">
        ➤
      </button>
    </div>

    <!-- Disclaimer -->
    <div class="chatbot-disclaimer">
      ⚠️ Thông tin chỉ mang tính tham khảo, không phải lời khuyên đầu tư.
    </div>
  `;
  document.body.appendChild(chatWindow);

  // Bind events
  bindChatEvents();

  // Show welcome message when chat is first opened (lazy)
  // Don't auto-pop anything — user clicks the button when ready
}


// ─── Event Bindings ─────────────────────────────────────
function bindChatEvents() {
  const toggleBtn = document.getElementById('chatbot-toggle');
  const closeBtn = document.getElementById('chatbot-close');
  const sendBtn = document.getElementById('chatbot-send');
  const input = document.getElementById('chatbot-input');

  // Toggle chat window
  toggleBtn.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', toggleChat);

  // Send message
  sendBtn.addEventListener('click', sendMessage);

  // Enter to send (Shift+Enter for new line)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  });

  // Quick action buttons
  document.querySelectorAll('.chat-quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const msg = btn.dataset.msg;
      if (msg) {
        document.getElementById('chatbot-input').value = msg;
        sendMessage();
      }
    });
  });
}


// ─── Toggle Chat ────────────────────────────────────────
function toggleChat() {
  const chatWindow = document.getElementById('chatbot-window');
  const toggleBtn = document.getElementById('chatbot-toggle');
  const badge = document.getElementById('chatbot-badge');

  const isOpen = chatWindow.classList.toggle('open');
  toggleBtn.classList.toggle('active', isOpen);

  if (isOpen) {
    badge.style.display = 'none';
    // Show welcome message on first open
    if (!welcomeShown) {
      welcomeShown = true;
      showWelcomeMessage();
    }
    document.getElementById('chatbot-input').focus();
    scrollToBottom();
  }
}


// ─── Welcome Message ────────────────────────────────────
function showWelcomeMessage() {
  const welcomeHTML = `
    Xin chào! 👋 Mình là <strong>Trợ lý Đầu tư AI</strong> của daututaichinh.pro.
    <br><br>
    Mình có thể giúp bạn về:
    <div class="chat-welcome-actions">
      <button class="chat-welcome-btn" onclick="quickSend('Giải thích về chứng khoán cho người mới')">📈 Kiến thức chứng khoán</button>
      <button class="chat-welcome-btn" onclick="quickSend('Hướng dẫn quản lý tài chính cá nhân')">💰 Tài chính cá nhân</button>
      <button class="chat-welcome-btn" onclick="quickSend('Cho tôi xem video mới nhất')">🎬 Video phân tích thị trường</button>
      <button class="chat-welcome-btn" onclick="quickSend('Tôi muốn nhận tài liệu đầu tư miễn phí')">📥 Tài liệu miễn phí</button>
    </div>
  `;
  addMessage('bot', welcomeHTML);
}

// Quick send from welcome buttons
function quickSend(msg) {
  document.getElementById('chatbot-input').value = msg;
  sendMessage();
}
// Make it accessible globally
window.quickSend = quickSend;


// ─── Send Message ───────────────────────────────────────
async function sendMessage() {
  const input = document.getElementById('chatbot-input');
  const text = input.value.trim();

  if (!text || isWaitingResponse) return;

  // Add user message
  addMessage('user', escapeHtml(text));
  input.value = '';
  input.style.height = 'auto';
  messageCount++;

  // Hide quick actions after first message
  const quickActions = document.getElementById('chat-quick-actions');
  if (quickActions && messageCount >= 1) {
    quickActions.style.display = 'none';
  }

  // Check for worker URL
  if (CHATBOT_WORKER_URL === 'YOUR_CLOUDFLARE_WORKER_URL_HERE') {
    addMessage('bot', '⚠️ Chatbot chưa được cấu hình. Vui lòng thiết lập Cloudflare Worker URL trong <code>chatbot.js</code>.<br><br>Xem hướng dẫn trong file <code>HUONG-DAN-SETUP.md</code>.');
    return;
  }

  // Show typing indicator
  showTyping();
  isWaitingResponse = true;
  updateSendButton();

  try {
    // Add to chat history for context
    chatHistory.push({ role: 'user', parts: [{ text }] });

    // Keep only last 20 messages to avoid token limit
    if (chatHistory.length > 20) {
      chatHistory = chatHistory.slice(-20);
    }

    // Call Cloudflare Worker
    const response = await fetch(CHATBOT_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        history: chatHistory,
        systemPrompt: SYSTEM_PROMPT
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const botReply = data.reply || 'Xin lỗi, mình không thể trả lời lúc này. Vui lòng thử lại! 😊';

    // Remove typing and show response
    removeTyping();
    addMessage('bot', formatBotMessage(botReply));

    // Add to history
    chatHistory.push({ role: 'model', parts: [{ text: botReply }] });

    // Smart lead collection (after 3 messages, if there's still something to show)
    if (!(formDone && zaloDone) && messageCount >= 3 && messageCount % 3 === 0) {
      setTimeout(() => suggestLeadCollection(), 1500);
    }

  } catch (error) {
    console.error('Chatbot error:', error);
    removeTyping();
    addMessage('bot',
      '❌ Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.<br><br>' +
      '💡 Trong lúc chờ, bạn có thể:<br>' +
      `• <a href="https://www.youtube.com/@dautuvataichinhchuyensau" target="_blank">Xem video trên YouTube</a><br>` +
      `• <a href="${CHATBOT_ZALO_URL}" target="_blank">Tham gia nhóm Zalo</a>`
    );
  } finally {
    isWaitingResponse = false;
    updateSendButton();
  }
}


// ─── Lead Collection ────────────────────────────────────
function suggestLeadCollection() {
  // Re-check states in case user just submitted form or clicked Zalo
  formDone = localStorage.getItem('formSubmitted') === 'yes'
           || localStorage.getItem('chatbotLeadCollected') === 'yes';
  zaloDone = localStorage.getItem('zaloJoined') === 'yes';

  // Both done → don't show anything
  if (formDone && zaloDone) return;

  let messageText = '';
  let buttonsHTML = '';

  if (!formDone && !zaloDone) {
    // Neither done → show both
    messageText = '💡 Nhân tiện, mình có kho tài liệu đầu tư miễn phí (PDF phân tích, mô hình Excel...).<br><br>Bạn muốn mình gửi cho không? Chỉ cần để lại email hoặc tham gia nhóm Zalo nhé!';
    buttonsHTML = `
      <button class="chat-welcome-btn" onclick="openLeadPopup()">📥 Nhận tài liệu miễn phí</button>
      <a class="chat-welcome-btn" href="${CHATBOT_ZALO_URL}" target="_blank" rel="noopener" onclick="markZaloJoined()">💬 Tham gia nhóm Zalo</a>
    `;
  } else if (formDone && !zaloDone) {
    // Form done → only show Zalo
    messageText = '💡 Nhân tiện, bạn đã nhận tài liệu rồi đúng không? Nếu muốn thảo luận thêm với cộng đồng nhà đầu tư, tham gia nhóm Zalo nhé!';
    buttonsHTML = `
      <a class="chat-welcome-btn" href="${CHATBOT_ZALO_URL}" target="_blank" rel="noopener" onclick="markZaloJoined()">💬 Tham gia nhóm Zalo</a>
    `;
  } else if (!formDone && zaloDone) {
    // Zalo done → only show form
    messageText = '💡 Nhân tiện, mình có kho tài liệu đầu tư miễn phí (PDF phân tích, mô hình Excel...). Bạn muốn nhận không?';
    buttonsHTML = `
      <button class="chat-welcome-btn" onclick="openLeadPopup()">📥 Nhận tài liệu miễn phí</button>
    `;
  }

  const leadHTML = `
    ${messageText}
    <div class="chat-welcome-actions" style="margin-top:10px">
      ${buttonsHTML}
    </div>
  `;
  addMessage('bot', leadHTML, true); // noScroll = true, don't interrupt user reading
}

// Mark Zalo as joined when user clicks the Zalo link
function markZaloJoined() {
  localStorage.setItem('zaloJoined', 'yes');
  zaloDone = true;
}
window.markZaloJoined = markZaloJoined;

// Open existing lead popup
function openLeadPopup() {
  if (typeof openPopup === 'function') {
    openPopup();
  } else {
    window.location.href = '/download/';
  }
}
window.openLeadPopup = openLeadPopup;


// ─── UI Helpers ─────────────────────────────────────────
function addMessage(sender, html, noScroll = false) {
  const messagesEl = document.getElementById('chatbot-messages');
  const avatarEmoji = sender === 'bot' ? '🤖' : '👤';

  const msgEl = document.createElement('div');
  msgEl.className = `chat-msg ${sender}`;
  msgEl.innerHTML = `
    <div class="chat-msg-avatar">${avatarEmoji}</div>
    <div class="chat-msg-bubble">${html}</div>
  `;

  messagesEl.appendChild(msgEl);

  // If noScroll is true (e.g. lead collection popup), don't scroll at all
  // to avoid interrupting user who is still reading above content
  if (noScroll) return;

  // Bot messages: scroll to the TOP of the new message so user reads from top down
  // User messages & others: scroll to bottom as usual
  if (sender === 'bot') {
    scrollToMessage(msgEl);
  } else {
    scrollToBottom();
  }
}

function showTyping() {
  const messagesEl = document.getElementById('chatbot-messages');
  const typingEl = document.createElement('div');
  typingEl.className = 'chat-typing';
  typingEl.id = 'chat-typing';
  typingEl.innerHTML = `
    <div class="chat-msg-avatar">🤖</div>
    <div class="chat-typing-dots">
      <span></span><span></span><span></span>
    </div>
  `;
  messagesEl.appendChild(typingEl);
  scrollToBottom();
}

function removeTyping() {
  const typing = document.getElementById('chat-typing');
  if (typing) typing.remove();
}

function scrollToBottom() {
  const messagesEl = document.getElementById('chatbot-messages');
  if (messagesEl) {
    requestAnimationFrame(() => {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }
}

// Scroll so the top of a specific message element is visible at the top of the chat area
function scrollToMessage(msgEl) {
  const messagesEl = document.getElementById('chatbot-messages');
  if (messagesEl && msgEl) {
    requestAnimationFrame(() => {
      // Scroll the messages container so the new message starts at the top
      messagesEl.scrollTop = msgEl.offsetTop - messagesEl.offsetTop;
    });
  }
}

function updateSendButton() {
  const sendBtn = document.getElementById('chatbot-send');
  if (sendBtn) sendBtn.disabled = isWaitingResponse;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Format bot markdown-like reply to HTML
function formatBotMessage(text) {
  let formatted = text
    // Bold: **text** → <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic: *text* → <em>text</em>
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    // Links: [text](url) → <a> (hỗ trợ cả link tuyệt đối https:// và link tương đối /download/)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // Bullet points: lines starting with - or •
    .replace(/^[\-•]\s+(.+)/gm, '• $1')
    // Line breaks
    .replace(/\n/g, '<br>');

  // Regex Auto-Link: Bắt các đường link trần chưa được gắn thể a (không nằm trong thẻ a href="...")
  // URL bắt đầu bằng http:// hoặc https://
  formatted = formatted.replace(/(?<!\bhref=["'])(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');

  return formatted;
}


// ─── Auto Initialize ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Delay chatbot init a bit so it doesn't interfere with page load
  setTimeout(() => initChatbot(), 2000);
});
