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

### 2.6. Quy Chuẩn Viết Hoa Tiêu Đề Bài Viết (Headline Casing - NGUYÊN TẮC BẮT BUỘC)
- **BẮT BUỘC áp dụng dạng Sentence Case** cho toàn bộ tiêu đề bài viết (`title`, `<h1>`, `og:title`, `schema headline`, danh mục bài viết và trang chủ):
  - **Chỉ viết hoa:** Ký tự đầu tiên của tiêu đề, ký tự sau dấu hai chấm (`: `), dấu hỏi (`? `), dấu chấm than (`! `), và danh từ riêng/mã chứng khoán (`VN-Index`, `SSI`, `FPT`, `Việt Nam`, `Mỹ`...).
  - **TUYỆT ĐỐI CẤM:** Viết hoa chữ cái đầu của từng từ (*Title Case* - ví dụ: ❌ *Tháo Kíp Nổ Tâm Lý Thị Trường...*). Phải viết chuẩn Sentence Case: ✅ *Tháo kíp nổ tâm lý thị trường chứng khoán tuần 02/11–06/11/2026: 4 sự thật ngược đời phía sau nhịp điều chỉnh*.
- **Lý do kỹ thuật & SEO:**
  1. *SERP Pixel Limit:* Ký tự in hoa chiếm nhiều pixel bề ngang hơn chữ thường 30% - 50%, dễ bị Google cắt cụt `...` trên trang kết quả tìm kiếm.
  2. *CTR & Tâm lý độc giả:* Tiếng Việt dùng Sentence Case tạo cảm giác tự nhiên, tin cậy, chuẩn báo chí tài chính chuyên nghiệp; Title Case gây cảm giác spam, giật cục và giảm tỷ lệ nhấp chuột.
  3. *Tránh Google Title Rewrite:* Tránh việc thuật toán Google tự động viết lại tiêu đề khác ý đồ tác giả do viết hoa bất thường.

### 2.7. Quy Chuẩn Khối Trích Dẫn (Blockquote Styling)
- **Thanh viền bên trái (Accent Bar):** BẮT BUỘC dùng **màu trắng tinh tế** `border-left: 3px solid #ffffff;`. TUYỆT ĐỐI KHÔNG dùng viền màu vàng (`#fbbf24`) gây chói mắt và rối giao diện.
- **Màu nền:** Dùng nền kính tối nhẹ trung tính `rgba(255, 255, 255, 0.03);` (loại bỏ hoàn toàn dải màu vàng `linear-gradient yellow`).
- **Khoảng cách:** `margin: 18px 0; padding: 12px 18px;` tạo sự thanh thoát, gọn gàng và tôn vinh nội dung câu trích dẫn.

### 2.8. Quy Chuẩn Khoảng Cách & Phân Mục (Spacing & Typography)
- **Cấm tuyệt đối dấu gạch ngang thô (`---`):** Không dùng `---` hoặc `<p>---</p>` để phân cách đoạn văn; các phân mục nội dung phải được dẫn dắt tự nhiên bằng các thẻ `<h2>` và `<h3>`.
- **Gắn kết tiêu đề mục con:** Áp dụng `h2 + h3 { margin-top: 8px !important; }` để khi mục `<h3>` nằm ngay sau `<h2>`, khoảng cách hiển thị gắn kết chặt chẽ như tiêu đề chương và phân mục, không tạo khoảng trống đứt gãy.
- **Khoảng cách tiêu chuẩn:**
  - `h2`: `margin: 30px 0 12px;`
  - `h3`: `margin: 20px 0 10px;`
  - Đoạn văn `<p>`: `margin: 0 0 15px;`
  - Danh sách ý (`.article-sub-list`): `margin: 10px 0;` (các mục con `margin: 6px 0;`).

### 2.9. Quy Chuẩn Tự Động Hóa FAQ & Rich Snippets (Automated FAQ - 100% Tự Động)
- **Cơ chế tự động hóa hoàn toàn:** Hệ thống n8n tự động phân tích toàn bộ nội dung bài viết để sinh ĐÚNG 3 câu hỏi và câu trả lời thường gặp (FAQ) thiết thực nhất, đào sâu trực tiếp vào các nghịch lý, số liệu hoặc vấn đề trọng tâm của bài. Người dùng KHÔNG CẦN customize thủ công.
- **Tiêu chuẩn Schema.org FAQPage:** Tự động trích xuất các cặp Hỏi - Đáp này thành Schema JSON-LD `FAQPage` nhúng vào `<head>` để Google hiển thị Rich Snippets trực tiếp trên SERP.
- **Cơ chế Accordion tương tác:**
  - Không nhúng thuộc tính nội dòng `style="display:none"` làm kẹt trạng thái mở.
  - Sử dụng class `.active` với `.faq-item.active .faq-answer { display: block !important; }` và hiệu ứng xoay mũi tên chevron `.fa-chevron-down` mượt mà.

---

