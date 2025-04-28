# LegAI - Hệ thống trợ lý pháp lý sử dụng RAG với Qwen2.5

Hệ thống trợ lý pháp lý thông minh sử dụng mô hình Qwen2.5 (3B) kết hợp với kỹ thuật RAG (Retrieval-Augmented Generation) để trả lời các câu hỏi pháp lý dựa trên dữ liệu pháp luật Việt Nam.

## Tính năng chính

- Trả lời câu hỏi pháp lý bằng tiếng Việt dựa trên dữ liệu pháp luật chính thống
- Sử dụng kỹ thuật RAG để cải thiện độ chính xác của câu trả lời
- Hỗ trợ tìm kiếm và truy xuất thông tin từ cơ sở dữ liệu luật, câu hỏi thường gặp và bài viết pháp lý
- Tối ưu hóa cho phần cứng phổ thông (chỉ cần khoảng 4-6GB VRAM)

## Yêu cầu hệ thống

- Node.js (>= 14.0.0)
- Ollama đã cài đặt và chạy (với mô hình Qwen2.5 3B)
- RAM: tối thiểu 8GB
- VRAM: 4-6GB (nếu sử dụng GPU)

## Cài đặt

1. **Cài đặt Ollama và mô hình Qwen2.5**

2. **Clone repository và cài đặt dependencies**

```bash
git clone <repository-url>
cd legai/backend
npm install
```

3. **Chuẩn bị dữ liệu**

Đảm bảo file `src/data/legal_data.json` chứa dữ liệu pháp luật đúng định dạng. File mẫu đã được cung cấp trong repository.

## Chạy ứng dụng

1. **Chạy Ollama**

```bash
# Chạy Ollama server ở một terminal riêng
ollama serve
```

2. **Chạy backend**

```bash
# Khởi động server trong chế độ development
npm run dev

# Hoặc trong chế độ production
npm start
```

Server sẽ chạy ở địa chỉ `http://localhost:8000` theo mặc định.

## API Endpoints

### Trả lời câu hỏi

**Request:**
```
POST /api/ai/ask
Content-Type: application/json

{
  "question": "Thủ tục đăng ký kết hôn tại Việt Nam là gì?",
  "options": {
    "temperature": 0.3,
    "topK": 5
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "answer": "Theo Luật Hôn nhân và Gia đình 2014, thủ tục đăng ký kết hôn tại Việt Nam bao gồm các bước sau:\n\n1. Nam, nữ chuẩn bị hồ sơ gồm: Tờ khai đăng ký kết hôn theo mẫu quy định, giấy tờ tùy thân (CMND/CCCD/Hộ chiếu), giấy xác nhận tình trạng hôn nhân nếu cần thiết.\n\n2. Nộp hồ sơ tại UBND cấp xã nơi cư trú của một trong hai bên.\n\n3. Sau khi kiểm tra đủ điều kiện kết hôn theo quy định (nam từ đủ 20 tuổi trở lên, nữ từ đủ 18 tuổi trở lên; tự nguyện; không bị mất năng lực hành vi dân sự; không thuộc các trường hợp cấm kết hôn), cơ quan đăng ký hộ tịch sẽ tổ chức đăng ký kết hôn.\n\n4. Hai bên nam nữ phải có mặt, ký tên vào Sổ đăng ký kết hôn.\n\n5. Cơ quan đăng ký hộ tịch trao Giấy chứng nhận kết hôn cho hai bên.\n\nLưu ý: Việc đăng ký kết hôn tại Việt Nam không phải nộp lệ phí.",
    "documents": [
      {
        "id": "law-1-chunk-0",
        "type": "law",
        "title": "Luật Hôn nhân và Gia đình 2014",
        "originalId": 1
      },
      {
        "id": "faq-1",
        "type": "faq",
        "title": "Thủ tục đăng ký kết hôn tại Việt Nam?",
        "originalId": 1
      }
    ]
  }
}
```

### Kiểm tra trạng thái AI

**Request:**
```
GET /api/ai/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ollamaConnected": true,
    "modelName": "qwen2.5:3b",
    "vectorStoreReady": true
  }
}
```

### Tải lại vector store (Admin)

**Request:**
```
POST /api/ai/reload
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Đã tải lại vector store thành công"
}
```

## Cấu trúc dữ liệu

File `legal_data.json` có cấu trúc sau:

```json
{
  "laws": [
    { "id": 1, "title": "Luật Hôn nhân và Gia đình 2014", "content": "..." }
  ],
  "faqs": [
    { "id": 1, "question": "Thủ tục ly hôn?", "answer": "..." }
  ],
  "articles": [
    { "id": 1, "title": "Hướng dẫn đăng ký kinh doanh", "content": "..." }
  ]
}
```

## Tùy chỉnh

Có thể tùy chỉnh các thông số của hệ thống trong các file sau:

- `src/services/ragService.js`: Tùy chỉnh kích thước chunk, kích thước vector, số lượng kết quả trả về...
- `src/services/ollamaService.js`: Tùy chỉnh prompt, nhiệt độ (temperature), top_k, top_p...

## Ghi chú

- Hệ thống sử dụng mô hình embedding `Xenova/multilingual-e5-small` để hỗ trợ tốt tiếng Việt
- Khi khởi động lần đầu, quá trình tạo vector store có thể mất vài phút 