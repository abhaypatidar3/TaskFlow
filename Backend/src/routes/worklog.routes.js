const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const {
  getMyDaily, getMyChart, getMyTimeline, getMyHeatmap, getMyTaskLogs,
  getUserDaily, getUserChart, getUserTimeline, getUserHeatmap, getUserTaskLogs,
  getUserSummary, getLiveTracking,
  addManualSession, editSession, deleteSession,
} = require('../controllers/worklog.controller');

const router = express.Router();
router.use(authMiddleware);

// Member: own work logs
router.get('/my/daily', getMyDaily);
router.get('/my/chart', getMyChart);
router.get('/my/timeline', getMyTimeline);
router.get('/my/heatmap', getMyHeatmap);
router.get('/my/task-logs', getMyTaskLogs);

// Admin: specific user
router.get('/user/:userId/daily', requireRole('ADMIN'), getUserDaily);
router.get('/user/:userId/chart', requireRole('ADMIN'), getUserChart);
router.get('/user/:userId/timeline', requireRole('ADMIN'), getUserTimeline);
router.get('/user/:userId/heatmap', requireRole('ADMIN'), getUserHeatmap);
router.get('/user/:userId/task-logs', requireRole('ADMIN'), getUserTaskLogs);
router.get('/user/:userId/summary', requireRole('ADMIN'), getUserSummary);

// Admin: live tracking
router.get('/live', requireRole('ADMIN'), getLiveTracking);

// Admin: manual session management
router.post('/user/:userId/sessions', requireRole('ADMIN'), addManualSession);
router.patch('/sessions/:sessionId', requireRole('ADMIN'), editSession);
router.delete('/sessions/:sessionId', requireRole('ADMIN'), deleteSession);

module.exports = router;
