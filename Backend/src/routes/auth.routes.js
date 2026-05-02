const express = require('express');
const { body } = require('express-validator');
const { signup, login, getMe, logout, setup } = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

const signupValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);
router.get('/me', authMiddleware, getMe);
router.post('/logout', logout);
router.post('/setup', setup); // One-time admin creation

module.exports = router;
