import axiosInstance from '../config/axios';

// Hàm lấy token từ localStorage
const getToken = () => {
    return localStorage.getItem('token');
};

// Hàm tạo headers request
const getHeaders = () => {
    return {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    };
};

// Lấy danh sách hồ sơ pháp lý của người dùng
export const getUserLegalDocs = async (page = 1, limit = 10, options = {}) => {
    try {
        const { category, search, sortBy, sortOrder } = options;
        
        let queryParams = `page=${page}&limit=${limit}`;
        if (category) queryParams += `&category=${category}`;
        if (search) queryParams += `&search=${search}`;
        if (sortBy) queryParams += `&sortBy=${sortBy}`;
        if (sortOrder) queryParams += `&sortOrder=${sortOrder}`;
        
        const response = await axiosInstance.get(`/legal-docs?${queryParams}`, getHeaders());
        
        // Kiểm tra nếu API trả về dữ liệu rỗng
        if (!response.data || !response.data.data) {
            return {
                status: 'success',
                data: [],
                pagination: {
                    page: page,
                    limit: limit,
                    totalPages: 1,
                    total: 0
                }
            };
        }
        
        return response.data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách hồ sơ pháp lý:', error);
        throw error;
    }
};

// Lấy danh sách hồ sơ pháp lý được chia sẻ với người dùng
export const getSharedLegalDocs = async (page = 1, limit = 10, options = {}) => {
    try {
        const { category, search, sortBy, sortOrder } = options;
        
        let queryParams = `page=${page}&limit=${limit}`;
        if (category) queryParams += `&category=${category}`;
        if (search) queryParams += `&search=${search}`;
        if (sortBy) queryParams += `&sortBy=${sortBy}`;
        if (sortOrder) queryParams += `&sortOrder=${sortOrder}`;
        
        
        const response = await axiosInstance.get(`/legal-docs/shared?${queryParams}`, getHeaders());
        
        
        // Nếu response trả về dữ liệu rỗng, vẫn đảm bảo cấu trúc đúng
        if (!response.data.data) {
            console.warn('API không trả về dữ liệu hoặc dữ liệu không đúng định dạng');
            response.data = {
                ...response.data,
                data: [],
                pagination: {
                    total: 0,
                    page: page,
                    limit: limit,
                    totalPages: 0
                }
            };
        }
        
        return response.data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách hồ sơ pháp lý được chia sẻ:', error);
        if (error.response) {
            console.error('API response error:', error.response.data);
            console.error('Status code:', error.response.status);
        }
        throw error;
    }
};

// Lấy thông tin chi tiết của hồ sơ pháp lý
export const getLegalDocById = async (docId) => {
    try {
        const response = await axiosInstance.get(`/legal-docs/${docId}`, getHeaders());
        return response.data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin hồ sơ pháp lý:', error);
        throw error;
    }
};

// Tải lên hồ sơ pháp lý mới
export const uploadLegalDoc = async (formData) => {
    try {
        const config = {
            ...getHeaders(),
            headers: {
                ...getHeaders().headers,
                'Content-Type': 'multipart/form-data'
            }
        };
        
        const response = await axiosInstance.post('/legal-docs/upload', formData, config);
        return response.data;
    } catch (error) {
        console.error('Lỗi khi tải lên hồ sơ pháp lý:', error);
        throw error;
    }
};

// Cập nhật thông tin hồ sơ pháp lý
export const updateLegalDoc = async (docId, updateData) => {
    try {
        const response = await axiosInstance.put(`/legal-docs/${docId}`, updateData, getHeaders());
        return response.data;
    } catch (error) {
        console.error('Lỗi khi cập nhật hồ sơ pháp lý:', error);
        throw error;
    }
};

// Xóa hồ sơ pháp lý
export const deleteLegalDoc = async (docId) => {
    try {
        const response = await axiosInstance.delete(`/legal-docs/${docId}`, getHeaders());
        return response.data;
    } catch (error) {
        console.error('Lỗi khi xóa hồ sơ pháp lý:', error);
        throw error;
    }
};

