const geminiRaw = $input.first().json;
const normalizerData = $('Input Normalizer & Router').first().json;
const today = normalizerData.todayStr;
const currentYear = normalizerData.currentYear;
const mode = normalizerData.mode || 'generate';

let draftArticle = null;
try {
  let text = '';
  if (geminiRaw.candidates && geminiRaw.candidates[0]?.content?.parts) {
    text = geminiRaw.candidates[0].content.parts.map(p => p.text || '').join('');
  } else if (geminiRaw.text) {
    text = geminiRaw.text;
  }
  const clean = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
  try {
    draftArticle = JSON.parse(clean);
  } catch (err) {}

  if (!draftArticle || !draftArticle.htmlContent || draftArticle.htmlContent.length < 50) {
    let recoveredTitle = '';
    const titleM = clean.match(/"title"\s*:\s*"([^"]+)"/i);
    if (titleM) recoveredTitle = titleM[1];
    else recoveredTitle = normalizerData.topic || 'Bản tin phân tích tài chính';

    let recoveredHtml = '';
    const htmlM = clean.match(/"htmlContent"\s*:\s*"([\s\S]*?)"\s*,\s*"imageSearchQuery"/i);
    if (htmlM) {
      recoveredHtml = htmlM[1];
    } else {
      const pIdx = clean.search(/<p>|<h[23]>/i);
      const endPIdx = clean.lastIndexOf('</p>');
      if (pIdx !== -1 && endPIdx > pIdx) {
        recoveredHtml = clean.substring(pIdx, endPIdx + 4);
      } else {
        recoveredHtml = clean;
      }
    }

    let recoveredKpi = null;
    const kpiM = clean.match(/"kpiCards"\s*:\s*(\[[\s\S]*?\])/i);
    if (kpiM) {
      try { recoveredKpi = JSON.parse(kpiM[1]); } catch(e) {}
    }

    let recoveredFaqs = [];
    const faqM = clean.match(/"faqs"\s*:\s*(\[[\s\S]*?\])/i);
    if (faqM) {
      try { recoveredFaqs = JSON.parse(faqM[1]); } catch(e) {}
    }

    let recoveredSummary = '';
    const sumM = clean.match(/"summaryMsg"\s*:\s*"([^"]+)"/i);
    if (sumM) recoveredSummary = sumM[1];

    draftArticle = {
      title: recoveredTitle,
      slug: (draftArticle && draftArticle.slug) || 'tin-thi-truong',
      metaDescription: (draftArticle && draftArticle.metaDescription) || (recoveredTitle + '. Phân tích xu hướng thị trường tài chính.'),
      category: normalizerData.category || 'market',
      sapo: (draftArticle && draftArticle.sapo) || '',
      summaryMsg: recoveredSummary || (draftArticle && draftArticle.summaryMsg) || '',
      keyTakeaways: (draftArticle && draftArticle.keyTakeaways) || [],
      kpiCards: recoveredKpi,
      faqs: recoveredFaqs,
      htmlContent: recoveredHtml,
      imageSearchQuery: (draftArticle && draftArticle.imageSearchQuery) || 'modern finance architecture',
      imageAlt: (draftArticle && draftArticle.imageAlt) || recoveredTitle,
      imageCaption: (draftArticle && draftArticle.imageCaption) || ''
    };
  }
} catch (e) {}

if (!draftArticle) {
  draftArticle = {
    title: normalizerData.topic || 'Bản tin thị trường tài chính',
    htmlContent: '<p>Nội dung phân tích thị trường đang được cập nhật...</p>',
    kpiCards: null,
    faqs: []
  };
}

