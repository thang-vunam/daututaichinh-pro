/**
 * stock-realtime.js — Real-time Market Session & Client-side Price Sync Engine
 * daututaichinh.pro • Data Hub
 */

(function() {
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
        label: `🔒 Đóng cửa cuối tuần &bull; Chốt phiên ATC gần nhất`, 
        color: '#94a3b8',
        isLive: false 
      };
    }
    if (timeNum < 900) {
      return { 
        status: 'pre_market', 
        label: `⏳ Chờ mở phiên (09:00) &bull; Giá chốt phiên ATC hôm trước`, 
        color: '#fbbf24',
        isLive: false 
      };
    }
    if (timeNum >= 900 && timeNum < 1130) {
      return { 
        status: 'live_morning', 
        label: `🟢 Đang giao dịch trực tiếp &bull; Phiên sáng sàn HOSE`, 
        color: '#34d399',
        isLive: true 
      };
    }
    if (timeNum >= 1130 && timeNum < 1300) {
      return { 
        status: 'lunch_break', 
        label: `☕ Tạm nghỉ trưa &bull; Tạm chốt phiên sáng sàn HOSE`, 
        color: '#94a3b8',
        isLive: false 
      };
    }
    if (timeNum >= 1300 && timeNum < 1430) {
      return { 
        status: 'live_afternoon', 
        label: `🟢 Đang giao dịch trực tiếp &bull; Phiên chiều sàn HOSE`, 
        color: '#34d399',
        isLive: true 
      };
    }
    if (timeNum >= 1430 && timeNum <= 1445) {
      return { 
        status: 'atc', 
        label: `🟡 Khớp lệnh định kỳ đóng cửa (ATC)`, 
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

  // Update session badge in UI
  function updateSessionBadge(stockData) {
    const session = getMarketSessionInfo();
    const badgeEl = document.querySelector('.price-change');
    if (badgeEl) {
      let refText = '';
      if (stockData && stockData.ref_price && stockData.current_price) {
        const diff = stockData.current_price - stockData.ref_price;
        const diffPct = stockData.price_change_pct || ((diff / stockData.ref_price) * 100).toFixed(2);
        const sign = diff > 0 ? '+' : '';
        const color = diff > 0 ? '#34d399' : (diff < 0 ? '#ef4444' : '#fbbf24');
        refText = ` &bull; <span style="color:${color}; font-weight:600;">${sign}${diff.toLocaleString('vi-VN')} đ (${sign}${diffPct}%)</span> &bull; Tham chiếu: ${stockData.ref_price.toLocaleString('vi-VN')} đ`;
      } else {
        const origText = badgeEl.innerText || badgeEl.textContent || '';
        if (origText.includes('Tham chiếu:')) {
          const m = origText.match(/Tham chiếu:\s*([0-9.,]+)\s*đ?/i);
          if (m) {
            refText = ` &bull; Tham chiếu: ${m[1]} đ`;
          }
        }
      }

      let label = session.label;
      if (stockData && stockData.last_updated && label.includes('Ngày')) {
        const parts = stockData.last_updated.split('-');
        if (parts.length === 3) {
          const dateStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
          label = label.replace(/Ngày\s+\d{2}\/\d{2}\/\d{4}/, `Ngày ${dateStr}`);
        }
      }
      badgeEl.innerHTML = `<span style="color:${session.color}; font-weight:600;">${label}</span>${refText}`;
    }
  }

  // Sync latest price from /data/stocks.json
  async function syncLatestPrice() {
    try {
      const tickerEl = document.querySelector('.ticker-code');
      if (!tickerEl) return;
      const currentTicker = tickerEl.innerText.trim().toUpperCase();

      // Fetch same-origin stocks.json (cache-friendly, non-blocking)
      const res = await fetch(`/data/stocks.json?t=${Date.now()}`);
      if (!res.ok) return;
      const stocks = await res.json();
      const currentStock = stocks.find(s => s.ticker === currentTicker);
      if (!currentStock || !currentStock.current_price) return;

      const newPrice = currentStock.current_price;
      const priceEl = document.getElementById('current-market-price');

      if (priceEl && newPrice > 0) {
        priceEl.innerHTML = `${newPrice.toLocaleString('vi-VN')} <span style="font-size:1.1rem; font-weight:500; color:#94a3b8;">VNĐ</span>`;
        if (typeof CURRENT_PRICE !== 'undefined') {
          window.CURRENT_PRICE = newPrice;
        }
        if (typeof calculateValuation === 'function') {
          calculateValuation();
        }
      }

      if (currentStock.pe) {
        const pill = document.querySelector('.valuation-status-pill');
        if (pill) {
          pill.innerText = `Vùng định giá: Rất rẻ (P/E ${currentStock.pe}x)`;
        }
      }

      updateSessionBadge(currentStock);
    } catch (e) {
      // Graceful fallback: silently keep static HTML price
      updateSessionBadge();
    }
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      updateSessionBadge();
      syncLatestPrice();
    });
  } else {
    updateSessionBadge();
    syncLatestPrice();
  }

  // Auto-refresh every 60s if market is open
  setInterval(() => {
    const session = getMarketSessionInfo();
    updateSessionBadge();
    if (session.isLive) {
      syncLatestPrice();
    }
  }, 60000);
})();
