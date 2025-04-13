# LegAI - Website Tư Vấn và Quản Lý Hồ Sơ Pháp Lý Tích Hợp AI Để Nâng Cao Hiệu Quả Tra Cứu
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
├── .git/                     # Thư mục quản lý phiên bản Git
├── .vscode/                  # Cấu hình cho Visual Studio Code
├── Documents/                # Tài liệu dự án
│   ├── 1.ProjectProposal.docx       # Đề xuất dự án
│   ├── 2.ProjectPlan.docx           # Kế hoạch dự án
│   ├── 3.ProjectUserStrory.docx     # User stories
│   ├── 4.Product-Backlog.docx       # Danh sách tính năng
│   ├── 6.ProjectDatabase.docx       # Thiết kế cơ sở dữ liệu
│   └── 10.ProjectSprintBacklog.xlsx # Kế hoạch sprint
├── .gitignore                # Danh sách loại trừ khỏi Git
├── LegAI/                    # Mã nguồn dự án
│   ├── Backend/              # Phần backend
│   │   ├── node_modules/     # Thư viện
│   │   ├── src/              # Mã nguồn
│   │   │   ├── config/       # Cấu hình
│   │   │   ├── controllers/  # Xử lý logic
│   │   │   ├── middleware/   # Middleware
│   │   │   ├── models/       # Mô hình dữ liệu
│   │   │   ├── routes/       # API routes 
│   │   │   ├── services/     # Logic nghiệp vụ
│   │   │   ├── types/        # Định nghĩa kiểu
│   │   │   ├── utils/        # Tiện ích
│   │   │   └── app.js        # Khởi động ứng dụng
│   │   ├── .env              # Biến môi trường
│   │   ├── .gitignore        # Cấu hình Git
│   │   ├── package.json      # Cấu hình npm
│   │   ├── package-lock.json # Khóa phiên bản npm
│   │   └── pnpm-lock.yaml    # Khóa phiên bản pnpm
│   └── Frontend/             # Phần frontend
│       ├── node_modules/     # Thư viện
│       ├── public/           # Tài nguyên công khai
│       ├── src/              # Mã nguồn
│       │   ├── assets/       # Tài nguyên tĩnh
│       │   ├── components/   # Components UI
│       │   ├── config/       # Cấu hình
│       │   ├── pages/        # Các trang
│       │   ├── router/       # Định tuyến
│       │   ├── services/     # Gọi API
│       │   ├── store/        # Quản lý trạng thái
│       │   ├── styles/       # Style chung
│       │   ├── types/        # Định nghĩa kiểu
│       │   ├── App.jsx       # Component chính
│       │   ├── App.css       # Style cho App
│       │   ├── main.jsx      # Điểm khởi chạy
│       │   └── index.css     # Style toàn cục
│       ├── .env              # Biến môi trường
│       ├── .gitignore        # Cấu hình Git
│       ├── eslint.config.js  # Cấu hình linting
│       ├── index.html        # HTML gốc
│       ├── package.json      # Cấu hình npm
│       ├── package-lock.json # Khóa phiên bản npm
│       ├── pnpm-lock.yaml    # Khóa phiên bản pnpm
│       ├── README.md         # Hướng dẫn frontend
│       └── vite.config.js    # Cấu hình Vite
└── README.md                 # Tài liệu tổng quan
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