// Tải xuống hồ sơ pháp lý
export const downloadLegalDoc = async (docId) => {
    try {
        const response = await axiosInstance.get(`/legal-docs/${docId}/download`, {
            ...getHeaders(),
            responseType: 'blob'
        });
        
        // Lấy tên file từ header Content-Disposition nếu có
        const contentDisposition = response.headers['content-disposition'];
        let filename = 'document';
        
        if (contentDisposition) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(contentDisposition);
            if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        }
        
        // Tạo URL cho blob
        const url = window.URL.createObjectURL(new Blob([response.data]));
        
        // Tạo link tải xuống và click
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        
        // Dọn dẹp
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        
        return { success: true };
    } catch (error) {
        console.error('Lỗi khi tải xuống hồ sơ pháp lý:', error);
        throw error;
    }
};

// Lấy danh sách các danh mục
export const getLegalDocCategories = async () => {
    try {
        const response = await axiosInstance.get('/legal-docs/categories', getHeaders());
        return response.data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách danh mục:', error);
        throw error;
    }
};

// Chia sẻ hồ sơ pháp lý
export const shareLegalDoc = async (docId, userData) => {
    try {
        // Đảm bảo userData có định dạng chuẩn được API mong đợi
        // Xác định shared_with một cách rõ ràng
        let sharedWithId = null;
        
        // Kiểm tra và lấy ID người dùng từ các trường có thể có
        if (userData.shared_with && Number.isInteger(userData.shared_with)) {
            sharedWithId = userData.shared_with;
        } else if (userData.userId && Number.isInteger(userData.userId)) {
            sharedWithId = userData.userId;
        } else if (userData.user_id && Number.isInteger(userData.user_id)) {
            sharedWithId = userData.user_id;
        }
        
        // Kiểm tra nếu không tìm thấy ID hợp lệ
        if (!sharedWithId) {
            console.error('ID người dùng không hợp lệ:', userData);
            return {
                success: false,
                message: 'ID người dùng không hợp lệ hoặc không được cung cấp'
            };
        }
        
        const payload = {
            shared_with: sharedWithId,
            permissions: Array.isArray(userData.permissions) 
                ? userData.permissions 
                : [userData.permission || "read"],
            valid_until: userData.expireDate || userData.expiryDate || userData.expire_date || userData.valid_until
        };
        
        const response = await axiosInstance.post(`/legal-docs/${docId}/share`, payload, getHeaders());
        return response.data;
    } catch (error) {
        console.error('Lỗi khi chia sẻ hồ sơ pháp lý:', error);
        console.error('Error response:', error.response?.data);
        throw error;
    }
};

// Hủy chia sẻ hồ sơ pháp lý
export const unshareLegalDoc = async (docId, userId) => {
    try {
        const response = await axiosInstance.post(`/legal-docs/${docId}/unshare`, { user_id: userId }, getHeaders());
        return response.data;
    } catch (error) {
        console.error('Lỗi khi hủy chia sẻ hồ sơ pháp lý:', error);
        throw error;
    }
};

// Phân tích hồ sơ pháp lý với AI
export const analyzeLegalDoc = async (docId) => {
    try {
        const response = await axiosInstance.post(`/legal-docs/${docId}/analyze`, {}, getHeaders());
        return response.data;
    } catch (error) {
        console.error('Lỗi khi phân tích hồ sơ pháp lý:', error);
        throw error;
    }
};

// [ADMIN] Lấy danh sách hồ sơ pháp lý của tất cả người dùng
export const getAllUserLegalDocs = async (page = 1, limit = 10, options = {}) => {
    console.warn('API getAllUserLegalDocs đã bị vô hiệu hóa do lỗi phía máy chủ (500 Internal Server Error)');
    
    // Trả về một đối tượng phản hồi trống để tránh lỗi
    return {
        status: 'success',
        data: [],
        pagination: {
            totalPages: 1,
            page: 1,
            limit: limit,
            total: 0
        }
    };
};

// [ADMIN] Lấy danh sách hồ sơ pháp lý của một người dùng cụ thể
export const getUserLegalDocsById = async (userId, page = 1, limit = 10, options = {}) => {
    console.warn(`API getUserLegalDocsById đã bị vô hiệu hóa do lỗi phía máy chủ (500 Internal Server Error) khi truy cập hồ sơ của người dùng ID ${userId}`);
    
    // Trả về một đối tượng phản hồi trống để tránh lỗi
    return {
        status: 'success',
        data: [],
        pagination: {
            totalPages: 1,
            page: 1,
            limit: limit,
            total: 0
        }
    };
}; 