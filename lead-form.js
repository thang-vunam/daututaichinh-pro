/**
 * ================================================
 * LEAD CAPTURE FORM — daututaichinh.pro
 * Popup + Inline | Google Sheets Integration
 * ================================================
 *
 * HƯỚNG DẪN:
 * Thay URL ở dòng bên dưới bằng URL Google Apps Script Web App của bạn.
 * Xem file HUONG-DAN-SETUP.md để biết cách lấy URL này.
 */

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxD7TnNMKJGKb-ZOLKj1QESmy_c3bQ6lrXjlwn4fVbQh1yXcubwLnM19ellixFLjYOYog/exec';

// Link nhóm Zalo
const ZALO_GROUP_URL = 'https://zalo.me/g/pvscez363';

// ─── Form HTML Template ──────────────────────────────────
function createFormHTML(formId) {
  return `
    <form class="lead-form" id="${formId}" autocomplete="on">
      <div class="form-group">
        <label for="${formId}-name">Họ và Tên <span class="required">*</span></label>
        <input type="text" id="${formId}-name" name="name" placeholder="Nguyễn Văn A" required autocomplete="name">
      </div>
      <div class="form-group">
        <label for="${formId}-email">Email <span class="required">*</span></label>
        <input type="email" id="${formId}-email" name="email" placeholder="email@example.com" required autocomplete="email">
      </div>
      <div class="form-group">
        <label for="${formId}-phone">Số điện thoại <span style="color:#64748b;font-weight:400">(không bắt buộc)</span></label>
        <input type="tel" id="${formId}-phone" name="phone" placeholder="0912 345 678" autocomplete="tel">
      </div>
      <div class="form-group">
        <label for="${formId}-interest">Bạn quan tâm đến <span class="required">*</span></label>
        <select id="${formId}-interest" name="interest" required>
          <option value="" disabled selected>— Chọn lĩnh vực —</option>
          <option value="Chứng khoán">📈 Chứng khoán</option>
          <option value="Bảo hiểm nhân thọ">🛡️ Bảo hiểm nhân thọ</option>
          <option value="Cả hai">📊 Cả hai (Chứng khoán & Bảo hiểm)</option>
          <option value="Khác">📂 Lĩnh vực khác</option>
        </select>
      </div>
      <button type="submit" class="btn-submit">
        <span class="btn-text">📥 Nhận tài liệu miễn phí</span>
        <span class="spinner"></span>
      </button>
      <div class="form-message" id="${formId}-message"></div>
      <p class="form-privacy">
        🔒 Thông tin của bạn được bảo mật và chỉ dùng để gửi tài liệu.
        Chúng tôi cam kết không chia sẻ cho bên thứ ba.
      </p>
    </form>
  `;
}

// ─── Submit to Google Sheets via hidden iframe (bypasses CORS) ───
function submitToGoogleSheets(data) {
  return new Promise((resolve) => {
    // Create hidden iframe
    const iframeName = 'lead-submit-iframe-' + Date.now();
    const iframe = document.createElement('iframe');
    iframe.name = iframeName;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Create hidden form
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = GOOGLE_SCRIPT_URL;
    form.target = iframeName;
    form.style.display = 'none';

    // Add form fields
    for (const [key, value] of Object.entries(data)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    }

    document.body.appendChild(form);

    // Listen for iframe load (submission complete)
    iframe.addEventListener('load', function() {
      // Clean up after a delay
      setTimeout(() => {
        document.body.removeChild(iframe);
        document.body.removeChild(form);
      }, 1000);
      resolve(true);
    });

    // Submit the form
    form.submit();

    // Fallback: resolve after 5s even if iframe doesn't fire load
    setTimeout(() => resolve(true), 5000);
  });
}

