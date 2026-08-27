import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import catalogRouter from './routes/catalog.js';
import productsRouter from './routes/products.js';
import collectionsRouter from './routes/collections.js';
import shadeFinderRouter from './routes/shadeFinder.js';
import ugcRouter from './routes/ugc.js';
import shoppableVideosRouter from './routes/shoppableVideos.js';
import campaignsRouter from './routes/campaigns.js';
import blogRouter from './routes/blog.js';
import faqsRouter from './routes/faqs.js';
import editorialRouter from './routes/editorial.js';
import announcementsRouter from './routes/announcements.js';
import settingsRouter from './routes/settings.js';
import ordersRouter from './routes/orders.js';
import newsletterRouter from './routes/newsletter.js';
import reviewsRouter from './routes/reviews.js';
import mediaRouter from './routes/media.js';
import analyticsRouter from './routes/analytics.js';
import agentVisibilityRouter from './routes/agentVisibility.js';
import storefrontSeoRouter from './routes/storefrontSeo.js';
import aiEnrichRouter from './routes/aiEnrich.js';
import authRouter from './routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = new Hono();

// Mount Cloudflare Agent Visibility & LLMs.txt routes
app.route('/', agentVisibilityRouter);

// Mount SEO-Friendly Storefront Routes & 301 Redirects
app.route('/', storefrontSeoRouter);

// Middlewares
app.use('*', cors());

// API Routers
app.route('/api/auth', authRouter);
app.route('/api/catalog', catalogRouter);
app.route('/api/products', productsRouter);
app.route('/api/collections', collectionsRouter);
app.route('/api/shade-finder', shadeFinderRouter);
app.route('/api/ugc', ugcRouter);
app.route('/api/shoppable-videos', shoppableVideosRouter);
app.route('/api/campaigns', campaignsRouter);
app.route('/api/coupons', campaignsRouter);
app.route('/api/blog', blogRouter);
app.route('/api/faqs', faqsRouter);
app.route('/api/editorial', editorialRouter);
app.route('/api/announcements', announcementsRouter);
app.route('/api/settings', settingsRouter);
app.route('/api/orders', ordersRouter);
app.route('/api/newsletter', newsletterRouter);
app.route('/api/reviews', reviewsRouter);
app.route('/api/media', mediaRouter);
app.route('/api/analytics', analyticsRouter);
app.route('/api/ai', aiEnrichRouter);


// Health Check
app.get('/api/health', c => c.json({ status: 'ok', time: new Date().toISOString() }));

// 1. Static Assets & Universal Media Fallback (handles /assets/*, /uploads/*, direct /p-monstera.jpg, etc.)
app.use('*', async (c, next) => {
  const reqPath = c.req.path;

  // If requesting a media file anywhere on the server
  if (reqPath.match(/\.(jpg|jpeg|png|webp|svg|gif|mp4|webm|ico|woff2|woff|ttf)$/i)) {
    const filename = path.basename(reqPath);
    const possiblePaths = [
      path.join(rootDir, 'assets', 'img', filename),
      path.join(rootDir, 'assets', filename),
      path.join(rootDir, 'uploads', filename),
      path.join(rootDir, reqPath.replace(/^\//, '')),
      path.join(rootDir, 'build', 'client', reqPath.replace(/^\//, ''))
    ];
    for (const fp of possiblePaths) {
      if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
        const ext = path.extname(fp).toLowerCase();
        const mimeTypes = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.webp': 'image/webp',
          '.svg': 'image/svg+xml',
          '.gif': 'image/gif',
          '.mp4': 'video/mp4',
          '.webm': 'video/webm',
          '.ico': 'image/x-icon',
          '.woff2': 'font/woff2',
          '.woff': 'font/woff',
          '.ttf': 'font/ttf'
        };
        return c.body(fs.readFileSync(fp), 200, {
          'Content-Type': mimeTypes[ext] || 'application/octet-stream',
          'Cache-Control': 'public, max-age=31536000, immutable'
        });
      }
    }
  }

  await next();
});

// 2. Remix Client Build Assets with Cache-Control
app.use('/assets/*', async (c, next) => {
  await next();
  c.header('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
});
app.use('/assets/*', serveStatic({ root: './build/client' }));
app.use('/assets/*', serveStatic({ root: './' }));
app.use('/uploads/*', serveStatic({ root: './' }));

// Storefront routes and 301 redirects are mounted via storefrontSeoRouter at root '/'

// Error handling
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: err.message || 'Internal Server Error' }, 500);
});

export default app;
