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
const cron = require('node-cron');
const autoUpdateService = require('./services/autoUpdateService');

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
    origin: '*', // Cho phép tất cả các origin trong môi trường phát triển
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
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

// Thiết lập cron job cho tự động cập nhật văn bản pháp luật
const setupAutoUpdateCron = () => {
  // Cập nhật văn bản pháp luật mỗi ngày lúc 1 giờ sáng (thay vì chỉ vào Chủ nhật)
  cron.schedule('0 1 * * *', async () => {
    console.log('Bắt đầu cron job cập nhật văn bản pháp luật tự động hàng ngày...');
    try {
      const result = await autoUpdateService.autoUpdateLegalDocuments(20);
      console.log(`Cron job tự động cập nhật văn bản pháp luật hoàn tất: ${result.count} văn bản mới`);
    } catch (error) {
      console.error('Lỗi trong cron job cập nhật văn bản pháp luật:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh"
  });
  
  // Cập nhật thêm vào buổi chiều mỗi ngày lúc 15 giờ (3 giờ chiều)
  cron.schedule('0 15 * * *', async () => {
    console.log('Bắt đầu cron job cập nhật văn bản pháp luật buổi chiều...');
    try {
      const result = await autoUpdateService.autoUpdateLegalDocuments(10);
      console.log(`Cron job cập nhật văn bản pháp luật buổi chiều hoàn tất: ${result.count} văn bản mới`);
    } catch (error) {
      console.error('Lỗi trong cron job cập nhật văn bản pháp luật buổi chiều:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh"
  });
  
  // Thêm cơ chế kiểm tra và cập nhật bù khi server khởi động lại
  console.log('Kiểm tra xem có cần cập nhật bù không...');
  
  // Lấy thời gian hiện tại ở múi giờ Việt Nam
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const currentHour = now.getHours();
  const lastUpdateKey = 'last_auto_update_date';
  
  // Kiểm tra xem đã cập nhật trong ngày hôm nay chưa
  const checkAndRunMissedUpdate = async () => {
    try {
      // Lấy ngày cập nhật cuối từ bảng AuditLogs
      const lastUpdateLogs = await autoUpdateService.getLastUpdateTime();
      const today = now.toISOString().split('T')[0]; // Lấy phần ngày YYYY-MM-DD
      
      let needsUpdate = false;
      let updateCount = 0;
      
      if (!lastUpdateLogs || lastUpdateLogs.length === 0) {
        console.log('Chưa có bản ghi cập nhật nào, thực hiện cập nhật ngay.');
        needsUpdate = true;
        updateCount = 20;
      } else {
        const lastUpdateDate = new Date(lastUpdateLogs[0].created_at)
          .toISOString().split('T')[0];
        
        if (lastUpdateDate !== today) {
          console.log(`Phát hiện chưa cập nhật trong ngày hôm nay (${today}). Lần cập nhật cuối: ${lastUpdateDate}`);
          needsUpdate = true;
          
          // Nếu đã qua 15h, cập nhật tổng cộng 30 văn bản (cả 2 đợt)
          if (currentHour >= 15) {
            updateCount = 30;
          } else if (currentHour >= 1) {
            // Nếu đã qua 1h sáng, cập nhật 20 văn bản (đợt sáng)
            updateCount = 20;
          }
        } else {
          // Đã cập nhật trong ngày hôm nay, kiểm tra xem có phải cập nhật buổi chiều không
          if (currentHour >= 15) {
            // Kiểm tra xem đã cập nhật sau 15h chưa
            const lastUpdateHour = new Date(lastUpdateLogs[0].created_at).getHours();
            
            if (lastUpdateHour < 15) {
              console.log('Phát hiện chưa cập nhật buổi chiều. Thực hiện cập nhật bù.');
              needsUpdate = true;
              updateCount = 10;
            }
          }
        }
      }
      
      if (needsUpdate && updateCount > 0) {
        console.log(`Thực hiện cập nhật bù với ${updateCount} văn bản...`);
        const result = await autoUpdateService.autoUpdateLegalDocuments(updateCount);
        console.log(`Cập nhật bù hoàn tất: ${result.count} văn bản mới`);
      } else {
        console.log('Không cần cập nhật bù.');
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra và cập nhật bù:', error);
    }
  };
  
  // Chạy kiểm tra cập nhật bù khi khởi động
  checkAndRunMissedUpdate();
  
  console.log('Đã thiết lập cron job tự động cập nhật văn bản pháp luật hàng ngày');
};

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server website đẳng cấp thế giới đã được khởi động, Chú ý !`);
    console.log(`Cổng: ${PORT}`);
    console.log(`Địa chỉ API: http://localhost:${PORT}`);
    setupAutoUpdateCron();
});