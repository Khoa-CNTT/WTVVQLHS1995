const userLegalDocModel = require('../models/userLegalDocModel');
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
    
    // Nếu file được mã hóa, giải mã trước khi gửi
    if (doc.is_encrypted && doc.encryption_key) {
        try {
            const decryptedBuffer = await decryptFile(filePath, doc.encryption_key);
            
            // Đặt header
            res.setHeader('Content-Type', doc.metadata.mime_type || 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.metadata.original_name || doc.title)}"`);
            
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
    res.download(filePath, doc.metadata && doc.metadata.original_name ? doc.metadata.original_name : `${doc.title}.${doc.file_type}`);
});

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
    
    const { shared_with, permissions, valid_until } = req.body;
    
    if (!shared_with || !Array.isArray(permissions) || permissions.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp ID người dùng được chia sẻ và các quyền'
        });
    }
    
    // Kiểm tra các loại quyền hợp lệ
    const validPermissions = ['read', 'edit', 'delete'];
    const isValidPermissions = permissions.every(p => validPermissions.includes(p));
    
    if (!isValidPermissions) {
        return res.status(400).json({
            success: false,
            message: 'Các quyền không hợp lệ. Chỉ chấp nhận: read, edit, delete'
        });
    }
    
    try {
        // Kiểm tra xem người dùng shared_with có tồn tại không
        const pool = require('../config/database');
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
        
        const result = await userLegalDocModel.shareLegalDoc(
            docId, 
            userId, 
            shared_with, 
            permissions, 
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
        let fileContent = null;
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
            }
        }
        
        // TODO: Tích hợp với AI API để phân tích nội dung
        // Giả định AI phân tích và trả về kết quả
        const aiAnalysis = {
            summary: "Đây là bản tóm tắt tự động được tạo bởi AI.",
            document_type: "Tự động xác định loại văn bản pháp lý.",
            keywords: extractedText 
                ? extractedText
                    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
                    .split(' ')
                    .filter(word => word.length > 4)
                    .slice(0, 10)
                : [],
            entities: [],
            sentiment: "neutral",
            recommendations: "Đây chỉ là phân tích mẫu. Trong thực tế, AI sẽ đưa ra các khuyến nghị dựa trên nội dung văn bản."
        };
        
        // Cập nhật metadata với kết quả phân tích
        const updatedMetadata = {
            ...doc.metadata,
            analyzed: true,
            analyzed_at: new Date().toISOString(),
            ai_analysis: aiAnalysis
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
});

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
            sortOrder = 'DESC'
        } = req.query;

        // Truy vấn SQL trực tiếp để lấy thông tin chi tiết hơn
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT d.*, u.username, u.full_name as owner_name
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
                OR $${paramIndex} = ANY(d.tags)
            )`;
            params.push(`%${search}%`);
        }

        // Thêm sắp xếp
        query += ` ORDER BY d.${sortBy} ${sortOrder}`;

        // Thêm phân trang
        query += ` LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}`;
        params.push(limit, offset);

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
                OR $${countParamIndex} = ANY(d.tags)
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
            message: 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu'
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

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            category,
            search,
            sortBy,
            sortOrder
        };

        const result = await userLegalDocModel.getUserLegalDocs(userId, options);
        
        // Lấy thông tin người dùng
        const userInfo = await pool.query(
            'SELECT username, full_name, email FROM Users WHERE id = $1',
            [userId]
        );

        return res.status(200).json({
            status: 'success',
            user: userInfo.rows[0],
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách hồ sơ pháp lý của người dùng:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu'
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