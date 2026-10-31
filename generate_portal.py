import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

base = r'C:\Users\Thang Vu\.gemini\antigravity\scratch\daututaichinh-pro'
co_phieu_dir = os.path.join(base, 'co-phieu')
stocks_path = os.path.join(base, 'data', 'stocks.json')

with open(stocks_path, 'r', encoding='utf-8') as f:
    stocks = json.load(f)

# Sort stocks alphabetically
stocks = sorted(stocks, key=lambda x: x['ticker'])

# Build sector counts
sector_counts = {}
for s in stocks:
    sec = s.get('sector', 'Khác')
    # group simple sector
    if 'Ngân hàng' in sec:
        key = 'Ngân hàng'
    elif 'Bất động sản' in sec:
        key = 'Bất động sản'
    elif 'Thực phẩm' in sec or 'Bán lẻ' in sec or 'Sữa' in sec or 'Bia' in sec or 'tiêu dùng' in sec:
        key = 'Tiêu dùng & Bán lẻ'
    elif 'Dầu khí' in sec or 'Năng lượng' in sec:
        key = 'Dầu khí & Năng lượng'
    elif 'Công nghệ' in sec:
        key = 'Công nghệ'
    elif 'Thép' in sec or 'Cao su' in sec:
        key = 'Sản xuất & Công nghiệp'
    elif 'Chứng khoán' in sec:
        key = 'Dịch vụ Tài chính'
    else:
        key = 'Khác'
    s['sec_group'] = key
    sector_counts[key] = sector_counts.get(key, 0) + 1

