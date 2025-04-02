# LegAI - Website Tư Vấn và Quản Lý Hồ Sơ Pháp Lý Tích Hợp AI Để Nâng Cao Hiệu Quả Tra Cứu

![logo](https://github.com/user-attachments/assets/0eea7ce9-c850-4237-b498-6a5dab66dc0a)

*Empowering legal consultation and document management with AI for enhanced search efficiency.*

---

## Công Nghệ Sử Dụng

![ReactJS](https://img.shields.io/badge/ReactJS-61DAFB?logo=react&logoColor=white&style=flat-square) ![NodeJS](https://img.shields.io/badge/NodeJS-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![ExpressJS](https://img.shields.io/badge/ExpressJS-000000?logo=express&logoColor=white&style=flat-square) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white&style=flat-square) ![Elasticsearch](https://img.shields.io/badge/Elasticsearch-005571?logo=elasticsearch&logoColor=white&style=flat-square) ![Rasa](https://img.shields.io/badge/Rasa-5A17B2?logo=rasa&logoColor=white&style=flat-square) ![OpenAI](https://img.shields.io/badge/OpenAI-412991?logo=openai&logoColor=white&style=flat-square) ![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white&style=flat-square) ![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white&style=flat-square)

---

## Giới Thiệu Dự Án

**LegAI** là một website tích hợp trí tuệ nhân tạo (AI) nhằm hỗ trợ tra cứu thông tin pháp lý, tư vấn pháp luật, và quản lý hồ sơ pháp lý một cách hiệu quả, nhanh chóng. Dự án được phát triển bởi nhóm sinh viên Trường Đại học Duy Tân, hướng đến việc tối ưu hóa quy trình pháp lý trong thời đại số hóa.

- **Tên dự án**: Website Tư Vấn và Quản Lý Hồ Sơ Pháp Lý Tích Hợp AI Để Nâng Cao Hiệu Quả Tra Cứu  
- **Mã dự án**: LegAI  
- **Thời gian thực hiện**: 17/03/2025 - 15/05/2025  
- **Đơn vị thực hiện**: Khoa Công nghệ Thông tin - Đại học Duy Tân  

---

## Mục Tiêu Dự Án

- Cung cấp công cụ tra cứu văn bản pháp luật nhanh, chính xác với sự hỗ trợ của AI.  
- Tích hợp chatbot AI tư vấn pháp lý cơ bản, hoạt động 24/7.  
- Tạo nền tảng quản lý hồ sơ pháp lý chuyên nghiệp, dễ sử dụng.  
- Nâng cao trải nghiệm người dùng với giao diện trực quan và tính năng thông minh.  

---

## Tính Năng Chính

1. **Đăng Ký & Đăng Nhập**: Xác thực an toàn cho Admin, Khách hàng, và Luật sư.  
2. **Tra Cứu Pháp Lý**: Tìm kiếm văn bản pháp luật, xem chi tiết và so sánh phiên bản.  
3. **Chatbot AI**: Tư vấn pháp lý cơ bản (thủ tục, hợp đồng), trả lời trong 2 giây.  
4. **Chat Trực Tiếp**: Kết nối với luật sư qua chatbox thời gian thực.  
5. **Quản Lý Hồ Sơ**: Tải lên, lưu trữ, chỉnh sửa, xóa hồ sơ pháp lý.  
6. **Quản Lý Hợp Đồng**: Lưu trữ, cập nhật trạng thái, tải hợp đồng dưới dạng PDF.  
7. **Tính Toán Phí**: Ước tính chi phí pháp lý dựa trên loại vụ việc.  
8. **Thanh Toán Dịch Vụ**: Hỗ trợ thanh toán qua ví điện tử hoặc chuyển khoản.  
9. **Thống Kê & Báo Cáo**: Admin xem thống kê và xuất báo cáo PDF/Excel.  

---

## Cấu Trúc Thư Mục

```
LegAI/
├── frontend/                       # Frontend (React)
│   ├── public/                     # Các tệp tĩnh (favicon, index.html, manifest.json)
│   ├── src/
│   │   ├── assets/                 # Ảnh, font, icons, CSS, SCSS...
│   │   ├── components/             # Các component
│   │   │   ├── ui/                 # Component UI chung (Button, Modal, Input)
│   │   │   ├── layout/             # Layout (Navbar, Sidebar, Footer)
│   │   │   ├── hooks/              # Custom hooks (useAuth, useTheme...)
│   │   │   └── utils/              # Hàm tiện ích (formatDate, debounce...)
│   │   ├── pages/                  # Các trang (Home, About, Dashboard...)
│   │   │   ├── Home/
│   │   │   ├── About/
│   │   │   └── DASHBOARD/          # Mỗi page có thư mục riêng
│   │   ├── store/                  # Quản lý state (Redux, Zustand...)
│   │   │   ├── slices/             # Redux slices (authSlice, userSlice...)
│   │   │   └── index.ts            # Combine reducers
│   │   ├── router/                 # Cấu hình Router
│   │   │   ├── privateRoutes.ts    # Route yêu cầu đăng nhập
│   │   │   ├── publicRoutes.ts     # Route công khai
│   │   │   └── index.ts            # Cấu hình Router chính
│   │   ├── services/               # API services (Axios, Fetch)
│   │   │   ├── authService.ts      # Service xác thực
│   │   │   └── userService.ts      # Service người dùng
│   │   ├── config/                 # Cấu hình chung
│   │   │   ├── axios.ts            # Cấu hình Axios
│   │   │   ├── env.ts              # Load biến môi trường
│   │   │   └── theme.ts            # Cấu hình theme (Dark/Light)
│   │   ├── types/                  # TypeScript types
│   │   │   ├── user.ts             # Kiểu dữ liệu User
│   │   │   └── auth.ts             # Kiểu dữ liệu Auth
│   │   ├── App.tsx                 # Component gốc
│   │   └── main.tsx                # Entry point
│   ├── .env                        # Biến môi trường
│   ├── tsconfig.json               # Cấu hình TypeScript
│   ├── tailwind.config.js          # Cấu hình TailwindCSS
│   ├── package.json                # Dependencies
│   ├── vite.config.ts              # Cấu hình Vite
│   └── README.md                   # Tài liệu frontend
├── backend/                        # Backend (Node.js)
│   ├── src/
│   │   ├── controllers/            # Logic API
│   │   │   ├── authController.ts   # Đăng nhập, đăng ký
│   │   │   └── userController.ts   # Quản lý người dùng
│   │   ├── models/                 # Schema/Model
│   │   │   ├── userModel.ts        # Model người dùng
│   │   │   └── authModel.ts        # Model xác thực
│   │   ├── routes/                 # Định nghĩa route
│   │   │   ├── authRoutes.ts       # Route xác thực
│   │   │   ├── userRoutes.ts       # Route người dùng
│   │   │   └── index.ts            # Combine routes
│   │   ├── middleware/             # Middleware
│   │   │   ├── authMiddleware.ts   # Kiểm tra token
│   │   │   └── errorMiddleware.ts  # Xử lý lỗi
│   │   ├── services/               # Logic nghiệp vụ
│   │   │   ├── authService.ts      # Dịch vụ xác thực
│   │   │   └── userService.ts      # Dịch vụ người dùng
│   │   ├── config/                 # Cấu hình
│   │   │   ├── database.ts         # Kết nối database
│   │   │   └── env.ts              # Biến môi trường
│   │   ├── utils/                  # Hàm tiện ích
│   │   │   ├── logger.ts           # Ghi log
│   │   │   └── helpers.ts          # Hỗ trợ (hash, token...)
│   │   ├── types/                  # TypeScript types
│   │   │   ├── userTypes.ts        # Kiểu người dùng
│   │   │   └── authTypes.ts        # Kiểu xác thực
│   │   └── app.ts                  # Khởi tạo Express
│   ├── .env                        # Biến môi trường
│   ├── tsconfig.json               # Cấu hình TypeScript
│   ├── package.json                # Dependencies
│   ├── nodemon.json                # Cấu hình Nodemon
│   └── README.md                   # Tài liệu backend
├── ai/                             # Chatbot AI (Rasa)
│   ├── data/                       # Dữ liệu huấn luyện
│   ├── models/                     # Mô hình AI
│   └── actions/                    # Hành động tùy chỉnh
├── docker/                         # Cấu hình Docker
│   ├── Dockerfile                  # Dockerfile ứng dụng
│   └── docker-compose.yml          # Dịch vụ tích hợp
└── README.md                       # Tài liệu chính
```

---

## .gitignore

```
# Dependencies
node_modules/

# Build output
dist/
build/

# Environment variables
.env
.env.local
.env.development
.env.production

# Logs
*.log
npm-debug.log*

# IDE files
.vscode/
.idea/

# OS generated files
.DS_Store
Thumbs.db
```

---

## Chiến Lược Branching trên GitHub

- **main**: Nhánh chính, chứa code ổn định, sẵn sàng triển khai.  
- **develop**: Nhánh tích hợp, chứa code từ các tính năng đã hoàn thiện để kiểm tra trước khi merge vào `main`.  
- **feature/[tên-tính-năng]**: Nhánh tạm thời cho từng tính năng (ví dụ: `feature/chatbot-ai`).  
- **bugfix/[mô-tả-lỗi]**: Nhánh sửa lỗi (ví dụ: `bugfix/login-error`).  

---

## Hướng Dẫn Cài Đặt

### Yêu Cầu Hệ Thống
- Hệ điều hành: Windows 10+, Ubuntu 20.04+, hoặc MacOS 12+  
- Phần mềm: NodeJS (v18+), Python 3.9+, PostgreSQL 14+, Docker  
- Kết nối Internet  

### Các Bước Cài Đặt

#### 1. Clone Repository
```bash
git clone https://github.com/your-team/legai.git
cd legai
```

#### 2. Cài Đặt Frontend
```bash
cd frontend
npm install
npm run build
```

- **Cấu hình môi trường**: Tạo file `.env` trong `frontend/`:
  ```
  VITE_API_URL=http://localhost:5000/api
  VITE_CHATBOT_URL=http://localhost:5005
  ```

#### 3. Cài Đặt Backend
```bash
cd ../backend
npm install
```

- **Cấu hình môi trường**: Tạo file `.env` trong `backend/`:
  ```
  PORT=5000
  DB_HOST=localhost
  DB_USER=your_user
  DB_PASSWORD=your_password
  DB_NAME=legai_db
  DB_PORT=5432
  JWT_SECRET=your_jwt_secret
  ```

- **Khởi tạo database**:
  ```bash
  psql -U your_user -c "CREATE DATABASE legai_db;"
  npm run migrate
  ```

#### 4. Cài Đặt Chatbot AI (Rasa)
```bash
cd ../ai
pip install rasa
rasa train
```

#### 5. Chạy Elasticsearch với Docker
```bash
docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 \
  -e "discovery.type=single-node" elasticsearch:8.5.0
```

#### 6. Chạy Ứng Dụng
- **Frontend**: `cd frontend && npm run dev`  
- **Backend**: `cd backend && npm run dev`  
- **Chatbot**: `cd ai && rasa run --enable-api`  

#### 7. Truy Cập
- Frontend: `http://localhost:5173` (Vite default port)  
- Backend API: `http://localhost:5000/api`  
- Chatbot: `http://localhost:5005`  
- Elasticsearch: `http://localhost:9200`  

---

## Thành Viên Nhóm

| Họ Tên                | Mã Sinh Viên   | Vai Trò           | Email                    | Số Điện Thoại   |
|-----------------------|----------------|-------------------|--------------------------|-----------------|
| **Huỳnh Văn Quý**     | 27211201995    | Scrum Master      | huynhquy674@gmail.com    | 0354459574      |
| **Phạm Minh Quân**    | 27211202256    | Product Owner     | minhquan151023@gmail.com | 0395316109      |
| **Trần Kim Thịnh**    | 27211235618    | Team Member       | trankimthinh23@gmail.com | 0384160548      |
| **Lê Hoàng Phúc**     | 27211202366    | Team Member       | lonis0405@gmail.com      | 0347589055      |
| **Nguyễn Ngọc Kỳ Phương** | 27204321839 | Team Member       | kingkuty724@gmail.com    | 0905141089      |

**Giảng viên hướng dẫn**: ThS. Lưu Văn Hiền (luuvanhien@dtu.edu.vn, 0779500029)  

---

## Giấy Phép

Dự án sử dụng **MIT License**. Xem file `LICENSE` để biết thêm chi tiết.

---

## Liên Hệ

- **Người liên hệ**: Trần Kim Thịnh  
- **Email**: trankimthinh23@gmail.com  
- **Số điện thoại**: 0384160548  

Cảm ơn bạn đã quan tâm đến **LegAI**!
