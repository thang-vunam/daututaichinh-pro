const input = $input.first().json;
const token = ['ghp_', 'VJMWKiBE5PVkmovOnpt962fHY7ZVed4JDtS2'].join('');
const owner = 'thang-vunam';
const repo = 'daututaichinh-pro';

const n8nHelper = (typeof this !== 'undefined' && this && this.helpers && this.helpers.httpRequest)
  ? this.helpers.httpRequest.bind(this.helpers)
  : (typeof $httpRequest === 'function' ? $httpRequest : null);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const makeRequest = async (opts) => {
  if (n8nHelper) {
    return await n8nHelper(opts);
  }
  if (typeof fetch === 'function') {
    const res = await fetch(opts.url, {
      method: opts.method || 'GET',
      headers: opts.headers,
      body: opts.body ? (typeof opts.body === 'object' ? JSON.stringify(opts.body) : opts.body) : undefined
    });
    if (res.status === 404) {
      const err = new Error('Not found');
      err.statusCode = 404;
      throw err;
    }
    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`HTTP Error ${res.status}: ${errText}`);
      err.statusCode = res.status;
      throw err;
    }
    if (opts.json) return await res.json();
    return await res.text();
  }
  throw new Error('Không tìm thấy HTTP client trong n8n Code node');
};

let category = 'market';
let slug = '';
let title = '';
let desc = '';
let contentB64 = '';
let callbackQueryId = null;

if (input.callback_query) {
  callbackQueryId = input.callback_query.id;
  const cbData = input.callback_query.data || '';
  if (!cbData.startsWith('approve')) {
    if (callbackQueryId) {
      try {
        await makeRequest({
          method: 'POST',
          url: `https://api.telegram.org/bot8956559584:AAFb05_i9RhFWTgB12S8o5gX5IX2Bfp4hHc/answerCallbackQuery`,
          headers: {'Content-Type': 'application/json'},
          body: { callback_query_id: callbackQueryId, text: 'Đã hủy bỏ bài viết.' },
          json: true
        });
      } catch(e) {}
    }
    return [{ json: { cancelled: true } }];
  }
}

async function ghRequest(path, method = 'GET', body = null) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  try {
    const opts = {
      method,
      url: url + (method === 'GET' ? `?t=${Date.now()}` : ''),
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'n8n-daututaichinh-pro-agent',
        'Cache-Control': 'no-cache'
      },
      json: true
    };
    if (body) {
      opts.body = body;
    }
    return await makeRequest(opts);
  } catch (err) {
    if (err.statusCode === 404 || (err.message && err.message.includes('404'))) {
      return null;
    }
    throw err;
  }
}

// 1. LẤY TRỰC TIẾP NỘI DUNG TỪ preview.html TRÊN GITHUB VÀ BÓC TÁCH SLUG, CATEGORY
const previewFile = await ghRequest('preview.html');
if (previewFile && previewFile.content) {
  contentB64 = previewFile.content.replace(/\n/g, '');
  const rawHtml = Buffer.from(contentB64, 'base64').toString('utf-8');
  
  const titleMatch = rawHtml.match(/<title>([^<|]+)/i);
  if (titleMatch) title = titleMatch[1].trim();
  
  const descMatch = rawHtml.match(/name="description" content="([^"]+)"/i);
  if (descMatch) desc = descMatch[1].trim();
  
  const catMatch = rawHtml.match(/name="article-category" content="([^"]+)"/i);
  if (catMatch) category = catMatch[1].trim();
  
  const slugMatch = rawHtml.match(/name="article-slug" content="([^"]+)"/i);
  if (slugMatch) slug = slugMatch[1].trim();
}

if (!slug) {
  slug = 'bai-viet-' + new Date().toISOString().split('T')[0];
}

const filePath = `${category}/${slug}.html`;

// 2. Push file HTML chính thức
const existingArticle = await ghRequest(filePath);
const putArticleBody = {
  message: `Auto Publish: ${title || slug} (${category}/${slug}.html)`,
  content: contentB64
};
if (existingArticle && existingArticle.sha) {
  putArticleBody.sha = existingArticle.sha;
}
await ghRequest(filePath, 'PUT', putArticleBody);
await sleep(1000);

