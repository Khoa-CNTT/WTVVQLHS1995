// Import required modules
const userLegalDocModel = require('../models/userLegalDocModel');
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { promisify } = require('util');
const asyncHandler = require('../middleware/async');
const pdfParse = require('pdf-parse');
const textract = require('textract');
const {pipeline} = require('stream');
const pump = promisify(pipeline);

// Cấu hình lưu trữ file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'legal-docs');
        // Tạo thư mục nếu chưa tồn tại
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Tạo tên file ngẫu nhiên để tránh trùng lặp
        const randomName = crypto.randomBytes(16).toString('hex');
        const fileExt = path.extname(file.originalname);
        cb(null, `${Date.now()}-${randomName}${fileExt}`);
    }
});

// Hàm kiểm tra loại file
const fileFilter = (req, file, cb) => {
    // Danh sách các loại file được phép
    const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Loại file không được hỗ trợ. Vui lòng tải lên PDF, DOCX, DOC, JPG, PNG, GIF, XLSX, XLS hoặc TXT.'), false);
    }
};

// Cấu hình upload
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

// Hàm mã hóa file
const encryptFile = async (filePath, key) => {
    try {
        const fileContent = fs.readFileSync(filePath);
        const algorithm = 'aes-256-cbc';
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);
        
        const encrypted = Buffer.concat([iv, cipher.update(fileContent), cipher.final()]);
        
        // Ghi đè file gốc bằng dữ liệu đã mã hóa
        fs.writeFileSync(filePath, encrypted);
        
        return true;
    } catch (error) {
        console.error('Lỗi khi mã hóa file:', error);
        return false;
    }
};

// Hàm giải mã file
const decryptFile = async (filePath, key) => {
    try {
        const encryptedData = fs.readFileSync(filePath);
        const algorithm = 'aes-256-cbc';
        const iv = encryptedData.slice(0, 16);
        const encryptedContent = encryptedData.slice(16);
        
        const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), iv);
        const decrypted = Buffer.concat([decipher.update(encryptedContent), decipher.final()]);
        
        // Trả về buffer đã giải mã, không ghi đè file gốc
        return decrypted;
    } catch (error) {
        console.error('Lỗi khi giải mã file:', error);
        throw new Error('Không thể giải mã file. File có thể bị hỏng hoặc key không đúng.');
    }
};

// Hàm trích xuất text từ PDF
const extractTextFromPDF = async (buffer) => {
    try {
        const data = await pdfParse(buffer);
        return data.text;
    } catch (error) {
        console.error('Lỗi khi trích xuất text từ PDF:', error);
        return null;
    }
};

// Hàm trích xuất text từ DOCX
const extractTextFromDOCX = async (filePath) => {
    try {
        return new Promise((resolve, reject) => {
            textract.fromFileWithPath(filePath, (error, text) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(text);
            });
        });
    } catch (error) {
        console.error('Lỗi khi trích xuất text từ DOCX:', error);
        return null;
    }
};

// API endpoint để lấy danh sách hồ sơ pháp lý của người dùng
const getUserDocs = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { page, limit, category, search, sortBy, sortOrder } = req.query;
    
    const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        category: category || null,
        search: search || null,
        sortBy: sortBy || 'created_at',
        sortOrder: (sortOrder && sortOrder.toUpperCase() === 'ASC') ? 'ASC' : 'DESC'
    };
    
    const result = await userLegalDocModel.getUserLegalDocs(userId, options);
    
    res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
    });
});

// API endpoint để lấy thông tin chi tiết của hồ sơ pháp lý
const getDocById = asyncHandler(async (req, res) => {
    const docId = req.params.id;
    const userId = req.user.id;
    
    const doc = await userLegalDocModel.getLegalDocById(docId, userId);
    
    if (!doc) {
        return res.status(404).json({
            success: false,
            message: 'Hồ sơ pháp lý không tồn tại hoặc bạn không có quyền truy cập'
        });
    }
    
    res.status(200).json({
        success: true,
        data: doc
    });
});

