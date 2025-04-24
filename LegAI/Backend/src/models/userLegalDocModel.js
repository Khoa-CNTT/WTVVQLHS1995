const pool = require('../config/database');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Lấy danh sách hồ sơ pháp lý của người dùng
const getUserLegalDocs = async (userId, options = {}) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            category = null, 
            search = null, 
            sortBy = 'created_at', 
            sortOrder = 'DESC'
        } = options;

        const offset = (page - 1) * limit;
        
        let query = `
            SELECT id, title, description, category, file_type, file_url, 
                   thumbnail_url, access_level, tags, created_at, updated_at
            FROM UserLegalDocs
            WHERE user_id = $1
        `;

        let params = [userId];
        let paramCount = 1;

        // Thêm điều kiện tìm kiếm theo danh mục
        if (category) {
            paramCount++;
            query += ` AND category = $${paramCount}`;
            params.push(category);
        }

        // Thêm điều kiện tìm kiếm theo từ khóa
        if (search) {
            paramCount++;
            query += ` AND (
                title ILIKE $${paramCount}
                OR description ILIKE $${paramCount}
                OR $${paramCount} = ANY(tags)
            )`;
            params.push(`%${search}%`);
        }

        // Thêm sắp xếp
        query += ` ORDER BY ${sortBy} ${sortOrder}`;

        // Thêm phân trang
        query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        
        // Đếm tổng số hồ sơ (không áp dụng phân trang)
        let countQuery = `
            SELECT COUNT(*) FROM UserLegalDocs
            WHERE user_id = $1
        `;
        
        let countParams = [userId];
        let countParamIndex = 1;
        
        if (category) {
            countParamIndex++;
            countQuery += ` AND category = $${countParamIndex}`;
            countParams.push(category);
        }
        
        if (search) {
            countParamIndex++;
            countQuery += ` AND (
                title ILIKE $${countParamIndex}
                OR description ILIKE $${countParamIndex}
                OR $${countParamIndex} = ANY(tags)
            )`;
            countParams.push(`%${search}%`);
        }
        
        const countResult = await pool.query(countQuery, countParams);
        const totalDocs = parseInt(countResult.rows[0].count);
        
        return {
            data: result.rows,
            pagination: {
                total: totalDocs,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalDocs / limit)
            }
        };
    } catch (error) {
        console.error('Lỗi khi lấy danh sách hồ sơ pháp lý:', error);
        throw error;
    }
};

// Lấy thông tin chi tiết của hồ sơ pháp lý
const getLegalDocById = async (docId, userId = null) => {
    try {
        let query = `
            SELECT d.*, 
                  (SELECT json_agg(json_build_object(
                    'id', a.id,
                    'granted_to', a.granted_to,
                    'granted_by', a.granted_by,
                    'access_type', a.access_type,
                    'valid_until', a.valid_until,
                    'created_at', a.created_at
                  ))
                  FROM UserLegalDocAccess a
                  WHERE a.doc_id = d.id) as shared_with
            FROM UserLegalDocs d
            WHERE d.id = $1
        `;

        const params = [docId];

        // Nếu có userId, kiểm tra quyền truy cập
        if (userId) {
            query += ` AND (
                d.user_id = $2 
                OR d.access_level = 'public'
                OR (
                    d.access_level = 'shared' 
                    AND EXISTS (
                        SELECT 1 FROM UserLegalDocAccess a 
                        WHERE a.doc_id = d.id 
                        AND a.granted_to = $2
                        AND (a.valid_until IS NULL OR a.valid_until > NOW())
                    )
                )
            )`;
            params.push(userId);
        }

        const result = await pool.query(query, params);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return result.rows[0];
    } catch (error) {
        console.error('Lỗi khi lấy thông tin hồ sơ pháp lý:', error);
        throw error;
    }
};