### 2.10. Quy Chuẩn Liên Kết Nội Bộ & Bộ Lọc Phòng Vệ Chống 404 (Internal Linking & Anti-Hallucination)
- **Nguyên nhân cốt lõi của lỗi 404:** LLM (Gemini) khi viết bài thường có xu hướng "tự bịa" ra các đường link bài viết không tồn tại (như `/market/bao-cao-thi-truong-quy-4-2026` hay `/blog/chien-luoc-dau-tu-gia-tri-trong-thi-truong-bien-dong`), dẫn độc giả đến trang lỗi `404 NOT_FOUND`.
- **Nguyên tắc Whitelist nghiêm ngặt từ Prompt:**
  - AI chỉ được phép trỏ liên kết nội bộ về 3 Trang Hub chính thức:
    + `<a href="/market/">nhận định thị trường</a>`
    + `<a href="/blog/">kiến thức đầu tư chuyên sâu</a>`
    + `<a href="/download/">tài liệu đầu tư tài chính miễn phí</a>`
    + Hoặc các trang tra cứu định giá VN30: `<a href="/co-phieu/{ticker}.html">cổ phiếu {TICKER}</a>` (với {ticker} thuộc 31 mã VN30 được hỗ trợ).
  - TUYỆT ĐỐI KHÔNG tự tạo ra slug bài viết chưa có thật.
- **Hệ thống phòng vệ 2 lớp (Defense in Depth) trong `node_packager.js`:**
  - Hàm `sanitizeInternalLinks(html)` chủ động quét toàn bộ thẻ `<a>` trước khi xuất bản.
  - Mọi đường dẫn nội bộ dạng `/market/...`, `/blog/...` hoặc `/download/...` không nằm trong danh sách trắng sẽ được **tự động hạ cấp an toàn về trang Hub cha** (`/market/`, `/blog/`, `/download/`).
  - Triệt tiêu 100% rủi ro phát sinh link chết (404), bảo vệ chỉ số SEO Authority và trải nghiệm người dùng tuyệt đối.

### 2.11. Quy Chuẩn Định Danh Chủ Thể Cụ Thể (Explicit Financial Entity Naming)
- **Vấn đề cần khắc phục:** Tránh lối viết tài chính mơ hồ, bóng gió kiểu "một huyền thoại năm 2008", "một công ty bán gấu bông" mà không nêu danh tính cụ thể, làm giảm tính xác thực, uy tín báo chí và khả năng kiểm chứng của độc giả.
- **Quy tắc bắt buộc:**
  - BẮT BUỘC gọi ĐÍCH DANH tên nhân vật / nhà đầu tư (Ví dụ: *Michael Burry*, *Warren Buffett*, *Howard Marks*...).
  - BẮT BUỘC nêu rõ tên tổ chức / quỹ đầu tư liên quan (Ví dụ: *Scion Asset Management*, *Berkshire Hathaway*...).
  - BẮT BUỘC cung cấp tên công ty và mã chứng khoán niêm yết (Ví dụ: *Build-A-Bear Workshop* – mã niêm yết NYSE: `BBW`; *Apple* – NASDAQ: `AAPL`; *FPT* – HOSE: `FPT`...).
  - Giúp bài viết đạt chuẩn EEAT (Experience, Expertise, Authoritativeness, Trustworthiness) cao nhất theo tiêu chuẩn đánh giá của Google và các mô hình tìm kiếm thông minh (GEO).

### 2.12. Quy Chuẩn Nút Điều Hướng Data Hub
- **Tên hiển thị:** BẮT BUỘC chỉ để **"Data Hub"** (loại bỏ hậu tố "VN30" để ngắn gọn, tinh tế và sẵn sàng cho việc mở rộng dữ liệu ngoài rổ VN30).
- **Mã HTML chuẩn:**
  ```html
  <a href="/co-phieu/" style="color:#fbbf24; background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.3); border-radius:6px; padding:4px 10px; font-weight:600; text-decoration:none; transition:all 0.2s;"><i class="fa-solid fa-chart-line"></i> Data Hub</a>
  ```

### 2.13. Quy Chuẩn Metadata Đầu Bài Viết (Clean Meta Bar)
- **Thông tin giữ lại:** Chỉ hiển thị 2 trường cốt lõi là **📅 Đăng ngày: DD/MM/YYYY** và **📁 Chuyên mục: Thị trường / Bài viết**.
- **Loại bỏ vĩnh viễn:** KHÔNG hiển thị mục tác giả mặc định `👤 Ban Phân tích daututaichinh.pro` để thanh thông tin thoáng đãng, tập trung trực tiếp vào nội dung.

## 3. Trạng Thái Hệ Thống Tự Động Hóa (Đã kích hoạt trên Live Production)
- **AI Dashboard (`AI-Dashboard.html`):** Đã tích hợp quy trình 5 bước tự động, bộ lọc `formatSentenceCase()`, FAQ Studio tương tác AI và chuẩn hóa khoảng cách/blockquote trắng.
- **n8n Automation (`n8n.kotaduck.cc` - ID: `I1s1oP386rgDTF0F`):** Gemini Prompt, HTML Packager và Schema Engine đã được đồng bộ 100% tự động sinh FAQ theo nội dung bài viết, chuẩn hóa Sentence Case và định dạng giao diện đồng bộ.