index_html = f'''<!DOCTYPE html>
<html lang="vi">
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-RJZJX69KDM"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){{dataLayer.push(arguments);}}
    gtag('js', new Date());
    gtag('config', 'G-RJZJX69KDM');
  </script>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cổng Dữ Liệu & Định Giá Cổ Phiếu VN30 | daututaichinh.pro</title>
  <meta name="description" content="Tra cứu dữ liệu tài chính, chỉ số P/E, P/B, EPS, BVPS và công cụ Mini Calculator định giá giá trị thực cho toàn bộ 30 cổ phiếu thuộc rổ chỉ số VN30." />
  <meta name="keywords" content="định giá cổ phiếu VN30, dữ liệu tài chính VN30, tra cứu cổ phiếu, P/E VN30, BCTC VN30, Mini Calculator cổ phiếu" />
  <link rel="canonical" href="https://daututaichinh.pro/co-phieu/" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Cổng Dữ Liệu & Định Giá Cổ Phiếu VN30 | daututaichinh.pro" />
  <meta property="og:description" content="Tra cứu chỉ số P/E, P/B, EPS, BVPS và công cụ Mini Calculator định giá thực tế cho 30 cổ phiếu VN30." />
  <meta property="og:url" content="https://daututaichinh.pro/co-phieu/" />
  <meta property="og:image" content="https://daututaichinh.pro/logo.png" />

  <!-- Fonts & Core Styles -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/style.css" />

  <style>
    /* Scoped Styles for Data Hub Portal */
    body {{
      background: #070a11;
      color: #f1f5f9;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      overflow-x: hidden;
    }}
    .hub-container {{
      max-width: 1200px;
      margin: 0 auto;
      padding: 125px 20px 80px;
      color: #e2e8f0;
    }}
    .breadcrumbs {{
      display: flex;
      gap: 8px;
      font-size: 0.85rem;
      color: #94a3b8;
      margin-bottom: 24px;
      align-items: center;
      flex-wrap: wrap;
    }}
    .breadcrumbs a {{
      color: #94a3b8;
      text-decoration: none;
      transition: color 0.2s;
    }}
    .breadcrumbs a:hover {{
      color: #60a5fa;
    }}
    .hub-hero {{
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 30px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }}
    .hub-badge {{
      display: inline-block;
      font-size: 0.8rem;
      font-weight: 700;
      padding: 4px 12px;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #fbbf24;
      border-radius: 20px;
      margin-bottom: 12px;
    }}
    .hub-title {{
      font-size: 2.2rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #fff;
      margin-bottom: 12px;
      line-height: 1.25;
    }}
    .hub-sub {{
      font-size: 1.05rem;
      color: #94a3b8;
      max-width: 800px;
      line-height: 1.6;
    }}

    /* Search & Filter Controls */
    .controls-panel {{
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }}
    .search-box-wrap {{
      position: relative;
      max-width: 100%;
    }}
    .search-box-wrap input {{
      width: 100%;
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      padding: 14px 18px 14px 46px;
      color: #fff;
      font-size: 0.95rem;
      outline: none;
      transition: all 0.2s;
    }}
    .search-box-wrap input:focus {{
      border-color: #fbbf24;
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
    }}
    .search-icon {{
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.1rem;
      color: #64748b;
      pointer-events: none;
    }}
    .filter-pills {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }}
    .filter-pill {{
      padding: 7px 14px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      font-size: 0.82rem;
      color: #94a3b8;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }}
    .filter-pill:hover {{
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }}
    .filter-pill.active {{
      background: rgba(245, 158, 11, 0.15);
      border-color: #fbbf24;
      color: #fbbf24;
    }}

    /* Stock Table with Sticky Header */
    .stocks-table-card {{
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: 0;
      overflow: visible;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    }}
    .hub-table {{
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 0.9rem;
    }}
    .hub-table thead th {{
      position: sticky;
      top: 105px; /* Sticks right below top-bar + ticker */
      background: #141e34;
      z-index: 50;
      text-align: left;
      padding: 14px;
      color: #94a3b8;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid rgba(245, 158, 11, 0.4);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      cursor: pointer;
      user-select: none;
      transition: color 0.15s;
    }}
    .hub-table th:first-child {{
      border-top-left-radius: 14px;
      padding-left: 20px;
    }}
    .hub-table th:last-child {{
      border-top-right-radius: 14px;
      padding-right: 20px;
    }}
    .hub-table th:hover {{
      color: #fbbf24;
    }}
    .hub-table td {{
      padding: 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      color: #cbd5e1;
      transition: background 0.15s;
    }}
    .hub-table td:first-child {{
      padding-left: 20px;
    }}
    .hub-table td:last-child {{
      padding-right: 20px;
    }}
    
    /* Interactive Full-Row Clickable Styling */
    .hub-table tbody tr {{
      cursor: pointer;
    }}
    .hub-table tbody tr:hover td {{
      background: rgba(245, 158, 11, 0.08);
    }}
    .hub-table tbody tr:active td {{
      background: rgba(245, 158, 11, 0.15);
    }}

    @media (max-width: 991px) {{
      .stocks-table-card {{
        overflow-x: auto;
        overflow-y: auto;
        max-height: 75vh;
        -webkit-overflow-scrolling: touch;
      }}
      .hub-table thead th {{
        top: 0;
      }}
      /* Freeze first column (Mã CP) on mobile & tablets */
      .hub-table th:first-child,
      .hub-table td:first-child {{
        position: sticky;
        left: 0;
        background: #141e34;
        z-index: 10;
        box-shadow: 2px 0 8px rgba(0, 0, 0, 0.4);
      }}
      .hub-table thead th:first-child {{
        z-index: 60;
      }}
      .hub-table tr:hover td:first-child {{
        background: #1e293b !important;
      }}
    }}

    /* Mobile UX Optimizations */
    @media (max-width: 768px) {{
      .hub-container {{
        padding: 155px 16px 60px !important;
      }}
      .hub-hero {{
        padding: 20px;
      }}
      .hub-title {{
        font-size: 1.6rem;
      }}
      /* Hide full company name column on mobile to eliminate clutter */
      .col-company {{
        display: none !important;
      }}
      /* Horizontal scrollable sector filter pills */
      .filter-pills {{
        display: flex;
        flex-wrap: nowrap;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 6px;
        gap: 8px;
      }}
      .filter-pill {{
        white-space: nowrap;
        flex-shrink: 0;
      }}
    }}

    .ticker-link {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 800;
      font-size: 1.15rem;
      color: #fbbf24;
      text-decoration: none;
      transition: color 0.15s;
    }}
    .ticker-link:hover {{
      color: #60a5fa;
      text-decoration: underline;
    }}
    .action-btn {{
      display: inline-block;
      padding: 6px 14px;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #fbbf24;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      white-space: nowrap;
    }}
    .action-btn:hover {{
      background: #fbbf24;
      color: #0f172a;
    }}
  </style>
</head>
<body data-lead-popup>

<!-- TOP NAVIGATION -->
<header class="top-bar">
  <div class="container nav">
    <a href="/" class="brand">
      <img src="/logo.png" alt="Đầu tư & Tài chính chuyên sâu" class="brand-logo" />
      <div class="brand-text">
        <span class="brand-title">Đầu tư & Tài chính chuyên sâu</span>
        <span class="brand-sub">Hệ sinh thái nội dung tài chính cho người Việt</span>
      </div>
    </a>
    <nav class="nav-links">
      <a href="/">Trang chủ</a>
      <a href="/market/">Thị trường</a>
      <a href="/blog/">Bài viết</a>
      <a href="/download/">Tài liệu</a>
      <a href="/co-phieu/" style="color:#fbbf24; background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.3); border-radius:6px; padding:4px 10px; font-weight:600; text-decoration:none; transition:all 0.2s;">📊 Data Hub</a>
    </nav>
  </div>
  <!-- SIMPLIZE-STYLE 1-ROW MARKET TICKER -->
  <div class="simplize-ticker-bar">
    <div class="simplize-ticker-track">
      <div class="s-item"><span class="s-icon">💧</span><span class="s-name">Dầu thô (WTI)</span><span class="s-val">101.33</span><span class="s-badge-down">▼ 1.88%</span></div>
      <div class="s-item"><span class="s-icon">🪙</span><span class="s-name">Vàng</span><span class="s-val">4,016.00</span><span class="s-badge-up">▲ 0.20%</span></div>
      <div class="s-item"><span class="s-icon">₿</span><span class="s-name">Bitcoin</span><span class="s-val">79,671.99</span><span class="s-badge-down">▼ 0.60%</span></div>
      <div class="s-item"><span class="s-icon">🇻🇳</span><span class="s-name">VNINDEX</span><span class="s-val">1,763.55</span><span class="s-badge-down">▼ 0.60%</span></div>
      <div class="s-item"><span class="s-icon">🇻🇳</span><span class="s-name">VN30</span><span class="s-val">1,907.09</span><span class="s-badge-up">▲ 0.75%</span></div>
      <div class="s-item"><span class="s-icon">🇺🇸</span><span class="s-name">Dow Jones</span><span class="s-val">52,410.50</span><span class="s-badge-up">▲ 0.45%</span></div>
      <div class="s-item"><span class="s-icon">🇺🇸</span><span class="s-name">S&P 500</span><span class="s-val">5,815.20</span><span class="s-badge-up">▲ 0.35%</span></div>
      <div class="s-item"><span class="s-icon">💵</span><span class="s-name">USD/VND</span><span class="s-val">25,460</span><span class="s-badge-up">▲ 0.05%</span></div>

      <!-- DUPLICATE FOR INFINITE SEAMLESS LOOP -->
      <div class="s-item"><span class="s-icon">💧</span><span class="s-name">Dầu thô (WTI)</span><span class="s-val">101.33</span><span class="s-badge-down">▼ 1.88%</span></div>
      <div class="s-item"><span class="s-icon">🪙</span><span class="s-name">Vàng</span><span class="s-val">4,016.00</span><span class="s-badge-up">▲ 0.20%</span></div>
      <div class="s-item"><span class="s-icon">₿</span><span class="s-name">Bitcoin</span><span class="s-val">79,671.99</span><span class="s-badge-down">▼ 0.60%</span></div>
      <div class="s-item"><span class="s-icon">🇻🇳</span><span class="s-name">VNINDEX</span><span class="s-val">1,763.55</span><span class="s-badge-down">▼ 0.60%</span></div>
      <div class="s-item"><span class="s-icon">🇻🇳</span><span class="s-name">VN30</span><span class="s-val">1,907.09</span><span class="s-badge-up">▲ 0.75%</span></div>
      <div class="s-item"><span class="s-icon">🇺🇸</span><span class="s-name">Dow Jones</span><span class="s-val">52,410.50</span><span class="s-badge-up">▲ 0.45%</span></div>
      <div class="s-item"><span class="s-icon">🇺🇸</span><span class="s-name">S&P 500</span><span class="s-val">5,815.20</span><span class="s-badge-up">▲ 0.35%</span></div>
      <div class="s-item"><span class="s-icon">💵</span><span class="s-name">USD/VND</span><span class="s-val">25,460</span><span class="s-badge-up">▲ 0.05%</span></div>
    </div>
  </div>
</header>

<main class="hub-container">
  <!-- BREADCRUMBS -->
  <nav class="breadcrumbs" aria-label="Breadcrumb">
    <a href="/">Trang chủ</a>
    <span>&rsaquo;</span>
    <span style="color:#f1f5f9; font-weight:600;">Data Hub: Cổ Phiếu VN30</span>
  </nav>

  <!-- HERO SECTION -->
  <section class="hub-hero">
    <span class="hub-badge">🚀 Data Hub & Định Giá Chuyên Sâu</span>
    <h1 class="hub-title">Hồ Sơ & Công Cụ Định Giá 30 Cổ Phiếu Trụ Cột VN30</h1>
    <p class="hub-sub">
      Cổng tra cứu chỉ số tài chính (P/E, P/B, EPS, BVPS, Vốn hóa) và công cụ Mini Calculator định giá trực quan theo kịch bản lợi nhuận độc quyền từ daututaichinh.pro.
    </p>
  </section>

  <!-- CONTROLS: SEARCH + SECTOR FILTER -->
  <div class="controls-panel">
    <div class="search-box-wrap">
      <span class="search-icon">🔍</span>
      <input type="text" id="filter-search" placeholder="Tìm kiếm nhanh mã CP hoặc tên công ty (VD: SSI, HPG, FPT, VCB...)..." oninput="applyFilters()" />
    </div>

    <div class="filter-pills">
      <button class="filter-pill active" onclick="filterSector('all', this)">Tất cả (30)</button>
      <button class="filter-pill" onclick="filterSector('Ngân hàng', this)">Ngân hàng ({sector_counts.get('Ngân hàng', 0)})</button>
      <button class="filter-pill" onclick="filterSector('Tiêu dùng & Bán lẻ', this)">Tiêu dùng & Bán lẻ ({sector_counts.get('Tiêu dùng & Bán lẻ', 0)})</button>
      <button class="filter-pill" onclick="filterSector('Bất động sản', this)">Bất động sản ({sector_counts.get('Bất động sản', 0)})</button>
      <button class="filter-pill" onclick="filterSector('Sản xuất & Công nghiệp', this)">Sản xuất & Thép ({sector_counts.get('Sản xuất & Công nghiệp', 0)})</button>
      <button class="filter-pill" onclick="filterSector('Dầu khí & Năng lượng', this)">Dầu khí & Năng lượng ({sector_counts.get('Dầu khí & Năng lượng', 0)})</button>
      <button class="filter-pill" onclick="filterSector('Công nghệ', this)">Công nghệ ({sector_counts.get('Công nghệ', 0)})</button>
      <button class="filter-pill" onclick="filterSector('Dịch vụ Tài chính', this)">Chứng khoán ({sector_counts.get('Dịch vụ Tài chính', 0)})</button>
    </div>
  </div>

  <!-- STOCKS TABLE -->
  <div class="stocks-table-card">
    <table class="hub-table" id="stocks-table">
      <thead>
        <tr>
          <th>Mã CP</th>
          <th class="col-company">Doanh Nghiệp</th>
          <th>Ngành Nghề</th>
          <th>Thị Giá (VNĐ)</th>
          <th>P/E</th>
          <th>P/B</th>
          <th>EPS (VNĐ)</th>
          <th>Vốn Hóa</th>
          <th>Hành Động</th>
        </tr>
      </thead>
      <tbody id="stocks-body">
'''

