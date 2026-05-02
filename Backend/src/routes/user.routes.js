const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const { getUsers, deleteUser } = require('../controllers/user.controller');

const router = express.Router();

router.use(authMiddleware);
router.get('/', requireRole('ADMIN'), getUsers);
router.delete('/:id', requireRole('ADMIN'), deleteUser);

module.exports = router;
