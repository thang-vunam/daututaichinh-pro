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
