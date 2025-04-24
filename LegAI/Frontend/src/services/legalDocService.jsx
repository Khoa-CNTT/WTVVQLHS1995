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
        return response.data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách hồ sơ pháp lý được chia sẻ:', error);
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
        const response = await axiosInstance.post(`/legal-docs/${docId}/share`, userData, getHeaders());
        return response.data;
    } catch (error) {
        console.error('Lỗi khi chia sẻ hồ sơ pháp lý:', error);
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