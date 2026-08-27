import db from '../db/index.js';

/**
 * Service to generate Agentic Commerce & AI Visibility Projections
 * Based on Cloudflare commerce-llms-txt-template & agent-visibility-template
 */

export function getSiteInfo() {
  return {
    name: 'FROND Botanic',
    tagline: 'Living Design & Architectural Botanical Goods',
    description: 'FROND is a modern architectural plant and living design studio. We cultivate premium indoor statement plants, sculpted ceramic planters, and botanical care essentials designed to transform residential and commercial spaces.',
    url: 'https://frond.com',
    location: 'Portland, OR',
    shipping_policy: 'Free insured greenhouse shipping on orders over $75. 30-Day Root-to-Leaf Guarantee.',
    support_email: 'hello@frond.com'
  };
}

/**
 * Generate /llms.txt following llmstxt.org specifications
 */
export function generateLlmsTxt() {
  const site = getSiteInfo();
  const products = db.prepare('SELECT * FROM products WHERE is_published = 1 ORDER BY sort_order ASC, created_at DESC').all();
  const articles = db.prepare('SELECT * FROM blog_articles WHERE is_published = 1 ORDER BY published_at DESC').all();
  const collections = db.prepare('SELECT * FROM collections WHERE is_published = 1 ORDER BY sort_order ASC').all();

  let out = `# ${site.name} — ${site.tagline}\n\n`;
  out += `> ${site.description}\n\n`;
  out += `## Shopping Policies & Agent Context\n`;
  out += `- **Store URL**: ${site.url}\n`;
  out += `- **Shipping**: ${site.shipping_policy}\n`;
  out += `- **Root-to-Leaf Guarantee**: All plants arrive thriving in custom nursery pots, or we replace them for free within 30 days.\n`;
  out += `- **Full Agent Specs**: ${site.url}/llms-full.txt\n`;
  out += `- **Structured Index**: ${site.url}/index.json\n\n`;

  out += `## Product Catalog\n`;
  for (const p of products) {
    const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(p.id);
    const minPrice = variants.length > 0 ? Math.min(...variants.map(v => v.price)) / 100 : 0;
    const maxPrice = variants.length > 0 ? Math.max(...variants.map(v => v.price)) / 100 : 0;
    const priceStr = minPrice === maxPrice ? `$${minPrice.toFixed(2)}` : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;

    const careSummary = [
      p.light_care ? `Light: ${p.light_care}` : null,
      p.water_care ? `Water: ${p.water_care}` : null,
      p.pet_care ? `Pet: ${p.pet_care}` : null,
    ].filter(Boolean).join(' | ');

    out += `- [${p.title}](${site.url}/product.html?handle=${p.id}): ${p.subtitle || p.description?.substring(0, 90) || 'Architectural plant'}. ${careSummary ? `(${careSummary})` : ''} — ${priceStr}\n`;
  }

  out += `\n## Botanical Collections\n`;
  for (const c of collections) {
    out += `- [${c.title}](${site.url}/collections/${c.id}): ${c.description || 'Curated botanical selection.'}\n`;
  }

  out += `\n## Journal & Care Guides\n`;
  for (const a of articles) {
    out += `- [${a.title}](${site.url}/journal/${a.id}): ${a.excerpt || a.tldr_summary || 'Plant care and living design field notes.'} (${a.read_time || '5 min read'})\n`;
  }

  out += `\n## Direct Markdown Projections for AI Grounding\n`;
  for (const p of products.slice(0, 8)) {
    out += `- [${p.title} (Markdown Document)](${site.url}/products/${p.id}.md)\n`;
  }
  for (const a of articles.slice(0, 5)) {
    out += `- [${a.title} (Markdown Document)](${site.url}/journal/${a.id}.md)\n`;
  }

  return out;
}

/**
 * Generate /llms-full.txt with deep technical specs and variant details for AI shopping agents
 */
