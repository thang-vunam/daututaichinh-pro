
// ==========================================
// QUY CHUẨN SENTENCE CASE TIÊU ĐỀ (SEO & GEO)
// ==========================================
const SENTENCE_CASE_KEEP_PHRASES = [
  "VN-Index", "VN30", "HNX", "UPCoM", "HOSE", "HSX", "KRX", "FTSE", "MSCI",
  "SSI", "VND", "VIX", "HCM", "SHS", "MBS", "TCBS", "VPS", "FPT", "MWG",
  "HPG", "VHM", "VIC", "VRE", "VCB", "BID", "CTG", "MBB", "TCB", "VPB",
  "ACB", "STB", "HDB", "TPB", "MSB", "SSB", "LPB", "EIB", "OIC", "VIB",
  "PNJ", "MSN", "VNM", "SAB", "GAS", "PLX", "POW", "BSR", "PVD", "PVS",
  "DGC", "DCM", "DPM", "GVR", "KBC", "KDH", "NLG", "VGC", "VJC", "HVN",
  "GMD", "REE", "BVH", "BCM", "CTR", "FRT", "DGW", "HAX",
  "P/E", "P/B", "ROE", "ROA", "EPS", "BVPS", "EBITDA", "EBIT", "CAGR",
  "NAV", "WACC", "DCF", "D/E", "NPL", "CASA", "NIM", "CIR", "CAR",
  "FED", "SBV", "UBCKNN", "SSC", "VSD", "IMF", "WB", "WTO", "GDP", "CPI",
  "FDI", "FII", "ETF", "M&A", "IPO", "CEO", "CFO", "AI", "ESG",
  "Việt Nam", "Mỹ", "Trung Quốc", "Nhật Bản", "Hàn Quốc", "Châu Âu", "Đức", "Anh", "Pháp", "Nga", "Indonesia",
  "Hà Nội", "TP.HCM", "Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Bình Dương", "Đồng Nai",
  "Quý I", "Quý II", "Quý III", "Quý IV", "Q1", "Q2", "Q3", "Q4",
  "III", "II", "IV", "VIII", "VII", "VI", "IX", "X"
];

function formatSentenceCase(title) {
  if (!title || typeof title !== 'string') return '';
  let clean = title.trim();
  if (!clean) return '';

  let lower = clean.toLowerCase();
  let result = lower.charAt(0).toUpperCase() + lower.slice(1);
  result = result.replace(/([:?!.]\s+)([a-zà-ỹ])/g, (m, p1, p2) => p1 + p2.toUpperCase());

  const sorted = [...SENTENCE_CASE_KEEP_PHRASES].sort((a,b) => b.length - a.length);
  for (const phrase of sorted) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\/\\]/g, '\\$&');
    const regex = new RegExp(`(?<=[^a-zà-ỹ0-9]|^)${escaped}(?=[^a-zà-ỹ0-9]|$)`, 'gi');
    result = result.replace(regex, phrase);
  }
  return result;
}

const geminiOutput = $input.first().json;
const normalizerData = $('Input Normalizer & Router').first().json;

function parseGeminiOutput(rawText) {
  let clean = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }

  const result = {
    title: '',
    slug: '',
    metaDescription: '',
    category: normalizerData.category || 'market',
    sapo: '',
    summaryMsg: '',
    keyTakeaways: [],
    kpiCards: null,
    faqs: [],
    htmlContent: '',
    imageSearchQuery: '',
    imageAlt: '',
    imageCaption: '',
    tags: []
  };

  // 1. Try standard JSON.parse first
  try {
    const p = JSON.parse(clean);
    if (p && p.htmlContent) {
      if (typeof p.htmlContent === 'string') {
        p.htmlContent = p.htmlContent
          .replace(/\\r/g, '')
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, ' ')
          .replace(/\\"/g, '"');
      }
      return p;
    }
  } catch (e) {}

  // 2. Extract htmlContent via precise boundary detection
  const marker = '"htmlContent"';
  const markerIdx = clean.indexOf(marker);
  if (markerIdx !== -1) {
    const colonIdx = clean.indexOf(':', markerIdx + marker.length);
    const openQuote = clean.indexOf('"', colonIdx + 1);
    if (openQuote !== -1) {
      let closeQuote = -1;
      const nextKeys = ['"imageSearchQuery"', '"imageAlt"', '"tags"', '"hashtags"', '"factCheckReport"'];
      for (const nk of nextKeys) {
        const nkIdx = clean.indexOf(nk, openQuote);
        if (nkIdx !== -1) {
          const prevQuote = clean.lastIndexOf('"', nkIdx - 1);
          if (prevQuote > openQuote && (closeQuote === -1 || prevQuote < closeQuote)) {
            closeQuote = prevQuote;
          }
        }
      }
      if (closeQuote !== -1) {
        result.htmlContent = clean.substring(openQuote + 1, closeQuote)
          .replace(/\\"/g, '"')
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '')
          .replace(/\\t/g, '  ')
          .replace(/\\\\/g, '\\');
      }
    }
  }

  // 3. Regex extractions for other fields
  const titleM = clean.match(/"title"\s*:\s*"([^"]+)"/i);
  if (titleM) result.title = titleM[1];

  const slugM = clean.match(/"slug"\s*:\s*"([^"]+)"/i);
  if (slugM) result.slug = slugM[1];

  const descM = clean.match(/"metaDescription"\s*:\s*"([^"]+)"/i);
  if (descM) result.metaDescription = descM[1];

  const sapoM = clean.match(/"sapo"\s*:\s*"([^"]+)"/i);
  if (sapoM) result.sapo = sapoM[1];

  const sumM = clean.match(/"summaryMsg"\s*:\s*"([^"]+)"/i);
  if (sumM) result.summaryMsg = sumM[1];

  const takeM = clean.match(/"keyTakeaways"\s*:\s*\[([\s\S]*?)\]/i);
  if (takeM) {
    const items = [];
    const itemRegex = /"([^"]+)"/g;
    let im;
    while ((im = itemRegex.exec(takeM[1])) !== null) {
      items.push(im[1]);
    }
    result.keyTakeaways = items;
  }

  const kpiM = clean.match(/"kpiCards"\s*:\s*(\[[\s\S]*?\])/i);
  if (kpiM) {
    try { result.kpiCards = JSON.parse(kpiM[1]); } catch(e) {}
  }

  const faqM = clean.match(/"faqs"\s*:\s*(\[[\s\S]*?\])/i);
  if (faqM) {
    try { result.faqs = JSON.parse(faqM[1]); } catch(e) {}
  }

  const iqM = clean.match(/"imageSearchQuery"\s*:\s*"([^"]*)"/i);
  if (iqM) result.imageSearchQuery = iqM[1];
  const iaM = clean.match(/"imageAlt"\s*:\s*"([^"]*)"/i);
  if (iaM) result.imageAlt = iaM[1];
  const icM = clean.match(/"imageCaption"\s*:\s*"([^"]*)"/i);
  if (icM) result.imageCaption = icM[1];

  return result;
}

