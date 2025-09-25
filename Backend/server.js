// Traditional server entry point (for local development)
const app = require('./index');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Only start server if not in serverless environment
if (!process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Mathematico Backend Server running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/api/v1/health`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
      process.exit(0);
    });
  });
} else {
  console.log('Serverless environment detected - app exported for Vercel');
}

module.exports = app;
