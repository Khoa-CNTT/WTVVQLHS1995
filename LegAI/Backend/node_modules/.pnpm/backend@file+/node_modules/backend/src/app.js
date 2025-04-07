// src/app.js
const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const { authenticateToken } = require('./middleware/authMiddleware');

// Middleware
app.use(cors());
app.use(express.json());

// Thông báo
console.log('Server khởi động với cấu hình:');
console.log('- Xác thực JWT được kích hoạt');
console.log('- Gửi email OTP được xử lý ở frontend thông qua EmailJS');

// Routes
app.use('/api/auth', authRoutes);

// Route chào mừng
app.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'Chào mừng đến với API LegAI'
    });
});

// Route ví dụ cần bảo vệ
app.get('/api/protected', authenticateToken, (req, res) => {
    res.json({
        status: 'success',
        message: 'Đây là route được bảo vệ',
        user: req.user
    });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server chạy trên port ${PORT}`);
});