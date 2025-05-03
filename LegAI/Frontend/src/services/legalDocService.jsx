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
            
            // Đảm bảo URL có thể truy cập từ bên ngoài
            if (docData.file_url && docData.file_url.includes('/uploads/legal-docs/')) {
                // Tạo URL download API thay vì URL trực tiếp đến file
                const baseURL = axiosInstance.defaults.baseURL || 'http://localhost:8000/api';
                docData.download_url = `${baseURL}/legal-docs/${docData.id}/download`;
                console.log("Tạo URL download API:", docData.download_url);
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
        console.error('Lỗi khi lấy danh sách danh mục hồ sơ pháp lý:', error);
        throw new Error('Không thể lấy danh sách danh mục: ' + (error.message || 'Đã có lỗi xảy ra'));
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
    try {
        const { category, search, getCategories, docId } = options;
        
        // Sử dụng đúng đường dẫn API backend
        let url = `/legal-docs/admin/all?page=${page}&limit=${limit}`;
        if (category) url += `&category=${encodeURIComponent(category)}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (getCategories) url += `&getCategories=true`;
        if (docId) url += `&docId=${docId}`;
        
        console.log('Gọi API với URL:', url);
        const response = await axiosInstance.get(url, getHeaders());
        
        // Kiểm tra và chuyển đổi kết quả để tương thích với giao diện
        if (response.data && response.data.status === 'success') {
            // Format kết quả từ API backend
            return {
                status: 'success',
                data: response.data.data || [],
                categories: getCategories ? await getCategoriesFromBackend() : undefined,
                pagination: response.data.pagination || {
                    page: page,
                    limit: limit,
                    total: 0,
                    totalPages: 1
                },
                total: response.data.pagination?.total || 0
            };
        }
        
        return response.data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách hồ sơ pháp lý của tất cả người dùng:', error);
        
        // Lỗi kết nối hoặc lỗi máy chủ
        if (error.response && error.response.status === 500) {
            console.error('Lỗi máy chủ (500):', error.response.data);
        }
        
        // Gửi thông báo để ứng dụng có thể xử lý và hiển thị
        throw new Error(`Không thể kết nối đến máy chủ để lấy danh sách hồ sơ pháp lý. ${error.message}`);
    }
};

// Hàm trợ giúp để lấy danh mục từ backend
const getCategoriesFromBackend = async () => {
    try {
        const response = await axiosInstance.get('/legal-docs/categories', getHeaders());
        if (response.data && response.data.success) {
            return response.data.categories || [];
        }
        return ['Hồ sơ cá nhân', 'Hợp đồng', 'Đơn kiện', 'Biên bản', 'Khác'];
    } catch (error) {
        console.error('Lỗi khi lấy danh sách danh mục:', error);
        return ['Hồ sơ cá nhân', 'Hợp đồng', 'Đơn kiện', 'Biên bản', 'Khác'];
    }
};

// [ADMIN] Lấy danh sách hồ sơ pháp lý của một người dùng cụ thể
export const getUserLegalDocsById = async (userId, page = 1, limit = 10, options = {}) => {
    try {
        const { category, search, sortBy, sortOrder } = options;
        
        // Sử dụng đúng đường dẫn API backend
        let url = `/legal-docs/admin/users/${userId}?page=${page}&limit=${limit}`;
        if (category) url += `&category=${encodeURIComponent(category)}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (sortBy) url += `&sortBy=${sortBy}`;
        if (sortOrder) url += `&sortOrder=${sortOrder}`;
        
        console.log('Gọi API với URL:', url);
        const response = await axiosInstance.get(url, getHeaders());
        
        // Kiểm tra và chuyển đổi kết quả để tương thích với giao diện
        if (response.data && response.data.status === 'success') {
            return {
                status: 'success',
                user: response.data.user || {
                    username: 'unknown',
                    full_name: 'Người dùng không xác định',
                    email: 'unknown@example.com'
                },
                data: response.data.data || [],
                pagination: response.data.pagination || {
                    page: page,
                    limit: limit,
                    total: 0,
                    totalPages: 1
                },
                total: response.data.pagination?.total || 0
            };
        }
        
        return response.data;
    } catch (error) {
        console.error(`Lỗi khi lấy danh sách hồ sơ pháp lý của người dùng ID ${userId}:`, error);
        
        if (error.response) {
            if (error.response.status === 403) {
                throw new Error('Bạn không có quyền truy cập vào tài nguyên này.');
            } else if (error.response.status === 404) {
                throw new Error('Không tìm thấy người dùng với ID này.');
            } else if (error.response.status === 500) {
                throw new Error('Lỗi máy chủ khi truy cập dữ liệu người dùng.');
            }
        }
        
        // Gửi thông báo để ứng dụng có thể xử lý và hiển thị
        throw new Error(`Không thể kết nối đến máy chủ để lấy hồ sơ pháp lý của người dùng. ${error.message}`);
    }
};

