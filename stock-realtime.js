/**
 * stock-realtime.js — Ultra-Fast Real-time Market Session & Batch Live Stock Price Sync Engine
 * daututaichinh.pro • Data Hub
 *
 * Architecture:
 * - Direct Client-side Batch Query to VPS Data Feed (CORS enabled, ~250ms response)
 * - Cross-page Instant Cache (sessionStorage) for 0ms transition from Hub to Detail pages
 * - Serverless /api/stock-live fallback with tight timeouts
 * - Dynamic P/E & Live Price & Valuation Calculator synchronization
 */

(function() {
  'use strict';

  const CACHE_KEY = 'dttc_vps_stocks_cache';
  const CACHE_TIME_KEY = 'dttc_vps_stocks_cache_time';
  const DIRECT_VPS_BASE = 'https://bgapidatafeed.vps.com.vn/getliststockdata/';

  // 1. Market Session Detection (Vietnam GMT+7)
  function getMarketSessionInfo() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const vnTime = new Date(utc + (3600000 * 7));
    const day = vnTime.getDay(); // 0: Sun, 6: Sat
    const hour = vnTime.getHours();
    const minute = vnTime.getMinutes();
    const timeNum = hour * 100 + minute;

    const dateStr = `${String(vnTime.getDate()).padStart(2, '0')}/${String(vnTime.getMonth() + 1).padStart(2, '0')}/${vnTime.getFullYear()}`;

    if (day === 0 || day === 6) {
      return { 
        status: 'closed_weekend', 
        label: '🔒 Đóng cửa cuối tuần &bull; Chốt phiên ATC gần nhất', 
        color: '#94a3b8',
        isLive: false 
      };
    }
    if (timeNum < 900) {
      return { 
        status: 'pre_market', 
        label: '⏰ Chờ mở phiên (09:00) &bull; Giá chốt phiên ATC hôm trước', 
        color: '#fbbf24',
        isLive: false 
      };
    }
    if (timeNum >= 900 && timeNum < 1130) {
      return { 
        status: 'live_morning', 
        label: '🟢 Đang giao dịch trực tiếp &bull; Phiên sáng sàn HOSE', 
        color: '#34d399',
        isLive: true 
      };
    }
    if (timeNum >= 1130 && timeNum < 1300) {
      return { 
        status: 'lunch_break', 
        label: '☕ Tạm nghỉ trưa &bull; Tạm chốt phiên sáng sàn HOSE', 
        color: '#94a3b8',
        isLive: false 
      };
    }
    if (timeNum >= 1300 && timeNum < 1430) {
      return { 
        status: 'live_afternoon', 
        label: '🟢 Đang giao dịch trực tiếp &bull; Phiên chiều sàn HOSE', 
        color: '#34d399',
        isLive: true 
      };
    }
    if (timeNum >= 1430 && timeNum <= 1445) {
      return { 
        status: 'atc', 
        label: '🟡 Khớp lệnh định kỳ đóng cửa (ATC)', 
        color: '#facc15',
        isLive: true 
      };
    }
    return { 
      status: 'closed_atc', 
      label: `🔒 Đã chốt phiên ATC &bull; Ngày ${dateStr}`, 
      color: '#94a3b8',
      isLive: false 
    };
  }

  // 2. Cache Helpers (sessionStorage)
  function getCachedStocks() {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function setCachedStocks(map) {
    try {
      const existing = getCachedStocks() || {};
      const merged = Object.assign({}, existing, map);
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(merged));
      sessionStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
    } catch (e) {}
  }

  // 3. Format Currency
  function formatVND(val) {
    return Number(val).toLocaleString('vi-VN');
  }

  // 4. Fetch Direct from VPS Data Feed with High-Performance Batch Support
  async function fetchVpsBatch(tickers) {
    if (!tickers || !tickers.length) return null;
    const tickerStr = tickers.join(',');
    const url = DIRECT_VPS_BASE + tickerStr;

    try {
      const resp = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3000)
      });
      if (!resp.ok) throw new Error('VPS HTTP ' + resp.status);
      const data = await resp.json();
      if (!Array.isArray(data) || !data.length) return null;

      const resultMap = {};
      data.forEach(item => {
        const sym = (item.sym || '').toUpperCase();
        if (!sym) return;

        const lastPrice = Math.round(parseFloat(item.lastPrice || 0) * 1000);
        const refPrice = Math.round(parseFloat(item.r || 0) * 1000);
        const ceiling = Math.round(parseFloat(item.c || 0) * 1000);
        const floor = Math.round(parseFloat(item.f || 0) * 1000);
        const currentPrice = lastPrice > 0 ? lastPrice : refPrice;
        const diff = currentPrice - refPrice;
        let changePct = refPrice > 0 ? ((diff / refPrice) * 100).toFixed(2) : parseFloat(item.changePc || 0).toFixed(2);

        resultMap[sym] = {
          ticker: sym,
          currentPrice,
          refPrice,
          ceiling,
          floor,
          diff,
          changePct: parseFloat(changePct),
          volume: parseFloat(item.lot || 0),
          high: Math.round(parseFloat(item.highPrice || 0) * 1000),
          low: Math.round(parseFloat(item.lowPrice || 0) * 1000),
          updatedAt: Date.now()
        };
      });

      setCachedStocks(resultMap);
      return resultMap;
    } catch (err) {
      console.warn('[DataHub] Direct VPS query failed, falling back:', err.message);
      return null;
    }
  }

  // Fallback to /api/stock-live for a single ticker if direct VPS blocked
  async function fetchApiFallback(ticker) {
    try {
      const res = await fetch(`/api/stock-live?ticker=${ticker}&t=${Date.now()}`, {
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.success && data.currentPrice > 0) {
        const item = {
          ticker,
          currentPrice: data.currentPrice,
          refPrice: data.refPrice || data.currentPrice,
          ceiling: data.ceiling || 0,
          floor: data.floor || 0,
          diff: data.currentPrice - (data.refPrice || data.currentPrice),
          changePct: data.priceChangePct !== undefined ? data.priceChangePct : 0,
          volume: data.totalVolume || 0,
          updatedAt: Date.now()
        };
        const map = {};
        map[ticker] = item;
        setCachedStocks(map);
        return map;
      }
    } catch (e) {}
    return null;
  }

  // =========================================================================
  // SCENARIO A: DATA HUB PORTAL PAGE (/co-phieu/ or /co-phieu/index.html)
  // =========================================================================
  async function initHubPortal() {
    const tableBody = document.getElementById('stocks-body');
    if (!tableBody) return;

    const rows = tableBody.querySelectorAll('tr[data-ticker]');
    if (!rows.length) return;

    const tickers = [];
    rows.forEach(r => {
      const t = r.getAttribute('data-ticker');
      if (t) tickers.push(t.trim().toUpperCase());
    });

    // 1. STEP 0: Apply cached data immediately (0ms instant render)
    const cached = getCachedStocks();
    if (cached) {
      applyDataToPortalRows(rows, cached);
    }

    // 2. STEP 1: Direct VPS Batch Fetch (< 300ms)
    async function syncPortal() {
      const freshData = await fetchVpsBatch(tickers);
      if (freshData) {
        applyDataToPortalRows(rows, freshData);
        updatePortalLiveIndicator(true);
      } else {
        updatePortalLiveIndicator(false);
      }
    }

    syncPortal();

    // 3. Smart Schedule
    const session = getMarketSessionInfo();
    const intervalMs = session.isLive ? 5000 : 30000;
    setInterval(() => {
      const currentSession = getMarketSessionInfo();
      if (currentSession.isLive || currentSession.status === 'lunch_break') {
        syncPortal();
      }
    }, intervalMs);
  }

  function applyDataToPortalRows(rows, dataMap) {
    rows.forEach(row => {
      const ticker = (row.getAttribute('data-ticker') || '').toUpperCase();
      const stock = dataMap[ticker];
      if (!stock || !stock.currentPrice) return;

      const price = stock.currentPrice;
      const ref = stock.refPrice || price;
      const diff = stock.diff !== undefined ? stock.diff : (price - ref);
      const pct = stock.changePct !== undefined ? stock.changePct : 0;

      // Color coding chuẩn sàn HOSE
      let color = '#fbbf24'; // tham chiếu
      let sign = '';
      if (diff > 0) {
        color = '#34d399'; // xanh lá
        sign = '+';
      } else if (diff < 0) {
        color = '#ef4444'; // đỏ
      }

      if (stock.ceiling && price >= stock.ceiling) {
        color = '#c084fc'; // trần tím
      } else if (stock.floor && price <= stock.floor) {
        color = '#22d3ee'; // sàn xanh lơ
      }

      // Update Price Cell
      const priceEl = row.querySelector('.cell-price');
      if (priceEl) {
        priceEl.innerHTML = `<span style="color:${color}; font-weight:700;">${formatVND(price)}</span> <span style="font-size:0.75rem; color:${color}; font-weight:600; display:inline-block; margin-left:4px;">${sign}${pct}%</span>`;
      }

      // Recalculate Live P/E
      const epsEl = row.querySelector('.cell-eps');
      const epsVal = epsEl ? parseFloat(epsEl.innerText.replace(/[^0-9.-]/g, '')) : 0;
      if (epsVal > 0) {
        const livePe = (price / epsVal).toFixed(2);
        const peEl = row.querySelector('.cell-pe');
        if (peEl) {
          const peColor = livePe < 10 ? '#34d399' : (livePe < 16 ? '#fbbf24' : '#94a3b8');
          peEl.innerHTML = `<span style="color:${peColor};">${livePe}x</span>`;
        }
      }
    });
  }

  function updatePortalLiveIndicator(isOnline) {
    let indicator = document.getElementById('datahub-live-badge');
    if (!indicator) {
      const controls = document.querySelector('.controls-panel') || document.querySelector('.hub-hero');
      if (controls) {
        indicator = document.createElement('div');
        indicator.id = 'datahub-live-badge';
        indicator.style.cssText = 'display:inline-flex; align-items:center; gap:8px; font-size:0.8rem; font-weight:600; padding:4px 12px; border-radius:20px; margin-bottom:12px; background:rgba(15,23,42,0.8); border:1px solid rgba(255,255,255,0.08);';
        controls.parentNode.insertBefore(indicator, controls);
      }
    }
    if (!indicator) return;

    const session = getMarketSessionInfo();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    if (session.isLive) {
      indicator.innerHTML = `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#34d399; box-shadow:0 0 8px #34d399; animation:pulse 1.5s infinite;"></span> <span style="color:#34d399;">Trực tiếp bảng giá HOSE</span> &bull; <span style="color:#94a3b8;">Cập nhật: ${timeStr}</span>`;
    } else {
      indicator.innerHTML = `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#fbbf24;"></span> <span style="color:#fbbf24;">${session.label}</span> &bull; <span style="color:#94a3b8;">Cập nhật: ${timeStr}</span>`;
    }
  }

  // =========================================================================
  // SCENARIO B: INDIVIDUAL STOCK PAGE (/co-phieu/{ticker}.html)
  // =========================================================================
  function ensureDetailTickStyles() {
    if (document.getElementById('dttc-detail-tick-styles')) return;
    const style = document.createElement('style');
    style.id = 'dttc-detail-tick-styles';
    style.textContent = `
      @keyframes dttcTickGreen {
        0% { background: rgba(52, 211, 153, 0.45); color: #34d399; }
        100% { background: transparent; }
      }
      @keyframes dttcTickRed {
        0% { background: rgba(239, 68, 68, 0.45); color: #ef4444; }
        100% { background: transparent; }
      }
      @keyframes dttcTickNeutral {
        0% { background: rgba(250, 204, 21, 0.35); }
        100% { background: transparent; }
      }
      .tick-flash-green {
        animation: dttcTickGreen 0.9s ease-out;
        border-radius: 4px;
      }
      .tick-flash-red {
        animation: dttcTickRed 0.9s ease-out;
        border-radius: 4px;
      }
      .tick-flash-neutral {
        animation: dttcTickNeutral 0.9s ease-out;
        border-radius: 4px;
      }
    `;
    document.head.appendChild(style);
  }

  async function initStockDetailPage() {
    ensureDetailTickStyles();
    const tickerEl = document.querySelector('.ticker-code');
    const priceEl = document.getElementById('current-market-price');
    if (!tickerEl || !priceEl) return;

    const currentTicker = tickerEl.innerText.trim().toUpperCase();

    // 1. STEP 0: Zero-latency Instant Cache Rendering (0ms)
    const cached = getCachedStocks();
    let initialStock = cached ? cached[currentTicker] : null;

    if (initialStock) {
      applySingleStockData(initialStock);
    } else {
      // Load baseline from stocks.json if no cache
      try {
        const res = await fetch(`/data/stocks.json?t=${Date.now()}`);
        if (res.ok) {
          const stocks = await res.json();
          const found = stocks.find(s => s.ticker === currentTicker);
          if (found) {
            initialStock = {
              ticker: currentTicker,
              currentPrice: found.current_price,
              refPrice: found.ref_price || found.current_price,
              diff: 0,
              changePct: found.price_change_pct || 0,
              eps: found.eps,
              pe: found.pe,
              last_updated: found.last_updated
            };
            applySingleStockData(initialStock);
          }
        }
      } catch (e) {}
    }

    // 2. STEP 1: Fast Direct Fetch from VPS (< 300ms)
    async function syncSingleStock() {
      let data = await fetchVpsBatch([currentTicker]);
      if (!data || !data[currentTicker]) {
        data = await fetchApiFallback(currentTicker);
      }
      if (data && data[currentTicker]) {
        applySingleStockData(data[currentTicker]);
      }
    }

    syncSingleStock();

    // 3. Smart Schedule
    const session = getMarketSessionInfo();
    const intervalMs = session.isLive ? 5000 : 30000;
    setInterval(() => {
      const currentSession = getMarketSessionInfo();
      if (currentSession.isLive || currentSession.status === 'lunch_break') {
        syncSingleStock();
      }
    }, intervalMs);
  }

  function applySingleStockData(stockData) {
    if (!stockData || !stockData.currentPrice) return;

    const price = stockData.currentPrice;
    const ref = stockData.refPrice || price;
    const diff = stockData.diff !== undefined ? stockData.diff : (price - ref);
    const pct = stockData.changePct !== undefined ? stockData.changePct : 0;
    const session = getMarketSessionInfo();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    // 1. Update Market Price Display with Visual Flash Highlight
    const priceEl = document.getElementById('current-market-price');
    if (priceEl) {
      const prevPriceStr = priceEl.getAttribute('data-prev-price');
      const prevPrice = prevPriceStr ? parseFloat(prevPriceStr) : null;
      priceEl.setAttribute('data-prev-price', String(price));
      priceEl.innerHTML = `${formatVND(price)} <span style="font-size:1.1rem; font-weight:500; color:#94a3b8;">VNĐ</span>`;

      // Trigger smooth flash tick animation
      priceEl.classList.remove('tick-flash-green', 'tick-flash-red', 'tick-flash-neutral');
      void priceEl.offsetWidth; // Force CSS reflow
      if (prevPrice !== null && price > prevPrice) {
        priceEl.classList.add('tick-flash-green');
      } else if (prevPrice !== null && price < prevPrice) {
        priceEl.classList.add('tick-flash-red');
      } else {
        priceEl.classList.add('tick-flash-neutral');
      }
    }

    // 2. Update Live Session Badge & Real-time Clock (HH:MM:SS)
    const badgeEl = document.querySelector('.price-change');
    if (badgeEl) {
      const sign = diff > 0 ? '+' : '';
      const color = diff > 0 ? '#34d399' : (diff < 0 ? '#ef4444' : '#fbbf24');
      const refText = `<span style="color:${color}; font-weight:700;">${sign}${formatVND(diff)} đ (${sign}${pct}%)</span> &bull; <span style="color:#94a3b8;">Tham chiếu: ${formatVND(ref)} đ</span>`;

      let sessionHeader = '';
      if (session.isLive) {
        sessionHeader = `<div style="display:inline-flex; align-items:center; gap:6px; font-size:0.8rem; font-weight:600; color:#34d399; margin-bottom:4px;">` +
          `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#34d399; box-shadow:0 0 8px #34d399; animation:pulse 1.5s infinite;"></span>` +
          `<span>Trực tiếp HOSE</span> &bull; <span style="color:#94a3b8; font-family:'JetBrains Mono',monospace;">Cập nhật: ${timeStr}</span>` +
        `</div>`;
      } else {
        sessionHeader = `<div style="display:inline-flex; align-items:center; gap:6px; font-size:0.8rem; font-weight:600; color:#fbbf24; margin-bottom:4px;">` +
          `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#fbbf24;"></span>` +
          `<span>${session.label}</span> &bull; <span style="color:#94a3b8; font-family:'JetBrains Mono',monospace;">Cập nhật: ${timeStr}</span>` +
        `</div>`;
      }

      badgeEl.innerHTML = `${sessionHeader}<div style="font-size:0.85rem; line-height:1.35;">${refText}</div>`;
    }

    // 3. Dynamic Override & Synchronization for Mini Calculator
    if (typeof window !== 'undefined') {
      window.CURRENT_PRICE = price;

      if (!window._valuationEnginePatched) {
        window._valuationEnginePatched = true;
        const origCalc = window.calculateValuation;
        window.calculateValuation = function() {
          if (typeof origCalc === 'function') origCalc();
          const activePrice = window.CURRENT_PRICE;
          const targetPriceEl = document.getElementById('target-price');
          const upsideBadge = document.getElementById('upside-badge');
          if (activePrice > 0 && targetPriceEl && upsideBadge) {
            const target = parseFloat(targetPriceEl.innerText.replace(/[^0-9]/g, ''));
            if (target > 0) {
              const upside = ((target - activePrice) / activePrice) * 100;
              if (upside >= 0) {
                upsideBadge.className = 'calc-upside-badge upside-positive';
                upsideBadge.innerHTML = '▲ Tiềm năng tăng giá: +' + upside.toFixed(1) + '%';
              } else {
                upsideBadge.className = 'calc-upside-badge upside-negative';
                upsideBadge.innerHTML = '▼ Thấp hơn thị giá: ' + upside.toFixed(1) + '% (Cần chiết khấu thêm)';
              }
            }
          }
        };
      }

      if (typeof window.calculateValuation === 'function') {
        window.calculateValuation();
      }
    }

    // 4. Synchronize Matrix Table (Bảng Lịch sử & Chỉ số định giá trọng yếu) & KPI Cards
    let eps = stockData.eps;
    let bvps = 0;

    // Read EPS and BVPS from matrix table if not provided
    const matrixTable = document.querySelector('.matrix-table');
    if (matrixTable) {
      const rows = matrixTable.querySelectorAll('tbody tr');
      rows.forEach(r => {
        const text = r.innerText;
        if (text.includes('EPS')) {
          const numEl = r.querySelector('.num');
          if (numEl && !eps) {
            eps = parseFloat(numEl.innerText.replace(/[^0-9.-]/g, ''));
          }
        } else if (text.includes('BVPS') || text.includes('sổ sách')) {
          const numEl = r.querySelector('.num');
          if (numEl) {
            bvps = parseFloat(numEl.innerText.replace(/[^0-9.-]/g, ''));
          }
        }
      });
    }

    // Fallback: Read EPS from DOM KPI
    if (!eps) {
      const kpiLabels = document.querySelectorAll('.kpi-label');
      kpiLabels.forEach(lbl => {
        if (lbl.innerText.includes('EPS')) {
          const valEl = lbl.parentNode.querySelector('.kpi-val');
          if (valEl) eps = parseFloat(valEl.innerText.replace(/[^0-9.-]/g, ''));
        }
      });
    }

    // Recalculate Live P/E
    if (eps && eps > 0) {
      const livePe = (price / eps).toFixed(2);

      // Update Matrix Table P/E Row
      if (matrixTable) {
        const peRow = Array.from(matrixTable.querySelectorAll('tbody tr')).find(r => r.innerText.includes('P/E'));
        if (peRow) {
          const peCell = peRow.querySelector('.num');
          if (peCell) peCell.innerHTML = `<span style="color:#fbbf24; font-weight:700;">${livePe}x</span>`;
        }
      }

      // Update KPI Card P/E
      const kpiPeCard = Array.from(document.querySelectorAll('.kpi-card')).find(c => c.innerText.includes('P/E'));
      if (kpiPeCard) {
        const valEl = kpiPeCard.querySelector('.kpi-val');
        if (valEl) valEl.innerHTML = `<span style="color:#fbbf24;">${livePe}x</span>`;
      }

      // Update Valuation Status Pill
      const pill = document.querySelector('.valuation-status-pill');
      if (pill) {
        const peNum = parseFloat(livePe);
        const evalText = peNum < 10 ? 'Rất rẻ' : (peNum < 15 ? 'Hợp lý' : 'Đắt');
        pill.innerText = `Vùng định giá: ${evalText} (P/E ${livePe}x)`;
      }
    }

    // Recalculate Live P/B
    if (bvps && bvps > 0) {
      const livePb = (price / bvps).toFixed(2);

      // Update Matrix Table P/B Row
      if (matrixTable) {
        const pbRow = Array.from(matrixTable.querySelectorAll('tbody tr')).find(r => r.innerText.includes('P/B'));
        if (pbRow) {
          const pbCell = pbRow.querySelector('.num');
          if (pbCell) pbCell.innerHTML = `<span style="color:#a78bfa; font-weight:700;">${livePb}x</span>`;
        }
      }

      // Update KPI Card P/B
      const kpiPbCard = Array.from(document.querySelectorAll('.kpi-card')).find(c => c.innerText.includes('P/B'));
      if (kpiPbCard) {
        const valEl = kpiPbCard.querySelector('.kpi-val');
        if (valEl) valEl.innerHTML = `<span style="color:#a78bfa;">${livePb}x</span>`;
      }
    }

    // Recalculate Live Market Cap (Vốn hóa thị trường)
    if (matrixTable) {
      const capRow = Array.from(matrixTable.querySelectorAll('tbody tr')).find(r => r.innerText.includes('Vốn hóa'));
      if (capRow) {
        const capCell = capRow.querySelector('.num');
        if (capCell) {
          // Initialize baseline attributes once
          if (!capCell.getAttribute('data-base-price')) {
            const currentCapText = capCell.innerText.replace(/[^0-9.]/g, '');
            const baseCap = parseFloat(currentCapText);
            if (baseCap > 0) {
              capCell.setAttribute('data-base-cap', String(baseCap));
              capCell.setAttribute('data-base-price', String(price));
            }
          }
          const baseCap = parseFloat(capCell.getAttribute('data-base-cap') || 0);
          const basePrice = parseFloat(capCell.getAttribute('data-base-price') || 0);
          if (baseCap > 0 && basePrice > 0) {
            const liveCap = (baseCap * (price / basePrice)).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
            capCell.innerHTML = `<span style="color:#facc15; font-weight:700;">${liveCap} tỷ</span>`;
          }
        }
      }
    }
  }

  // =========================================================================
  // BOOTSTRAP: AUTO-DETECT CONTEXT AND RUN
  // =========================================================================
  function init() {
    if (document.getElementById('stocks-body')) {
      initHubPortal();
    } else if (document.querySelector('.ticker-code')) {
      initStockDetailPage();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
