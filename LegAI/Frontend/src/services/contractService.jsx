import axios from 'axios';
import { API_URL } from '../config/constants';

// Lấy token xác thực từ localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// Cấu hình headers với token xác thực
const getHeaders = () => {
  const token = getToken();
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

// Lấy danh sách hợp đồng của người dùng hiện tại
const getContracts = async (page = 1, limit = 10) => {
  try {
    const response = await axios.get(
      `${API_URL}/contracts?page=${page}&limit=${limit}`, 
      getHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách hợp đồng:', error);
    
    // Xử lý lỗi chi tiết hơn
    if (error.response) {
      // Máy chủ trả về lỗi
      console.error('Lỗi server:', error.response.status, error.response.data);
      if (error.response.status === 500) {
        throw new Error('Lỗi máy chủ. Vui lòng liên hệ quản trị viên.');
      }
    } else if (error.request) {
      // Không nhận được phản hồi
      console.error('Không nhận được phản hồi từ server');
      throw new Error('Không nhận được phản hồi từ máy chủ. Vui lòng thử lại sau.');
    }
    
    throw error;
  }
};

// Lấy tất cả hợp đồng (dành cho admin)
const getAllContracts = async (page = 1, limit = 10, searchTerm = '', userId = null) => {
  try {
    let url = `${API_URL}/contracts/all?page=${page}&limit=${limit}`;
    
    if (searchTerm) {
      url += `&search=${encodeURIComponent(searchTerm)}`;
    }
    
    if (userId) {
      url += `&userId=${userId}`;
    }
    
    const response = await axios.get(url, getHeaders());
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy tất cả hợp đồng:', error);
    
    // Xử lý lỗi chi tiết hơn
    if (error.response) {
      console.error('Lỗi server:', error.response.status, error.response.data);
      
      if (error.response.status === 403) {
        throw new Error('Bạn không có quyền truy cập chức năng này');
      } else if (error.response.status === 500) {
        throw new Error('Lỗi máy chủ. Vui lòng liên hệ quản trị viên.');
      }
    } else if (error.request) {
      console.error('Không nhận được phản hồi từ server');
      throw new Error('Không nhận được phản hồi từ máy chủ. Vui lòng thử lại sau.');
    }
    
    throw error;
  }
};

// Lấy chi tiết hợp đồng theo ID
const getContractById = async (contractId) => {
  try {
    const response = await axios.get(
      `${API_URL}/contracts/${contractId}`, 
      getHeaders()
    );
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy chi tiết hợp đồng ID ${contractId}:`, error);
    throw error;
  }
};

// Tạo hợp đồng mới
const createContract = async (contractData) => {
  try {
    // Tạo FormData để gửi file
    const formData = new FormData();

    // Thêm các trường dữ liệu vào formData
    Object.keys(contractData).forEach(key => {
      if (key === 'file') {
        if (contractData.file) {
          formData.append('file', contractData.file);
        }
      } else {
        formData.append(key, contractData[key]);
      }
    });

    // Cấu hình header với token và content-type cho FormData
    const headers = {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'multipart/form-data'
    };

    const response = await axios.post(
      `${API_URL}/contracts`, 
      formData, 
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo hợp đồng mới:', error);
    throw error;
  }
};

// Cập nhật hợp đồng
const updateContract = async (contractId, contractData) => {
  try {
    // Tạo FormData để gửi file
    const formData = new FormData();

    // Thêm các trường dữ liệu vào formData
    Object.keys(contractData).forEach(key => {
      if (key === 'file') {
        if (contractData.file) {
          formData.append('file', contractData.file);
        }
      } else {
        formData.append(key, contractData[key]);
      }
    });

    // Cấu hình header với token và content-type cho FormData
    const headers = {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'multipart/form-data'
    };

    const response = await axios.put(
      `${API_URL}/contracts/${contractId}`, 
      formData, 
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi cập nhật hợp đồng ID ${contractId}:`, error);
    throw error;
  }
};

// Xóa hợp đồng
const deleteContract = async (contractId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/contracts/${contractId}`, 
      getHeaders()
    );
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi xóa hợp đồng ID ${contractId}:`, error);
    throw error;
  }
};

