# QUY CHUẨN TỐI ƯU HÓA SEO & GEO TOÀN DIỆN CHO DAUTUTAICHINH.PRO
*Tài liệu kỹ thuật đồng bộ giữa các Agent Antigravity, n8n Automation và AI Dashboard*
*Ngày cập nhật: 27/10/2026*

---

## 1. Mục Tiêu Chiến Lược
Website `daututaichinh.pro` áp dụng chiến lược **Dual-Optimization**:
1. **Google SEO truyền thống (Top 1-3 Google):** Đón người dùng tìm kiếm từ khóa, bài phân tích, nhận định vĩ mô.
2. **Generative Engine Optimization (GEO):** Trở thành nguồn trích dẫn hàng đầu khi người dùng hỏi các AI Assistants (ChatGPT Search, Perplexity AI, Claude, Gemini, Microsoft Copilot).

---

## 2. Các Quy Chuẩn Kỹ Thuật Bắt Buộc

### 2.1. Định dạng Ngày Tháng: Chuẩn Việt Nam `DD/MM/YYYY`
- Mọi hiển thị ngày tháng ở phía người dùng (Trang chủ, Catalog chuyên mục, bài viết, search dropdown, related articles) **BẮT BUỘC** hiển thị dạng `DD/MM/YYYY` (ví dụ: `27/10/2026`).
- Ngày lưu trong file `_catalog.json` dùng `YYYY-MM-DD` để sắp xếp, nhưng khi render ra giao diện phải luôn đi qua hàm format `formatVnDate()` để thành `DD/MM/YYYY`.

### 2.2. Tiêu chuẩn `llms.txt` (Dành riêng cho Bot AI)
- File gốc: `https://daututaichinh.pro/llms.txt`.
- Khi xuất bản bất kỳ bài viết mới nào (qua n8n hoặc AI Dashboard), hệ thống **tự động thêm một dòng** vào mục `## Key Analytical Reports` theo định dạng:
  `- [Tiêu đề bài viết](https://daututaichinh.pro/{category}/{slug}.html): Tóm tắt 1-2 câu`

### 2.3. Tiêu chuẩn `robots.txt`
- Đã mở cửa hoàn toàn cho tất cả các bot AI: `GPTBot`, `ChatGPT-User`, `PerplexityBot`, `ClaudeBot`, `anthropic-ai`, `Google-Extended`, `Applebot-Extended`, `Bingbot`, `cohere-ai`.
- Khai báo rõ ràng đường dẫn tới `sitemap.xml` và `llms.txt`.

### 2.4. Tiêu chuẩn Cấu trúc Nội dung (Content Structure)
- **Tóm tắt Chiến lược (Key Takeaways):**
  - Đặt ngay sau ảnh bìa bài viết.
  - *Đối với bài viết có số liệu:* Nêu 2-3 gạch đầu dòng kèm con số, phần trăm, tác động thị trường cụ thể.
  - *Đối với bài viết triết lý / định tính / tâm lý:* Nêu luận điểm cốt lõi và bài học hành động, **tuyệt đối KHÔNG gượng ép nhồi số liệu giả tạo**.
  - *Đối với bài ngắn, tản mạn:* Có thể bỏ qua khối tóm tắt.
- **Thẻ KPI (Stat Cards):**
  - Tự động sinh 2 đến 4 thẻ khi bài có số liệu định lượng quan trọng.
  - Bỏ qua hoàn toàn nếu là bài viết thuần văn bản.
- **Dữ liệu tĩnh (Static HTML):**
  - Mọi bảng biểu số liệu phải dùng thẻ `<table>` hoặc `<div>` tĩnh có sẵn trong mã HTML. Tuyệt đối không dùng AJAX/JavaScript để load số liệu, giúp AI Crawlers quét là thấy ngay.

### 2.5. Tự động đồng bộ `sitemap.xml`
- Mọi bài viết mới phải được tự động chèn vào `sitemap.xml` kèm thẻ ngày `<lastmod>` theo ngày xuất bản thực tế, đồng thời cập nhật `<lastmod>` của trang chủ và trang chuyên mục tương ứng.

---

## 3. Trạng Thái Hệ Thống Tự Động Hóa (Đã kích hoạt)
- **AI Dashboard (`AI-Dashboard.html`):** Đã tích hợp quy trình 5 bước tự động (Push bài $\rightarrow$ Catalog $\rightarrow$ Homepage DD/MM/YYYY $\rightarrow$ Sitemap.xml $\rightarrow$ llms.txt).
- **n8n Automation (`n8n.kotaduck.cc` - ID: `I1s1oP386rgDTF0F`):** Node `GitHub API Auto-Publish & Catalog Sync` đã được cập nhật trực tiếp để tự động sync `sitemap.xml`, `llms.txt` và `index.html`.
