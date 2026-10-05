const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const docRoutes = require('./routes/doc.routes');
const healthRoutes = require('./routes/health.routes');

const app = express();

// Database Connect
connectDB();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Global Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Bohot zyada requests, thodi der baad koshish karein.'
});
app.use('/api/', limiter);

// Routes Register
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/documents', docRoutes);

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