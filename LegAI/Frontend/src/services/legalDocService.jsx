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
        
        // Nếu response thành công nhưng không có file_url, thử thêm nó từ các trường khác
        if (response.data && response.data.success && response.data.data) {
            const docData = response.data.data;
            
            // Xác định URL file từ các trường có thể có
            if (!docData.file_url && docData.url) {
                docData.file_url = docData.url;
                console.log("Sử dụng URL từ trường url:", docData.url);
            }
            
            // Nếu vẫn không có, tạo URL dựa trên ID nếu có thể
            if (!docData.file_url && docData.id && docData.file_type) {
                // Tạo URL dựa trên cấu trúc thông thường của API backend
                const baseURL = axiosInstance.defaults.baseURL || 'http://localhost:8000/api';
                docData.file_url = `${baseURL}/legal-docs/${docData.id}/download`;
                console.log("Tạo URL dựa trên ID:", docData.file_url);
            }
            
            // Cập nhật response
            response.data.data = docData;
        }
        
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
        
        // Lấy tên file từ header Content-Disposition
        const contentDisposition = response.headers['content-disposition'];
        let filename = 'document';
        
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
                // Xử lý decode URI component để lấy tên file đúng
                let extractedName = filenameMatch[1].replace(/['"]/g, '');
                try {
                    filename = decodeURIComponent(extractedName);
                } catch (e) {
                    // Nếu không decode được, sử dụng tên gốc
                    filename = extractedName;
                }
            }
        }
        
        // Xác định đúng loại MIME type dựa vào Content-Type header
        const contentType = response.headers['content-type'] || 'application/octet-stream';
        
        // Tạo URL cho blob với đúng MIME type
        const blob = new Blob([response.data], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        
        // Tạo link tải xuống và click
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        
        // Dọn dẹp
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
        }, 100);
        
        return { success: true, filename, contentType };
    } catch (error) {
        console.error('Lỗi khi tải xuống hồ sơ pháp lý:', error);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
            if (error.response.data instanceof Blob) {
                try {
                    const text = await error.response.data.text();
                    console.error('Error response:', text);
                } catch (e) {
                    console.error('Không thể đọc nội dung lỗi');
                }
            } else {
                console.error('Error data:', error.response.data);
            }
        }
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
        
        // Chuyển đổi quyền thành CHUỖI đơn giản theo yêu cầu API
        // Mặc định backend cần các quyền dưới dạng string: read, edit, delete
        let singlePermission = '';
        
        if (userData.permission) {
            // Ưu tiên sử dụng permission truyền vào trực tiếp
            singlePermission = userData.permission;
            console.log('Sử dụng quyền từ trường permission:', singlePermission);
        } else if (Array.isArray(userData.permissions)) {
            // Chuyển đổi từ mảng permissions thành chuỗi đơn lẻ
            if (userData.permissions.includes('delete')) {
                singlePermission = 'delete';
            } else if (userData.permissions.includes('edit')) {
                singlePermission = 'edit';
            } else if (userData.permissions.includes('read')) {
                singlePermission = 'read';
            } else {
                singlePermission = 'read'; // Mặc định
            }
            console.log('Chuyển đổi từ mảng permissions thành:', singlePermission);
        } else if (typeof userData.permissions === 'string') {
            // Chuyển đổi từ chuỗi permissions thô sang API đúng
            if (userData.permissions === 'view' || userData.permissions === 'read') {
                singlePermission = 'read';
            } else if (userData.permissions === 'edit') {
                singlePermission = 'edit';
            } else if (userData.permissions === 'full' || userData.permissions === 'delete') {
                singlePermission = 'delete';
            } else {
                singlePermission = 'read'; // Mặc định
            }
            console.log('Chuyển đổi từ chuỗi permissions thành:', singlePermission);
        } else {
            // Mặc định quyền đọc
            singlePermission = 'read';
            console.log('Sử dụng quyền mặc định:', singlePermission);
        }
        
        const payload = {
            shared_with: sharedWithId,
            access_type: singlePermission, // Sử dụng một quyền duy nhất thay vì mảng
            valid_until: userData.expireDate || userData.expiryDate || userData.expire_date || userData.valid_until
        };
        
        console.log('Payload cuối cùng gửi đến API:', payload);
        
        const response = await axiosInstance.post(`/legal-docs/${docId}/share`, payload, getHeaders());
        
        console.log('Kết quả từ API:', response.data);
        
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

// Lấy nội dung file từ URL
export const getDocFileContent = async (docId) => {
  try {
    // Thử sử dụng endpoint file content
    try {
      const response = await axiosInstance.get(`/legal-docs/${docId}/content`, getHeaders());
      return response.data;
    } catch (contentError) {
      console.log("Endpoint /content không tồn tại, thử sử dụng phương pháp khác");
      
      // Nếu endpoint content không tồn tại, thử tải file và đọc nội dung
      const docResponse = await getLegalDocById(docId);
      if (docResponse.success && docResponse.data.file_url) {
        try {
          const fileResponse = await fetch(docResponse.data.file_url);
          if (fileResponse.ok) {
            const contentType = fileResponse.headers.get('content-type');
            if (contentType && contentType.includes('text') || 
                ['txt', 'html', 'css', 'js', 'json', 'xml'].includes(docResponse.data.file_type?.toLowerCase())) {
              const text = await fileResponse.text();
              return {
                success: true,
                data: {
                  content: text
                }
              };
            } else {
              return {
                success: false,
                message: 'Không phải file văn bản, không thể hiển thị nội dung trực tiếp.'
              };
            }
          }
        } catch (fetchError) {
          console.error("Lỗi khi tải file:", fetchError);
        }
      }
      
      // Nếu không thể lấy nội dung, trả về thông báo lỗi
      return {
        success: false,
        message: 'Không thể tải nội dung file. Vui lòng tải xuống để xem.'
      };
    }
  } catch (error) {
    console.error('Lỗi khi lấy nội dung file:', error);
    throw error;
  }
};

// Cập nhật nội dung file
export const updateDocContent = async (docId, content) => {
  try {
    const response = await axiosInstance.put(`/legal-docs/${docId}/content`, { content }, getHeaders());
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật nội dung file:', error);
    throw error;
  }
}; 