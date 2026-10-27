/**
 * Live Real-Time Market Ticker Updater
 * Auto-refreshes every 60s from /api/market-ticker
 */
(function() {
  async function refreshMarketTicker() {
    try {
      const res = await fetch('/api/market-ticker');
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !data.items || data.items.length === 0) return;

      const track = document.querySelector('.simplize-ticker-track');
      if (!track) return;

      // Duplicate array for seamless infinite CSS marquee
      const html = [...data.items, ...data.items].map(it => `
        <div class="s-item">
          <span class="s-icon">${it.icon}</span>
          <span class="s-name">${it.name}</span>
          <span class="s-val">${it.val}</span>
          <span class="${it.isUp ? 's-badge-up' : 's-badge-down'}">${it.change}</span>
        </div>
      `).join('');

      track.innerHTML = html;
    } catch (e) {
      // Fail silently, preserving static fallback snapshot
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refreshMarketTicker);
  } else {
    refreshMarketTicker();
  }
  // Auto refresh every 60 seconds
  setInterval(refreshMarketTicker, 60000);
})();
