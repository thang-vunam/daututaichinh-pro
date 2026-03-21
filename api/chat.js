export const config = {
  runtime: 'edge',
  regions: ['sin1'], // BẮT BUỘC: Gắn cứng máy chủ ở Singapore để Gemini AI luôn cấp phép
};

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(request) });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  }

  try {
    const { history, systemPrompt } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return jsonResponse({ error: 'Chưa cấu hình API Key trên Vercel' }, 500, request);
    }

    let result = await callGemini(apiKey, history, systemPrompt, true);

    if (!result.ok) {
      console.log('Google Search failed, retrying without it...');
      result = await callGemini(apiKey, history, systemPrompt, false);
    }

    if (!result.ok) {
      return jsonResponse({ error: 'Gemini API error', details: result.status }, 502, request);
    }

    return jsonResponse({ reply: result.reply }, 200, request);

  } catch (error) {
    console.error('API proxy error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500, request);
  }
}

async function callGemini(apiKey, history, systemPrompt, useSearch) {
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const geminiBody = {
    system_instruction: { parts: [{ text: systemPrompt || 'Bạn là trợ lý tài chính thông minh.' }] },
    contents: history,
    generationConfig: { temperature: 0.7, topP: 0.9, topK: 40, maxOutputTokens: 2048 },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }
    ]
  };

  if (useSearch) {
    geminiBody.tools = [{ googleSearch: {} }];
  }

  try {
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody)
    });

    if (!response.ok) return { ok: false, status: response.status };

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Xin lỗi, mình không thể trả lời lúc này.';
    return { ok: true, reply };
  } catch (error) {
    return { ok: false, status: 0 };
  }
}

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function jsonResponse(data, status, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request) }
  });
}