export function generateLlmsFullTxt() {
  const site = getSiteInfo();
  const products = db.prepare('SELECT * FROM products WHERE is_published = 1 ORDER BY sort_order ASC').all();
  const articles = db.prepare('SELECT * FROM blog_articles WHERE is_published = 1 ORDER BY published_at DESC').all();

  let out = `# ${site.name} — Full Technical Catalog & Botanical Knowledge Base\n\n`;
  out += `> ${site.description}\n\n`;

  out += `## Complete Product Specifications & Variant Inventory\n\n`;

  for (const p of products) {
    const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order ASC').all(p.id);
    const images = db.prepare('SELECT url FROM product_images WHERE product_id = ? ORDER BY sort_order ASC').all(p.id);

    out += `### Product: ${p.title}\n`;
    out += `- **Handle/Slug**: \`${p.id}\`\n`;
    out += `- **Canonical PDP URL**: ${site.url}/product.html?handle=${p.id}\n`;
    out += `- **SKU**: ${p.sku || 'N/A'}\n`;
    out += `- **Badge**: ${p.badge || 'Standard'}\n`;
    out += `- **Rating**: ⭐ ${p.rating || 5.0} (${p.reviews_count || 0} customer reviews)\n`;
    out += `- **Light Requirements**: ${p.light_care || 'Medium indirect light'}\n`;
    out += `- **Watering Schedule**: ${p.water_care || 'When top 2 inches dry'}\n`;
    out += `- **Pet Friendliness / Toxicity**: ${p.pet_care || 'Keep out of reach of pets'}\n`;
    out += `- **Tags & Botanical Classifications**: ${p.tags || 'indoor, plant, living design'}\n`;
    out += `- **Short Summary**: ${p.subtitle || 'Premium rooted architectural houseplant.'}\n`;
    out += `- **Full Description**:\n${p.description || 'Rooted and established in sustainable nursery pot, shipped directly from our Portland greenhouse.'}\n\n`;

    out += `#### Available Variants & Pricing:\n`;
    for (const v of variants) {
      const priceFmt = `$${(v.price / 100).toFixed(2)}`;
      out += `  - **${v.label}** (SKU: \`${v.sku || 'N/A'}\` | Hex: \`${v.hex_color || '#000'}\`): ${priceFmt} — In Stock: ${v.inventory_qty} units (${v.is_available ? 'Available' : 'Out of Stock'})\n`;
    }

    if (images.length > 0) {
      out += `#### High-Resolution Media:\n`;
      for (const img of images) {
        out += `  - ${img.url.startsWith('http') ? img.url : site.url + img.url}\n`;
      }
    }
    out += `\n---\n\n`;
  }

  out += `## Journal Articles & Botanical Care Knowledge\n\n`;
  for (const a of articles) {
    out += `### Article: ${a.title}\n`;
    out += `- **Slug**: \`${a.id}\`\n`;
    out += `- **URL**: ${site.url}/journal/${a.id}\n`;
    out += `- **Author**: ${a.author_name} (${a.author_role || 'Care Lab'})\n`;
    out += `- **Category**: ${a.tag}\n`;
    out += `- **Read Time**: ${a.read_time}\n`;
    if (a.tldr_summary) {
      out += `- **AI Overview / Key Takeaways**:\n${a.tldr_summary}\n`;
    }
    out += `- **Content Excerpt**: ${a.excerpt}\n`;
    out += `- **Full Article Markdown**: ${site.url}/journal/${a.id}.md\n\n`;
  }

  return out;
}

/**
 * Generate /index.json typed index for autonomous agents
 */
