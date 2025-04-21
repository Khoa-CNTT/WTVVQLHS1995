// src/app.js
// Thiết lập môi trường phát triển
process.env.NODE_ENV = 'development';

require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const routes = require('./routes');
const { authenticateToken } = require('./middleware/authMiddleware');

// Kiểm tra biến môi trường JWT_SECRET
if (!process.env.JWT_SECRET) {
    console.log('CẢNH BÁO: Biến môi trường JWT_SECRET không tìm thấy. Sử dụng giá trị mặc định.');
    process.env.JWT_SECRET = 'legai_jwt_super_secret_key_12345_secure_random_string';
}

// Tạo thư mục uploads nếu chưa tồn tại
const uploadsDir = path.join(__dirname, '../uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Đã tạo thư mục uploads');
}

if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
    console.log('Đã tạo thư mục uploads/avatars');
}

// Cấu hình CORS
app.use(cors({
    origin: '*', // Cho phép tất cả nguồn gốc truy cập API
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Role', 'Content-Length', 'X-Requested-With'],
    credentials: true,
    exposedHeaders: ['Content-Length', 'X-Requested-With']
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Cấu hình thư mục tĩnh để truy cập files
app.use('/uploads', express.static(uploadsDir, {
    setHeaders: (res, path) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
    }
}));

// Sử dụng tất cả các routes từ routes/index.js
app.use('/api', routes);

// Route chào mừng
app.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'Chào mừng đến với API LegAI'
    });
});

// Route debug để xem đường dẫn uploads
app.get('/api/debug/uploads', (req, res) => {
    // Đọc danh sách file trong thư mục uploads
    const filesList = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
    
    // Tạo đường dẫn đầy đủ cho từng file
    const fullPathFiles = filesList.map(file => {
        return {
            filename: file,
            path: path.join(uploadsDir, file),
            url: `/uploads/${file}`
        };
    });
    
    res.json({
        status: 'success',
        uploads_directory: {
            path: uploadsDir,
            absolutePath: path.resolve(uploadsDir),
            exists: fs.existsSync(uploadsDir)
        },
        files: fullPathFiles,
        staticPath: '/uploads',
        baseUrl: `${req.protocol}://${req.get('host')}`
    });
});

// Route test upload file
app.get('/api/test-upload', (req, res) => {
    res.send(`
        <html>
        <head><title>Test Upload</title></head>
        <body>
            <h1>Test Upload Avatar</h1>
            <form action="/api/users/1/avatar" method="post" enctype="multipart/form-data">
                <input type="file" name="avatar" />
                <button type="submit">Upload</button>
            </form>
            <div>
                <h2>Uploads Directory</h2>
                <p>${uploadsDir}</p>
                <p>Absolute Path: ${path.resolve(uploadsDir)}</p>
            </div>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server website đẳng cấp thế giới đã được khởi động, Chú ý !`);
    console.log(`Cổng: ${PORT}`);
    console.log(`Địa chỉ API: http://localhost:${PORT}`);
});