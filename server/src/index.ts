import { Hono } from 'hono';
import { cors } from 'hono/cors';
import rpcRoutes from './routes/rpc.js';

const app = new Hono();

app.use('/api/*', cors());

// API routes
app.route('/api/rpc', rpcRoutes);

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }));

export default app;