// Tải xuống file hợp đồng
const downloadContractFile = async (contractId) => {
  try {
    console.log(`Bắt đầu tải xuống hợp đồng ID: ${contractId}`);
    
    const response = await axios({
      url: `${API_URL}/contracts/${contractId}/download`,
      method: 'GET',
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    
    // Log thông tin để debug
    console.log('Headers nhận được:', response.headers);
    console.log('Content-Type:', response.headers['content-type']);
    console.log('Content-Disposition:', response.headers['content-disposition']);
    
    // Xác định đúng content-type từ response
    const contentType = response.headers['content-type'] || 'application/pdf';
    console.log(`Sử dụng content-type: ${contentType}`);
    
    // Tạo đường dẫn URL từ Blob với content-type chính xác
    const blob = new Blob([response.data], { type: contentType });
    
    // Lấy tên file từ Content-Disposition header nếu có
    const contentDisposition = response.headers['content-disposition'];
    let filename = `contract_${contractId}`;
    
    // Thêm phần mở rộng phù hợp nếu không có trong tên file
    if (contentType === 'application/pdf' && !filename.toLowerCase().endsWith('.pdf')) {
      filename += '.pdf';
    } else if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' && !filename.toLowerCase().endsWith('.docx')) {
      filename += '.docx';
    } else if (contentType === 'application/msword' && !filename.toLowerCase().endsWith('.doc')) {
      filename += '.doc';
    }
    
    if (contentDisposition) {
      console.log('Xử lý content-disposition:', contentDisposition);
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = contentDisposition.match(filenameRegex);
      
      if (matches && matches[1]) {
        let extractedName = matches[1].replace(/['"]/g, '');
        try {
          filename = decodeURIComponent(extractedName);
        } catch (e) {
          console.error('Lỗi khi decode tên file:', e);
          filename = extractedName;
        }
      }
    }
    
    console.log(`Tên file được xác định: ${filename}`);
    
    // Tạo URL cho blob và tải xuống
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    
    // Click để tải file
    link.click();
    
    // Dọn dẹp
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
      console.log('Đã dọn dẹp sau khi tải xuống');
    }, 200);
    
    return { success: true, message: 'Tải xuống thành công', filename, downloadUrl: url };
  } catch (error) {
    console.error(`Lỗi khi tải xuống file hợp đồng ID ${contractId}:`, error);
    
    // Nếu API tải xuống không tồn tại, thử lấy thông tin hợp đồng để có file_url
    if (error.response && error.response.status === 404) {
      try {
        const contractResponse = await getContractById(contractId);
        if (contractResponse.success && contractResponse.data && contractResponse.data.file_url) {
          let fileUrl = contractResponse.data.file_url;
          
          // Đảm bảo URL trỏ đến backend
          if (fileUrl.startsWith('/uploads/')) {
            fileUrl = `http://localhost:8000${fileUrl}`;
          }
          
          // Nếu URL chứa localhost:3000, chuyển thành localhost:8000
          if (fileUrl.includes('localhost:3000')) {
            fileUrl = fileUrl.replace('localhost:3000', 'localhost:8000');
          }
          
          console.log("API download không tồn tại, sử dụng file_url trực tiếp:", fileUrl);
          return { 
            success: true, 
            message: 'Đã chuyển hướng sang URL trực tiếp', 
            downloadUrl: fileUrl,
            filename: contractResponse.data.title || `contract_${contractId}`
          };
        }
      } catch (contractError) {
        console.error("Không thể lấy thông tin hợp đồng:", contractError);
      }
    }
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      
      if (error.response.data instanceof Blob) {
        try {
          const reader = new FileReader();
          reader.onload = function() {
            console.error('Error response (Blob):', reader.result);
          };
          reader.readAsText(error.response.data);
        } catch (e) {
          console.error('Không thể đọc nội dung lỗi từ Blob');
        }
      } else {
        console.error('Error data:', error.response.data);
      }
    }
    
    throw error;
  }
};

// Lấy nội dung file hợp đồng
const getContractFileContent = async (contractId) => {
  try {
    const response = await axios.get(
      `${API_URL}/contracts/${contractId}/content`, 
      getHeaders()
    );
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy nội dung file hợp đồng ID ${contractId}:`, error);
    throw error;
  }
};

// Cập nhật nội dung hợp đồng
const updateContractContent = async (contractId, content) => {
  try {
    const response = await axios.put(
      `${API_URL}/contracts/${contractId}/content`, 
      { content },
      getHeaders()
    );
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi cập nhật nội dung hợp đồng ID ${contractId}:`, error);
    throw error;
  }
};

export { 
  getContracts, 
  getAllContracts,
  getContractById, 
  createContract, 
  updateContract, 
  deleteContract, 
  downloadContractFile,
  getContractFileContent,
  updateContractContent
}; 