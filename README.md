# LegAI - Website Tư Vấn và Quản Lý Hồ Sơ Pháp Lý Tích Hợp AI Để Nâng Cao Hiệu Quả Tra Cứu
*Empowering legal consultation and document management with AI for enhanced search efficiency.*

---

## Công Nghệ Sử Dụng

### Frontend
![ReactJS](https://img.shields.io/badge/ReactJS-61DAFB?logo=react&logoColor=white&style=flat-square) 
![ViteJS](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white&style=flat-square) 
![React Router](https://img.shields.io/badge/React_Router-CA4245?logo=react-router&logoColor=white&style=flat-square) 
![Axios](https://img.shields.io/badge/Axios-5A29E4?logo=axios&logoColor=white&style=flat-square)
![CSS Modules](https://img.shields.io/badge/CSS_Modules-000000?logo=css3&logoColor=white&style=flat-square)
![JWT](https://img.shields.io/badge/JWT-000000?logo=jsonwebtokens&logoColor=white&style=flat-square)

### Backend
![NodeJS](https://img.shields.io/badge/NodeJS-339933?logo=nodedotjs&logoColor=white&style=flat-square)
![ExpressJS](https://img.shields.io/badge/ExpressJS-000000?logo=express&logoColor=white&style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white&style=flat-square)
![Nodemailer](https://img.shields.io/badge/Nodemailer-22B573?logo=gmail&logoColor=white&style=flat-square)
![Bcrypt](https://img.shields.io/badge/Bcrypt-003A70?logo=lock&logoColor=white&style=flat-square)

### DevOps & Tools
![Git](https://img.shields.io/badge/Git-F05032?logo=git&logoColor=white&style=flat-square)
![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white&style=flat-square)
![Postman](https://img.shields.io/badge/Postman-FF6C37?logo=postman&logoColor=white&style=flat-square)
![VSCode](https://img.shields.io/badge/VSCode-007ACC?logo=visualstudiocode&logoColor=white&style=flat-square)

### AI & Search (Đang Triển Khai)
![Elasticsearch](https://img.shields.io/badge/Elasticsearch-005571?logo=elasticsearch&logoColor=white&style=flat-square)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?logo=openai&logoColor=white&style=flat-square)

---

## Giới Thiệu Dự Án

**LegAI** là một website tích hợp trí tuệ nhân tạo (AI) nhằm hỗ trợ tra cứu thông tin pháp lý, tư vấn pháp luật, và quản lý hồ sơ pháp lý một cách hiệu quả, nhanh chóng. Dự án được phát triển bởi nhóm sinh viên Trường Đại học Duy Tân, hướng đến việc tối ưu hóa quy trình pháp lý trong thời đại số hóa.

- **Tên dự án**: Website Tư Vấn và Quản Lý Hồ Sơ Pháp Lý Tích Hợp AI Để Nâng Cao Hiệu Quả Tra Cứu  
- **Mã dự án**: LegAI  
- **Thời gian thực hiện**: 17/03/2023 - 15/05/2023  
- **Đơn vị thực hiện**: Khoa Công nghệ Thông tin - Đại học Duy Tân  

---

## Tiến Độ Dự Án Hiện Tại

### Giai Đoạn Hiện Tại: Sprint 3/5 (67% hoàn thành)

#### Đã Hoàn Thành:
- ✅ **Database**: Thiết kế và triển khai cơ sở dữ liệu PostgreSQL với 16 bảng tích hợp ràng buộc khóa ngoại
- ✅ **Backend API**: 
  - Hệ thống xác thực JWT và quản lý phiên làm việc
  - API đăng ký, đăng nhập, quên mật khẩu
  - Endpoints quản lý thông tin người dùng
  - API quản lý cuộc hẹn giữa khách hàng và luật sư
  - Hệ thống gửi email tự động với Nodemailer (8 template khác nhau)
- ✅ **Frontend**: 
  - Các trang: Trang chủ, Đăng nhập/Đăng ký, Danh sách luật sư, Chi tiết luật sư
  - Trang profile người dùng với chức năng cập nhật thông tin, đổi avatar
  - Form đặt lịch hẹn với luật sư
  - Giao diện quản lý lịch hẹn cho khách hàng
  - Giao diện quản lý lịch hẹn cho luật sư
  - Form liên hệ với hệ thống gửi email tự động
- ✅ **Security**: 
  - Mã hóa mật khẩu với bcrypt
  - Xác thực email OTP
  - Bảo vệ route với middleware kiểm tra JWT

#### Đang Triển Khai (Sprint 1): 
- 🔄 **Chat System**:
  - Giao diện chat giữa khách hàng và luật sư (pass)
  - Tích hợp Socket.IO cho giao tiếp thời gian thực
  - Lưu trữ lịch sử chat vào cơ sở dữ liệu (pass)
  - Thông báo tin nhắn mới (process)
- 🔄 **Document Management**:
  - Tải lên và lưu trữ tài liệu pháp lý
  - Phân loại tài liệu theo loại và người dùng
  - API quản lý quyền truy cập tài liệu
  - Xem và tải xuống tài liệu
- 🔄 **Admin Dashboard**:
  - Giao diện quản lý người dùng(pass)
  - Thống kê cơ bản về lịch hẹn và người dùng (pass)
  - Quản lý danh sách luật sư

#### Sắp Triển Khai (Sprint 2):
- ⏳ **AI Integration**:
  - Tích hợp OpenAI API cho tư vấn cơ bản
  - Tích hợp Elasticsearch cho tìm kiếm văn bản pháp luật
  - Phân loại tài liệu tự động dựa trên nội dung
- ⏳ **Payment System**:
  - Tích hợp cổng thanh toán (VNPAY/MoMo)
  - Quản lý hóa đơn và lịch sử thanh toán
  - Khuyến mãi và mã giảm giá
- ⏳ **Contract Management**:
  - Tạo hợp đồng từ template
  - Quản lý trạng thái hợp đồng
  - Tạo PDF cho hợp đồng

---

## Chi Tiết Công Nghệ

### Frontend
- **ReactJS**: Framework JavaScript cho phát triển giao diện người dùng
- **Vite**: Công cụ build nhanh, thay thế cho Create React App
- **React Router v6**: Quản lý định tuyến trong ứng dụng React
- **Axios**: Thư viện HTTP client để gọi API
- **CSS Modules**: Tổ chức và scope CSS cho component
- **react-toastify**: Hiển thị thông báo và cảnh báo
- **date-fns**: Xử lý định dạng ngày tháng
- **jwt-decode**: Giải mã token JWT ở client
- **react-icons**: Thư viện icon cho giao diện

### Backend
- **Node.js**: Môi trường runtime JavaScript phía server
- **Express.js**: Web framework cho Node.js
- **PostgreSQL**: Hệ quản trị cơ sở dữ liệu quan hệ
- **Nodemailer**: Thư viện gửi email từ Node.js
- **Bcrypt**: Mã hóa mật khẩu
- **JWT**: JSON Web Token cho xác thực
- **Multer**: Xử lý upload file
- **pg-promise**: Thư viện kết nối PostgreSQL với Node.js
- **cors**: Middleware xử lý Cross-Origin Resource Sharing
- **dotenv**: Quản lý biến môi trường

### DevOps
- **Git & GitHub**: Quản lý phiên bản và cộng tác
- **ESLint**: Linting JavaScript code
- **Prettier**: Format code
- **Postman**: Testing API endpoints

---

## Vấn Đề Hiện Tại và Kế Hoạch Khắc Phục

### Vấn Đề Đã Xác Định:
1. **UI/UX trên thiết bị di động**: Một số trang chưa hiển thị tốt trên màn hình nhỏ
   - **Kế hoạch**: Áp dụng Media Queries và thiết kế responsive cho tất cả các trang
   - **Deadline**: Sprint 3 (đang thực hiện)

2. **Hiệu suất tải trang**: Một số trang có thời gian tải lâu
   - **Kế hoạch**: Tối ưu hóa việc tải hình ảnh, sử dụng lazy loading, và cải thiện tối ưu hóa bundle
   - **Deadline**: Sprint 4

3. **Lỗi import trong một số module**: Phát hiện lỗi import trong AppointmentsPage.jsx
   - **Kế hoạch**: Đã sửa lỗi import authService, cần kiểm tra lại tất cả các file
   - **Deadline**: Sprint 3 (đã hoàn thành một phần)

### Kế Hoạch Tối Ưu Hóa:
1. **Cải thiện SEO**: Thêm metadata và cấu trúc dữ liệu có cấu trúc
2. **Thực hiện testing**: Viết unit tests và integration tests
3. **Triển khai CI/CD**: Cài đặt GitHub Actions cho tự động hóa quy trình

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

## Hướng Dẫn Cài Đặt

### Yêu Cầu Hệ Thống
- Hệ điều hành: Windows 10+, Ubuntu 20.04+, hoặc MacOS 12+  
- Phần mềm: NodeJS (v16+), PostgreSQL 14+  
- NPM (v8+) hoặc PNPM (v7+)  
- Kết nối Internet  

### Các Bước Cài Đặt

#### 1. Clone Repository
```bash
git clone https://github.com/your-team/legai.git
cd legai
```

#### 2. Cài Đặt Backend
```bash
cd Backend
npm install

# Tạo file .env từ mẫu
cp .env.example .env

# Cập nhật thông tin cấu hình trong .env
# PORT=8000
# DB_HOST=localhost
# DB_USER=your_user
# DB_PASSWORD=your_password
# DB_NAME=legai_db
# DB_PORT=5432
# JWT_SECRET=your_secret_key
# MAIL_HOST=smtp.gmail.com
# MAIL_PORT=587
# MAIL_USER=your-email@gmail.com
# MAIL_PASS=your-app-password
# MAIL_FROM=LegAI <your-email@gmail.com>
# ADMIN_EMAIL=admin@legai.vn

# Khởi tạo cơ sở dữ liệu
npm run migrate
npm run seed  # tùy chọn, tạo dữ liệu mẫu

# Khởi chạy ở chế độ development
npm run dev
```

#### 3. Cài Đặt Frontend
```bash
cd ../Frontend
npm install

# Tạo file .env từ mẫu
cp .env.example .env

# Cập nhật biến môi trường trong .env
# VITE_API_URL=http://localhost:8000/api
# VITE_UPLOAD_URL=http://localhost:8000/uploads

# Khởi chạy ở chế độ development
npm run dev
```

#### 4. Truy Cập Ứng Dụng
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api`
- API Documentation: `http://localhost:8000/api-docs` (nếu đã cài đặt Swagger)

---

## Đóng Góp và Phát Triển
Xem [CONTRIBUTING.md](CONTRIBUTING.md) để biết cách đóng góp vào dự án.

---

## Thành Viên Nhóm và Phân Công

| Họ Tên                | Mã Sinh Viên   | Vai Trò           | Phụ Trách                | Thành Tựu                          |
|-----------------------|----------------|-------------------|--------------------------|-----------------------------------|
| **Huỳnh Văn Quý**     | 27211201995    | Scrum Master      | Backend, Database        | API Endpoints, Database Schema     |
| **Phạm Minh Quân**    | 27211202256    | Product Owner     | Frontend, UI/UX          | React Components, Responsive Design|
| **Trần Kim Thịnh**    | 27211235618    | Developer         | Email System, Frontend,Database   | Email Templates, UI Components     |
| **Lê Hoàng Phúc**     | 27211202366    | Developer         | Backend, API             | Authentication, File Upload Logic  |
| **Nguyễn Ngọc Kỳ Phương** | 27204321839 | Developer       | Testing, Documentation   | Bug Fixes, Documentation           |

**Giảng viên hướng dẫn**: ThS. Lưu Văn Hiền (luuvanhien@dtu.edu.vn, 0779800029)  

---

## Giấy Phép

Dự án sử dụng **MIT License**. Xem file `LICENSE` để biết thêm chi tiết.

---

## Liên Hệ

- **GitHub Repository**: [github.com/your-team/legai](https://github.com/your-team/legai)  
- **Email Dự Án**: legai.project@gmail.com  
- **Người Liên Hệ Chính**: Trần Kim Thịnh, trankimthinh23@gmail.com, 0384160548  

---

Cập nhật cuối: 20/04/2023
