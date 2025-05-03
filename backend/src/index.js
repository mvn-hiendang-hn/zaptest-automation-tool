require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./routes/authRoutes');
const collectionsRoutes = require('./routes/collectionsRoutes');
const testRoutes = require('./routes/testRoutes');
const schedulesRoutes = require('./routes/schedulesRoutes');
const testRunsRoutes = require('./routes/testRunsRoutes');
const cronService = require('./services/cronService');

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Add Prisma to request object
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Routes
app.use('/api/collections', collectionsRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/test-runs', testRunsRoutes);

// Khởi tạo cron jobs
cronService.initializeCronJobs();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Có lỗi xảy ra!' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên port ${PORT}`);
});