// API endpoint để tải lên hồ sơ pháp lý mới
const uploadDoc = asyncHandler(async (req, res) => {
    // Middleware multer đã được xử lý, file đã được lưu và thông tin nằm trong req.file
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng chọn file để tải lên'
        });
    }
    
    const { title, description, category, tags } = req.body;
    const userId = req.user.id;
    
    // Kiểm tra các trường bắt buộc
    if (!title || !category) {
        // Xóa file đã upload nếu thông tin không hợp lệ
        fs.unlinkSync(req.file.path);
        
        return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp tiêu đề và danh mục cho hồ sơ'
        });
    }
    
    const fileType = path.extname(req.file.originalname).substring(1);
    const fileUrl = `/uploads/legal-docs/${req.file.filename}`;
    
    // Parse tags từ chuỗi JSON nếu có
    let parsedTags = [];
    if (tags) {
        try {
            parsedTags = JSON.parse(tags);
        } catch (error) {
            // Nếu không phải JSON array, xem như một chuỗi và tách theo dấu phẩy
            parsedTags = tags.split(',').map(tag => tag.trim());
        }
    }
    
    // Tạo metadata ban đầu
    const metadata = {
        original_name: req.file.originalname,
        mime_type: req.file.mimetype,
        analyzed: false
    };
    
    // Trích xuất text từ file nếu có thể
    let extractedText = null;
    
    try {
        if (req.file.mimetype === 'application/pdf') {
            const buffer = fs.readFileSync(req.file.path);
            extractedText = await extractTextFromPDF(buffer);
        } else if (['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'].includes(req.file.mimetype)) {
            extractedText = await extractTextFromDOCX(req.file.path);
        } else if (req.file.mimetype === 'text/plain') {
            extractedText = fs.readFileSync(req.file.path, 'utf8');
        }
        
        if (extractedText) {
            metadata.extracted_text = extractedText.substring(0, 1000); // Lưu 1000 ký tự đầu tiên
            
            // Thêm tags tự động từ text (đơn giản là lấy 5 từ dài nhất)
            if (parsedTags.length === 0) {
                const words = extractedText
                    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
                    .replace(/\s{2,}/g, ' ')
                    .split(' ')
                    .filter(word => word.length > 3)
                    .map(word => word.toLowerCase())
                    .filter((value, index, self) => self.indexOf(value) === index); // Loại bỏ trùng lặp
                
                // Lấy 5 từ dài nhất
                parsedTags = words
                    .sort((a, b) => b.length - a.length)
                    .slice(0, 5);
            }
        }
    } catch (error) {
        console.error('Lỗi khi trích xuất text:', error);
        // Không dừng quá trình, chỉ bỏ qua phần trích xuất text
    }
    
    // Chuẩn bị dữ liệu cho hồ sơ
    const docData = {
        user_id: userId,
        title,
        description: description || title,
        category,
        file_type: fileType,
        file_url: fileUrl,
        file_size: req.file.size,
        is_encrypted: true, // Mặc định mã hóa
        access_level: 'private', // Mặc định private
        metadata,
        tags: parsedTags
    };
    
    // Lưu thông tin vào database
    const newDoc = await userLegalDocModel.createLegalDoc(docData);
    
    // Mã hóa file sau khi đã lưu thông tin vào database
    if (newDoc.is_encrypted && newDoc.encryption_key) {
        await encryptFile(req.file.path, newDoc.encryption_key);
    }
    
    res.status(201).json({
        success: true,
        data: newDoc,
        message: 'Đã tải lên hồ sơ pháp lý thành công'
    });
});

