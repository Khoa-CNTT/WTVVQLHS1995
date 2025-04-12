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

// Routes quên mật khẩu
router.post('/forgot-password', userController.forgotPassword);
router.post('/verify-reset-token', userController.verifyResetToken);
router.post('/change-password', userController.changePassword);

// Routes được bảo vệ (yêu cầu xác thực)
router.get('/users', authenticateToken, userController.getUsers);
router.get('/users/:userId', authenticateToken, userController.getUserById);
router.get('/users/:userId/stats', authenticateToken, userController.getUserStats);
router.put('/users/:userId', authenticateToken, userController.updateUser);
router.delete('/users/:userId', authenticateToken, userController.deleteUser);
router.patch('/users/:userId/toggle-lock', authenticateToken, userController.toggleUserLock);
router.post('/users/:userId/reset-password', authenticateToken, userController.resetPassword);

// Route cho developer kiểm tra ràng buộc database
router.get('/check-constraints/:tableName', authenticateToken, userController.checkDatabaseConstraints);

module.exports = router;