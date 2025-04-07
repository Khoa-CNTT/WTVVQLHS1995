// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

// Đăng nhập
router.post('/login', authController.login);

// Đăng ký
router.post('/register', userController.register);

// Xác minh tài khoản
router.post('/verify', userController.verifyAccount);

// Lấy thông tin người dùng theo ID
router.get('/users/:userId', userController.getUserById);

module.exports = router;