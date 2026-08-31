import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { enrichProduct, saveApiKey, getApiKey, getAllApiKeys, SERVICES } from '../services/aiEnrich.js';

const app = new Hono();

// POST /api/ai/enrich-product — SSE streaming enrichment
app.post('/enrich-product', async (c) => {
  const body = await c.req.json();
  const { title, action = 'ALL' } = body;
  if (!title) return c.json({ error: 'title required' }, 400);

  return stream(c, async (stream) => {
    const send = async (event, data) => {
      await stream.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // Heartbeat interval to keep connection alive during LLM reasoning
    const heartbeat = setInterval(() => {
      stream.write(': ping\n\n').catch(() => {});
    }, 3000);

    try {
      await send('start', { message: 'Pipeline başlatılıyor...' });
      const payload = await enrichProduct({ title, action }, async (stage, pct) => {
        await send('progress', { stage, pct });
      });
      await send('complete', { payload });
    } catch (err) {
      await send('error', { message: err.message });
    } finally {
      clearInterval(heartbeat);
    }
  }, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
});

// POST /api/ai/test-key — ping a service
app.post('/test-key', async (c) => {
  const { service } = await c.req.json();
  const apiKey = getApiKey(service);
  if (!apiKey) return c.json({ ok: false, error: 'API anahtarı bulunamadı' });
  const t0 = Date.now();
  try {
    let testRes;
    if (service === 'EXA_API_KEY') {
      testRes = await fetch('https://api.exa.ai/search', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey }, body: JSON.stringify({ query: 'test', numResults: 1 }), signal: AbortSignal.timeout(8000) });
    } else if (service === 'FIRECRAWL_API_KEY') {
      testRes = await fetch('https://api.firecrawl.dev/v1/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey }, body: JSON.stringify({ url: 'https://example.com', formats: ['markdown'] }), signal: AbortSignal.timeout(8000) });
    } else if (service === 'MISTRAL_API_KEY') {
      testRes = await fetch('https://api.mistral.ai/v1/models', { headers: { Authorization: 'Bearer ' + apiKey }, signal: AbortSignal.timeout(8000) });
    } else if (service === 'PLANTNET_API_KEY') {
      testRes = await fetch(`https://my-api.plantnet.org/v2/projects/all?api-key=${apiKey}`, { signal: AbortSignal.timeout(8000) });
    } else {
      return c.json({ ok: true, message: 'Test mevcut degil, anahtar kaydedildi' });
    }
    const ok = testRes.status < 400;
    return c.json({ ok, status: testRes.status, latencyMs: Date.now() - t0 });
  } catch (err) {
    return c.json({ ok: false, error: err.message, latencyMs: Date.now() - t0 });
  }
});

// POST /api/ai/save-key — save encrypted API key
app.post('/save-key', async (c) => {
  const { service, value } = await c.req.json();
  if (!service || !value) return c.json({ error: 'service and value required' }, 400);
  const svc = SERVICES.find(s => s.key === service);
  saveApiKey(service, value, svc?.label || service);
  return c.json({ success: true });
});

// GET /api/ai/keys — list saved keys (metadata only, no values)
app.get('/keys', (c) => {
  const all = getAllApiKeys();
  const svcs = SERVICES.map(s => ({ ...s, saved: all.some(r => r.service_key === s.key), updatedAt: all.find(r => r.service_key === s.key)?.updated_at || null }));
  return c.json(svcs);
});

export default app;