for s in stocks:
    ticker = s['ticker']
    name = s['name']
    sector = s['sector']
    sec_group = s['sec_group']
    price = s['current_price']
    pe = s['pe']
    pb = s['pb']
    eps = s['eps']
    cap = s['market_cap']

    index_html += f'''        <tr data-ticker="{ticker}" data-name="{name.lower()}" data-sector="{sec_group}" data-href="/co-phieu/{ticker.lower()}.html">
          <td>
            <a href="/co-phieu/{ticker.lower()}.html" class="ticker-link">{ticker}</a>
          </td>
          <td class="col-company" style="font-weight:500; color:#f1f5f9; max-width:240px;">{name}</td>
          <td style="font-size:0.85rem; color:#94a3b8;">{sector}</td>
          <td style="font-family:'JetBrains Mono',monospace; font-weight:700; color:#fbbf24;">{price:,}</td>
          <td style="font-family:'JetBrains Mono',monospace; font-weight:600; color:{'#34d399' if pe < 10 else '#facc15'};">{pe:.2f}x</td>
          <td style="font-family:'JetBrains Mono',monospace; font-weight:600; color:#a78bfa;">{pb:.2f}x</td>
          <td style="font-family:'JetBrains Mono',monospace;">{eps:,}</td>
          <td style="font-size:0.85rem;">{cap}</td>
          <td>
            <a href="/co-phieu/{ticker.lower()}.html" class="action-btn">Định giá &rarr;</a>
          </td>
        </tr>
'''

