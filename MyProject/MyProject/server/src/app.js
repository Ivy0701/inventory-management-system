import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import connectDb from './config/db.js';
import orderRoutes from './routes/orderRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { initDefaultUsers } from './scripts/initDefaultUsers.js';

connectDb();
initDefaultUsers();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  });
});

export default app;

