// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Routes công khai
router.post('/login', authController.login);
router.post('/register', userController.register);
router.post('/verify', userController.verifyAccount);

// Routes được bảo vệ (yêu cầu xác thực)
router.get('/users', authenticateToken, userController.getUsers);
router.get('/users/:userId', authenticateToken, userController.getUserById);
router.put('/users/:userId', authenticateToken, userController.updateUser);
router.delete('/users/:userId', authenticateToken, userController.deleteUser);
router.patch('/users/:userId/toggle-lock', authenticateToken, userController.toggleUserLock);
router.post('/users/:userId/reset-password', authenticateToken, userController.resetPassword);

module.exports = router;