index_html += '''      </tbody>
    </table>
  </div>
</main>

<!-- FOOTER -->
<footer style="background:#0b1120; border-top:1px solid rgba(255,255,255,0.06); padding:40px 20px; text-align:center; color:#64748b; font-size:0.85rem;">
  <div class="container">
    <p style="margin-bottom:8px; color:#94a3b8;"><strong>daututaichinh.pro</strong> &mdash; Hệ sinh thái thông tin tài chính & đầu tư chuyên sâu cho người Việt.</p>
    <p style="margin-bottom:12px;">Dữ liệu bảng giá và tài chính chuẩn hóa từ sàn HOSE và Báo cáo tài chính soát xét.</p>
    <p>&copy; 2026 daututaichinh.pro. Giữ toàn quyền.</p>
  </div>
</footer>

<script>
  let activeSector = 'all';

  function filterSector(sec, el) {
    activeSector = sec;
    document.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
    el.classList.add('active');
    applyFilters();
  }

  function applyFilters() {
    const query = (document.getElementById('filter-search').value || '').toLowerCase().trim();
    const rows = document.querySelectorAll('#stocks-body tr');

    rows.forEach(row => {
      const ticker = (row.getAttribute('data-ticker') || '').toLowerCase();
      const name = (row.getAttribute('data-name') || '').toLowerCase();
      const sector = row.getAttribute('data-sector') || '';

      const matchQuery = !query || ticker.includes(query) || name.includes(query);
      const matchSector = activeSector === 'all' || sector === activeSector;

      if (matchQuery && matchSector) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  // Row-level Click Handler: click anywhere on row navigates to stock page
  document.addEventListener('DOMContentLoaded', () => {
    const rows = document.querySelectorAll('#stocks-body tr');
    rows.forEach(row => {
      row.addEventListener('click', (e) => {
        // If user explicitly clicked an <a> or interactive element, let native link work
        if (e.target.closest('a') || e.target.closest('button')) return;
        const href = row.getAttribute('data-href');
        if (href) {
          if (e.ctrlKey || e.metaKey) {
            window.open(href, '_blank');
          } else {
            window.location.href = href;
          }
        }
      });
    });
  });
</script>
<script src="/ticker-live.js" defer></script>
</body>
</html>
'''

output_path = os.path.join(co_phieu_dir, 'index.html')
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(index_html)

print("✅ Generated co-phieu/index.html portal successfully!")
