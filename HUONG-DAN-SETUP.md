# 📋 Hướng dẫn kết nối Form với Google Sheets

Hướng dẫn này giúp bạn kết nối form trên website với Google Sheets để tự động lưu thông tin khách hàng.

> ⏱ Thời gian thực hiện: **5-10 phút**
> 🔧 Yêu cầu: Tài khoản Google

---

## Bước 1: Tạo Google Sheets

1. Vào [Google Sheets](https://sheets.google.com) → tạo bảng tính mới
2. Đặt tên: **"Leads - daututaichinh.pro"**
3. Ở **dòng 1**, nhập các tiêu đề cột:

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| Timestamp | Name | Email | Phone | Interest | Source |

4. **Giữ nguyên bảng tính này**, không đóng tab.

---

## Bước 2: Tạo Google Apps Script

1. Trong bảng tính vừa tạo, vào menu **Extensions** → **Apps Script**
2. Xóa hết code mặc định
3. **Copy & Paste** đoạn code sau:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    sheet.appendRow([
      e.parameter.timestamp || new Date().toLocaleString('vi-VN'),
      e.parameter.name || '',
      e.parameter.email || '',
      e.parameter.phone || '',
      e.parameter.interest || '',
      e.parameter.source || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Nhấn **Ctrl + S** để lưu. Đặt tên project: **"Lead Form Handler"**

> ⚠️ **QUAN TRỌNG**: Nếu bạn đã deploy trước đó với code cũ (dùng JSON.parse), bạn cần **Deploy lại** (Bước 3) với **New deployment**, sau đó copy URL mới vào `lead-form.js`.

---

## Bước 3: Deploy Web App

1. Nhấn nút **Deploy** → **New deployment** (góc trên bên phải)
2. Nhấn ⚙ icon bên cạnh "Select type" → chọn **Web app**
3. Cấu hình:
   - **Description:** Lead Form Handler
   - **Execute as:** Me
   - **Who has access:** **Anyone** (quan trọng!)
4. Nhấn **Deploy**
5. Nhấn **Authorize access** → chọn tài khoản Google → cho phép
6. **Copy URL** hiện ra (dạng: `https://script.google.com/macros/s/xxx.../exec`)

---

## Bước 4: Dán URL vào code

1. Mở file **`lead-form.js`**
2. Tìm dòng đầu tiên:

```javascript
const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
```

3. Thay `'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'` bằng URL bạn vừa copy:

```javascript
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/xxxxx.../exec';
```

4. Lưu file.

---

## Bước 5: Push lên GitHub

```bash
git add .
git commit -m "Thêm lead capture form"
git push
```

Hoặc nếu bạn dùng **GitHub web**: upload các file sau lên repo:
- `lead-form.css` (root)
- `lead-form.js` (root)
- `index.html` (ghi đè file cũ)
- `download/index.html` (ghi đè file cũ)
- `download/phan-tich.html` (ghi đè file cũ)

---

## ✅ Kiểm tra

1. Vào website → đợi 5 giây → popup hiện lên
2. Điền form → nhấn "Nhận tài liệu miễn phí"
3. Kiểm tra **Google Sheets** → data xuất hiện ở dòng mới

---

## ❓ Gặp lỗi?

| Vấn đề | Cách khắc phục |
|---|---|
| Popup không hiện | Xóa cache browser hoặc mở Incognito |
| Data không vào Sheets | Kiểm tra URL trong `lead-form.js` đã đúng chưa |
| Lỗi "Authorization" | Deploy lại với "Anyone" trong Who has access |

Nếu vẫn gặp vấn đề, liên hệ để được hỗ trợ!

---
---

# 🤖 Hướng dẫn thiết lập Chatbot AI (Gemini)

Chatbot sử dụng **Cloudflare Workers** làm proxy để bảo mật Gemini API key (key không bao giờ lộ trên GitHub).

> ⏱ Thời gian thực hiện: **10-15 phút**
> 🔧 Yêu cầu: Tài khoản Google + Tài khoản Cloudflare (miễn phí)

---

## Bước 1: Lấy Gemini API Key

1. Vào [Google AI Studio](https://aistudio.google.com/apikey)
2. Nhấn **"Create API key"**
3. Chọn hoặc tạo project mới (gợi ý tên: `daututaichinh-chatbot`)
4. **Copy API key** (dạng: `AIzaSy...`)

> 💡 **Tip**: Nên tạo key riêng cho chatbot, không dùng chung với các project khác.

---

## Bước 2: Tạo Cloudflare Worker

1. Đăng ký/đăng nhập tại [dash.cloudflare.com](https://dash.cloudflare.com)
2. Vào menu **Workers & Pages** → nhấn **Create**
3. Chọn **"Create Worker"**
4. Đặt tên worker: `chatbot-api` (hoặc tên khác bạn muốn)
5. Nhấn **Deploy** (sẽ tạo worker mặc định "Hello World")
6. Nhấn **"Edit code"** (hoặc **Quick Edit**)
7. **Xóa hết code mặc định** → **Paste toàn bộ nội dung từ file `cloudflare-worker.js`**
8. Nhấn **Save and Deploy**

---

## Bước 3: Thêm API Key vào Worker

1. Quay lại trang Worker → vào tab **Settings**
2. Tìm mục **Variables and Secrets**
3. Nhấn **Add** → nhập:
   - **Variable name:** `GEMINI_API_KEY`
   - **Value:** Paste API key từ Bước 1
   - **Chọn "Encrypt"** (để bảo mật)
4. Nhấn **Save and Deploy**

> ⚠️ **QUAN TRỌNG**: API key được mã hóa trên Cloudflare, không ai có thể đọc được sau khi lưu — kể cả bạn (chỉ có thể thay thế).

---

## Bước 4: Dán Worker URL vào code

1. Trên trang Worker, copy URL (dạng: `https://chatbot-api.your-name.workers.dev`)
2. Mở file **`chatbot.js`**
3. Tìm dòng đầu tiên:

```javascript
const CHATBOT_WORKER_URL = 'YOUR_CLOUDFLARE_WORKER_URL_HERE';
```

4. Thay bằng URL Worker của bạn:

```javascript
const CHATBOT_WORKER_URL = 'https://chatbot-api.your-name.workers.dev';
```

5. Lưu file.

---

## Bước 5: Push lên GitHub

```bash
git add chatbot.css chatbot.js index.html
git commit -m "Thêm AI chatbot Gemini"
git push
```

> ⚠️ **KHÔNG push file `cloudflare-worker.js` lên GitHub** nếu bạn lo ngại (file này chỉ để tham khảo, code thực nằm trên Cloudflare).

---

## ✅ Kiểm tra Chatbot

1. Vào website → đợi 2 giây → icon chat 💬 xuất hiện ở góc phải dưới
2. Nhấn icon → cửa sổ chat mở ra
3. Gửi câu hỏi: "Chứng khoán là gì?" → Bot trả lời bằng tiếng Việt
4. Thử các nút gợi ý nhanh

---

## ❓ Gặp lỗi?

| Vấn đề | Cách khắc phục |
|---|---|
| Icon chat không hiển thị | Kiểm tra đã thêm `chatbot.css` và `chatbot.js` vào `index.html` |
| Bot báo "chưa cấu hình" | Kiểm tra `CHATBOT_WORKER_URL` trong `chatbot.js` |
| Bot không trả lời | Kiểm tra `GEMINI_API_KEY` đã được thêm trong Cloudflare Worker Settings |
| Lỗi CORS | Kiểm tra Worker đã deploy đúng code từ `cloudflare-worker.js` |

---

## 💡 Chi phí

| Dịch vụ | Chi phí |
|---|---|
| **Cloudflare Workers** | Miễn phí (100,000 requests/ngày) |
| **Gemini API** | Miễn phí (15 RPM cho Flash model) |
| **GitHub Pages** | Miễn phí |

→ Tổng chi phí: **$0** cho website cá nhân với traffic thông thường.
