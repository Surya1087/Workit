const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');

const createApp = () => {
  const app = express();

  app.use(helmet());

 const allowedOrigins = [
  'https://workit-neon.vercel.app',  // ADD THIS
  'https://gigflow-frontend-rust.vercel.app',
  'https://trygigflow.vercel.app',
  'http://localhost:5173'
];

  app.use(
    cors({
      origin: function (origin, callback) {
        // allow requests with no origin (like Postman)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          return callback(null, origin); // ✅ only ONE origin returned
        } else {
          return callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    })
  );

  // To handle preflight properly
  app.options('*', cors());

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api', routes);

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found',
    });
  });

  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);

    res.status(err.statusCode || 500).json({
      success: false,
      error:
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : err.message,
    });
  });

  return app;
};

module.exports = { createApp };
