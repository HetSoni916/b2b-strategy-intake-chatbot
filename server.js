import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Base Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the B2B Strategy Intake Chatbot API',
    status: 'online',
    version: '1.0.0'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Database Connection and Server Startup
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/b2b-strategy-chatbot';

console.log('Attempting to connect to MongoDB...');
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API endpoints accessible at http://localhost:${PORT}/api`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed. Express server not started:', err.message);
  });
