interface Env {
  GEMINI_API_KEY: string;
  ALLOWED_ORIGIN?: string;
}

const MODEL = 'gemini-2.5-flash';
const SYSTEM_PROMPT = `You are the AI tutor inside a Boolean Logic Simplifier and Digital Logic Toolkit. Help with Boolean algebra, truth tables, K-maps, SOP/POS, minterms/maxterms, Quine-McCluskey, logic gates, digital circuits, mathematics, programming, and general technical questions. When an image is uploaded, inspect it carefully and solve the exact question step by step. Use clean Markdown and Markdown tables when useful. Put mathematical expressions in $...$ or $$...$$.`;

function corsHeaders(origin: string, allowed: string) {
  const allow = allowed === '*' || origin === allowed ? origin || allowed : allowed;
  return { 'Access-Control-Allow-Origin': allow, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') || '';
    const allowed = env.ALLOWED_ORIGIN || '*';
    const headers = corsHeaders(origin, allowed);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers });
    if (allowed !== '*' && origin !== allowed) return Response.json({ error: 'Origin not allowed' }, { status: 403, headers });

    try {
      const body = await request.json() as { message?: string; history?: Array<{ role: 'user' | 'assistant'; text: string }>; attachment?: { type?: string; data?: string } | null };
      const message = String(body.message || '').trim();
      const history = Array.isArray(body.history) ? body.history.slice(-10) : [];
      const attachment = body.attachment;
      if (!message && !attachment?.data) return Response.json({ error: 'Message or attachment is required.' }, { status: 400, headers });

      const parts: any[] = [{ text: message || 'Analyze the uploaded question image carefully and solve it step by step.' }];
      if (attachment?.data) {
        const type = String(attachment.type || '');
        if (!type.startsWith('image/')) return Response.json({ error: 'Only image questions are supported.' }, { status: 400, headers });
        const data = String(attachment.data);
        parts.push({ inline_data: { mime_type: type, data: data.includes(',') ? data.split(',')[1] : data } });
      }

      const contents = [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        ...history.map(item => ({ role: item.role === 'assistant' ? 'model' : 'user', parts: [{ text: item.text }] })),
        { role: 'user', parts },
      ];

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${env.GEMINI_API_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents, generationConfig: { temperature: 0.3, maxOutputTokens: 2048 } })
      });
      const result = await response.json() as any;
      if (!response.ok) return Response.json({ error: result?.error?.message || 'Gemini request failed.' }, { status: response.status, headers });
      const text = result?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || '').join('').trim();
      if (!text) return Response.json({ error: 'Gemini returned an empty response. Please try again.' }, { status: 502, headers });
      return Response.json({ text, model: MODEL, free: true }, { headers });
    } catch (error) {
      console.error('Gemini request failed:', error);
      return Response.json({ error: 'The AI service could not process this request. Please try again.' }, { status: 500, headers });
    }
  },
} satisfies ExportedHandler<Env>;
