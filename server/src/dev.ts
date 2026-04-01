import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, '../../client/dist');
const staticRoot = path.relative(process.cwd(), clientDist);

// Serve frontend static files
app.use('/*', serveStatic({ root: staticRoot }));

// SPA fallback: serve index.html for non-API routes
app.get('*', (c) => {
  const html = fs.readFileSync(path.join(clientDist, 'index.html'), 'utf-8');
  return c.html(html);
});

const port = Number(process.env.PORT) || 3000;
console.log(`Server running on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
