import { Router } from 'express';
import {
  getUserConnections,
  getConnectionById,
  createConnection,
  updateConnection,
  deleteConnection,
  searchByCapability,
  getConnectionStats,
  sendConnectionRequest,
  getMyConnectionRequests,
  acceptConnectionRequest,
  declineConnectionRequest
} from '../controllers/network.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * All network routes require authentication
 */

// GET /api/network/connections/stats - Get connection statistics
router.get('/connections/stats', authenticate, getConnectionStats);

// GET /api/network/connections/search/capabilities - Search by capability
router.get('/connections/search/capabilities', authenticate, searchByCapability);

// GET /api/network/connections - Get all user's connections
router.get('/connections', authenticate, getUserConnections);

// POST /api/network/connections - Create new connection
router.post('/connections', authenticate, createConnection);

// Connection Requests Routes (must come before /connections/:id to avoid route conflicts)
// POST /api/network/connection-requests - Send connection request
router.post('/connection-requests', authenticate, sendConnectionRequest);

// GET /api/network/connection-requests - Get connection requests for current user
router.get('/connection-requests', authenticate, getMyConnectionRequests);

// POST /api/network/connection-requests/:id/accept - Accept connection request
router.post('/connection-requests/:id/accept', authenticate, acceptConnectionRequest);

// POST /api/network/connection-requests/:id/decline - Decline connection request
router.post('/connection-requests/:id/decline', authenticate, declineConnectionRequest);

// GET /api/network/connections/:id - Get connection by ID (must come after connection-requests)
router.get('/connections/:id', authenticate, getConnectionById);

// PUT /api/network/connections/:id - Update connection
router.put('/connections/:id', authenticate, updateConnection);

// DELETE /api/network/connections/:id - Delete connection
router.delete('/connections/:id', authenticate, deleteConnection);

export default router;