// API endpoint để cập nhật thông tin hồ sơ pháp lý
const updateDoc = asyncHandler(async (req, res) => {
    const docId = req.params.id;
    const userId = req.user.id;
    
    // Lấy dữ liệu cập nhật từ body
    const { title, description, category, tags, access_level } = req.body;
    
    // Chuẩn bị dữ liệu cập nhật
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (access_level) updateData.access_level = access_level;
    
    // Xử lý tags nếu có
    if (tags) {
        try {
            updateData.tags = Array.isArray(tags) ? tags : JSON.parse(tags);
        } catch (error) {
            // Nếu không phải JSON array, xem như một chuỗi và tách theo dấu phẩy
            updateData.tags = tags.split(',').map(tag => tag.trim());
        }
    }
    
    // Thực hiện cập nhật
    try {
        const updatedDoc = await userLegalDocModel.updateLegalDoc(docId, userId, updateData);
        
        res.status(200).json({
            success: true,
            data: updatedDoc,
            message: 'Đã cập nhật hồ sơ pháp lý thành công'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// API endpoint để xóa hồ sơ pháp lý
const deleteDoc = asyncHandler(async (req, res) => {
    const docId = req.params.id;
    const userId = req.user.id;
    
    try {
        const result = await userLegalDocModel.deleteLegalDoc(docId, userId);
        
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// API endpoint để tải xuống hồ sơ pháp lý
const downloadDoc = asyncHandler(async (req, res) => {
    const docId = req.params.id;
    const userId = req.user.id;
    
    // Lấy thông tin hồ sơ
    const doc = await userLegalDocModel.getLegalDocById(docId, userId);
    
    if (!doc) {
        return res.status(404).json({
            success: false,
            message: 'Hồ sơ pháp lý không tồn tại hoặc bạn không có quyền truy cập'
        });
    }
    
    // Chuyển đổi URL thành đường dẫn thực
    const relativePath = doc.file_url.replace(/^\/uploads\//, '');
    const filePath = path.join(process.cwd(), 'uploads', relativePath);
    
    // Kiểm tra file có tồn tại không
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            success: false,
            message: 'File không tồn tại trên hệ thống'
        });
    }
    
    // Tạo tên file khi tải xuống dựa trên tên gốc và định dạng
    const originalName = doc.metadata && doc.metadata.original_name 
        ? doc.metadata.original_name 
        : `${doc.title}.${doc.file_type}`;
    
    // Xác định đúng Content-Type dựa trên MIME type
    const contentType = doc.metadata && doc.metadata.mime_type 
        ? doc.metadata.mime_type 
        : getMimeTypeByExtension(doc.file_type);
    
    // Nếu file được mã hóa, giải mã trước khi gửi
    if (doc.is_encrypted && doc.encryption_key) {
        try {
            const decryptedBuffer = await decryptFile(filePath, doc.encryption_key);
            
            // Đặt header
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`);
            
            // Trả về buffer đã giải mã
            return res.send(decryptedBuffer);
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Không thể giải mã file. Vui lòng liên hệ quản trị viên.'
            });
        }
    }
    
    // Nếu file không được mã hóa, trả về file trực tiếp
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`);
    res.download(filePath, originalName);
});

// Hàm hỗ trợ lấy MIME type từ extension
const getMimeTypeByExtension = (extension) => {
    const mimeTypes = {
        'pdf': 'application/pdf',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'doc': 'application/msword',
        'txt': 'text/plain',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'xls': 'application/vnd.ms-excel'
    };
    
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
};

// API endpoint để lấy danh sách các danh mục
const getCategories = asyncHandler(async (req, res) => {
    const categories = await userLegalDocModel.getLegalDocCategories();
    
    res.status(200).json({
        success: true,
        data: categories
    });
});

// API endpoint để chia sẻ hồ sơ pháp lý
const shareDoc = asyncHandler(async (req, res) => {
    const docId = req.params.id;
    const userId = req.user.id; // Người chia sẻ
    
    const { shared_with, permissions, access_type, valid_until } = req.body;
    
    console.log('Dữ liệu nhận được từ request:', req.body);
    
    // Kiểm tra đã có shared_with chưa
    if (!shared_with) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp ID người dùng được chia sẻ'
        });
    }
    
    // Xác định quyền truy cập từ nhiều nguồn có thể có
    let permissionsArray = [];
    
    // Nếu có access_type, ưu tiên sử dụng nó (cách mới)
    if (access_type) {
        console.log('Sử dụng access_type:', access_type);
        permissionsArray = [access_type]; // Chỉ sử dụng một quyền từ access_type
    }
    // Nếu có permissions array, sử dụng nó (cách cũ)
    else if (Array.isArray(permissions) && permissions.length > 0) {
        console.log('Sử dụng permissions array:', permissions);
        permissionsArray = permissions;
    }
    // Trường hợp không có quyền hợp lệ
    else {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp quyền truy cập (access_type hoặc permissions)'
        });
    }
    
    // Kiểm tra các loại quyền hợp lệ
    const validPermissions = ['read', 'edit', 'delete'];
    const isValidPermissions = permissionsArray.every(p => validPermissions.includes(p));
    
    if (!isValidPermissions) {
        return res.status(400).json({
            success: false,
            message: 'Các quyền không hợp lệ. Chỉ chấp nhận: read, edit, delete'
        });
    }
    
    try {
        // Kiểm tra xem người dùng shared_with có tồn tại không
        const userCheck = await pool.query('SELECT id FROM Users WHERE id = $1', [shared_with]);
        
        if (userCheck.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Người dùng được chia sẻ không tồn tại trong hệ thống'
            });
        }
        
        // Xử lý ngày hết hạn nếu có
        let parsedValidUntil = null;
        if (valid_until) {
            parsedValidUntil = new Date(valid_until);
            
            if (isNaN(parsedValidUntil.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Định dạng ngày hết hạn không hợp lệ'
                });
            }
        }
        
        console.log('Gọi model shareLegalDoc với:', {
            docId, userId, shared_with, permissions: permissionsArray, parsedValidUntil
        });
        
        const result = await userLegalDocModel.shareLegalDoc(
            docId, 
            userId, 
            shared_with, 
            permissionsArray, 
            parsedValidUntil
        );
        
        res.status(200).json(result);
    } catch (error) {
        console.error('Lỗi khi chia sẻ hồ sơ:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// API endpoint để hủy chia sẻ hồ sơ pháp lý
const unshareDoc = asyncHandler(async (req, res) => {
    const docId = req.params.id;
    const userId = req.user.id; // Người sở hữu
    const { user_id } = req.body; // ID người dùng bị hủy chia sẻ
    
    if (!user_id) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp ID người dùng cần hủy chia sẻ'
        });
    }
    
    try {
        const result = await userLegalDocModel.unshareDoc(docId, userId, user_id);
        
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// API endpoint để phân tích hồ sơ với AI
const analyzeDoc = asyncHandler(async (req, res) => {
    const docId = req.params.id;
    const userId = req.user.id;
    
    // Lấy thông tin hồ sơ
    const doc = await userLegalDocModel.getLegalDocById(docId, userId);
    
    if (!doc) {
        return res.status(404).json({
            success: false,
            message: 'Hồ sơ pháp lý không tồn tại hoặc bạn không có quyền truy cập'
        });
    }
    
    // Chuyển đổi URL thành đường dẫn thực
    const relativePath = doc.file_url.replace(/^\/uploads\//, '');
    const filePath = path.join(process.cwd(), 'uploads', relativePath);
    
    // Kiểm tra file có tồn tại không
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            success: false,
            message: 'File không tồn tại trên hệ thống'
        });
    }
    
    try {
        // Nếu file được mã hóa, giải mã trước khi phân tích
        let extractedText = null;
        
        if (doc.is_encrypted && doc.encryption_key) {
            const decryptedBuffer = await decryptFile(filePath, doc.encryption_key);
            
            // Trích xuất text từ buffer
            if (doc.file_type === 'pdf') {
                extractedText = await extractTextFromPDF(decryptedBuffer);
            } else if (['docx', 'doc'].includes(doc.file_type)) {
                // Lưu tạm file đã giải mã để textract có thể đọc
                const tempPath = path.join(process.cwd(), 'uploads', 'temp', `temp-${Date.now()}.${doc.file_type}`);
                
                // Tạo thư mục temp nếu chưa tồn tại
                if (!fs.existsSync(path.dirname(tempPath))) {
                    fs.mkdirSync(path.dirname(tempPath), { recursive: true });
                }
                
                fs.writeFileSync(tempPath, decryptedBuffer);
                extractedText = await extractTextFromDOCX(tempPath);
                
                // Xóa file tạm sau khi đã trích xuất
                fs.unlinkSync(tempPath);
            } else if (doc.file_type === 'txt') {
                extractedText = decryptedBuffer.toString('utf8');
            } else if (['jpg', 'jpeg', 'png', 'gif'].includes(doc.file_type)) {
                // Thông báo không hỗ trợ phân tích hình ảnh
                return res.status(400).json({
                    success: false,
                    message: 'Không hỗ trợ phân tích file hình ảnh. Vui lòng chuyển đổi sang định dạng PDF hoặc DOCX.'
                });
            }
        } else {
            // Nếu file không được mã hóa, đọc trực tiếp
            if (doc.file_type === 'pdf') {
                const buffer = fs.readFileSync(filePath);
                extractedText = await extractTextFromPDF(buffer);
            } else if (['docx', 'doc'].includes(doc.file_type)) {
                extractedText = await extractTextFromDOCX(filePath);
            } else if (doc.file_type === 'txt') {
                extractedText = fs.readFileSync(filePath, 'utf8');
            } else if (['jpg', 'jpeg', 'png', 'gif'].includes(doc.file_type)) {
                // Thông báo không hỗ trợ phân tích hình ảnh
                return res.status(400).json({
                    success: false,
                    message: 'Không hỗ trợ phân tích file hình ảnh. Vui lòng chuyển đổi sang định dạng PDF hoặc DOCX.'
                });
            }
        }

        // Kiểm tra xem có trích xuất được text không
        if (!extractedText) {
            return res.status(400).json({
                success: false,
                message: 'Không thể trích xuất nội dung từ file'
            });
        }
        
        // Tích hợp với Ollama API để phân tích nội dung
        const ollamaService = require('../services/ollamaService');
        
        // Thiết lập tiền xử lý kết quả từ AI để đảm bảo có JSON
        const fallbackResponse = {
            summary: `Tài liệu "${doc.title}" thuộc danh mục ${doc.category || 'chưa phân loại'}.`,
            keywords: [],
            document_type: doc.category ? `Tài liệu ${doc.category}` : "Tài liệu văn bản",
            entities: [
                {"text": doc.title, "type": "Tên tài liệu"},
                {"text": new Date(doc.created_at).toLocaleDateString('vi-VN'), "type": "Ngày tạo"}
            ],
            recommendations: `Nghiên cứu kỹ nội dung của tài liệu này. Tham khảo ý kiến chuyên gia trong lĩnh vực ${doc.category || 'pháp lý'} nếu cần thêm thông tin.`
        };
        
        console.log(`Bắt đầu phân tích hồ sơ ID: ${docId} của người dùng ID: ${userId}`);
        
        try {
            // Chuẩn bị prompt cho AI - cải tiến để tăng khả năng thành công
            const prompt = `Phân tích dữ liệu từ tài liệu sau và trả về kết quả ở định dạng JSON (và chỉ JSON, không có gì khác).

Tài liệu: "${doc.title}" 
Loại file: ${doc.file_type}
Danh mục: ${doc.category || 'Không xác định'}

Nội dung: 
${extractedText.substring(0, 4000)}

Định dạng JSON cần trả về:
{
  "summary": "Tóm tắt chi tiết về nội dung văn bản, bao gồm các điểm chính, thông tin quan trọng và bối cảnh. Tóm tắt phải đầy đủ, dài ít nhất 200-300 từ và có cấu trúc tốt.",
  "keywords": ["từ khóa 1", "từ khóa 2", "từ khóa 3", "từ khóa 4", "từ khóa 5"],
  "document_type": "Loại văn bản",
  "entities": [
    {"text": "Tên thực thể", "type": "Loại thực thể"}
  ],
  "recommendations": "Đề xuất chi tiết dựa trên nội dung, đưa ra ít nhất 3-5 đề xuất cụ thể"
}

QUAN TRỌNG: 
- KHÔNG TRẢ LỜI BẰNG VĂN BẢN
- KHÔNG SỬ DỤNG MARKDOWN
- KHÔNG DÙNG DẤU BACKTICK
- CHỈ TRẢ VỀ JSON HỢP LỆ`;
            
            // Gọi Ollama API với nhiệt độ thấp
            const aiResponse = await ollamaService.generateResponse(prompt, [], {
                temperature: 0.1,
                max_tokens: 1024
            });
            
            console.log('Nhận được phản hồi từ AI, bắt đầu xử lý...');
            
            // Xử lý phản hồi từ AI
            let aiAnalysis;
            try {
                // Phát hiện phần JSON trong phản hồi
                const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                                  aiResponse.match(/```\s*([\s\S]*?)\s*```/) ||
                                  aiResponse.match(/\{[\s\S]*\}/);
                                  
                if (!jsonMatch) {
                    console.error('Không tìm thấy JSON trong phản hồi AI:', aiResponse);
                    throw new Error('Không tìm thấy JSON trong phản hồi');
                }
                
                const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : aiResponse;
                console.log('Đã trích xuất JSON:', jsonStr.substring(0, 100) + '...');
                
                try {
                    aiAnalysis = JSON.parse(jsonStr);
                    console.log('Phân tích JSON thành công');
                } catch (jsonError) {
                    console.error('Lỗi khi phân tích JSON:', jsonError);
                    
                    // Thử sửa chuỗi JSON nếu có thể
                    const fixedJsonStr = jsonStr.replace(/\n/g, ' ')
                                               .replace(/,\s*}/g, '}')
                                               .replace(/,\s*]/g, ']')
                                               .replace(/'/g, '"')
                                               .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
                    
                    try {
                        console.log('Thử phân tích JSON đã sửa:', fixedJsonStr.substring(0, 100) + '...');
                        aiAnalysis = JSON.parse(fixedJsonStr);
                    } catch (fixError) {
                        console.error('Không thể khắc phục JSON:', fixError);
                        // Sử dụng phản hồi dự phòng nếu không thể sửa JSON
                        aiAnalysis = createFallbackAnalysis(extractedText, doc);
                    }
                }
            } catch (error) {
                console.error('Lỗi khi xử lý phản hồi từ AI:', error);
                console.error('Phản hồi gốc từ AI:', aiResponse);
                
                // Tạo phân tích dự phòng nếu không thể xử lý phản hồi
                aiAnalysis = createFallbackAnalysis(extractedText, doc);
            }
            
            // Đảm bảo aiAnalysis có đủ các trường cần thiết
            ensureAnalysisFields(aiAnalysis, extractedText, doc);
            
            // Cập nhật metadata với kết quả phân tích
            const updatedMetadata = {
                ...doc.metadata,
                analyzed: true,
                analyzed_at: new Date().toISOString(),
                summary: aiAnalysis.summary,
                keywords: aiAnalysis.keywords,
                document_type: aiAnalysis.document_type,
                entities: aiAnalysis.entities,
                recommendations: aiAnalysis.recommendations
            };
            
            // Cập nhật vào database
            await userLegalDocModel.updateLegalDoc(docId, userId, {
                metadata: updatedMetadata,
                tags: [...new Set([...(doc.tags || []), ...aiAnalysis.keywords])]
            });
            
            res.status(200).json({
                success: true,
                data: aiAnalysis,
                message: 'Đã phân tích hồ sơ pháp lý thành công'
            });
        } catch (error) {
            console.error('Lỗi khi phân tích hồ sơ:', error);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi phân tích hồ sơ: ' + error.message
            });
        }
    } catch (error) {
        console.error('Lỗi khi phân tích hồ sơ:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi phân tích hồ sơ: ' + error.message
        });
    }
});

