const express = require('express');
const { body } = require('express-validator');
const {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require('../controllers/project.controller');
const authMiddleware = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');

const router = express.Router();

const projectValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Project name must be at least 2 characters'),
];

// All routes require authentication
router.use(authMiddleware);

router.get('/', getProjects);
router.post('/', requireRole('ADMIN'), projectValidation, createProject);
router.get('/:id', getProjectById);
router.patch('/:id', requireRole('ADMIN'), projectValidation, updateProject);
router.delete('/:id', requireRole('ADMIN'), deleteProject);
router.post('/:id/members', requireRole('ADMIN'), addMember);
router.delete('/:id/members/:userId', requireRole('ADMIN'), removeMember);

module.exports = router;
