import { serve, getRequestListener } from '@hono/node-server';
import { createServer } from 'http';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequestHandler } from '@remix-run/node';

import app from './app.js';
import { seedDatabase } from './db/seed.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--production');
const PORT = Number(process.env.PORT) || 3000;

// 1. Seed database with storefront initial data
try {
  seedDatabase();
} catch (err) {
  console.error('Seed error:', err);
}

// 2. Setup Server and Remix Handler
async function startServer() {
  const buildPath = path.join(rootDir, 'build', 'server', 'index.js');
  const hasBuild = fs.existsSync(buildPath);

  if (isProduction || hasBuild) {
    // Production / Pre-built mode: load compiled Remix server build
    console.log('📦 Loading compiled Remix production build...');
    const build = await import(pathToFileURL(buildPath).href);
    const remixHandler = createRequestHandler(build, 'production');

    app.use('*', async (c, next) => {
      const reqPath = c.req.path;
      if (
        reqPath.startsWith('/api') ||
        reqPath.startsWith('/assets') ||
        reqPath.startsWith('/uploads') ||
        reqPath === '/' ||
        reqPath === '/index.html' ||
        reqPath === '/product.html' ||
        reqPath.startsWith('/plants') ||
        reqPath.startsWith('/collections') ||
        reqPath.startsWith('/blogs') ||
        reqPath.startsWith('/journal') ||
        reqPath.startsWith('/cart') ||
        reqPath.startsWith('/checkout') ||
        reqPath.startsWith('/account') ||
        reqPath.startsWith('/profile') ||
        reqPath === '/shop' ||
        reqPath === '/llms.txt' ||
        reqPath === '/llms-full.txt' ||
        reqPath === '/index.json' ||
        reqPath === '/robots.txt' ||
        reqPath.endsWith('.md') ||
        reqPath.endsWith('.jsonld')
      ) {
        return next();
      }
      return remixHandler(c.req.raw);
    });

    console.log(`🚀 Starting FROND Fullstack Server on http://localhost:${PORT}`);
    serve({
      fetch: app.fetch,
      port: PORT,
    }, (info) => {
      console.log(`🌿 Storefront: http://localhost:${info.port}/`);
      console.log(`🌿 Product PDP: http://localhost:${info.port}/product.html?handle=monstera`);
      console.log(`🛠️ Admin Panel: http://localhost:${info.port}/admin`);
      console.log(`📦 REST API: http://localhost:${info.port}/api/catalog`);
    });
  } else {
    // Development mode with Vite dev middleware
    console.log('⚡ Starting in Vite development mode with HMR...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });

    app.use('*', async (c, next) => {
      const reqPath = c.req.path;
      if (
        reqPath.startsWith('/api') ||
        reqPath.startsWith('/assets') ||
        reqPath.startsWith('/uploads') ||
        reqPath === '/' ||
        reqPath === '/index.html' ||
        reqPath === '/product.html' ||
        reqPath.startsWith('/plants') ||
        reqPath === '/collections' ||
        reqPath === '/blogs' ||
        reqPath === '/journal' ||
        reqPath === '/shop'
      ) {
        return next();
      }
      const build = await vite.ssrLoadModule('virtual:remix/server-build');
      const remixHandler = createRequestHandler(build, 'development');
      return remixHandler(c.req.raw);
    });

    const honoListener = getRequestListener(app.fetch);
    const server = createServer((req, res) => {
      vite.middlewares(req, res, (err) => {
        if (err) {
          console.error('Vite Middleware Error:', err);
          res.statusCode = 500;
          res.end(err.stack);
          return;
        }
        honoListener(req, res);
      });
    });

    server.listen(PORT, () => {
      console.log(`🌿 Storefront: http://localhost:${PORT}/`);
      console.log(`🌿 Product PDP: http://localhost:${PORT}/product.html?handle=monstera`);
      console.log(`🛠️ Admin Panel: http://localhost:${PORT}/admin`);
      console.log(`📦 REST API: http://localhost:${PORT}/api/catalog`);
    });
  }
}

startServer().catch(console.error);