// Hàm hỗ trợ tạo phân tích dự phòng
function createFallbackAnalysis(extractedText, doc) {
    // Trích xuất đoạn văn bản có ý nghĩa
    const paragraphs = extractedText
        .split(/\n\s*\n/)
        .filter(p => p.trim().length > 50);
    
    // Lấy các đoạn văn đầu tiên có ý nghĩa làm tóm tắt
    const firstParagraphs = paragraphs.length > 0 
        ? paragraphs.slice(0, Math.min(5, paragraphs.length)).join('\n\n')
        : extractedText.substring(0, 800);
    
    // Tóm tắt chi tiết hơn
    const summary = `Tài liệu "${doc.title}" thuộc danh mục ${doc.category || 'chưa phân loại'} chứa các nội dung chính sau:\n\n
    ${firstParagraphs}\n\n
    Đây là một tài liệu quan trọng có thể liên quan đến các vấn đề pháp lý trong lĩnh vực ${doc.category || 'pháp lý'}. 
    Nội dung tài liệu bao gồm các thông tin, quy định và hướng dẫn cần được xem xét kỹ lưỡng.
    Người đọc nên chú ý đến các chi tiết được đề cập và tham khảo ý kiến chuyên gia nếu cần thêm thông tin.`;
    
    // Trích xuất từ khóa từ nội dung
    const text = extractedText.toLowerCase();
    const stopWords = [
        "và", "hoặc", "là", "của", "trong", "có", "không", "được", "các", "những",
        "này", "khi", "về", "như", "theo", "cho", "tại", "từ", "với", "để"
    ];
    
    // Tạo danh sách n-gram (1-3 từ liên tiếp)
    const words = text.split(/\s+/);
    const phrases = new Map();
    
    // Đếm từ đơn (loại bỏ stopwords và từ ngắn)
    words.forEach(word => {
        word = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
        if (word.length > 3 && !stopWords.includes(word)) {
            phrases.set(word, (phrases.get(word) || 0) + 1);
        }
    });
    
    // Chuyển Map thành mảng và sắp xếp theo tần suất
    const sortedPhrases = [...phrases.entries()]
        .filter(([phrase, count]) => count > 2) // Lọc bỏ từ xuất hiện ít
        .sort((a, b) => b[1] - a[1]) // Sắp xếp giảm dần theo tần suất
        .map(entry => entry[0]);
    
    // Trích xuất ngày tháng
    const dateRegex = /\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4}|ngày\s+\d{1,2}\s+tháng\s+\d{1,2}\s+năm\s+\d{4}/g;
    const dates = extractedText.match(dateRegex) || [];
    
    // Tạo danh sách thực thể
    const entities = [];
    
    // Thêm ngày tháng vào thực thể
    dates.slice(0, 3).forEach(date => {
        entities.push({
            text: date,
            type: "Ngày tháng"
        });
    });
    
    // Thêm tên tài liệu và ngày tạo vào thực thể
    entities.push({
        text: doc.title,
        type: "Tên tài liệu"
    });
    
    if (doc.created_at) {
        entities.push({
            text: new Date(doc.created_at).toLocaleDateString('vi-VN'),
            type: "Ngày tạo"
        });
    }
    
    // Đề xuất chi tiết hơn
    const recommendations = `
    1. Nghiên cứu kỹ nội dung của tài liệu này, chú ý các điều khoản quan trọng và các thông tin cụ thể.
    
    2. Tham khảo ý kiến chuyên gia trong lĩnh vực ${doc.category || 'pháp lý'} để hiểu rõ hơn về tính áp dụng của tài liệu này.
    
    3. So sánh nội dung tài liệu với các quy định pháp luật hiện hành để đảm bảo tuân thủ.
    
    4. Lưu trữ tài liệu trong hệ thống quản lý tài liệu có tổ chức để dễ dàng tra cứu khi cần.
    
    5. Cập nhật định kỳ thông tin liên quan để đảm bảo tài liệu luôn phù hợp với các quy định mới nhất.`;
    
    return {
        summary: summary,
        keywords: sortedPhrases.slice(0, 8),
        document_type: doc.category ? `Tài liệu ${doc.category}` : "Tài liệu văn bản",
        entities: entities,
        recommendations: recommendations
    };
}