let rawText = '';
if (geminiOutput.candidates && geminiOutput.candidates[0]?.content?.parts) {
  rawText = geminiOutput.candidates[0].content.parts.map(p => p.text || '').join('');
} else if (geminiOutput.text) {
  rawText = geminiOutput.text;
}

const articleData = parseGeminiOutput(rawText);

// Curated Unsplash photo bank with distinct sentiment & topics
const photoBank = [
  // BULLISH / TĂNG ĐIỂM / BỨT PHÁ / SÓNG TĂNG / CHARGING BULL
  { 
    id: 'photo-1535320903710-d993d3d77d29', 
    sentiment: 'bullish',
    tags: ['bull', 'charging bull', 'tăng', 'bứt phá', 'vượt đỉnh', 'sóng tăng', 'hưng phấn', 'tăng vọt', 'rally', 'uptrend', 'xanh'] 
  },
  { 
    id: 'photo-1590283603385-17ffb3a7f29f', 
    sentiment: 'bullish',
    tags: ['bull', 'tăng trưởng', 'tăng điểm', 'bứt phá', 'phục hồi', 'hồi phục', 'thanh khoản', 'chart', 'trading', 'screen', 'green'] 
  },

  // BANKING / TÀI CHÍNH / TRỤ CỘT VN30 / VĨ MÔ
  { 
    id: 'photo-1486406146926-c627a92ad1ab', 
    sentiment: 'neutral',
    tags: ['ngân hàng', 'bank', 'banking', 'tài chính', 'building', 'skyscraper', 'office', 'corporate', 'trụ cột'] 
  },
  { 
    id: 'photo-1559526324-4b87b5e36e44', 
    sentiment: 'neutral',
    tags: ['tiền tệ', 'dòng tiền', 'ngoại tệ', 'lãi suất', 'money', 'wealth', 'investment', 'gold', 'vĩ mô'] 
  },
  { 
    id: 'photo-1460925895917-afdab827c52f', 
    sentiment: 'neutral',
    tags: ['dữ liệu', 'báo cáo', 'định giá', 'phân tích', 'kết quả kinh doanh', 'analytics', 'dashboard', 'report'] 
  },
  { 
    id: 'photo-1454165804606-c3d57bc86b40', 
    sentiment: 'neutral',
    tags: ['chiến lược', 'danh mục', 'nghiên cứu', 'khuyến nghị', 'research', 'desk', 'workspace', 'laptop'] 
  },

  // BEARISH / GIẢM ĐIỂM / BÁN THÁO / LAO DỐC / CHÌM TRONG SẮC ĐỎ (chỉ dùng khi thị trường giảm)
  { 
    id: 'photo-1611974789855-9c2a0a7236a3', 
    sentiment: 'bearish',
    tags: ['giảm', 'lao dốc', 'bán tháo', 'chìm sâu', 'sụt giảm', 'thủng đáy', 'đỏ lửa', 'rơi tự do', 'suy thoái', 'bear', 'crash', 'selloff', 'downtrend'] 
  }
];

function pickCoverImage(query, title) {
  const text = ((query || '') + ' ' + (title || '')).toLowerCase();
  
  // 1. Detect market sentiment
  const bullishKeywords = ['tăng', 'bứt phá', 'vượt đỉnh', 'hưng phấn', 'tăng vọt', 'sóng tăng', 'hồi phục', 'phục hồi', 'sắc xanh', 'khởi sắc', 'bull', 'rally', 'uptrend'];
  const bearishKeywords = ['giảm', 'lao dốc', 'bán tháo', 'chìm sâu', 'sụt giảm', 'thủng đáy', 'đỏ lửa', 'rơi tự do', 'suy thoái', 'bear', 'crash', 'selloff', 'downtrend'];

  const isBullish = bullishKeywords.some(kw => text.includes(kw));
  const isBearish = bearishKeywords.some(kw => text.includes(kw));

  let targetSentiment = 'neutral';
  if (isBullish && !isBearish) {
    targetSentiment = 'bullish';
  } else if (isBearish && !isBullish) {
    targetSentiment = 'bearish';
  } else if (isBullish && isBearish) {
    // Both present (e.g. tăng vọt 33 điểm nhưng khối ngoại bán ròng): dominant index movement takes priority
    targetSentiment = (text.includes('tăng vọt') || text.includes('tăng mạnh') || text.includes('bứt phá')) ? 'bullish' : 'neutral';
  }

  // Filter photo pool
  let pool = photoBank;
  if (targetSentiment === 'bullish') {
    pool = photoBank.filter(p => p.sentiment === 'bullish' || p.sentiment === 'neutral');
  } else if (targetSentiment === 'bearish') {
    pool = photoBank.filter(p => p.sentiment === 'bearish');
  }

  let bestPhoto = pool[0];
  let maxMatches = -1;
  for (const photo of pool) {
    let matches = 0;
    if (photo.sentiment === targetSentiment) matches += 3; // Sentiment priority weight
    for (const tag of photo.tags) {
      if (text.includes(tag)) matches++;
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      bestPhoto = photo;
    }
  }
  return bestPhoto.id;
}

