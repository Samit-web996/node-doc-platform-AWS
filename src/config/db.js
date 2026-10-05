const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info({ message: 'MongoDB connected successfully' });
  } catch (error) {
    logger.error({ message: 'MongoDB connection failed', error: error.message });
    process.exit(1);
  }
};

module.exports = connectDB;