// Hàm đảm bảo đủ các trường trong phân tích
function ensureAnalysisFields(analysis, extractedText, doc) {
    // Kiểm tra và cải thiện tóm tắt
    if (!analysis.summary || 
        analysis.summary.includes("Xin lỗi") || 
        analysis.summary.includes("không thể") || 
        analysis.summary.includes("Không thể") ||
        analysis.summary.length < 100) {
        
        // Trích xuất đoạn văn bản có ý nghĩa
        const paragraphs = extractedText
            .split(/\n\s*\n/)
            .filter(p => p.trim().length > 100)
            .slice(0, 5);
        
        if (paragraphs.length > 0) {
            const contentSummary = paragraphs.join('\n\n').substring(0, 800);
            analysis.summary = `Tài liệu "${doc.title}" thuộc lĩnh vực ${doc.category || 'pháp lý'} có các nội dung chính như sau:\n\n
            ${contentSummary}\n\n
            Đây là tài liệu quan trọng cần được xem xét kỹ lưỡng và có thể có ý nghĩa pháp lý đáng kể trong lĩnh vực ${doc.category || 'pháp lý'}.
            Người đọc nên chú ý tới các thông tin được trình bày và tham khảo ý kiến chuyên gia để hiểu rõ tính áp dụng của tài liệu này.`;
        } else {
            // Nếu không tìm thấy đoạn văn có ý nghĩa, sử dụng các từ đầu tiên
            const words = extractedText.split(' ').slice(0, 150).join(' ');
            analysis.summary = `Tài liệu "${doc.title}" có nội dung bắt đầu với: "${words}..."\n\n 
            Đây là tài liệu thuộc lĩnh vực ${doc.category || 'pháp lý'} cần được xem xét chi tiết. 
            Tài liệu có thể chứa thông tin pháp lý quan trọng và người đọc nên tham khảo ý kiến chuyên môn để hiểu rõ nội dung và tính áp dụng.`;
        }
    }
    
    // Đảm bảo keywords là mảng
    if (!Array.isArray(analysis.keywords) || analysis.keywords.length === 0) {
        const text = extractedText.toLowerCase();
        const stopWords = [
            "và", "hoặc", "là", "của", "trong", "có", "không", "được", "các", "những",
            "này", "khi", "về", "như", "theo", "cho", "tại", "từ", "với", "để"
        ];
        
        const words = text.split(/\s+/);
        const wordCount = {};
        
        words.forEach(word => {
            word = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
            if (word.length > 3 && !stopWords.includes(word)) {
                wordCount[word] = (wordCount[word] || 0) + 1;
            }
        });
        
        analysis.keywords = Object.entries(wordCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(entry => entry[0]);
    }
    
    // Đảm bảo document_type
    if (!analysis.document_type || 
        analysis.document_type.includes("không thể xác định") || 
        analysis.document_type.includes("Không thể xác định")) {
        
        analysis.document_type = doc.category ? 
            `Tài liệu ${doc.category}` : 
            "Tài liệu văn bản";
    }
    
    // Đảm bảo entities là mảng
    if (!Array.isArray(analysis.entities) || analysis.entities.length === 0) {
        analysis.entities = [
            {
                text: doc.title,
                type: "Tên tài liệu"
            }
        ];
        
        if (doc.created_at) {
            analysis.entities.push({
                text: new Date(doc.created_at).toLocaleDateString('vi-VN'),
                type: "Ngày tạo"
            });
        }
    }
    
    // Đảm bảo có recommendations chi tiết
    if (!analysis.recommendations || 
        analysis.recommendations.includes("Xin lỗi") || 
        analysis.recommendations.length < 100) {
        
        analysis.recommendations = `
        1. Nghiên cứu kỹ nội dung của tài liệu này, chú ý các điều khoản quan trọng và các thông tin cụ thể.
        
        2. Tham khảo ý kiến chuyên gia trong lĩnh vực ${doc.category || 'pháp lý'} để hiểu rõ hơn về tính áp dụng của tài liệu này.
        
        3. So sánh nội dung tài liệu với các quy định pháp luật hiện hành để đảm bảo tuân thủ.
        
        4. Lưu trữ tài liệu trong hệ thống quản lý tài liệu có tổ chức để dễ dàng tra cứu khi cần.
        
        5. Cập nhật định kỳ thông tin liên quan để đảm bảo tài liệu luôn phù hợp với các quy định mới nhất.`;
    }
}

// API endpoint để lấy danh sách hồ sơ được chia sẻ
const getSharedDocs = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    console.log(`Lấy tài liệu được chia sẻ cho user ID: ${userId}`);
    
    try {
        // Lấy các tham số truy vấn
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const category = req.query.category || null;
        const search = req.query.search || null;
        const sortBy = req.query.sortBy || 'created_at';
        const sortOrder = req.query.sortOrder || 'DESC';
        
        console.log('Query parameters:', { page, limit, category, search, sortBy, sortOrder });
        
        const options = { page, limit, category, search, sortBy, sortOrder };
        
        const result = await userLegalDocModel.getSharedDocuments(userId, options);
        
        console.log(`Tìm thấy ${result.data.length} tài liệu được chia sẻ`);
        
        res.status(200).json({
            success: true,
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách hồ sơ được chia sẻ:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy danh sách hồ sơ được chia sẻ'
        });
    }
});