// ─── Form Submission Handler ─────────────────────────────
function handleFormSubmit(form) {
  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const formId = form.id;
    const btn = form.querySelector('.btn-submit');
    const msgEl = form.querySelector('.form-message');

    // Get values
    const name = form.querySelector(`#${formId}-name`).value.trim();
    const email = form.querySelector(`#${formId}-email`).value.trim();
    const phone = form.querySelector(`#${formId}-phone`).value.trim();
    const interest = form.querySelector(`#${formId}-interest`).value;

    // Validate
    if (!name || !email || !interest) {
      showMessage(msgEl, 'error', '⚠️ Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    if (!isValidEmail(email)) {
      showMessage(msgEl, 'error', '⚠️ Email không hợp lệ. Vui lòng kiểm tra lại.');
      return;
    }

    // Loading state
    btn.classList.add('loading');
    btn.disabled = true;
    msgEl.className = 'form-message';
    msgEl.style.display = 'none';

    try {
      // Send to Google Sheets via hidden iframe (reliable, no CORS issues)
      await submitToGoogleSheets({
        name: name,
        email: email,
        phone: phone || '(không có)',
        interest: interest,
        source: window.location.pathname,
        timestamp: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
      });

      // Mark as submitted
      localStorage.setItem('formSubmitted', 'yes');
      localStorage.setItem('leadName', name);

      // Show success with Zalo invite
      showMessage(msgEl, 'success',
        `✅ Cảm ơn <strong>${name}</strong>! Thông tin đã được ghi nhận.<br>
         Bạn có thể truy cập kho tài liệu ngay bây giờ.<br><br>
         💬 <strong>Tham gia nhóm Zalo</strong> để nhận phân tích thị trường & thảo luận cùng cộng đồng nhà đầu tư:<br>
         <a href="${ZALO_GROUP_URL}" target="_blank" rel="noopener" 
            style="display:inline-block;margin-top:8px;padding:10px 20px;background:#0068FF;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
           💬 Tham gia nhóm Zalo ngay
         </a>`
      );

      // If on download page, show downloads after 3s
      const downloadArea = document.getElementById('download-area');
      if (downloadArea) {
        setTimeout(() => {
          const needForm = document.getElementById('need-form');
          if (needForm) needForm.style.display = 'none';
          downloadArea.style.display = 'block';
          downloadArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 3000);
      }

      // Close popup after 5s (if popup) — give time to see Zalo button
      const popup = document.querySelector('.lead-popup-overlay.active');
      if (popup) {
        setTimeout(() => closePopup(), 5000);
      }

    } catch (err) {
      showMessage(msgEl, 'error',
        '❌ Đã xảy ra lỗi. Vui lòng thử lại hoặc liên hệ qua email: thangvu@phs.vn'
      );
      console.error('Form submission error:', err);
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  });
}

// ─── Utilities ───────────────────────────────────────────
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showMessage(el, type, html) {
  el.className = `form-message ${type}`;
  el.innerHTML = html;
  el.style.display = 'block';
}

// ─── Popup Logic ─────────────────────────────────────────
function createPopup() {
  const overlay = document.createElement('div');
  overlay.className = 'lead-popup-overlay';
  overlay.id = 'lead-popup';
  overlay.innerHTML = `
    <div class="lead-popup-card">
      <button class="lead-popup-close" aria-label="Đóng" onclick="closePopup()">✕</button>
      <div class="lead-popup-icon">📥</div>
      <h2 class="form-title">Nhận tài liệu đầu tư miễn phí</h2>
      <p class="form-subtitle">
        Kho tài liệu chọn lọc về chứng khoán, phân tích kỹ thuật, quản trị tài chính
        và nhiều hơn nữa. Hoàn toàn miễn phí!
      </p>
      ${createFormHTML('popup-form')}
    </div>
  `;
  document.body.appendChild(overlay);

  // Close when clicking outside
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closePopup();
  });

  // Close on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closePopup();
  });

  // Init form handler
  const form = document.getElementById('popup-form');
  if (form) handleFormSubmit(form);
}

function openPopup() {
  const popup = document.getElementById('lead-popup');
  if (popup) {
    popup.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closePopup() {
  const popup = document.getElementById('lead-popup');
  if (popup) {
    popup.classList.remove('active');
    document.body.style.overflow = '';
    // Remember popup was closed in this session
    sessionStorage.setItem('popupClosed', 'yes');
  }
}

// ─── Inline Form (Download page) ────────────────────────
function createInlineForm(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="lead-form-inline-wrapper">
      <h2 class="form-title">📋 Để lại thông tin để nhận tài liệu</h2>
      <p class="form-subtitle">
        Điền thông tin bên dưới để truy cập kho tài liệu đầu tư.
        Thông tin chỉ dùng để gửi tài liệu và cập nhật nội dung mới.
      </p>
      ${createFormHTML('inline-form')}
    </div>
  `;

  const form = document.getElementById('inline-form');
  if (form) handleFormSubmit(form);
}

// ─── Auto-init ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  const hasSubmitted = localStorage.getItem('formSubmitted') === 'yes';

  // === POPUP (only on pages that have the popup marker) ===
  if (document.querySelector('[data-lead-popup]')) {
    createPopup();

    // Auto-show popup after 5s (only if not submitted & not closed in session)
    if (!hasSubmitted && sessionStorage.getItem('popupClosed') !== 'yes') {
      setTimeout(() => openPopup(), 5000);
    }
  }

  // === CTA BUTTON ===
  const ctaBtn = document.getElementById('cta-open-popup');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', function(e) {
      e.preventDefault();
      // Check localStorage at click time (not stale closure)
      if (localStorage.getItem('formSubmitted') === 'yes') {
        // Already submitted, go to download page
        window.location.href = '/download/';
      } else {
        openPopup();
      }
    });
  }

  // === INLINE FORM (Download page) ===
  const inlineContainer = document.getElementById('need-form');
  if (inlineContainer && !hasSubmitted) {
    createInlineForm('need-form');
  }
});