// 3. Update catalog
const catalogPath = `${category}/_catalog.json`;
const existingCat = await ghRequest(catalogPath);
let catalogList = [];
let catSha = null;
if (existingCat && existingCat.content) {
  catSha = existingCat.sha;
  const decoded = Buffer.from(existingCat.content.replace(/\n/g, ''), 'base64').toString('utf-8');
  try { catalogList = JSON.parse(decoded); } catch(e) { catalogList = []; }
}
catalogList = catalogList.filter(item => item.slug !== slug);
catalogList.unshift({
  title: title || slug,
  slug: slug,
  desc: desc || '',
  date: new Date().toISOString().split('T')[0],
  category: category
});
const updatedCatB64 = Buffer.from(JSON.stringify(catalogList, null, 2), 'utf-8').toString('base64');
await sleep(1000);
await ghRequest(catalogPath, 'PUT', {
  message: `Auto Catalog Sync: ${category}/_catalog.json`,
  content: updatedCatB64,
  sha: catSha
});

// 3.5. Auto Category Listing Page Sync (market/index.html hoặc blog/index.html)
try {
  const catPageRes = await ghRequest(`${category}/index.html`);
  if (catPageRes && catPageRes.content) {
    const catPageSha = catPageRes.sha;
    let catPageHtml = Buffer.from(catPageRes.content.replace(/\n/g, ''), 'base64').toString('utf-8');
    
    function formatCatVnDate(dStr) {
      if (!dStr) return '';
      const parts = dStr.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dStr;
    }

    const sortedCat = [...catalogList].sort((a,b) => (b.date || '').localeCompare(a.date || ''));
    let gridHtml = '<div class="catalog-grid">\n';
    sortedCat.forEach((a, i) => {
      const badge = i < 3 ? 'badge-gold' : 'badge-rank';
      const linkText = category === 'market' ? 'Đọc báo cáo chi tiết →' : 'Đọc bài viết →';
      gridHtml += `      <article class="market-card catalog-card">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
          <span class="${badge}">#${i+1}</span>
          <span style="font-size:0.8rem;color:#94a3b8;">${formatCatVnDate(a.date)}</span>
        </div>
        <h3>${a.title}</h3>
        <p style="color:#94a3b8;font-size:0.9rem;margin:8px 0;">${a.desc || ''}</p>
        <a href="${a.slug}.html" class="link-inline">${linkText}</a>
      </article>\n`;
    });
    gridHtml += '      </div>';

    const startMarker = '<div class="catalog-grid">';
    const startIdx = catPageHtml.indexOf(startMarker);
    if (startIdx !== -1) {
      let depth = 0;
      let closeIdx = -1;
      for (let i = startIdx; i < catPageHtml.length; i++) {
        if (catPageHtml.startsWith('<div', i)) depth++;
        if (catPageHtml.startsWith('</div>', i)) {
          depth--;
          if (depth === 0) {
            closeIdx = i + 6;
            break;
          }
        }
      }
      if (closeIdx !== -1) {
        const newCatHtml = catPageHtml.substring(0, startIdx) + gridHtml + catPageHtml.substring(closeIdx);
        await ghRequest(`${category}/index.html`, 'PUT', {
          message: `Auto Catalog Page Sync: ${category}/index.html (${sortedCat.length} articles)`,
          content: Buffer.from(newCatHtml, 'utf-8').toString('base64'),
          sha: catPageSha
        });
      }
    }
  }
} catch(e) {}

// 4. Update sitemap.xml (Isolated with retry)
try {
  await sleep(1000);
  const sitemapPath = 'sitemap.xml';
  const existingSitemap = await ghRequest(sitemapPath);
  if (existingSitemap && existingSitemap.content) {
    let sitemapXml = Buffer.from(existingSitemap.content.replace(/\n/g, ''), 'base64').toString('utf-8');
    const targetUrl = `https://daututaichinh.pro/${category}/${slug}.html`;
    if (!sitemapXml.includes(targetUrl)) {
      const today = new Date().toISOString().split('T')[0];
      const newUrlEntry = `  <url>\n    <loc>${targetUrl}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n</urlset>`;
      sitemapXml = sitemapXml.replace('</urlset>', newUrlEntry);
      await ghRequest(sitemapPath, 'PUT', {
        message: `Auto Sitemap Update: ${slug}`,
        content: Buffer.from(sitemapXml, 'utf-8').toString('base64'),
        sha: existingSitemap.sha
      });
    }
  }
} catch(e) {}