// [ADMIN] Lấy danh sách hồ sơ pháp lý của tất cả người dùng
const getAllUserDocs = async (req, res) => {
    try {
        // Kiểm tra quyền admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'Bạn không có quyền truy cập tính năng này'
            });
        }

        const { 
            page = 1, 
            limit = 10, 
            category = null, 
            search = null, 
            sortBy = 'created_at', 
            sortOrder = 'DESC',
            docId = null
        } = req.query;

        // Nếu có docId, trả về chi tiết 1 hồ sơ
        if (docId) {
            const doc = await pool.query(
                `SELECT d.*, u.username, u.full_name as owner_name, u.email as user_email
                FROM UserLegalDocs d
                JOIN Users u ON d.user_id = u.id
                WHERE d.id = $1`,
                [docId]
            );
            
            if (doc.rows.length === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Không tìm thấy hồ sơ pháp lý'
                });
            }
            
            return res.status(200).json({
                status: 'success',
                data: doc.rows
            });
        }

        // Truy vấn SQL trực tiếp để lấy thông tin chi tiết hơn
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        let query = `
            SELECT d.*, u.username, u.full_name as owner_name, u.email as user_email
            FROM UserLegalDocs d
            JOIN Users u ON d.user_id = u.id
            WHERE 1=1
        `;

        let params = [];
        let paramIndex = 0;

        // Thêm điều kiện tìm kiếm theo danh mục
        if (category) {
            paramIndex++;
            query += ` AND d.category = $${paramIndex}`;
            params.push(category);
        }

        // Thêm điều kiện tìm kiếm theo từ khóa
        if (search) {
            paramIndex++;
            query += ` AND (
                d.title ILIKE $${paramIndex}
                OR d.description ILIKE $${paramIndex}
                OR u.username ILIKE $${paramIndex}
                OR u.full_name ILIKE $${paramIndex}
            )`;
            params.push(`%${search}%`);
        }

        // Xử lý sắp xếp an toàn (tránh SQL injection)
        const validSortColumns = ['created_at', 'updated_at', 'title', 'category'];
        const validSortOrders = ['ASC', 'DESC'];
        
        const safeColumnName = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
        const safeOrderDirection = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

        // Thêm sắp xếp
        query += ` ORDER BY d.${safeColumnName} ${safeOrderDirection}`;

        // Thêm phân trang
        query += ` LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}`;
        params.push(parseInt(limit), offset);

        console.log('Query:', query);
        console.log('Params:', params);
        
        const documents = await pool.query(query, params);
        
        // Đếm tổng số hồ sơ (không áp dụng phân trang)
        let countQuery = `
            SELECT COUNT(*) FROM UserLegalDocs d
            JOIN Users u ON d.user_id = u.id
            WHERE 1=1
        `;
        
        let countParams = [];
        let countParamIndex = 0;
        
        if (category) {
            countParamIndex++;
            countQuery += ` AND d.category = $${countParamIndex}`;
            countParams.push(category);
        }
        
        if (search) {
            countParamIndex++;
            countQuery += ` AND (
                d.title ILIKE $${countParamIndex}
                OR d.description ILIKE $${countParamIndex}
                OR u.username ILIKE $${countParamIndex}
                OR u.full_name ILIKE $${countParamIndex}
            )`;
            countParams.push(`%${search}%`);
        }
        
        const countResult = await pool.query(countQuery, countParams);
        const totalDocs = parseInt(countResult.rows[0].count);
        
        return res.status(200).json({
            status: 'success',
            data: documents.rows,
            pagination: {
                total: totalDocs,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalDocs / limit)
            }
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách hồ sơ pháp lý của tất cả người dùng:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu: ' + error.message
        });
    }
};

