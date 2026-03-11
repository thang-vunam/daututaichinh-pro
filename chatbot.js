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
// URL của Cloudflare Worker proxy (thay đổi sau khi deploy Worker)
const CHATBOT_WORKER_URL = 'https://chatbot-api.thangvu-dht.workers.dev';

// Google Sheets endpoint (dùng chung với lead-form.js)
const CHATBOT_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxD7TnNMKJGKb-ZOLKj1QESmy_c3bQ6lrXjlwn4fVbQh1yXcubwLnM19ellixFLjYOYog/exec';

// Zalo group
const CHATBOT_ZALO_URL = 'https://zalo.me/g/pvscez363';

// ─── System Prompt ──────────────────────────────────────
const SYSTEM_PROMPT = `Bạn là "Trợ lý Đầu tư" — chatbot AI chính thức của website daututaichinh.pro, thuộc kênh YouTube "Đầu tư & Tài chính chuyên sâu".

## Vai trò & Tính cách
- Thân thiện, chuyên nghiệp, nói chuyện như một người bạn am hiểu tài chính
- Trả lời ngắn gọn, dễ hiểu (tối đa 3-4 đoạn ngắn)
- Sử dụng emoji phù hợp để tạo không khí thân thiện
- Xưng "mình" và gọi người dùng là "bạn"

## Chuyên môn
- Chứng khoán Việt Nam (VN-Index, cổ phiếu, phân tích)
- Tài chính cá nhân (tiết kiệm, đầu tư, quản lý tiền)
- Bảo hiểm nhân thọ
- Kiến thức đầu tư cơ bản cho người mới

## Nội dung website có thể gợi ý
- Kênh YouTube: https://www.youtube.com/@dautuvataichinhchuyensau
- Nhóm Zalo cộng đồng: ${CHATBOT_ZALO_URL}
- Trang tài liệu: /download/ (có tài liệu PDF miễn phí về đầu tư)
- Bài phân tích chuyên sâu trên website

## Quy tắc QUAN TRỌNG
1. LUÔN gắn disclaimer khi nói về đầu tư cụ thể: "⚠️ Đây chỉ là thông tin tham khảo, không phải lời khuyên đầu tư."
2. KHÔNG đưa ra khuyến nghị mua/bán cổ phiếu cụ thể
3. KHÔNG hứa hẹn lợi nhuận
4. Khi người dùng hỏi về phân tích cổ phiếu → gợi ý xem video trên kênh YouTube
5. Khi phù hợp, gợi ý tham gia nhóm Zalo hoặc tải tài liệu miễn phí
6. Trả lời bằng tiếng Việt (trừ khi người dùng dùng tiếng Anh)
7. Nếu câu hỏi ngoài chuyên môn tài chính → trả lời ngắn gọn và hướng lại về chủ đề tài chính`;

// ─── State ──────────────────────────────────────────────
let chatHistory = [];
let messageCount = 0;
let leadCollected = false;
let isWaitingResponse = false;
let chatbotInitialized = false;
let welcomeShown = false;

// ─── Build UI ───────────────────────────────────────────
function initChatbot() {
  if (chatbotInitialized) return;
  chatbotInitialized = true;

  // Check if lead was already collected
  leadCollected = localStorage.getItem('chatbotLeadCollected') === 'yes'
                || localStorage.getItem('formSubmitted') === 'yes';

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
      <button class="chat-quick-btn" data-msg="Chứng khoán là gì?">📈 Chứng khoán cơ bản</button>
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

    // Smart lead collection (after 3-4 messages, if not yet collected)
    if (!leadCollected && messageCount >= 3 && messageCount % 3 === 0) {
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
  const leadHTML = `
    💡 Nhân tiện, mình có kho tài liệu đầu tư miễn phí (PDF phân tích, mô hình Excel...).
    <br><br>
    Bạn muốn mình gửi cho không? Chỉ cần để lại email hoặc tham gia nhóm Zalo nhé!
    <div class="chat-welcome-actions" style="margin-top:10px">
      <button class="chat-welcome-btn" onclick="openLeadPopup()">📥 Nhận tài liệu miễn phí</button>
      <a class="chat-welcome-btn" href="${CHATBOT_ZALO_URL}" target="_blank" rel="noopener">💬 Tham gia nhóm Zalo</a>
    </div>
  `;
  addMessage('bot', leadHTML);
}

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
function addMessage(sender, html) {
  const messagesEl = document.getElementById('chatbot-messages');
  const avatarEmoji = sender === 'bot' ? '🤖' : '👤';

  const msgEl = document.createElement('div');
  msgEl.className = `chat-msg ${sender}`;
  msgEl.innerHTML = `
    <div class="chat-msg-avatar">${avatarEmoji}</div>
    <div class="chat-msg-bubble">${html}</div>
  `;

  messagesEl.appendChild(msgEl);
  scrollToBottom();
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
  return text
    // Bold: **text** → <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic: *text* → <em>text</em>
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    // Links: [text](url) → <a>
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // Bullet points: lines starting with - or •
    .replace(/^[\-•]\s+(.+)/gm, '• $1')
    // Line breaks
    .replace(/\n/g, '<br>');
}


// ─── Auto Initialize ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Delay chatbot init a bit so it doesn't interfere with page load
  setTimeout(() => initChatbot(), 2000);
});
