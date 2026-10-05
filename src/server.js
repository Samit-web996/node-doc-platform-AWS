require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { loadSecrets } = require('./config/secrets');

const app = express();

const startServer = async () => {
  await loadSecrets();

  const connectDB = require('./config/db');
  const authRoutes = require('./routes/auth.routes');
  const docRoutes = require('./routes/doc.routes');
  const healthRoutes = require('./routes/health.routes');

  // Database Connection
  await connectDB();

  // Security Middlewares
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.use('/api', healthRoutes);
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
  });

  app.use('/api/auth', limiter, authRoutes);
  app.use('/api/documents', limiter, docRoutes);

  // Error Handling Middleware
  app.use((err, req, res, next) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();