// Tạo hồ sơ pháp lý mới
const createLegalDoc = async (docData) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Mã hóa file nếu cần
        if (docData.is_encrypted === true) {
            // Tạo khóa mã hóa
            const encryptionKey = crypto.randomBytes(32).toString('hex');
            docData.encryption_key = encryptionKey;
            
            // Mã hóa file sẽ được thực hiện ở controller
        }
        
        const { 
            user_id, title, description, category, file_type, 
            file_url, file_size, thumbnail_url = null, 
            is_encrypted = true, encryption_key = null, 
            access_level = 'private', metadata = {}, tags = []
        } = docData;

        const query = `
            INSERT INTO UserLegalDocs (
                user_id, title, description, category, file_type, 
                file_url, file_size, thumbnail_url, is_encrypted, 
                encryption_key, access_level, metadata, tags
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
            )
            RETURNING *
        `;

        const values = [
            user_id, title, description, category, file_type,
            file_url, file_size, thumbnail_url, is_encrypted,
            encryption_key, access_level, metadata, tags
        ];

        const result = await client.query(query, values);
        
        // Ghi log hoạt động
        await client.query(
            `INSERT INTO AuditLogs (user_id, action, table_name, record_id, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [user_id, 'CREATE', 'UserLegalDocs', result.rows[0].id, 
             `Tạo hồ sơ pháp lý mới: ${title}`]
        );
        
        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Lỗi khi tạo hồ sơ pháp lý:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Cập nhật thông tin hồ sơ pháp lý
const updateLegalDoc = async (docId, userId, docData) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Kiểm tra quyền sở hữu
        const checkOwnership = await client.query(
            'SELECT user_id FROM UserLegalDocs WHERE id = $1',
            [docId]
        );
        
        if (checkOwnership.rows.length === 0) {
            throw new Error('Hồ sơ pháp lý không tồn tại');
        }
        
        if (checkOwnership.rows[0].user_id !== userId) {
            // Kiểm tra quyền chỉnh sửa
            const checkPermission = await client.query(
                `SELECT 1 FROM UserLegalDocAccess 
                 WHERE doc_id = $1 AND granted_to = $2 AND access_type = 'edit'
                 AND (valid_until IS NULL OR valid_until > NOW())`,
                [docId, userId]
            );
            
            if (checkPermission.rows.length === 0) {
                throw new Error('Không có quyền chỉnh sửa hồ sơ này');
            }
        }
        
        // Xây dựng câu truy vấn động
        let updateFields = [];
        let values = [];
        let paramCount = 1;
        
        const allowedFields = [
            'title', 'description', 'category', 'access_level', 'tags', 'metadata'
        ];
        
        for (const [key, value] of Object.entries(docData)) {
            if (allowedFields.includes(key) && value !== undefined) {
                updateFields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        }
        
        // Luôn cập nhật thời gian sửa đổi
        updateFields.push(`updated_at = NOW()`);
        
        if (updateFields.length === 1) {
            // Chỉ có updated_at, không có trường nào cần cập nhật
            await client.query('ROLLBACK');
            return { message: 'Không có thông tin nào được cập nhật' };
        }
        
        // Thêm tham số cuối cùng là docId
        values.push(docId);
        
        const query = `
            UPDATE UserLegalDocs
            SET ${updateFields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;
        
        const result = await client.query(query, values);
        
        // Ghi log hoạt động
        await client.query(
            `INSERT INTO AuditLogs (user_id, action, table_name, record_id, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, 'UPDATE', 'UserLegalDocs', docId, 
             `Cập nhật hồ sơ pháp lý: ${result.rows[0].title}`]
        );
        
        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Lỗi khi cập nhật hồ sơ pháp lý:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Xóa hồ sơ pháp lý
const deleteLegalDoc = async (docId, userId) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Kiểm tra quyền sở hữu
        const checkOwnership = await client.query(
            'SELECT user_id, file_url, title FROM UserLegalDocs WHERE id = $1',
            [docId]
        );
        
        if (checkOwnership.rows.length === 0) {
            throw new Error('Hồ sơ pháp lý không tồn tại');
        }
        
        if (checkOwnership.rows[0].user_id !== userId) {
            // Kiểm tra quyền xóa
            const checkPermission = await client.query(
                `SELECT 1 FROM UserLegalDocAccess 
                 WHERE doc_id = $1 AND granted_to = $2 AND access_type = 'delete'
                 AND (valid_until IS NULL OR valid_until > NOW())`,
                [docId, userId]
            );
            
            if (checkPermission.rows.length === 0) {
                throw new Error('Không có quyền xóa hồ sơ này');
            }
        }
        
        // Lấy thông tin file để xóa khỏi hệ thống
        const fileUrl = checkOwnership.rows[0].file_url;
        const docTitle = checkOwnership.rows[0].title;
        
        // Xóa các quyền truy cập liên quan
        await client.query(
            'DELETE FROM UserLegalDocAccess WHERE doc_id = $1',
            [docId]
        );
        
        // Xóa hồ sơ
        await client.query(
            'DELETE FROM UserLegalDocs WHERE id = $1',
            [docId]
        );
        
        // Ghi log hoạt động
        await client.query(
            `INSERT INTO AuditLogs (user_id, action, table_name, record_id, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, 'DELETE', 'UserLegalDocs', docId, 
             `Xóa hồ sơ pháp lý: ${docTitle}`]
        );
        
        await client.query('COMMIT');
        
        // Xóa file vật lý (thực hiện sau khi đã commit transaction)
        try {
            // Chuyển đổi URL thành đường dẫn thực
            const relativePath = fileUrl.replace(/^\/uploads\//, '');
            const filePath = path.join(process.cwd(), 'uploads', relativePath);
            
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (fileErr) {
            console.error('Lỗi khi xóa file vật lý:', fileErr);
            // Không throw lỗi này vì transaction đã commit thành công
        }
        
        return { success: true, message: 'Đã xóa hồ sơ pháp lý' };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Lỗi khi xóa hồ sơ pháp lý:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Lấy các danh mục hồ sơ pháp lý
const getLegalDocCategories = async () => {
    try {
        // Lấy danh sách các category đã có trong DB
        const result = await pool.query(`
            SELECT DISTINCT category 
            FROM UserLegalDocs 
            ORDER BY category
        `);
        
        // Danh sách mặc định các danh mục
        const defaultCategories = [
            'Hợp đồng', 'Giấy tờ cá nhân', 'Giấy tờ nhà đất', 'Giấy phép kinh doanh',
            'Giấy tờ xe', 'Di chúc', 'Sổ đỏ', 'Tranh chấp', 'Văn bản khác'
        ];
        
        // Gộp các danh mục từ DB và danh mục mặc định, loại bỏ trùng lặp
        const existingCategories = result.rows.map(row => row.category);
        const allCategories = [...new Set([...existingCategories, ...defaultCategories])];
        
        return allCategories.sort();
    } catch (error) {
        console.error('Lỗi khi lấy danh mục hồ sơ pháp lý:', error);
        throw error;
    }
};

// Chia sẻ hồ sơ pháp lý
const shareLegalDoc = async (docId, sharedBy, sharedWith, permissions, validUntil = null) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Kiểm tra quyền sở hữu
        const checkOwnership = await client.query(
            'SELECT user_id, title, access_level FROM UserLegalDocs WHERE id = $1',
            [docId]
        );
        
        if (checkOwnership.rows.length === 0) {
            throw new Error('Hồ sơ pháp lý không tồn tại');
        }
        
        if (checkOwnership.rows[0].user_id !== sharedBy) {
            throw new Error('Chỉ chủ sở hữu mới có thể chia sẻ hồ sơ này');
        }
        
        // Cập nhật trạng thái chia sẻ nếu hiện tại là 'private'
        if (checkOwnership.rows[0].access_level === 'private') {
            await client.query(
                'UPDATE UserLegalDocs SET access_level = $1 WHERE id = $2',
                ['shared', docId]
            );
        }
        
        // Xóa quyền truy cập cũ (nếu có)
        await client.query(
            'DELETE FROM UserLegalDocAccess WHERE doc_id = $1 AND granted_to = $2',
            [docId, sharedWith]
        );
        
        // Thêm quyền truy cập mới
        for (const permission of permissions) {
            await client.query(
                `INSERT INTO UserLegalDocAccess 
                 (doc_id, granted_to, granted_by, access_type, valid_until)
                 VALUES ($1, $2, $3, $4, $5)`,
                [docId, sharedWith, sharedBy, permission, validUntil]
            );
        }
        
        // Ghi log hoạt động
        await client.query(
            `INSERT INTO AuditLogs (user_id, action, table_name, record_id, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [sharedBy, 'SHARE', 'UserLegalDocs', docId, 
             `Chia sẻ hồ sơ pháp lý: ${checkOwnership.rows[0].title} với người dùng ID: ${sharedWith}`]
        );
        
        await client.query('COMMIT');
        return { success: true, message: 'Đã chia sẻ hồ sơ pháp lý' };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Lỗi khi chia sẻ hồ sơ pháp lý:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Hủy chia sẻ hồ sơ pháp lý
const unshareDoc = async (docId, ownerId, sharedWithId) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Kiểm tra quyền sở hữu
        const checkOwnership = await client.query(
            'SELECT user_id, title FROM UserLegalDocs WHERE id = $1',
            [docId]
        );
        
        if (checkOwnership.rows.length === 0) {
            throw new Error('Hồ sơ pháp lý không tồn tại');
        }
        
        if (checkOwnership.rows[0].user_id !== ownerId) {
            throw new Error('Chỉ chủ sở hữu mới có thể hủy chia sẻ hồ sơ này');
        }
        
        // Xóa quyền truy cập
        await client.query(
            'DELETE FROM UserLegalDocAccess WHERE doc_id = $1 AND granted_to = $2',
            [docId, sharedWithId]
        );
        
        // Kiểm tra xem còn chia sẻ với ai khác không
        const remainingShares = await client.query(
            'SELECT COUNT(*) FROM UserLegalDocAccess WHERE doc_id = $1',
            [docId]
        );
        
        // Nếu không còn chia sẻ với ai, chuyển về private
        if (parseInt(remainingShares.rows[0].count) === 0) {
            await client.query(
                'UPDATE UserLegalDocs SET access_level = $1 WHERE id = $2',
                ['private', docId]
            );
        }
        
        // Ghi log hoạt động
        await client.query(
            `INSERT INTO AuditLogs (user_id, action, table_name, record_id, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [ownerId, 'UNSHARE', 'UserLegalDocs', docId, 
             `Hủy chia sẻ hồ sơ pháp lý: ${checkOwnership.rows[0].title} với người dùng ID: ${sharedWithId}`]
        );
        
        await client.query('COMMIT');
        return { success: true, message: 'Đã hủy chia sẻ hồ sơ pháp lý' };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Lỗi khi hủy chia sẻ hồ sơ pháp lý:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Phân tích hồ sơ với AI
const analyzeDocWithAI = async (docId, userId) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Kiểm tra quyền truy cập
        const doc = await getLegalDocById(docId, userId);
        
        if (!doc) {
            throw new Error('Hồ sơ không tồn tại hoặc bạn không có quyền truy cập');
        }
        
        // TODO: Tích hợp với API AI để phân tích hồ sơ
        // Phần này sẽ được thực hiện ở controller
        
        // Cập nhật metadata với kết quả phân tích
        // Ví dụ giả định:
        const metadata = {
            ...doc.metadata,
            analyzed: true,
            analyzed_at: new Date().toISOString(),
            // Các thông tin khác sẽ được cập nhật ở controller
        };
        
        await client.query(
            'UPDATE UserLegalDocs SET metadata = $1 WHERE id = $2',
            [metadata, docId]
        );
        
        await client.query('COMMIT');
        return { success: true, message: 'Đã phân tích hồ sơ pháp lý' };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Lỗi khi phân tích hồ sơ pháp lý:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Lấy danh sách hồ sơ được chia sẻ với người dùng
const getSharedDocuments = async (userId, options = {}) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            category = null, 
            search = null, 
            sortBy = 'created_at', 
            sortOrder = 'DESC'
        } = options;

        const offset = (page - 1) * limit;
        
        let query = `
            SELECT d.id, d.title, d.description, d.category, d.file_type, d.file_url, 
                   d.thumbnail_url, d.access_level, d.tags, d.created_at, d.updated_at,
                   u.username as owner_username, u.full_name as owner_name,
                   array_agg(DISTINCT a.access_type) as permissions
            FROM UserLegalDocs d
            JOIN UserLegalDocAccess a ON d.id = a.doc_id
            JOIN Users u ON d.user_id = u.id
            WHERE a.granted_to = $1
              AND (a.valid_until IS NULL OR a.valid_until > NOW())
        `;

        let params = [userId];
        let paramCount = 1;

        // Thêm điều kiện tìm kiếm theo danh mục
        if (category) {
            paramCount++;
            query += ` AND d.category = $${paramCount}`;
            params.push(category);
        }

        // Thêm điều kiện tìm kiếm theo từ khóa
        if (search) {
            paramCount++;
            query += ` AND (
                d.title ILIKE $${paramCount}
                OR d.description ILIKE $${paramCount}
                OR $${paramCount} = ANY(d.tags)
            )`;
            params.push(`%${search}%`);
        }

        // Group by để array_agg hoạt động đúng
        query += ` GROUP BY d.id, u.username, u.full_name`;
        
        // Thêm sắp xếp
        query += ` ORDER BY d.${sortBy} ${sortOrder}`;

        // Thêm phân trang
        query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        
        // Đếm tổng số hồ sơ (không áp dụng phân trang)
        let countQuery = `
            SELECT COUNT(DISTINCT d.id) FROM UserLegalDocs d
            JOIN UserLegalDocAccess a ON d.id = a.doc_id
            WHERE a.granted_to = $1
              AND (a.valid_until IS NULL OR a.valid_until > NOW())
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
                OR $${countParamIndex} = ANY(d.tags)
            )`;
            countParams.push(`%${search}%`);
        }
        
        const countResult = await pool.query(countQuery, countParams);
        const totalDocs = parseInt(countResult.rows[0].count);
        
        return {
            data: result.rows,
            pagination: {
                total: totalDocs,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalDocs / limit)
            }
        };
    } catch (error) {
        console.error('Lỗi khi lấy danh sách hồ sơ được chia sẻ:', error);
        throw error;
    }
};

module.exports = {
    getUserLegalDocs,
    getLegalDocById,
    createLegalDoc,
    updateLegalDoc,
    deleteLegalDoc,
    getLegalDocCategories,
    shareLegalDoc,
    unshareDoc,
    analyzeDocWithAI,
    getSharedDocuments
}; 