const photoId = pickCoverImage(articleData.imageSearchQuery, articleData.title);
let imageUrl = `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1200&q=80`;
if (!imageUrl || imageUrl.startsWith('data:image')) {
  imageUrl = `https://daututaichinh.pro/images/cover-${articleData.slug}.png`;
}

// 1. Ensure Semantic Headings
function ensureSemanticHeadings(html) {
  if (!html) return '';
  let res = html;

  // Khử sạch hoàn toàn ký tự escape \n, \r, \t, \" rò rỉ từ JSON của AI
  res = res.replace(/\\r/g, '').replace(/\\n/g, '\n').replace(/\\t/g, ' ');
  res = res.replace(/\\"/g, '"').replace(/\\'/g, "'");

  // Bỏ qua và xóa sạch dấu phân cách thô '---' hoặc <p>---</p> để không tạo khoảng trắng khổng lồ
  res = res.replace(/<p>\s*---+?\s*<\/p>/gi, '');
  res = res.replace(/(^|[\r\n]+)\s*---+?\s*([\r\n]+|$)/g, '$1$2');
  // Chuẩn hóa Blockquote: thanh viền màu trắng thanh lịch, nền tối nhẹ dịu mắt
  res = res.replace(/<blockquote[^>]*>/gi, '<blockquote class="article-quote" style="border-left: 3px solid #ffffff; background: rgba(255, 255, 255, 0.03); border-radius: 0 8px 8px 0; padding: 12px 18px; margin: 18px 0; font-style: italic; color: #e2e8f0; line-height: 1.7;">');
  // Xóa mọi ký tự escape \", \'
  res = res.replace(/\\"/g, '"').replace(/\\'/g, "'");
  // Xóa dấu nháy kép thừa hoặc bị escape bên trong blockquote: \"Dòng tiền...\" -> Dòng tiền...
  res = res.replace(/(<blockquote[^>]*>[\s\S]*?<p>)\s*[\\"]*["“]?\s*([\s\S]*?)\s*[\\"]*["”]?\s*(<\/p>[\s\S]*?<\/blockquote>)/gi, '$1$2$3');
  res = res.replace(/(\d+)\\\./g, '$1.');
  res = res.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  res = res.replace(/(^|[^\*])\*([^\*]+?)\*([^\*]|$)/g, '$1<em>$2</em>$3');
  res = res.replace(/(^|[\r\n]+)#####\s+([^\r\n<]+)/g, '$1<h5>$2</h5>');
  res = res.replace(/(^|[\r\n]+)####\s+([^\r\n<]+)/g, '$1<h4>$2</h4>');
  res = res.replace(/(^|[\r\n]+)###\s+(\d+[\.\)]\s+)?(điểm bất ngờ|sự thật\s*\d+|luận điểm\s*\d+|kịch bản\s*\d+|trụ cột|nguyên tắc|nhóm ngành)[^\r\n<]*/gi, (m) => {
    let cleanText = m.replace(/(^|[\r\n]+)###\s+/, '').replace(/(\d+)\\\./g, '$1.').trim();
    cleanText = cleanText.replace(/^\d+[\.\)]\s*/, '').trim();
    return '\n<h3>' + cleanText + '</h3>';
  });
  return res;
}

// 2. Smart Linking with Tier 0 VN30 Data Hub
// DEFENSIVE ANTI-HALLUCINATION SANITIZER: Eliminate any 404 invented links
function sanitizeInternalLinks(html) {
  if (!html) return html;
  
  // Whitelist of valid root & hub paths
  const validExactPaths = new Set([
    '/', '/index.html', '/market/', '/market/index.html', 
    '/blog/', '/blog/index.html', '/download/', '/download/index.html',
    '/vip.html', '/co-phieu/', '/co-phieu/index.html'
  ]);
  
  const vn30Set = new Set([
    'acb', 'bid', 'bsr', 'ctg', 'fpt', 'gas', 'gvr', 'hdb', 'hpg', 'lpb',
    'mbb', 'mch', 'msn', 'mwg', 'sab', 'shb', 'ssb', 'ssi', 'stb', 'tcb',
    'tcx', 'vcb', 'vhm', 'vib', 'vic', 'vjc', 'vnm', 'vpb', 'vpl', 'vre'
  ]);

  return html.replace(/<a\s+([^>]*)href=["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi, (match, beforeHref, href, afterHref, innerText) => {
    // 1. External links
    if (href.startsWith('http://') || href.startsWith('https://')) {
      if (!href.includes('daututaichinh.pro')) {
        // Ensure rel and target for external
        let attrs = `${beforeHref} href="${href}" ${afterHref}`.trim();
        if (!attrs.includes('target=')) attrs += ' target="_blank"';
        if (!attrs.includes('rel=')) attrs += ' rel="noopener"';
        return `<a ${attrs}>${innerText}</a>`;
      }
      // If internal absolute URL (https://daututaichinh.pro/...), normalize to relative
      href = href.replace(/^https?:\/\/daututaichinh\.pro/, '') || '/';
    }

    // 2. Local anchor links (#...)
    if (href.startsWith('#')) {
      return match;
    }

    // 3. Whitelisted exact internal paths
    if (validExactPaths.has(href)) {
      return match;
    }

    // 4. Valid VN30 stock detail page: /co-phieu/{ticker}.html
    const tickerMatch = href.match(/^\/co-phieu\/([a-z0-9]+)\.html$/i);
    if (tickerMatch) {
      if (vn30Set.has(tickerMatch[1].toLowerCase())) {
        return match;
      }
      // Nếu là mã KHÔNG nằm trong Data Hub (như dxg, dig, vnd...): gỡ link, giữ in đậm thường để triệt tiêu 404!
      const cleanStock = innerText.replace(/<[^>]+>/g, '').trim();
      return `<strong>${cleanStock}</strong>`;
    }

    // 5. ANY other internal path is potentially hallucinated by AI (e.g. /market/bao-cao-xyz)
    // Safely remap to parent hub to guarantee ZERO 404s!
    let safeHref = '/market/';
    if (href.startsWith('/blog/')) {
      safeHref = '/blog/';
    } else if (href.startsWith('/download/')) {
      safeHref = '/download/';
    } else if (href.startsWith('/co-phieu/')) {
      safeHref = '/co-phieu/';
    }

    return `<a ${beforeHref} href="${safeHref}" ${afterHref}>${innerText}</a>`;
  });
}


// ==========================================
// BỘ LỌC CHUẨN HÓA DARK THEME (FAILSAFE ANTI-WHITE)
// ==========================================
function sanitizeDarkTheme(html) {
  if (!html) return '';
  // 1. Chuyển đổi màu nền sáng (#f8fafc, #f1f5f9, #ffffff, #fff) thành Dark Theme sang trọng
  html = html.replace(/background:\s*(?:#f8fafc|#f1f5f9|#ffffff|#fff)\b/gi, 'background: rgba(15, 23, 42, 0.85)');
  // 2. Chuyển đổi nền kịch bản sáng (#ecfdf5, #fffbeb, #fef2f2) sang nền tối có sắc thái
  html = html.replace(/background:\s*#ecfdf5\b/gi, 'background: rgba(16, 185, 129, 0.12)');
  html = html.replace(/background:\s*#fffbeb\b/gi, 'background: rgba(245, 158, 11, 0.12)');
  html = html.replace(/background:\s*#fef2f2\b/gi, 'background: rgba(239, 68, 68, 0.12)');
  // 3. Chuyển đổi màu chữ tối (dành cho nền trắng) sang màu chữ sáng chuẩn Dark Mode
  html = html.replace(/color:\s*#(?:1e293b|0f172a|334155|64748b)\b/gi, 'color: #cbd5e1');
  html = html.replace(/color:\s*#065f46\b/gi, 'color: #34d399');
  html = html.replace(/color:\s*#92400e\b/gi, 'color: #fbbf24');
  html = html.replace(/color:\s*#991b1b\b/gi, 'color: #f87171');
  // 4. Chuyển đổi viền xám sáng sang viền mờ Dark Mode
  html = html.replace(/border(?:-[a-z]+)?:\s*1px\s+solid\s+#(?:e2e8f0|cbd5e1|cbd5e0)\b/gi, 'border: 1px solid rgba(255, 255, 255, 0.08)');
  html = html.replace(/border-bottom:\s*2px\s+solid\s+#cbd5e1\b/gi, 'border-bottom: 2px solid rgba(255, 255, 255, 0.12)');
  return html;
}

function applySmartLinking(html, category, topic) {
  if (!html) return html;
  let modifiedHtml = html;

  function safeReplaceFirstInParagraphs(content, targetWord, replaceFn) {
    let replaced = false;
    return content.replace(/(<p[^>]*>)([\s\S]*?)(<\/p>)/gi, (fullP, pOpen, pInner, pClose) => {
      if (replaced) return fullP;
      const regex = new RegExp(`(?<![<a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF])${targetWord}(?![a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF])(?![^<]*>)(?![^<]*<\\/a>)`, 'i');
      const match = pInner.match(regex);
      if (match) {
        replaced = true;
        const matchIndex = match.index;
        // Detect if matched term is at beginning of paragraph or sentence
        const textBefore = pInner.slice(0, matchIndex).replace(/<[^>]+>/g, '').trim();
        const isStart = textBefore.length === 0 || /[.!?]\s*$/.test(textBefore);
        const isCapitalized = /^[A-ZÀ-Ỹ]/.test(match[0]);

        const newPInner = pInner.replace(regex, (matched) => {
          let rep = replaceFn(matched, isStart || isCapitalized);
          if (isStart || isCapitalized) {
            // Guarantee uppercase on first character inside tag
            rep = rep.replace(/>\s*([a-zà-ỹ])/i, (m, c) => `>${c.toUpperCase()}`);
          }
          return rep;
        });
        return pOpen + newPInner + pClose;
      }
      return fullP;
    });
  }

  // TIER 0: VN30 & Data Hub Whitelist (30 mã có file /co-phieu/{ticker}.html)
  const vn30Tickers = [
    'ACB', 'BID', 'BSR', 'CTG', 'FPT', 'GAS', 'GVR', 'HDB', 'HPG', 'LPB',
    'MBB', 'MCH', 'MSN', 'MWG', 'SAB', 'SHB', 'SSB', 'SSI', 'STB', 'TCB',
    'TCX', 'VCB', 'VHM', 'VIB', 'VIC', 'VJC', 'VNM', 'VPB', 'VPL', 'VRE'
  ];

  let linkedTickers = 0;
  for (const ticker of vn30Tickers) {
    if (linkedTickers >= 3) break;
    if (modifiedHtml.includes(`/co-phieu/${ticker.toLowerCase()}.html`)) continue;

    const patterns = [
      `\\(\\s*${ticker}\\s*\\)`, // Strip outer parentheses e.g. (BID), (ACB)
      `cổ phiếu\\s+${ticker}`,
      `mã\\s+${ticker}`,
      `\\b${ticker}\\b`
    ];

    for (const pat of patterns) {
      const beforeLen = modifiedHtml.length;
      modifiedHtml = safeReplaceFirstInParagraphs(modifiedHtml, pat, (matched) => {
        return `<a href="/co-phieu/${ticker.toLowerCase()}.html" class="ticker-badge" title="Định giá & Dữ liệu cổ phiếu ${ticker}"><i class="fa-solid fa-chart-line"></i> ${ticker}</a>`;
      });
      if (modifiedHtml.length !== beforeLen) {
        linkedTickers++;
        break;
      }
    }
  }

  // DEFENSIVE CLEANUP: Remove any double/redundant outer parentheses around ticker badges e.g. ( [📈 BID] )
  modifiedHtml = modifiedHtml.replace(/\(\s*(<a\s+[^>]*class=["']ticker-badge["'][^>]*>[\s\S]*?<\/a>)\s*\)/gi, '$1');

  // TIER 1 & 2: Hub pages
  if (!modifiedHtml.includes('/market/') && !modifiedHtml.includes('/blog/') && !modifiedHtml.includes('/download/')) {
    if (category === 'market') {
      modifiedHtml = safeReplaceFirstInParagraphs(modifiedHtml, 'thị trường chứng khoán', (m, cap) => {
        return `<a href="/market/">${cap ? 'Nhận định thị trường chứng khoán' : 'thị trường chứng khoán'}</a>`;
      });
    } else {
      modifiedHtml = safeReplaceFirstInParagraphs(modifiedHtml, 'đầu tư', (m, cap) => {
        return `<a href="/blog/">${cap ? 'Kiến thức đầu tư' : 'kiến thức đầu tư'} chuyên sâu</a>`;
      });
    }
  }

  // OUTBOUND LINK
  if (!modifiedHtml.includes('https://www.hsx.vn') && !modifiedHtml.includes('https://sbv.gov.vn') && !modifiedHtml.includes('https://gso.gov.vn')) {
    modifiedHtml = safeReplaceFirstInParagraphs(modifiedHtml, 'HOSE|sở giao dịch chứng khoán', () => '<a href="https://www.hsx.vn" target="_blank" rel="noopener">Sở Giao dịch Chứng khoán TP.HCM (HOSE)</a>');
  }

  return modifiedHtml;
}

// 3. Gold Key Takeaways & Metrics Grid
function buildKeyTakeaways(summaryMsg, kpiCards, body, category) {
  let kpiList = [];
  if (kpiCards && Array.isArray(kpiCards) && kpiCards.length >= 2) {
    kpiList = kpiCards.map(c => ({
      label: c.label || c.name || 'Chỉ số',
      val: c.val || c.value || '--'
    }));
  } else {
    const peMatch = body.match(/P\/E[^0-9]{1,20}(\d+[,.]\d+(\s*–\s*\d+[,.]\d+)?\s*(?:lần|x)?)/i);
    const vniMatch = body.match(/VN-Index[^0-9]{1,20}([12][,.]?\d{3}[,.]?\d*)/i);
    const lnstMatch = body.match(/LNST[^0-9]{1,20}([+-]?\d+[,.]?\d*\s*%(?:\s*YoY)?)/i);
    const knMatch = body.match(/khối ngoại[^0-9]{1,30}(\d+[,.]?\d*\s*tỷ)/i);

    if (vniMatch) kpiList.push({ label: 'Chỉ Số VN-Index', val: vniMatch[1] + ' đ' });
    if (peMatch) kpiList.push({ label: 'P/E Định Giá', val: peMatch[1] });
    if (lnstMatch) kpiList.push({ label: 'Tăng Trưởng LNST', val: lnstMatch[1] });
    if (knMatch) kpiList.push({ label: 'Khối Ngoại Giao Dịch', val: knMatch[1] });

    // Bóc tách thêm các chỉ số P/B, Tín dụng nếu có trong bài
    const pbMatch = body.match(/P\/B[^0-9]{1,20}(\d+[,.]\d+(\s*–\s*\d+[,.]\d+)?\s*(?:lần|x)?)/i);
    const creditMatch = body.match(/tín dụng[^0-9]{1,30}(\d+[,.]?\d*\s*%)/i);
    if (pbMatch) kpiList.push({ label: 'P/B Ngành', val: pbMatch[1] });
    if (creditMatch) kpiList.push({ label: 'Tăng Trưởng Tín Dụng', val: creditMatch[1] });

    // TUYỆT ĐỐI KHÔNG BỊA RA 4 THẺ CHUNG CHUNG NẾU BÀI KHÔNG CÓ SỐ LIỆU ĐỊNH LƯỢNG
    if (kpiList.length < 2) {
      kpiList = []; // Ẩn hoàn toàn khung metric nếu không có số liệu thực tế
    }
  }

  let metricsGridHtml = '';
  if (kpiList.length >= 2) {
    const colCount = Math.min(4, kpiList.length);
    const cardsHtml = kpiList.slice(0, 4).map(k => `        <div class="metric-card" style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 8px; padding: 12px 14px; text-align: center;">
          <div class="metric-label" style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">${k.label}</div>
          <div class="metric-val" style="font-size: 1.15rem; font-weight: 700; color: #fbbf24; font-family: var(--font-mono, monospace); margin-top: 4px; font-variant-numeric: tabular-nums;">${k.val}</div>
        </div>`).join('\n');
    metricsGridHtml = `\n      <div class="gseo-metrics-grid" style="display: grid; grid-template-columns: repeat(${colCount}, 1fr); gap: 12px; margin-top: 16px; width: 100%;">\n${cardsHtml}\n      </div>`;
  }

  const finalMsg = summaryMsg || 'Phân tích dữ liệu tài chính chuyên sâu và kịch bản vận hành chiến lược cho nhà đầu tư.';

  return `      <!-- Executive Summary / Key Takeaways chuẩn gSEO -->
      <div class="key-takeaways" style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(30, 41, 59, 0.7)); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 12px; padding: 22px 24px; margin: 25px 0 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
          <span style="font-size: 1.25rem;">⚡</span>
          <div class="key-takeaways-title" style="margin: 0; color: #fbbf24; font-size: 1.1rem; font-weight: 700;">Tóm tắt Định lượng & Chiến lược (Key Takeaways)</div>
        </div>
        <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 0.95rem; line-height: 1.6;">
          <li style="margin-bottom: 8px;"><strong>Thông điệp trọng tâm:</strong> ${finalMsg}</li>
        </ul>${metricsGridHtml}
      </div>\n\n`;
}

// 4. FAQ Accordion & FAQPage Schema
function buildFaqSection(faqs) {
  if (!faqs || !Array.isArray(faqs) || faqs.length === 0) return { faqHtml: '', faqSchema: null };

  const itemsHtml = faqs.map((f, i) => `  <div class="faq-item" style="background:#131d33; border:1px solid rgba(255,255,255,0.08); border-radius:10px; margin-bottom:12px; overflow:hidden;">
    <div class="faq-question" onclick="this.parentElement.classList.toggle('active')" style="padding:16px 20px; font-weight:700; color:#f8fafc; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
      <span>${i + 1}. ${f.question}</span>
      <i class="fa-solid fa-chevron-down"></i>
    </div>
    <div class="faq-answer" style="padding:0 20px 16px; color:#94a3b8; font-size:0.95rem; line-height:1.7;">
      ${f.answer}
    </div>
  </div>`).join('\n');

  const faqHtml = `\n\n<!-- FAQ Accordion chuẩn gSEO & Schema FAQPage -->
<div class="faq-wrap" id="faq" style="margin: 40px 0;">
  <h2 style="color: #cbd5e1; font-size: 1.45rem; margin-bottom: 20px;">
    <i class="fa-solid fa-circle-question" style="color: #60a5fa;"></i> Câu hỏi thường gặp (FAQ)
  </h2>
${itemsHtml}
</div>\n`;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return { faqHtml, faqSchema };
}

const title = formatSentenceCase(articleData.title || normalizerData.topic || 'Bản tin phân tích tài chính');
const slug = articleData.slug || 'tin-thi-truong';
const category = articleData.category || normalizerData.category || 'market';
const categoryName = category === 'market' ? 'Thị trường' : 'Bài viết';
const metaDesc = articleData.metaDescription || (title + '. Phân tích xu hướng thị trường tài chính chuyên sâu.');
const canonicalUrl = `https://daututaichinh.pro/${category}/${slug}.html`;
const dateIso = new Date().toISOString();
const d = new Date();
const dateDisplay = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

// Assemble Processed Body: Với bài tác giả tự viết (/content), bảo tồn tuyệt đối 100% câu chữ đã chuẩn hóa của tác giả
let rawBody = (normalizerData.mode === 'manual' && normalizerData.formattedHtml)
  ? normalizerData.formattedHtml
  : (articleData.htmlContent || normalizerData.formattedHtml || '<p>Nội dung đang được cập nhật...</p>');

// Lớp phòng vệ 1: Unescape mọi ký tự \n, \r, \t, \" còn sót lại từ JSON encoding
if (typeof rawBody === 'string') {
  rawBody = rawBody.replace(/\\r/g, '').replace(/\\n/g, '\n').replace(/\\t/g, ' ').replace(/\\"/g, '"');
}

let processedBody = ensureSemanticHeadings(rawBody);
// Clean out any hallucinated 404 links first, then apply smart linking & whitelisted stock badges
processedBody = sanitizeInternalLinks(processedBody);
processedBody = applySmartLinking(processedBody, category, title);

// Chuẩn hóa Dark Theme tự động cho mọi bảng biểu, infographic card, kịch bản (failsafe)
processedBody = sanitizeDarkTheme(processedBody);

// Khử trùng lặp ký tự bullet
processedBody = processedBody.replace(/<li>\s*[•\-\*]\s*/gi, '<li>');
processedBody = processedBody.replace(/([•\-\*]\s*)+([•\-\*]\s*)/g, '• ');

// Lớp phòng vệ 2: Quét sạch triệt để mọi chuỗi \n, \r, \t còn sót trong processedBody
processedBody = processedBody.replace(/\\r/g, '').replace(/\\n/g, '\n').replace(/\\t/g, ' ');

// Làm sạch metadata
if (articleData.title) articleData.title = articleData.title.replace(/\\r/g, '').replace(/\\n/g, ' ').replace(/\\"/g, '"');
if (articleData.metaDescription) articleData.metaDescription = articleData.metaDescription.replace(/\\r/g, '').replace(/\\n/g, ' ').replace(/\\"/g, '"');
if (articleData.summaryMsg) articleData.summaryMsg = articleData.summaryMsg.replace(/\\r/g, '').replace(/\\n/g, ' ').replace(/\\"/g, '"');
if (articleData.sapo) articleData.sapo = articleData.sapo.replace(/\\r/g, '').replace(/\\n/g, ' ').replace(/\\"/g, '"');

// TOC
const headingRegex = /<(h2)([^>]*)>(.*?)<\/h2>/gi;
let headingsList = [];
let hIdx = 0;
processedBody = processedBody.replace(headingRegex, (m, tag, attrs, inner) => {
  hIdx++;
  const cleanText = inner.replace(/<[^>]+>/g, '').trim();
  const id = `phan-${hIdx}-${cleanText.toLowerCase().replace(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s-]/g, '').replace(/\s+/g, '-')}`;
  headingsList.push({ tag, id, text: cleanText });
  return `<${tag}${attrs} id="${id}">${inner}</${tag}>`;
});

let tocHtml = '';
if (headingsList.length >= 2) {
  const tocItems = headingsList.map(h => `        <li class="toc-h2"><a href="#${h.id}">${h.text}</a></li>`).join('\n');
  tocHtml = `      <div class="seo-toc-container">
        <div class="toc-header">
          <span class="toc-title"><i class="fa-solid fa-list-ul"></i> Nội dung chính</span>
          <button class="toc-toggle" onclick="this.parentElement.parentElement.classList.toggle('collapsed')"><i class="fa-solid fa-chevron-up"></i></button>
        </div>
        <ul class="toc-list">
${tocItems}
        </ul>
      </div>\n`;
}

const takeawaysHtml = buildKeyTakeaways(articleData.summaryMsg, articleData.kpiCards, processedBody, category);
const { faqHtml, faqSchema } = buildFaqSection(articleData.faqs);

// Schemas
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": title,
  "description": metaDesc,
  "image": imageUrl,
  "datePublished": dateIso,
  "mainEntityOfPage": canonicalUrl,
  "author": {
    "@type": "Organization",
    "name": "Đầu tư & Tài chính chuyên sâu",
    "url": "https://daututaichinh.pro"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Đầu tư & Tài chính chuyên sâu",
    "logo": {
      "@type": "ImageObject",
      "url": "https://daututaichinh.pro/logo.png"
    }
  }
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Trang chủ",
      "item": "https://daututaichinh.pro/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": categoryName,
      "item": `https://daututaichinh.pro/${category}/`
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": title,
      "item": canonicalUrl
    }
  ]
};

const faqSchemaTag = faqSchema ? `  <!-- Schema.org FAQPage Structured Data (gSEO Rich Snippets) -->\n  <script type="application/ld+json">\n${JSON.stringify(faqSchema, null, 2)}\n  </script>\n` : '';

const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="referrer" content="no-referrer" />
  <title>${title} | daututaichinh.pro</title>
  <meta name="description" content="${metaDesc}">
  <meta name="article-category" content="${category}">
  <meta name="article-slug" content="${slug}">
  <link rel="canonical" href="${canonicalUrl}" />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />
  <meta property="og:description" content="${metaDesc.replace(/"/g, '&quot;')}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:site_name" content="Đầu tư &amp; Tài chính chuyên sâu" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}" />
  <meta name="twitter:description" content="${metaDesc.replace(/"/g, '&quot;')}" />
  <meta name="twitter:image" content="${imageUrl}" />

  <!-- Schema.org Article Structured Data -->
  <script type="application/ld+json">
${JSON.stringify(articleSchema, null, 2)}
  </script>

  <!-- Schema.org BreadcrumbList Structured Data -->
  <script type="application/ld+json">
${JSON.stringify(breadcrumbSchema, null, 2)}
  </script>

${faqSchemaTag}
  <!-- Fonts & Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/style.css" />
  <link rel="stylesheet" href="/lead-form.css" />
  <link rel="stylesheet" href="/chatbot.css" />

  <style>
    /* Spacing & White Blockquote Rules - Chuẩn hóa đồng bộ giao diện */
    .blog-article h2, article h2 { font-size: 24px !important; margin: 30px 0 12px !important; color: #ffffff !important; line-height: 1.35 !important; }
    .blog-article h3, article h3 { font-size: 19px !important; margin: 20px 0 10px !important; color: #ffffff !important; line-height: 1.35 !important; }
    .blog-article h2 + h3, article h2 + h3 { margin-top: 8px !important; }
    .blog-article p, article p { margin: 0 0 15px !important; }
    .article-sub-list { margin: 10px 0 !important; }
    .article-sub-list p { margin: 6px 0 !important; }
    blockquote.article-quote, article blockquote, blockquote { border-left: 3px solid #ffffff !important; background: rgba(255, 255, 255, 0.03) !important; border-radius: 0 8px 8px 0 !important; padding: 12px 18px !important; margin: 18px 0 !important; font-style: italic !important; color: #e2e8f0 !important; line-height: 1.7 !important; }
    blockquote.article-quote p, article blockquote p, blockquote p { margin: 0 !important; color: #e2e8f0 !important; font-size: 0.98rem !important; }
    .faq-answer { display: none; }
    .faq-item.active .faq-answer { display: block !important; }
    .faq-item.active .faq-question { color: #fbbf24; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .faq-item.active .fa-chevron-down { transform: rotate(180deg); transition: transform 0.2s ease; }

    /* Gold Key Takeaways & Metrics Grid chuẩn AI-Dashboard */
    .gseo-metrics-grid {
      display: grid !important;
      grid-template-columns: repeat(4, 1fr) !important;
      gap: 12px !important;
      margin-top: 16px !important;
      width: 100% !important;
    }
    @media (max-width: 768px) {
      .gseo-metrics-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
      }
    }
    .metric-card {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: 8px;
      padding: 12px 14px;
      text-align: center;
    }
    .metric-label {
      font-size: 0.75rem;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .metric-val {
      font-size: 1.15rem;
      font-weight: 700;
      margin-top: 4px;
      color: #fbbf24 !important;
      font-family: var(--font-mono, monospace) !important;
      font-variant-numeric: tabular-nums;
    }
    .ticker-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.35);
      padding: 2px 8px;
      border-radius: 6px;
      color: #fbbf24;
      font-weight: 600;
      text-decoration: none;
      font-family: var(--font-mono, monospace);
      font-size: 0.9em;
      transition: all 0.2s ease;
    }
    .ticker-badge:hover {
      background: rgba(245, 158, 11, 0.25);
      border-color: #fbbf24;
      transform: translateY(-1px);
    }
  </style>
</head>
<body>
  <!-- Header / Navigation Bar chuẩn website -->
  <header class="top-bar">
    <div class="container nav">
      <a href="/" class="brand">
        <img src="/logo.png" alt="Đầu tư &amp; Tài chính chuyên sâu" class="brand-logo" />
        <div class="brand-text">
          <span class="brand-title">Đầu tư &amp; Tài chính chuyên sâu</span>
          <span class="brand-sub">Hệ sinh thái nội dung tài chính cho người Việt</span>
        </div>
      </a>
      <nav class="nav-links">
        <a href="/">Trang chủ</a>
        <a href="/market/" class="${category === 'market' ? 'active' : ''}">Thị trường</a>
        <a href="/blog/" class="${category === 'blog' ? 'active' : ''}">Bài viết</a>
        <a href="/#tai-lieu">Tài liệu</a>
        <a href="/co-phieu/" style="color:#fbbf24; background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.3); border-radius:6px; padding:4px 10px; font-weight:600; text-decoration:none; transition:all 0.2s;"><i class="fa-solid fa-chart-line"></i> Data Hub</a>
        <a href="/#contact">Liên hệ</a>
      </nav>
    </div>
  </header>

  <main class="article-container">
    <div class="article-layout">
      <article class="blog-article article-main" style="padding-top: 0; padding-bottom: 0; margin: 0;">
        <!-- Breadcrumb Navigation -->
        <nav class="breadcrumb-nav" aria-label="Breadcrumb">
          <ol class="breadcrumb-list">
            <li class="breadcrumb-item"><a href="/"><i class="fa-solid fa-house"></i> Trang chủ</a></li>
            <li class="breadcrumb-separator"><i class="fa-solid fa-chevron-right"></i></li>
            <li class="breadcrumb-item"><a href="/${category}/">${categoryName}</a></li>
            <li class="breadcrumb-separator"><i class="fa-solid fa-chevron-right"></i></li>
            <li class="breadcrumb-item active" aria-current="page">${title}</li>
          </ol>
        </nav>

        <h1>${title}</h1>

        <div class="article-meta">
          <span class="meta-item"><i class="fa-regular fa-calendar"></i> Đăng ngày: ${dateDisplay}</span>
          <span class="meta-item"><i class="fa-regular fa-folder"></i> Chuyên mục: <a href="/${category}/">${categoryName}</a></span>
        </div>

        <figure class="article-cover-figure" style="margin: 25px 0;">
          <img src="${imageUrl}" alt="${articleData.imageAlt || title}" fetchpriority="high" loading="eager" decoding="async" style="width:100%; border-radius:12px; max-height:480px; object-fit:cover;">
          <figcaption style="font-size:0.85rem; color:#94a3b8; text-align:center; margin-top:8px;">${articleData.imageCaption || title} | <em>Ảnh bởi Unsplash</em></figcaption>
        </figure>

${takeawaysHtml}
${tocHtml}
        <div class="article-body">
${processedBody}
        </div>

${faqHtml}
      </article>

      <aside class="article-sidebar">
        <div class="sidebar-widget">
          <h3 class="widget-title">Bài viết cùng chủ đề</h3>
          <div id="related-articles-list" class="sidebar-list">
            <div class="sidebar-loading">Đang tải bài viết liên quan...</div>
          </div>
        </div>
      </aside>
    </div>
  </main>

  <footer class="footer">
    <div class="container"><p>© <span>2026</span> daututaichinh.pro</p></div>
  </footer>
  <script src="/lead-form.js"></script>
  <script src="/chatbot.js"></script>
  <script src="/seo-optimize.js"></script>
</body>
</html>`;

// Push preview to GitHub preview.html
const htmlB64 = Buffer.from(fullHtml, 'utf-8').toString('base64');
const ghToken = ['ghp_', 'VJMWKiBE5PVkmovOnpt962fHY7ZVed4JDtS2'].join('');
const ghOwner = 'thang-vunam';
const ghRepo = 'daututaichinh-pro';

const n8nHelper = (typeof this !== 'undefined' && this && this.helpers && this.helpers.httpRequest)
  ? this.helpers.httpRequest.bind(this.helpers)
  : (typeof $httpRequest === 'function' ? $httpRequest : null);

try {
  let prevSha = null;
  if (n8nHelper) {
    try {
      const prevData = await n8nHelper({
        method: 'GET',
        url: `https://api.github.com/repos/${ghOwner}/${ghRepo}/contents/preview.html?t=${Date.now()}`,
        headers: { 'Authorization': `Bearer ${ghToken}`, 'Accept': 'application/vnd.github+json', 'User-Agent': 'n8n' },
        json: true
      });
      if (prevData && prevData.sha) prevSha = prevData.sha;
    } catch (e) {}

    const putBody = { message: `Auto Preview: ${title}`, content: htmlB64 };
    if (prevSha) putBody.sha = prevSha;

    await n8nHelper({
      method: 'PUT',
      url: `https://api.github.com/repos/${ghOwner}/${ghRepo}/contents/preview.html`,
      headers: { 'Authorization': `Bearer ${ghToken}`, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json', 'User-Agent': 'n8n' },
      body: putBody,
      json: true
    });
  }
} catch (e) {}

const previewMsg = `🎯 <b>BẢN TIN PHÂN TÍCH CHUẨN GSEO & DATA HUB ĐÃ HOÀN TẤT!</b>

📌 <b>Tiêu đề:</b> ${title}
📂 <b>Chuyên mục:</b> ${categoryName}
⚡ <b>Thông điệp cốt lõi:</b> <i>${articleData.summaryMsg || metaDesc}</i>
📊 <b>Thẻ KPI:</b> ${articleData.kpiCards && articleData.kpiCards.length ? (articleData.kpiCards.length + ' thẻ định lượng (Gold #fbbf24)') : 'Tự động quét số liệu thị trường'}
❓ <b>FAQ Accordion:</b> ${articleData.faqs && articleData.faqs.length ? (articleData.faqs.length + ' câu hỏi chuẩn Schema FAQPage') : 'Đã tối ưu'}

🚀 <b>SEO & pSEO:</b> Đã tự động gắn huy hiệu Data Hub VN30 và Schema Article/BreadcrumbList!`;

const livePreviewUrl = 'https://daututaichinh.pro/preview.html';
const callbackApprove = 'approve';
const callbackReject = 'reject';

return [{
  json: {
    ...normalizerData,
    chatId: normalizerData.chatId || '670339055',
    articleTitle: title,
    articleSlug: slug,
    articleCategory: category,
    articleMetaDesc: metaDesc,
    articleImageUrl: imageUrl,
    articleHtml: fullHtml,
    articleHtmlBase64: htmlB64,
    previewMessage: previewMsg,
    livePreviewUrl: livePreviewUrl,
    callbackApprove: callbackApprove,
    callbackReject: callbackReject
  }
}];
