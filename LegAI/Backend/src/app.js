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