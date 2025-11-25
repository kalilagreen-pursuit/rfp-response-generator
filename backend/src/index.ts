import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import testRoutes from './routes/test.routes.js';
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import documentRoutes from './routes/document.routes.js';
import rfpRoutes from './routes/rfp.routes.js';
import proposalRoutes from './routes/proposal.routes.js';
import networkRoutes from './routes/network.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
      },
      rfp: {
        list: 'GET /api/rfp',
        upload: 'POST /api/rfp/upload',
        get: 'GET /api/rfp/:id',
        reparse: 'POST /api/rfp/:id/reparse',
        validate: 'PUT /api/rfp/:id/validate',
        download: 'GET /api/rfp/:id/download',
        delete: 'DELETE /api/rfp/:id'
      },
      proposals: {
        list: 'GET /api/proposals',
        generate: 'POST /api/proposals/generate',
        get: 'GET /api/proposals/:id',
        update: 'PUT /api/proposals/:id',
        refine: 'POST /api/proposals/:id/refine',
        status: 'PUT /api/proposals/:id/status',
        withdraw: 'PUT /api/proposals/:id/withdraw',
        delete: 'DELETE /api/proposals/:id',
        exportDocx: 'GET /api/proposals/:id/export/docx',
        exportPdf: 'GET /api/proposals/:id/export/pdf'
      },
      network: {
        listConnections: 'GET /api/network/connections',
        createConnection: 'POST /api/network/connections',
        getConnection: 'GET /api/network/connections/:id',
        updateConnection: 'PUT /api/network/connections/:id',
        deleteConnection: 'DELETE /api/network/connections/:id',
        searchByCapability: 'GET /api/network/connections/search/capabilities',
        stats: 'GET /api/network/connections/stats'
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

// RFP routes
app.use('/api/rfp', rfpRoutes);

// Proposal routes
app.use('/api/proposals', proposalRoutes);

// Network routes
app.use('/api/network', networkRoutes);

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
