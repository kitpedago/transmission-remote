import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serveStatic } from '@hono/node-server/serve-static';
import connectionsRoutes from './routes/connections.js';
import rpcRoutes from './routes/rpc.js';

const app = new Hono();

app.use('*', logger());
app.use('/api/*', cors());

// API routes
app.route('/api/connections', connectionsRoutes);
app.route('/api/rpc', rpcRoutes);

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }));

// Serve frontend in production
app.use('/*', serveStatic({ root: '../client/dist' }));

const port = Number(process.env.PORT) || 3000;
console.log(`Server running on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
