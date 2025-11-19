import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import testRoutes from './routes/test.routes.js';
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import documentRoutes from './routes/document.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.get('/api', (req, res) => {
  res.json({
    message: 'RFP Proposal Generator API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      test: '/api/test/supabase',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me',
        refresh: 'POST /api/auth/refresh',
        forgotPassword: 'POST /api/auth/forgot-password',
        resetPassword: 'POST /api/auth/reset-password'
      },
      profile: {
        get: 'GET /api/profile',
        update: 'PUT /api/profile',
        delete: 'DELETE /api/profile',
        marketplace: 'GET /api/profile/marketplace',
        getById: 'GET /api/profile/:id'
      },
      documents: {
        list: 'GET /api/documents',
        upload: 'POST /api/documents/upload',
        uploadMultiple: 'POST /api/documents/upload-multiple',
        get: 'GET /api/documents/:id',
        download: 'GET /api/documents/:id/download',
        delete: 'DELETE /api/documents/:id',
        stats: 'GET /api/documents/stats'
      }
    }
  });
});

// Test routes
app.use('/api/test', testRoutes);

// Auth routes
app.use('/api/auth', authRoutes);

// Profile routes
app.use('/api/profile', profileRoutes);

// Document routes
app.use('/api/documents', documentRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
});

export default app;
