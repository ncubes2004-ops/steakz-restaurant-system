import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { logger } from './middleware/logger.js';

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import hqRoutes from './routes/hqRoutes.js';
import branchManagerRoutes from './routes/branchManagerRoutes.js';
import chefRoutes from './routes/chefRoutes.js';
import cashierRoutes from './routes/cashierRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import publicRoutes from './routes/publicRoutes.js';

const app = express();
const PORT = process.env['PORT'] ?? 3001;

// Allow both your local machine and your Vercel live production domain explicitly
// Normalize any configured FRONTEND_URL by trimming a trailing slash.
const allowedOrigins = [
  process.env['FRONTEND_URL'] ? process.env['FRONTEND_URL'].replace(/\/$/, '') : undefined,
  'http://localhost:5173',
  'https://steakz-restaurant-system.vercel.app'
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    try {
      // For non-browser requests or same-origin requests, origin can be undefined.
      if (!origin) return callback(null, true);

      // Normalize request origin to avoid failures due to trailing slash differences.
      const requestOrigin = origin.replace(/\/$/, '');

      if (allowedOrigins.includes(requestOrigin)) {
        return callback(null, true);
      }

      // Do not pass an Error object to the callback — that will trigger a 500.
      // Instead, deny CORS by returning allow=false so the request fails with a CORS policy client-side.
      console.warn(`[CORS] Denied origin: ${requestOrigin}`);
      return callback(null, false);
    } catch (err) {
      console.error('[CORS] origin check failed:', err);
      return callback(null, false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 204,
}));

app.use(express.json());
app.use(logger);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hq', hqRoutes);
app.use('/api/branch-manager', branchManagerRoutes);
app.use('/api/chef', chefRoutes);
app.use('/api/cashier', cashierRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/public', publicRoutes);

app.listen(PORT, () => {
  console.log(`Steakz API successfully initialized and listening on port ${PORT}`);
});
