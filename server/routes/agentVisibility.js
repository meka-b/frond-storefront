import { Hono } from 'hono';
import {
  generateLlmsTxt,
  generateLlmsFullTxt,
  generateAgentIndexJson,
  generateResourceMarkdown,
  generateRobotsTxt,
  getSiteInfo
} from '../services/agentVisibility.js';
import db from '../db/index.js';

const router = new Hono();

// Helper to add Content-Signal headers
function withContentSignal(c) {
  c.header('Content-Signal', 'search=yes,ai-train=no,ai-input=yes,agents=allow');
  c.header('X-Agent-Protocol', 'llms.txt/1.0, agent-visibility/1.0');
}

/**
 * GET /llms.txt
 */
router.get('/llms.txt', (c) => {
  withContentSignal(c);
  c.header('Content-Type', 'text/plain; charset=utf-8');
  return c.text(generateLlmsTxt());
});

/**
 * GET /llms-full.txt
 */
router.get('/llms-full.txt', (c) => {
  withContentSignal(c);
  c.header('Content-Type', 'text/plain; charset=utf-8');
  return c.text(generateLlmsFullTxt());
});

/**
 * GET /index.json
 */
router.get('/index.json', (c) => {
  withContentSignal(c);
  return c.json(generateAgentIndexJson());
});

/**
 * GET /robots.txt
 */
router.get('/robots.txt', (c) => {
  c.header('Content-Type', 'text/plain; charset=utf-8');
  return c.text(generateRobotsTxt());
});

/**
 * GET /products/:slug (supports /products/:slug.md or /:slug.md)
 */
router.get('/products/:slug', (c) => {
  let slug = c.req.param('slug');
  if (slug.endsWith('.md')) slug = slug.replace(/\.md$/, '');
  const md = generateResourceMarkdown('product', slug);
  if (!md) return c.text('# Product Not Found', 404);
  withContentSignal(c);
  c.header('Content-Type', 'text/markdown; charset=utf-8');
  return c.text(md);
});

/**
 * GET /journal/:slug (supports /journal/:slug.md)
 */
router.get('/journal/:slug', (c) => {
  let slug = c.req.param('slug');
  if (slug.endsWith('.md')) slug = slug.replace(/\.md$/, '');
  const md = generateResourceMarkdown('article', slug);
  if (!md) return c.text('# Article Not Found', 404);
  withContentSignal(c);
  c.header('Content-Type', 'text/markdown; charset=utf-8');
  return c.text(md);
});

/**
 * GET /api/raw-catalog
 */
router.get('/api/raw-catalog', (c) => {
  withContentSignal(c);
  const products = db.prepare('SELECT * FROM products WHERE is_published = 1').all();
  const variants = db.prepare('SELECT * FROM product_variants').all();
  const articles = db.prepare('SELECT * FROM blog_articles WHERE is_published = 1').all();
  return c.json({
    site: getSiteInfo(),
    products: products.map(p => ({
      ...p,
      variants: variants.filter(v => v.product_id === p.id)
    })),
    articles
  });
});

/**
 * GET /api/agent-visibility/stats (for Admin Explorer)
 */
router.get('/api/agent-visibility/stats', (c) => {
  const productsCount = db.prepare('SELECT COUNT(*) as c FROM products WHERE is_published = 1').get().c;
  const articlesCount = db.prepare('SELECT COUNT(*) as c FROM blog_articles WHERE is_published = 1').get().c;
  const collectionsCount = db.prepare('SELECT COUNT(*) as c FROM collections WHERE is_published = 1').get().c;

  return c.json({
    status: 'active',
    protocol_version: '1.0.0 (Cloudflare Template Compliant)',
    surfaces: [
      { name: '/llms.txt', type: 'text/plain', status: 'live', desc: 'Standard Agent Manifest (llmstxt.org)' },
      { name: '/llms-full.txt', type: 'text/plain', status: 'live', desc: 'Full Technical Specs & Inventory' },
      { name: '/index.json', type: 'application/json', status: 'live', desc: 'Typed Agent Discovery Index' },
      { name: '/robots.txt', type: 'text/plain', status: 'live', desc: 'AI Crawler Directives (GPTBot, ClaudeBot, etc.)' },
      { name: '/api/raw-catalog', type: 'application/json', status: 'live', desc: 'Full JSON Feed' }
    ],
    supported_agents: [
      'GPTBot (OpenAI / ChatGPT)',
      'ClaudeBot (Anthropic / Claude)',
      'PerplexityBot (Perplexity AI)',
      'Google-Extended (Google Gemini / SGE)',
      'Amazonbot (Amazon AI Shopping)',
      'Applebot-Extended (Apple Intelligence)',
      'Bytespider (ByteDance AI)',
      'cohere-ai (Cohere Command)'
    ],
    counts: {
      indexed_products: productsCount,
      indexed_articles: articlesCount,
      indexed_collections: collectionsCount
    }
  });
});

export default router;
