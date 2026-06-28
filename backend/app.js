import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { errorHandler } from './src/middleware/errorHandler.middleware.js';
import authRoutes from './src/routes/auth.routes.js';
import productRoutes from './src/routes/product.routes.js';
import categoryRoutes from './src/routes/category.routes.js';
import inventoryRoutes from './src/routes/inventory.routes.js';
import settingsRoutes from './src/routes/settings.routes.js';
import saleRoutes from './src/routes/sale.routes.js';
import vendorRoutes from './src/routes/vendor.routes.js';
import purchaseOrderRoutes from './src/routes/purchaseOrder.routes.js';
import userRoutes from './src/routes/user.routes.js';
import customerRoutes from './src/routes/customer.routes.js';
import endOfDayRoutes from './src/routes/endOfDay.routes.js';
import reportRoutes from './src/routes/report.routes.js';
import receiptRoutes from './src/routes/receipt.routes.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/end-of-day', endOfDayRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/sales', receiptRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'POS API is running', data: null, errors: null });
});

app.use(errorHandler);

export default app;
