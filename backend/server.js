require('dotenv').config();
const cluster = require('cluster');
const os = require('os');

// Process-level event handlers to catch uncaught errors and prevent server from crashing.
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down worker gracefully...');
  console.error(err.name, err.message, err.stack);
  // Allow pending requests to complete then exit. The master will automatically restart a new worker.
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥');
  console.error(err.name, err.message, err.stack);
});

// Run cluster in production mode to avoid crash of the entire system and optimize CPU core usage.
// In development mode, we run a single process so nodemon and debugging work seamlessly.
const shouldCluster = process.env.NODE_ENV === 'production';

if (shouldCluster && cluster.isMaster) {
  const numCPUs = os.cpus().length || 2;
  console.log(`[Master] Master process ${process.pid} is running in production mode.`);
  console.log(`[Master] Spawning ${numCPUs} worker processes...`);

  // Fork worker processes
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Handle worker crashes and spawn replacements
  cluster.on('exit', (worker, code, signal) => {
    console.log(`[Master] Worker process ${worker.process.pid} died (code: ${code}, signal: ${signal}). Spawning replacement worker...`);
    cluster.fork();
  });
} else {
  const express = require('express');
  const cors = require('cors');
  const helmet = require('helmet');
  const cookieParser = require('cookie-parser');
  const morgan = require('morgan');

  const connectDB = require('./config/db');
  const bootstrapSuperAdmin = require('./services/bootstrapSuperAdmin');
  const errorHandler = require('./middlewares/errorMiddleware');
  const AppError = require('./utils/appError');
  const { apiLimiter } = require('./middlewares/rateLimitMiddleware');

  // Initialize database connection
  connectDB().then(async () => {
    // Bootstrap Super Admin role
    await bootstrapSuperAdmin();

    // Initialize express application
    const app = express();

    // 1) GLOBAL MIDDLEWARES
    // Secure HTTP Headers
    app.use(helmet());

    // CORS Configuration
    app.use(
      cors({
        origin: (origin, callback) => {
          // Allow requests with no origin (like mobile apps, curl)
          if (!origin) return callback(null, true);
          // Allow any localhost port (e.g. 5173, 5174, 3000, etc.)
          if (/^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
            return callback(null, true);
          }
          return callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
      })
    );

    // Request logger in dev environment
    if (process.env.NODE_ENV === 'development') {
      app.use(morgan('dev'));
    }

    // Rate Limiting for overall APIs
    app.use('/api', apiLimiter);

    // Body parser, reading data from body into req.body
    app.use(express.json({ limit: '10kb' }));

    // Cookie parser, reading cookies into req.cookies
    app.use(cookieParser());

    // 2) API ROUTES
    app.use('/api/auth', require('./routes/authRoutes'));
    app.use('/api/plans', require('./routes/planRoutes'));
    app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));
    app.use('/api/users', require('./routes/userRoutes'));
    app.use('/api/stats', require('./routes/statsRoutes'));

    // 3) UNHANDLED ROUTE HANDLER
    app.all('*', (req, res, next) => {
      next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
    });

    // 4) GLOBAL ERROR MIDDLEWARE
    app.use(errorHandler);

    // Start listening
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Worker process ${process.pid} running on port ${PORT}`);
    });
  }).catch((err) => {
    console.error('Failed to start server due to Database Connection failure:', err);
    process.exit(1);
  });
}
