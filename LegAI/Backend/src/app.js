// src/app.js
require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const { authenticateToken } = require('./middleware/authMiddleware');

// Kiểm tra biến môi trường JWT_SECRET
if (!process.env.JWT_SECRET) {
    console.log('CẢNH BÁO: Biến môi trường JWT_SECRET không tìm thấy. Sử dụng giá trị mặc định.');
    process.env.JWT_SECRET = 'legai_jwt_super_secret_key_12345_secure_random_string';
}


// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Route chào mừng
app.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'Chào mừng đến với API LegAI'
    });
});

// Route kiểm tra token
app.get('/api/auth/verify-token', authenticateToken, (req, res) => {
    res.json({
        status: 'success',
        message: 'Token hợp lệ',
        user: req.user
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
    console.log(`Server website đẳng cấp thế giới đã được khởi động, Chú ý !`);
    console.log(`Cổng: ${PORT}`);
});