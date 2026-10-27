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

### 2.1. Quy chuẩn Liên Kết Thông Minh (Smart Linking Rules - BẮT BUỘC)
Mọi bài viết sinh ra (từ AI Dashboard hoặc n8n) **BẮT BUỘC** tích hợp cả Internal Link và External Link theo cơ chế **Cầu nối 3 tầng linh hoạt**:

#### A. Liên kết nội bộ (Internal Links - 1 đến 2 link):
- **Tầng 1 (Cùng chủ đề):** Nếu bài viết có điểm chạm, chèn link tự nhiên tới bài liên quan có thật:
  - *Thị trường & Vĩ mô:* `/market/vn-index-1850-diem-thi-truong-chung-khoan.html`, `/blog/msci-ha-xep-hang-indonesia-tac-dong-viet-nam.html`, `/blog/nang-hang-thi-truong-vnindex-giam-diem.html`.
  - *Cổ phiếu:* `/market/co-phieu-ssi-kich-ban-q1-2026-va-nang-hang-thi-truong.html`, `/blog/pvs-loi-nhuan-q1-2026-lo-b-dau-on-dinh.html`, `/blog/co-phieu-pnj-ke-hoach-lo-ky-luc.html`.
  - *Bất động sản:* `/blog/bat-dong-san-viet-nam-2026-phuc-hoi-khong-dong-deu-dau-la-co-hoi-vang.html`.
- **Tầng 2 (Cầu nối dự phòng an toàn):** Nếu bài viết mới hoàn toàn không liên quan đến bài cũ nào, **BẮT BUỘC** liên kết mượt mà về một trong các Trang Cột Trụ (Hub Pages):
  - Trang nhận định: `<a href="/market/">nhận định thị trường chứng khoán</a>`
  - Trang kiến thức: `<a href="/blog/">kiến thức đầu tư chuyên sâu</a>`
  - Trang tài liệu: `<a href="/download/">tài liệu đầu tư tài chính miễn phí</a>`
- **Tầng 3:** TUYỆT ĐỐI KHÔNG tự bịa ra link hoặc slug không có thật (loại bỏ hoàn toàn rủi ro link 404).

#### B. Liên kết ngoài uy tín (Outbound / External Links - 1 link):
- Bắt buộc trích dẫn nguồn uy tín từ Danh sách trắng (Whitelist) kèm `target='_blank' rel='noopener'`:
  - *Chứng khoán:* HOSE (`https://www.hsx.vn`), HNX (`https://www.hnx.vn`), UBCKNN (`https://ssc.gov.vn`).
  - *Lãi suất, tỷ giá, vàng:* Ngân hàng Nhà nước (`https://sbv.gov.vn`).
  - *Lạm phát, GDP, kinh tế vĩ mô:* Tổng cục Thống kê (`https://gso.gov.vn`).
  - *Kinh tế toàn cầu:* World Bank (`https://www.worldbank.org`), Bloomberg, Reuters.

---

### 2.2. Định dạng Ngày Tháng: Chuẩn Việt Nam `DD/MM/YYYY`
- Mọi hiển thị ngày tháng ở phía người dùng (Trang chủ, Catalog chuyên mục, bài viết, search dropdown, related articles) **BẮT BUỘC** hiển thị dạng `DD/MM/YYYY` (ví dụ: `27/10/2026`).

### 2.3. Tiêu chuẩn `llms.txt` (Dành riêng cho Bot AI)
- File gốc: `https://daututaichinh.pro/llms.txt`.
- Khi xuất bản bất kỳ bài viết mới nào (qua n8n hoặc AI Dashboard), hệ thống **tự động thêm một dòng** vào mục `## Key Analytical Reports` theo định dạng:
  `- [Tiêu đề bài viết](https://daututaichinh.pro/{category}/{slug}.html): Tóm tắt 1-2 câu`

### 2.4. Tiêu chuẩn `robots.txt`
- Đã mở cửa hoàn toàn cho tất cả các bot AI: `GPTBot`, `ChatGPT-User`, `PerplexityBot`, `ClaudeBot`, `anthropic-ai`, `Google-Extended`, `Applebot-Extended`, `Bingbot`, `cohere-ai`.

### 2.5. Tiêu chuẩn Cấu trúc Nội dung (Content Structure)
- **Tóm tắt Chiến lược (Key Takeaways):**
  - Đặt ngay sau ảnh bìa bài viết.
  - *Đối với bài viết có số liệu:* Nêu 2-3 gạch đầu dòng kèm con số, phần trăm, tác động thị trường cụ thể.
  - *Đối với bài viết triết lý / định tính / tâm lý:* Nêu luận điểm cốt lõi và bài học hành động, **tuyệt đối KHÔNG gượng ép nhồi số liệu giả tạo**.
  - *Đối với bài ngắn, tản mạn:* Có thể bỏ qua khối tóm tắt.
- **Dữ liệu tĩnh (Static HTML):**
  - Mọi bảng biểu số liệu phải dùng thẻ `<table>` hoặc `<div>` tĩnh có sẵn trong mã HTML. Tuyệt đối không dùng AJAX/JavaScript để load số liệu, giúp AI Crawlers quét là thấy ngay.

---

## 3. Trạng Thái Hệ Thống Tự Động Hóa (Đã kích hoạt trên Live Production)
- **AI Dashboard (`AI-Dashboard.html`):** Đã tích hợp quy trình 5 bước tự động (Push bài $\rightarrow$ Catalog $\rightarrow$ Homepage DD/MM/YYYY $\rightarrow$ Sitemap.xml $\rightarrow$ llms.txt) và Prompt Smart Linking 3 tầng.
- **n8n Automation (`n8n.kotaduck.cc` - ID: `I1s1oP386rgDTF0F`):** Gemini Prompt và Node `GitHub API Auto-Publish & Catalog Sync` đã được cập nhật trực tiếp để tự động chèn liên kết thông minh, cập nhật `sitemap.xml`, `llms.txt` và `index.html`.