// [ADMIN] Lấy danh sách hồ sơ pháp lý của một người dùng cụ thể
const getUserDocsById = async (req, res) => {
    try {
        // Kiểm tra quyền admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'Bạn không có quyền truy cập tính năng này'
            });
        }

        const userId = req.params.userId;
        
        // Kiểm tra xem người dùng có tồn tại không
        const userCheck = await pool.query('SELECT id FROM Users WHERE id = $1', [userId]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Không tìm thấy người dùng'
            });
        }

        const { 
            page = 1, 
            limit = 10, 
            category = null, 
            search = null, 
            sortBy = 'created_at', 
            sortOrder = 'DESC'
        } = req.query;

        // Truy vấn SQL trực tiếp để lấy thông tin chi tiết hơn
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        let query = `
            SELECT d.*, u.username, u.full_name as owner_name, u.email as user_email
            FROM UserLegalDocs d
            JOIN Users u ON d.user_id = u.id
            WHERE d.user_id = $1
        `;

        let params = [userId];
        let paramIndex = 1;

        // Thêm điều kiện tìm kiếm theo danh mục
        if (category) {
            paramIndex++;
            query += ` AND d.category = $${paramIndex}`;
            params.push(category);
        }

        // Thêm điều kiện tìm kiếm theo từ khóa
        if (search) {
            paramIndex++;
            query += ` AND (
                d.title ILIKE $${paramIndex}
                OR d.description ILIKE $${paramIndex}
            )`;
            params.push(`%${search}%`);
        }

        // Xử lý sắp xếp an toàn (tránh SQL injection)
        const validSortColumns = ['created_at', 'updated_at', 'title', 'category'];
        const validSortOrders = ['ASC', 'DESC'];
        
        const safeColumnName = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
        const safeOrderDirection = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

        // Thêm sắp xếp
        query += ` ORDER BY d.${safeColumnName} ${safeOrderDirection}`;

        // Thêm phân trang
        query += ` LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}`;
        params.push(parseInt(limit), offset);

        console.log('User docs query:', query);
        console.log('User docs params:', params);
        
        const documents = await pool.query(query, params);
        
        // Đếm tổng số hồ sơ (không áp dụng phân trang)
        let countQuery = `
            SELECT COUNT(*) FROM UserLegalDocs d
            WHERE d.user_id = $1
        `;
        
        let countParams = [userId];
        let countParamIndex = 1;
        
        if (category) {
            countParamIndex++;
            countQuery += ` AND d.category = $${countParamIndex}`;
            countParams.push(category);
        }
        
        if (search) {
            countParamIndex++;
            countQuery += ` AND (
                d.title ILIKE $${countParamIndex}
                OR d.description ILIKE $${countParamIndex}
            )`;
            countParams.push(`%${search}%`);
        }
        
        const countResult = await pool.query(countQuery, countParams);
        const totalDocs = parseInt(countResult.rows[0].count);
        
        // Lấy thông tin người dùng
        const userInfo = await pool.query(
            'SELECT username, full_name, email FROM Users WHERE id = $1',
            [userId]
        );

        return res.status(200).json({
            status: 'success',
            user: userInfo.rows[0],
            data: documents.rows,
            pagination: {
                total: totalDocs,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalDocs / limit)
            }
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách hồ sơ pháp lý của người dùng:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu: ' + error.message
        });
    }
};

module.exports = {
    uploadDoc: [upload.single('file'), uploadDoc], // middleware upload file
    getUserDocs,
    getDocById,
    updateDoc,
    deleteDoc,
    downloadDoc,
    getCategories,
    shareDoc,
    unshareDoc,
    analyzeDoc,
    getSharedDocs,
    getAllUserDocs,     // New endpoint for admin
    getUserDocsById     // New endpoint for admin
}; 