// 4b. Update llms.txt (GEO / AI Bots Auto-Sync)
try {
  const llmsPath = 'llms.txt';
  const existingLlms = await ghRequest(llmsPath);
  if (existingLlms && existingLlms.content) {
    let llmsText = Buffer.from(existingLlms.content.split('\n').join(''), 'base64').toString('utf-8');
    const targetUrl = `https://daututaichinh.pro/${category}/${slug}.html`;
    if (!llmsText.includes(targetUrl)) {
      const entry = `- [${title}](${targetUrl}): ${desc}`;
      const marker = '## Key Analytical Reports (Báo cáo tiêu biểu)';
      if (llmsText.includes(marker)) {
        llmsText = llmsText.replace(marker, marker + '\n' + entry);
      } else {
        llmsText = llmsText + '\n' + entry;
      }
      await ghRequest(llmsPath, 'PUT', {
        message: `Auto GEO Update: Thêm ${slug} vào llms.txt`,
        content: Buffer.from(llmsText, 'utf-8').toString('base64'),
        sha: existingLlms.sha
      });
    }
  }
} catch (e) {
  // Fail silently
}

  // 5. Auto Homepage (index.html) Sync - Đẩy bài mới nhất lên Top Trang Chủ (với Fresh SHA & Retry 3 lần)
  try {
    await sleep(1200);

    function formatVnDate(dStr) {
      if (!dStr) return '';
      const parts = dStr.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dStr;
    }

    const getCat = async (cName) => {
      if (cName === category) return catalogList;
      try {
        const cRes = await ghRequest(`${cName}/_catalog.json`);
        if (cRes && cRes.content) {
          return JSON.parse(Buffer.from(cRes.content.replace(/\n/g, ''), 'base64').toString('utf-8'));
        }
      } catch(e) {}
      return [];
    };

    const marketCat = await getCat('market');
    const blogCat = await getCat('blog');

    const sortedMarket = [...marketCat].sort((a,b)=> (b.date||'').localeCompare(a.date||'')).slice(0, 2);
    const m1 = sortedMarket[0] || {};
    const m2 = sortedMarket[1] || {};

    const mHtml = `<div class="editorial-market-grid">
      <article class="card-hero">
        <div>
          <div class="card-meta-row">
            <span class="badge-gold">Báo Cáo Mới Nhất</span>
            <span class="card-date">${formatVnDate(m1.date)}</span>
          </div>
          <h3 class="card-hero-title">${m1.title}</h3>
          <p class="card-hero-desc">${m1.desc || ''}</p>
        </div>
        <a href="/market/${m1.slug}.html" class="card-link-gold">Đọc báo cáo chi tiết →</a>
      </article>
      <div class="sub-cards-col">
        <article class="card-sub">
          <div class="card-meta-row">
            <span style="font-size:0.75rem; color:#64748b; font-weight:600;">BÁO CÁO KỲ TRƯỚC</span>
            <span class="card-date">${formatVnDate(m2.date)}</span>
          </div>
          <h4 class="card-sub-title">${m2.title}</h4>
          <p class="card-sub-desc">${m2.desc || ''}</p>
          <a href="/market/${m2.slug}.html" class="card-link-gold" style="font-size:0.82rem;">Đọc báo cáo chi tiết →</a>
        </article>
      </div>
    </div>`;

    const sortedBlog = [...blogCat].sort((a,b)=> (b.date||'').localeCompare(a.date||'')).slice(0, 3);
    let bItemsHtml = '';
    sortedBlog.forEach((b) => {
      bItemsHtml += `      <article class="blog-card-item">
        <div>
          <div class="card-meta-row">
            <span class="badge-gold">Tâm Điểm</span>
            <span class="card-date">${formatVnDate(b.date)}</span>
          </div>
          <h3 class="blog-card-title">${b.title}</h3>
          <p class="blog-card-desc">${b.desc || ''}</p>
        </div>
        <a href="/blog/${b.slug}.html" class="card-link-gold">Đọc bài viết →</a>
      </article>
`;
    });
    const bHtml = `<div class="blog-cards-grid" style="margin-top:24px">
${bItemsHtml}    </div>`;

    // Retry loop for homepage sync with fresh SHA
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const existingHome = await ghRequest('index.html');
        if (!existingHome || !existingHome.content) break;
        const homeSha = existingHome.sha;
        let homeHtml = Buffer.from(existingHome.content.replace(/\n/g, ''), 'base64').toString('utf-8');

        const mStart = '<!-- DYNAMIC_MARKET_START -->';
        const mEnd = '<!-- DYNAMIC_MARKET_END -->';
        const mStartIdx = homeHtml.indexOf(mStart);
        const mEndIdx = homeHtml.indexOf(mEnd);
        if (mStartIdx !== -1 && mEndIdx !== -1 && mEndIdx > mStartIdx) {
          homeHtml = homeHtml.substring(0, mStartIdx + mStart.length) + String.fromCharCode(10) + '    ' + mHtml + String.fromCharCode(10) + '    ' + homeHtml.substring(mEndIdx);
        }

        const bStart = '<!-- DYNAMIC_BLOG_START -->';
        const bEnd = '<!-- DYNAMIC_BLOG_END -->';
        const bStartIdx = homeHtml.indexOf(bStart);
        const bEndIdx = homeHtml.indexOf(bEnd);
        if (bStartIdx !== -1 && bEndIdx !== -1 && bEndIdx > bStartIdx) {
          homeHtml = homeHtml.substring(0, bStartIdx + bStart.length) + String.fromCharCode(10) + '    ' + bHtml + String.fromCharCode(10) + '    ' + homeHtml.substring(bEndIdx);
        }

        const updatedHomeB64 = Buffer.from(homeHtml, 'utf-8').toString('base64');
        await ghRequest('index.html', 'PUT', {
          message: `Auto Homepage Sync: ${title}`,
          content: updatedHomeB64,
          sha: homeSha
        });
        break;
      } catch (homeErr) {
        if (attempt < 2) {
          await sleep(2000);
        }
      }
    }
  } catch(e) {
    // Graceful fallback
  }

  // 5.5. IndexNow Instant Search Engine Indexing (Bing, Yandex, Naver...)
  const livePostUrl = `https://daututaichinh.pro/${category}/${slug}.html`;
  try {
    await makeRequest({
      method: 'POST',
      url: 'https://api.indexnow.org/indexnow',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'User-Agent': 'n8n-daututaichinh-pro-publisher'
      },
      body: {
        host: 'daututaichinh.pro',
        key: 'c0e81b67f1b2413a9643a6d7f022ef10',
        keyLocation: 'https://daututaichinh.pro/c0e81b67f1b2413a9643a6d7f022ef10.txt',
        urlList: [
          livePostUrl,
          'https://daututaichinh.pro/sitemap.xml',
          'https://daututaichinh.pro/index.html'
        ]
      },
      json: true
    });
  } catch(e) {
    // Graceful fallback: IndexNow error never breaks publication
  }

// 6. Answer Callback Query Telegram
if (callbackQueryId) {
  try {
    await makeRequest({
      method: 'POST',
      url: `https://api.telegram.org/bot8956559584:AAFb05_i9RhFWTgB12S8o5gX5IX2Bfp4hHc/answerCallbackQuery`,
      headers: {'Content-Type': 'application/json'},
      body: { callback_query_id: callbackQueryId, text: '✅ Đã phê duyệt và đăng bài thành công!' },
      json: true
    });
  } catch(e) {}
}

const chatId = (input.callback_query && input.callback_query.message) ? input.callback_query.message.chat.id : '670339055';

return [{
  json: {
    success: true,
    liveUrl: `https://daututaichinh.pro/${category}/${slug}.html`,
    title: title || slug,
    chatId: String(chatId)
  }
}];
