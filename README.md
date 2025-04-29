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
![Ant Design](https://img.shields.io/badge/Ant_Design-0170FE?logo=antdesign&logoColor=white&style=flat-square)

### Backend
![NodeJS](https://img.shields.io/badge/NodeJS-339933?logo=nodedotjs&logoColor=white&style=flat-square)
![ExpressJS](https://img.shields.io/badge/ExpressJS-000000?logo=express&logoColor=white&style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white&style=flat-square)
![Nodemailer](https://img.shields.io/badge/Nodemailer-22B573?logo=gmail&logoColor=white&style=flat-square)
![Bcrypt](https://img.shields.io/badge/Bcrypt-003A70?logo=lock&logoColor=white&style=flat-square)
![Multer](https://img.shields.io/badge/Multer-FF6C37?logo=javascript&logoColor=white&style=flat-square)

### AI & Search
![Qwen2.5](https://img.shields.io/badge/Qwen2.5-00599C?logo=ai&logoColor=white&style=flat-square)
![RAG](https://img.shields.io/badge/RAG-412991?logo=ai&logoColor=white&style=flat-square)
![Ollama](https://img.shields.io/badge/Ollama-00C244?logo=openai&logoColor=white&style=flat-square)
![ChromaDB](https://img.shields.io/badge/ChromaDB-40AEF0?logo=database&logoColor=white&style=flat-square)

### DevOps & Tools
![Git](https://img.shields.io/badge/Git-F05032?logo=git&logoColor=white&style=flat-square)
![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white&style=flat-square)
![Postman](https://img.shields.io/badge/Postman-FF6C37?logo=postman&logoColor=white&style=flat-square)
![VSCode](https://img.shields.io/badge/VSCode-007ACC?logo=visualstudiocode&logoColor=white&style=flat-square)

---

## Giới Thiệu Dự Án

**LegAI** là một hệ thống trợ lý pháp lý thông minh được phát triển nhằm hỗ trợ người dùng trong lĩnh vực pháp lý tại Việt Nam. Dự án kết hợp công nghệ AI với cơ sở dữ liệu pháp luật Việt Nam để cung cấp các dịch vụ như tư vấn pháp lý, soạn thảo văn bản pháp lý, và quản lý vụ án.

- **Tên dự án**: Website Tư Vấn và Quản Lý Hồ Sơ Pháp Lý Tích Hợp AI Để Nâng Cao Hiệu Quả Tra Cứu  
- **Mã dự án**: LegAI  
- **Đơn vị thực hiện**: Khoa Công nghệ Thông tin - Đại học Duy Tân  

---

## Tiến Độ Dự Án Hiện Tại

### Giai Đoạn Hiện Tại: Sprint 4/5 (85% hoàn thành)

#### Đã Hoàn Thành:
- ✅ **Database**: Thiết kế và triển khai cơ sở dữ liệu với ràng buộc khóa ngoại
- ✅ **Backend API**: 
  - Hệ thống xác thực JWT và quản lý phiên làm việc
  - API đăng ký, đăng nhập, quên mật khẩu
  - Endpoints quản lý thông tin người dùng
  - API quản lý cuộc hẹn giữa khách hàng và luật sư
  - Hệ thống gửi email tự động với Nodemailer (8 template khác nhau)
  - API tạo và quản lý vụ án pháp lý
  - API tải lên và quản lý tài liệu liên quan đến vụ án
  - API tính phí dịch vụ pháp lý
  - API tạo bản nháp văn bản sử dụng AI
- ✅ **Frontend**: 
  - Các trang: Trang chủ, Đăng nhập/Đăng ký, Danh sách luật sư, Chi tiết luật sư
  - Trang profile người dùng với chức năng cập nhật thông tin, đổi avatar
  - Form đặt lịch hẹn với luật sư
  - Giao diện quản lý lịch hẹn cho khách hàng và luật sư
  - Form liên hệ với hệ thống gửi email tự động
  - Giao diện quản lý vụ án (danh sách, tạo mới, chi tiết, chỉnh sửa)
  - Tích hợp AI để soạn thảo văn bản pháp lý
  - Hệ thống quản lý tài liệu (upload, download)
- ✅ **AI Integration**:
  - Tích hợp mô hình Qwen2.5 (3B) AI Localhost
  - Kỹ thuật RAG (Retrieval-Augmented Generation) để cải thiện độ chính xác câu trả lời
  - Soạn thảo văn bản pháp lý với AI
- ✅ **Security**: 
  - Mã hóa mật khẩu với bcrypt
  - Xác thực email OTP
  - Bảo vệ route với middleware kiểm tra JWT

#### Đang Triển Khai (Sprint 4): 
- 🔄 **Payment System**:
  - Tích hợp cổng thanh toán
  - Quản lý hóa đơn và lịch sử thanh toán
  - Giao diện xác nhận thanh toán
- 🔄 **Admin Dashboard**:
  - Giao diện quản lý người dùng
  - Thống kê cơ bản về lịch hẹn và người dùng
  - Quản lý danh sách luật sư
  - Báo cáo doanh thu và phân tích
- 🔄 **Responsive Design**:
  - Tối ưu hóa giao diện trên các thiết bị di động
  - Cải thiện trải nghiệm người dùng trên điện thoại và máy tính bảng

#### Sắp Triển Khai (Sprint 5):
- ⏳ **Advanced Search**:
  - Tìm kiếm nâng cao các văn bản pháp lý
  - Tìm kiếm dựa trên ngữ nghĩa (semantic search)
- ⏳ **Multi-language Support**:
  - Hỗ trợ Tiếng Anh cho người dùng quốc tế
  - Chuyển đổi ngôn ngữ trong giao diện
- ⏳ **Performance Optimization**:
  - Tối ưu hóa thời gian tải trang
  - Cải thiện hiệu suất ứng dụng

---

## Chi Tiết Công Nghệ Mới Nhất

### Frontend
- **ReactJS**: Framework JavaScript cho phát triển giao diện người dùng
- **Vite**: Công cụ build nhanh, thay thế cho Create React App
- **React Router v6**: Quản lý định tuyến trong ứng dụng React
- **Ant Design**: Thư viện UI components chuyên nghiệp
- **CSS Modules**: Tổ chức và scope CSS cho component
- **Axios**: Thư viện HTTP client để gọi API
- **react-toastify**: Hiển thị thông báo và cảnh báo
- **date-fns**: Xử lý định dạng ngày tháng
- **jwt-decode**: Giải mã token JWT ở client

### Backend
- **Node.js**: Môi trường runtime JavaScript phía server
- **Express.js**: Web framework cho Node.js
- **PostgreSQL**: Hệ quản trị cơ sở dữ liệu quan hệ
- **JWT**: JSON Web Token cho xác thực
- **Multer**: Xử lý upload file
- **Bcrypt**: Mã hóa mật khẩu
- **Nodemailer**: Thư viện gửi email từ Node.js
- **Ollama**: Triển khai mô hình AI cục bộ
- **Qwen2.5 (3B)**: Mô hình ngôn ngữ lớn cho xử lý ngôn ngữ tự nhiên
- **ChromaDB**: Vector database cho kỹ thuật RAG
- **RAG**: Kỹ thuật Retrieval-Augmented Generation

### DevOps
- **Git & GitHub**: Quản lý phiên bản và cộng tác
- **ESLint**: Linting JavaScript code
- **Prettier**: Format code
- **Postman**: Testing API endpoints

---

## Cấu Trúc Dự Án Mới

Dự án được chia thành hai phần chính:

### 1. Backend (Node.js/Express)
- **Cấu trúc thư mục**:
  ```
  Backend/
  ├── src/
  │   ├── config/        # Cấu hình ứng dụng
  │   ├── controllers/   # Xử lý logic nghiệp vụ
  │   ├── middleware/    # Middleware (auth, upload, validation)
  │   ├── models/        # Mô hình dữ liệu và schema
  │   ├── routes/        # API routes
  │   ├── services/      # Logic nghiệp vụ
  │   │   ├── ragService.js    # Dịch vụ RAG
  │   │   ├── ollamaService.js # Kết nối với Ollama
  │   │   └── ...
  │   ├── data/          # Dữ liệu pháp lý
  │   ├── utils/         # Tiện ích
  │   └── app.js         # Entry point
  ├── uploads/           # Thư mục lưu tài liệu upload
  ├── migrations/        # Database migrations
  └── ...
  ```

### 2. Frontend (React/Vite)
- **Cấu trúc thư mục**:
  ```
  Frontend/
  ├── src/
  │   ├── assets/        # Tài nguyên tĩnh (hình ảnh, fonts)
  │   ├── components/    # Components tái sử dụng
  │   │   ├── layout/    # Components bố cục (Header, Footer, Navbar)
  │   │   └── ...
  │   ├── pages/         # Các trang
  │   │   ├── Home/      # Trang chủ
  │   │   ├── LegalCase/ # Trang quản lý vụ án
  │   │   └── ...
  │   ├── router/        # Cấu hình định tuyến
  │   ├── services/      # Gọi API
  │   ├── store/         # Quản lý trạng thái
  │   ├── styles/        # CSS toàn cục
  │   ├── hooks/         # React hooks
  │   ├── utils/         # Tiện ích
  │   ├── App.jsx        # Component App
  │   └── main.jsx       # Entry point
  └── ...
  ```

---

## Tính Năng Chính (Cập Nhật)

1. **Quản Lý Vụ Án Pháp Lý**
   - Tạo và quản lý vụ án
   - Tải lên tài liệu liên quan
   - Phân loại và tìm kiếm vụ án
   - Xem chi tiết và cập nhật trạng thái vụ án

2. **Soạn Thảo AI**
   - Sử dụng AI để soạn thảo văn bản pháp lý
   - Dựa trên mẫu văn bản và yêu cầu của người dùng
   - Hỗ trợ nhiều loại văn bản pháp lý khác nhau

3. **Tư Vấn Pháp Lý**
   - Kết nối người dùng với luật sư
   - Tính toán và quản lý phí dịch vụ
   - Thanh toán trực tuyến
   - Đánh giá và xếp hạng luật sư

4. **Quản Lý Tài Liệu**
   - Tải lên và quản lý tài liệu pháp lý
   - Xem và tải xuống tài liệu
   - Phân loại và tổ chức tài liệu

5. **Tra Cứu Pháp Luật**
   - Tìm kiếm thông tin pháp luật
   - Xem và so sánh văn bản pháp luật
   - Hỏi đáp với AI về vấn đề pháp lý

---

## Hướng Dẫn Cài Đặt (Cập Nhật)

### Yêu Cầu Hệ Thống
- NodeJS (>= 14.0.0)
- Ollama đã cài đặt và chạy với mô hình Qwen2.5 3B
- RAM: tối thiểu 8GB
- VRAM: 4-6GB (nếu sử dụng GPU)

### Các Bước Cài Đặt

#### 1. Cài Đặt Ollama và Mô Hình Qwen2.5
```bash
# Tải và cài đặt Ollama từ https://ollama.ai/
# Chạy Ollama server
ollama serve

# Tải mô hình Qwen2.5 (3B)
ollama pull qwen2.5:3b
```

#### 2. Cài Đặt Backend
```bash
cd LegAI/Backend
npm install

# Tạo file .env từ mẫu và cập nhật thông tin cấu hình
cp .env.example .env

# Khởi tạo database
npm run migrate

# Chạy ứng dụng trong chế độ development
npm run dev
```

#### 3. Cài Đặt Frontend
```bash
cd LegAI/Frontend
npm install

# Tạo file .env từ mẫu và cập nhật thông tin cấu hình
cp .env.example .env

# Chạy ứng dụng trong chế độ development
npm run dev
```

#### 4. Truy Cập Ứng Dụng
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api`

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

## Liên Hệ

- **GitHub Repository**: [github.com/your-team/legai](https://github.com/your-team/legai)  
- **Email Dự Án**: legai.project@gmail.com  
- **Người Liên Hệ Chính**: Trần Kim Thịnh, trankimthinh23@gmail.com, 0384160548  

---

Cập nhật cuối: 15/05/2023
