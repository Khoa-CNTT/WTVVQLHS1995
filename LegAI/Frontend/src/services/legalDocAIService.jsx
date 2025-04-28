import aiService from './aiService';
import * as legalDocService from './legalDocService';

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

    // Lấy thông tin chi tiết của tài liệu nếu cần
    let docDetails = document;
    
    // Nếu chưa có thông tin chi tiết, gọi API để lấy
    if (!document.content && !document.description) {
      try {
        const response = await legalDocService.getLegalDocById(document.id);
        if (response && response.data) {
          docDetails = response.data;
        }
      } catch (error) {
        console.warn('Không thể lấy thông tin chi tiết của tài liệu:', error);
      }
    }

    // Chuẩn bị prompt cho AI
    const prompt = `Bạn là LegAI, trợ lý phân tích tài liệu pháp lý thông minh. Hãy phân tích tài liệu sau và cung cấp:
    1. Tóm tắt ngắn gọn về nội dung chính (3-5 câu)
    2. Liệt kê 5-8 từ khóa chính 
    3. Xác định các thực thể quan trọng (tên người, tổ chức, địa điểm, số hiệu văn bản, v.v.)
    4. Đề xuất hành động tiếp theo hoặc lưu ý quan trọng
    
    Thông tin về tài liệu:
    - Tiêu đề: ${docDetails.title}
    - Loại tài liệu: ${docDetails.file_type}
    - Mô tả: ${docDetails.description || 'Không có mô tả'}
    - Danh mục: ${docDetails.category || 'Chưa phân loại'}
    ${docDetails.content ? `- Nội dung: ${docDetails.content}` : ''}
    
    Phản hồi theo cấu trúc JSON với các trường: summary, keywords (array), entities (array với mỗi phần tử có text và type), recommendations (array).`;

    // Gọi API AI để phân tích
    const aiResponse = await aiService.sendMessageToAI(prompt);
    
    // Xử lý phản hồi từ AI
    let parsedResponse;
    try {
      // Cố gắng trích xuất JSON từ phản hồi
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                        aiResponse.match(/\{[\s\S]*\}/);
                        
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : aiResponse;
      parsedResponse = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Lỗi khi phân tích phản hồi từ AI:', parseError);
      
      // Nếu không phân tích được JSON, tạo cấu trúc dữ liệu thủ công
      parsedResponse = {
        summary: aiResponse.substring(0, 300) + '...',
        keywords: ['tài liệu pháp lý'],
        entities: [],
        recommendations: ['Vui lòng xem xét nội dung đầy đủ của tài liệu']
      };
    }

    // Cập nhật metadata của tài liệu
    try {
      await legalDocService.updateLegalDoc(document.id, {
        metadata: {
          analyzed: true,
          analysis_date: new Date().toISOString(),
          ...parsedResponse
        }
      });
    } catch (updateError) {
      console.warn('Không thể cập nhật metadata của tài liệu:', updateError);
    }

    // Trả về kết quả phân tích
    return {
      success: true,
      data: {
        metadata: {
          analyzed: true,
          summary: parsedResponse.summary || 'Không có tóm tắt',
          keywords: parsedResponse.keywords || [],
          entities: parsedResponse.entities || [],
          recommendations: parsedResponse.recommendations || []
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