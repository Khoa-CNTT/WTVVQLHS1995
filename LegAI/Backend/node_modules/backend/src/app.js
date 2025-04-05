// src/app.js
const express = require('express');
const app = express();
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const { authenticateToken } = require('./middleware/authMiddleware');

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Route ví dụ cần bảo vệ
app.get('/api/protected', authenticateToken, (req, res) => {
    res.json({
        status: 'success',
        message: 'Đây là route được bảo vệ',
        user: req.user
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server chạy trên port ${PORT}`);
});