const auditPrompt = `Bạn là Trưởng Ban Thẩm định Số liệu & Kiểm soát Rủi ro (Chief Financial Auditor) của website daututaichinh.pro.
Hôm nay là ngày ${today}, năm ${currentYear}.

NHIỆM VỤ BẮT BUỘC: KIỂM ĐỊNH & THẨM ĐỊNH SỐ LIỆU TÀI CHÍNH CHUẨN XÁC 100%:
1. Rà soát TOÀN BỘ các con số, chỉ số định lượng trong bài viết nháp dưới đây:
   - Điểm số VN-Index, HNX-Index, UPCoM chốt phiên ngày ${today}.
   - Giá trị giao dịch / Thanh khoản toàn thị trường (tỷ đồng).
   - Khối ngoại: Giá trị mua/bán ròng (tỷ đồng), các mã cổ phiếu bị xả/gom mạnh nhất.
   - Các cổ phiếu cụ thể được nêu tên: Giá đóng cửa, tỷ lệ % tăng/giảm phiên hôm nay.
   - Số liệu BCTC quý mới nhất: Doanh thu, LNST, EPS, tăng trưởng %, nợ vay...
   - Tỷ giá USD/VND, lãi suất điều hành NHNN hoặc lãi suất ngân hàng.

2. Sử dụng Google Search Grounding để tra cứu số liệu thực tế chính xác 100% chốt phiên tại ngày ${today} từ các nguồn chính thống (HOSE, HNX, Vietstock, CafeF, Báo Đầu Tư).

3. ĐỐI SOÁT VÀ TỰ ĐỘNG HIỆU CHỈNH:
   - Nếu phát hiện bất kỳ con số nào sai lệch, số cũ của các phiên/quý trước:
     -> BẮT BUỘC THAY THẾ TRỰC TIẾP bằng con số thực tế mới nhất, chuẩn xác 100% vào title, sapo, summaryMsg, kpiCards và htmlContent.
   - BẮT BUỘC BẢO TOÀN NGUYÊN VẸN MẢNG faqs (3 câu hỏi và câu trả lời thực chiến từ bài viết nháp). TUYỆT ĐỐI CẤM bỏ trống hoặc trả về "faqs": [].
   - Bảo toàn nguyên vẹn định dạng HTML (<h2>, <p>, <table>, <a>, <strong>).

4. TRẢ VỀ ĐÚNG 1 CHUỖI JSON HỢP LỆ DUY NHẤT:
{
  "title": "${(draftArticle.title || '').replace(/"/g, '\\"')}",
  "slug": "${draftArticle.slug || 'tin-thi-truong'}",
  "metaDescription": "${(draftArticle.metaDescription || '').replace(/"/g, '\\"')}",
  "category": "${normalizerData.category || 'market'}",
  "sapo": "${(draftArticle.sapo || '').replace(/"/g, '\\"')}",
  "summaryMsg": "${(draftArticle.summaryMsg || '').replace(/"/g, '\\"')}",
  "keyTakeaways": ${JSON.stringify(draftArticle.keyTakeaways || [])},
  "kpiCards": ${JSON.stringify(draftArticle.kpiCards || null)},
  "faqs": ${JSON.stringify(draftArticle.faqs || [])},
  "htmlContent": "Nội dung HTML hoàn chỉnh sau khi đã được thẩm định và hiệu chỉnh số liệu chuẩn xác 100%",
  "imageSearchQuery": "${draftArticle.imageSearchQuery || 'modern finance architecture'}",
  "imageAlt": "${draftArticle.imageAlt || 'Daututaichinh.pro'}",
  "imageCaption": "${draftArticle.imageCaption || ''}",
  "factCheckReport": [
    "VN-Index: [Điểm số chốt phiên thực tế] ([+/- điểm])",
    "Khối ngoại: [Bán/Mua ròng X tỷ đồng, mã tâm điểm]",
    "Mã cổ phiếu & BCTC: [Đã xác thực dữ liệu chốt phiên/BCTC mới nhất]",
    "Trạng thái: ✅ Đã kiểm định & hiệu chỉnh số liệu 100% chính xác"
  ]
}

NỘI DUNG BÀI VIẾT NHÁP CẦN THẨM ĐỊNH:
${JSON.stringify(draftArticle, null, 2)}`;

return [{
  json: {
    ...normalizerData,
    draftArticle,
    factCheckPayload: {
      contents: [{
        parts: [{ text: auditPrompt }]
      }],
      tools: [{ google_search: {} }]
    }
  }
}];