export function generateAgentIndexJson() {
  const site = getSiteInfo();
  const products = db.prepare('SELECT * FROM products WHERE is_published = 1').all();
  const articles = db.prepare('SELECT * FROM blog_articles WHERE is_published = 1').all();

  return {
    schema_version: '1.0.0',
    specification: 'https://github.com/cloudflare/templates/tree/main/agent-visibility-template',
    site: {
      name: site.name,
      tagline: site.tagline,
      description: site.description,
      url: site.url,
      support: site.support_email
    },
    surfaces: {
      llms_txt: `${site.url}/llms.txt`,
      llms_full_txt: `${site.url}/llms-full.txt`,
      index_json: `${site.url}/index.json`,
      robots_txt: `${site.url}/robots.txt`,
      raw_catalog: `${site.url}/api/raw-catalog`
    },
    resources: [
      ...products.map(p => ({
        id: p.id,
        type: 'product',
        title: p.title,
        subtitle: p.subtitle,
        url: `${site.url}/product.html?handle=${p.id}`,
        markdown_url: `${site.url}/products/${p.id}.md`,
        jsonld_url: `${site.url}/products/${p.id}.jsonld`,
        light_care: p.light_care,
        water_care: p.water_care,
        pet_care: p.pet_care,
        tags: p.tags ? p.tags.split(' ') : []
      })),
      ...articles.map(a => ({
        id: a.id,
        type: 'article',
        title: a.title,
        excerpt: a.excerpt,
        category: a.tag,
        url: `${site.url}/journal/${a.id}`,
        markdown_url: `${site.url}/journal/${a.id}.md`,
        jsonld_url: `${site.url}/journal/${a.id}.jsonld`,
        author: a.author_name,
        tldr_summary: a.tldr_summary
      }))
    ]
  };
}

/**
 * Generate per-resource Markdown projection (<slug>.md)
 */
export function generateResourceMarkdown(type, id) {
  const site = getSiteInfo();

  if (type === 'product') {
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!p) return null;
    const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(p.id);

    return `---
title: "${p.title}"
handle: "${p.id}"
type: "product"
sku: "${p.sku || ''}"
rating: ${p.rating || 5.0}
reviews_count: ${p.reviews_count || 0}
light_care: "${p.light_care || ''}"
water_care: "${p.water_care || ''}"
pet_care: "${p.pet_care || ''}"
url: "${site.url}/product.html?handle=${p.id}"
---

# ${p.title}

> ${p.subtitle || ''}

${p.description || ''}

## Botanical Care Guide
- **Light Requirements**: ${p.light_care || 'Bright, indirect light'}
- **Watering**: ${p.water_care || 'Allow topsoil to dry before watering'}
- **Pet Safety**: ${p.pet_care || 'Non-toxic to cats and dogs'}

## Pricing & Variants
${variants.map(v => `- **${v.label}**: $${(v.price / 100).toFixed(2)} (Stock: ${v.inventory_qty})`).join('\n')}

---
*Published by FROND Living Design Studio. Guaranteed safe delivery.*
`;
  }

  if (type === 'article') {
    const a = db.prepare('SELECT * FROM blog_articles WHERE id = ?').get(id);
    if (!a) return null;

    return `---
title: "${a.title}"
slug: "${a.id}"
type: "article"
category: "${a.tag}"
author: "${a.author_name}"
read_time: "${a.read_time}"
url: "${site.url}/journal/${a.id}"
---

# ${a.title}

*By ${a.author_name} (${a.author_role || 'Care Lab'}) • ${a.read_time}*

${a.tldr_summary ? `## TL;DR / Key Takeaways\n${a.tldr_summary}\n\n` : ''}

${a.excerpt ? `> ${a.excerpt}\n\n` : ''}

${a.content ? a.content.replace(/<[^>]+>/g, '') : ''}

---
*Published by FROND Botanical Journal. Licensed for AI citations and indexing.*
`;
  }

  return null;
}

/**
 * Generate robots.txt welcoming all modern AI agent crawlers
 */
export function generateRobotsTxt() {
  const site = getSiteInfo();
  return `# FROND Robots.txt — AI Agents & Crawlers Directive
# Compliant with Cloudflare Agent Visibility Specifications

User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/orders
Disallow: /api/analytics

# Welcoming Named AI Shopping & Reasoning Agents
User-agent: GPTBot
Allow: /
Allow: /llms.txt
Allow: /llms-full.txt
Allow: /index.json

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Bytespider
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

# Agentic Discovery Feeds
Sitemap: ${site.url}/sitemap.xml
LLM-Index: ${site.url}/llms.txt
LLM-Full: ${site.url}/llms-full.txt
Agent-Index: ${site.url}/index.json
`;
}
