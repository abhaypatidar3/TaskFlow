const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const {
  getTasksByProject,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  getMyTasks,
  getAllTasks,
  addComment,
  startWork,
  stopWork,
  reassignTask,
} = require('../controllers/task.controller');

const router = express.Router();

// All routes require auth
router.use(authMiddleware);

// Member: my tasks
router.get('/my', getMyTasks);

// Admin: all tasks across projects
router.get('/', requireRole('ADMIN'), getAllTasks);

// Single task detail (both roles, access-checked in controller)
router.get('/:id', getTaskById);

// Admin: update task
router.patch('/:id', requireRole('ADMIN'), updateTask);

// Admin: delete task
router.delete('/:id', requireRole('ADMIN'), deleteTask);

// Reassign (admin + assignee, checked in controller)
router.patch('/:id/assign', reassignTask);

// Comments (both admin + assignee, checked in controller)
router.post('/:id/comments', addComment);

// Timer (assignee, checked in controller)
router.post('/:id/start', startWork);
router.post('/:id/stop', stopWork);

// Project-scoped routes
router.get('/project/:projectId', getTasksByProject);
router.post(
  '/project/:projectId',
  requireRole('ADMIN'),
  [body('title').trim().isLength({ min: 2 }).withMessage('Title must be at least 2 characters')],
  createTask
);

module.exports = router;