// Lấy nội dung file từ URL
export const getDocFileContent = async (docId, options = {}) => {
  try {
    const { maxSize = 0, fullContent = false } = options;
    
    // Nếu yêu cầu tải nội dung đầy đủ, ưu tiên lấy trực tiếp từ file
    if (fullContent) {
      console.log("Đang tải toàn bộ nội dung trực tiếp từ file");
      const docResponse = await getLegalDocById(docId);
      
      if (docResponse.success && docResponse.data.file_url) {
        try {
          console.log("Có URL file, bắt đầu tải từ:", docResponse.data.file_url);
          const fileResponse = await fetch(docResponse.data.file_url);
          
          if (fileResponse.ok) {
            const contentType = fileResponse.headers.get('content-type');
            const isTextFile = ['txt', 'html', 'css', 'js', 'json', 'xml'].includes(
              docResponse.data.file_type?.toLowerCase()
            );
            const isTextContentType = contentType && contentType.includes('text');
            
            if (isTextFile || isTextContentType) {
              const text = await fileResponse.text();
              
              // Kiểm tra nếu nội dung là HTML với DOCTYPE
              if (text.trim().toLowerCase().startsWith('<!doctype html>') || 
                  text.trim().toLowerCase().startsWith('<html')) {
                console.error("Nhận được HTML thay vì nội dung văn bản thực");
                return {
                  success: false,
                  message: 'Không thể hiển thị nội dung trực tiếp. Vui lòng tải xuống để xem.',
                  data: {
                    content: "Định dạng file không được hỗ trợ để hiển thị trực tiếp. Vui lòng tải xuống để xem đầy đủ.",
                    truncated: true,
                    isHtmlError: true
                  }
                };
              }
              
              console.log("Đã tải thành công nội dung từ file gốc");
              return {
                success: true,
                data: {
                  content: text,
                  truncated: false
                }
              };
            }
          }
        } catch (fetchError) {
          console.error("Lỗi khi tải trực tiếp từ file:", fetchError);
        }
      }
    }
    
    // Thử dùng API content
    console.log("Thử dùng API /content để lấy nội dung");
    const queryParams = new URLSearchParams();
    queryParams.append('max_size', maxSize);
    if (fullContent) {
      queryParams.append('full_content', 'true');
    }
    
    try {
      const response = await axiosInstance.get(
        `/legal-docs/${docId}/content?${queryParams.toString()}`, 
        getHeaders()
      );
      console.log("Đã nhận phản hồi từ API /content");
      
      // Kiểm tra nếu response chứa HTML
      if (response.data && response.data.data && response.data.data.content) {
        const content = response.data.data.content;
        if (content.trim().toLowerCase().startsWith('<!doctype html>') || 
            content.trim().toLowerCase().startsWith('<html')) {
          console.error("API trả về HTML thay vì nội dung văn bản thực");
          return {
            success: false,
            message: 'Không thể hiển thị nội dung trực tiếp. Vui lòng tải xuống để xem.',
            data: {
              content: "Định dạng file không được hỗ trợ để hiển thị trực tiếp. Vui lòng tải xuống để xem đầy đủ.",
              truncated: true,
              isHtmlError: true
            }
          };
        }
      }
      
      return response.data;
    } catch (apiError) {
      console.log("API /content lỗi, thử phương pháp khác:", apiError);
      
      // Thử lấy file URL và đọc trực tiếp
      const docResponse = await getLegalDocById(docId);
      if (docResponse.success && docResponse.data.file_url) {
        try {
          const fileResponse = await fetch(docResponse.data.file_url);
          if (fileResponse.ok) {
            const contentType = fileResponse.headers.get('content-type');
            if (contentType && contentType.includes('text') || 
                ['txt', 'html', 'css', 'js', 'json', 'xml'].includes(docResponse.data.file_type?.toLowerCase())) {
              const text = await fileResponse.text();
              
              // Kiểm tra nếu nội dung là HTML với DOCTYPE
              if (text.trim().toLowerCase().startsWith('<!doctype html>') || 
                  text.trim().toLowerCase().startsWith('<html')) {
                console.error("Nhận được HTML thay vì nội dung văn bản thực");
                return {
                  success: false,
                  message: 'Không thể hiển thị nội dung trực tiếp. Vui lòng tải xuống để xem.',
                  data: {
                    content: "Định dạng file không được hỗ trợ để hiển thị trực tiếp. Vui lòng tải xuống để xem đầy đủ.",
                    truncated: true,
                    isHtmlError: true
                  }
                };
              }
              
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

// Chuyển đổi tài liệu DOCX sang PDF
export const convertDocxToPdf = async (docId) => {
  try {
    // Thử gọi API từ backend nếu có
    try {
      const response = await axiosInstance.post(`/legal-docs/${docId}/convert-to-pdf`, {}, getHeaders());
      return response.data;
    } catch (error) {
      // Lấy URL hiện tại của tài liệu 
      const docInfo = await getLegalDocById(docId);
      const fileUrl = docInfo.data?.file_url || '';
      
      if (fileUrl) {
        // Tạo URL Google Docs thay vì Office Online
        const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}`;
        
        return {
          success: true,
          message: 'Đã sử dụng Google Docs thay thế',
          data: {
            pdfUrl: googleDocsUrl,
            useGoogleViewer: true
          }
        };
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Lỗi khi chuyển đổi tài liệu:', error);
    throw error;
  }
};

// Thay thế file trong hồ sơ pháp lý
export const replaceDocFile = async (docId, fileData) => {
  try {
    const config = {
      ...getHeaders(),
      headers: {
        ...getHeaders().headers,
        'Content-Type': 'multipart/form-data'
      }
    };
    
    // Tạo FormData với file và các thông tin cần thiết
    const formData = new FormData();
    formData.append('file', fileData);
    
    // Sử dụng API update hiện có, vì API replace-file chưa được triển khai
    // Bước 1: Lấy thông tin hiện tại của document
    const docResponse = await getLegalDocById(docId);
    if (!docResponse.success) {
      throw new Error('Không thể lấy thông tin tài liệu');
    }
    
    // Bước 2: Upload file mới với thông tin hiện tại của tài liệu
    const docInfo = docResponse.data;
    formData.append('title', docInfo.title || '');
    formData.append('description', docInfo.description || '');
    formData.append('category', docInfo.category || '');
    
    if (docInfo.tags) {
      if (Array.isArray(docInfo.tags)) {
        formData.append('tags', JSON.stringify(docInfo.tags));
      } else if (typeof docInfo.tags === 'string') {
        formData.append('tags', JSON.stringify(docInfo.tags.split(',').map(tag => tag.trim())));
      }
    }
    
    // Bước 3: Xóa tài liệu cũ
    await deleteLegalDoc(docId);
    
    // Bước 4: Upload file mới
    const response = await uploadLegalDoc(formData);
    
    return response;
  } catch (error) {
    console.error('Lỗi khi thay thế file hồ sơ pháp lý:', error);
    if (error.response) {
      console.error('API response:', error.response.status);
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
}; 