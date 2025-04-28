import aiService from './aiService';
import * as legalDocService from './legalDocService';

/**
 * Kiểm tra file có phải là hình ảnh không
 * @param {string} fileType - Loại file
 * @returns {boolean} - True nếu là file hình ảnh
 */
const isImageFile = (fileType) => {
  const type = fileType ? fileType.toLowerCase() : '';
  return ['jpg', 'jpeg', 'png', 'gif'].includes(type);
};

/**
 * Phân tích tài liệu pháp lý bằng AI
 * @param {Object} document - Thông tin tài liệu pháp lý cần phân tích
 * @returns {Promise<Object>} - Kết quả phân tích dưới dạng cấu trúc đã xử lý
 */
export const analyzeLegalDocument = async (document) => {
  try {
    if (!document || !document.id) {
      throw new Error('Tài liệu không hợp lệ để phân tích');
    }

    // Kiểm tra nếu là file hình ảnh, từ chối phân tích
    if (isImageFile(document.file_type)) {
      return {
        success: false,
        message: 'Không hỗ trợ phân tích file hình ảnh. Vui lòng chuyển đổi sang định dạng PDF hoặc DOCX.'
      };
    }

    console.log('Bắt đầu phân tích tài liệu:', document.id);
    
    // Gọi API backend để phân tích tài liệu
    const response = await legalDocService.analyzeLegalDoc(document.id);
    
    if (!response.success) {
      throw new Error(response.message || 'Không thể phân tích tài liệu');
    }
    
    // Định dạng lại phản hồi từ API
    const analysisData = response.data;
    
    // Đảm bảo rằng có đủ dữ liệu để hiển thị
    return {
      success: true,
      data: {
        metadata: {
          analyzed: true,
          analyzed_at: new Date().toISOString(),
          summary: analysisData.summary || 'Không có tóm tắt',
          keywords: analysisData.keywords || [],
          document_type: analysisData.document_type || 'Không xác định',
          entities: analysisData.entities || [],
          recommendations: analysisData.recommendations || ''
        }
      }
    };
  } catch (error) {
    console.error('Lỗi khi phân tích tài liệu:', error);
    return {
      success: false,
      message: error.message || 'Có lỗi xảy ra khi phân tích tài liệu'
    };
  }
};

/**
 * Tạo tóm tắt ngắn gọn cho tài liệu pháp lý
 * @param {Object} document - Thông tin tài liệu pháp lý cần tóm tắt
 * @returns {Promise<string>} - Tóm tắt ngắn gọn
 */
export const generateDocumentSummary = async (document) => {
  try {
    if (!document || (!document.content && !document.description)) {
      return 'Không đủ thông tin để tạo tóm tắt';
    }

    const prompt = `Tóm tắt ngắn gọn nội dung chính của tài liệu pháp lý sau trong 2-3 câu:
    - Tiêu đề: ${document.title}
    - Loại tài liệu: ${document.file_type}
    - Mô tả: ${document.description || 'Không có mô tả'}
    ${document.content ? `- Nội dung: ${document.content}` : ''}`;

    const aiResponse = await aiService.sendMessageToAI(prompt);
    return aiResponse;
  } catch (error) {
    console.error('Lỗi khi tạo tóm tắt tài liệu:', error);
    return 'Không thể tạo tóm tắt';
  }
};

/**
 * Trích xuất từ khóa từ tài liệu pháp lý
 * @param {Object} document - Thông tin tài liệu pháp lý
 * @returns {Promise<Array<string>>} - Danh sách từ khóa
 */
export const extractKeywords = async (document) => {
  try {
    if (!document || (!document.content && !document.description)) {
      return ['không đủ thông tin'];
    }

    const prompt = `Trích xuất 5-7 từ khóa quan trọng nhất từ tài liệu pháp lý sau (chỉ trả về danh sách từ khóa, không có giải thích):
    - Tiêu đề: ${document.title}
    - Mô tả: ${document.description || 'Không có mô tả'}
    ${document.content ? `- Nội dung: ${document.content}` : ''}`;

    const aiResponse = await aiService.sendMessageToAI(prompt);
    
    // Xử lý phản hồi để trích xuất danh sách từ khóa
    const keywords = aiResponse
      .split(/[,\n]/)
      .map(keyword => keyword.trim())
      .filter(keyword => keyword && !keyword.startsWith('-') && !keyword.startsWith('*'))
      .map(keyword => keyword.replace(/^\d+\.\s*/, '').replace(/["']/g, ''));
    
    return keywords;
  } catch (error) {
    console.error('Lỗi khi trích xuất từ khóa:', error);
    return ['không thể trích xuất'];
  }
};

export default {
  analyzeLegalDocument,
  generateDocumentSummary,
  extractKeywords
}; 