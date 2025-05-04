import axios from 'axios';
import { API_URL } from '../config/constants';
import aiService from './aiService';
import legalService from './legalService';

// Lấy token xác thực từ localStorage (nếu có)
const getToken = () => {
  return localStorage.getItem('token');
};

// Cấu hình headers cho request
const getHeaders = () => {
  const token = getToken();
  return {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  };
};

/**
 * Lấy phiên bản trước đó của văn bản pháp luật
 * @param {number|string} documentId - ID của văn bản
 * @returns {Promise<Array>} - Danh sách các phiên bản
 */
const getPreviousVersions = async (documentId) => {
  try {
    const response = await axios.get(`${API_URL}/legal/documents/${documentId}/versions`, getHeaders());
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy các phiên bản trước:', error);
    
    // Trả về mảng trống nếu API chưa được triển khai
    return { 
      status: 'success', 
      data: [] 
    };
  }
};

/**
 * So sánh nội dung giữa hai văn bản
 * @param {string} currentContent - Nội dung văn bản hiện tại
 * @param {string} previousContent - Nội dung văn bản trước đó
 * @returns {Promise<Object>} - Kết quả so sánh
 */
const compareContents = async (currentContent, previousContent) => {
  try {
    console.log('Phân tích sự khác biệt giữa hai văn bản...');
    
    // Chuẩn hóa nội dung cho việc so sánh
    const normalizeForComparison = (content) => {
      // Thay thế các thẻ HTML phổ biến bằng các ký tự đặc biệt để dễ so sánh
      return content
        .replace(/<br\s*\/?>/gi, '\n')  // Thay <br> bằng xuống dòng
        .replace(/<\/p>\s*<p>/gi, '\n\n')  // Thay </p><p> bằng 2 dòng trống
        .replace(/<\/?[^>]+(>|$)/g, ''); // Loại bỏ tất cả HTML tags
    };
    
    // Nội dung chuẩn hóa để so sánh
    const normalizedCurrent = normalizeForComparison(currentContent);
    const normalizedPrevious = normalizeForComparison(previousContent);
    
    // Hàm tách đoạn văn thành các phần nhỏ hơn để so sánh
    const tokenizeContent = (text) => {
      // Tách theo đoạn văn
      const paragraphs = text.split(/\n{2,}/);
      // Tạo mảng lưu trữ các phần nhỏ hơn
      const tokens = [];
      
      paragraphs.forEach((paragraph, index) => {
        // Nếu đoạn văn quá dài, chia thành các câu
        if (paragraph.length > 300) {
          // Tách thành các câu (kết thúc bằng dấu chấm, dấu chấm hỏi, dấu chấm than và có khoảng trắng hoặc xuống dòng phía sau)
          const sentences = paragraph.split(/([.!?][\s\n])/);
          let currentSentence = '';
          
          for (let i = 0; i < sentences.length; i++) {
            currentSentence += sentences[i];
            
            // Khi đủ độ dài hoặc gặp dấu kết thúc câu, thêm vào tokens
            if (currentSentence.length > 100 || i === sentences.length - 1 || 
                (sentences[i].match(/[.!?][\s\n]/) && currentSentence.length > 30)) {
              if (currentSentence.trim()) {
                tokens.push({
                  content: currentSentence.trim(),
                  type: 'sentence',
                  paragraphIndex: index
                });
              }
              currentSentence = '';
            }
          }
        } 
        // Nếu đoạn văn ngắn, giữ nguyên
        else if (paragraph.trim()) {
          tokens.push({
            content: paragraph.trim(),
            type: 'paragraph',
            paragraphIndex: index
          });
        }
      });
      
      return tokens;
    };
    
    // Tách văn bản thành các phần nhỏ để so sánh
    const currentTokens = tokenizeContent(normalizedCurrent);
    const previousTokens = tokenizeContent(normalizedPrevious);
    
    // Tìm nội dung chính xác trong HTML gốc
    const findOriginalHtml = (searchText, htmlContent) => {
      // Loại bỏ các ký tự đặc biệt và khoảng trắng để tạo regex pattern
      const escapeRegExp = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      };
      
      // Tạo regex pattern linh hoạt để tìm nội dung trong HTML
      const pattern = escapeRegExp(searchText)
        .replace(/\s+/g, '\\s*') // Cho phép số lượng khoảng trắng linh hoạt
        .replace(/\n/g, '\\s*'); // Cho phép xuống dòng
      
      const regex = new RegExp(`(.{0,100}${pattern}.{0,100})`, 'is');
      const match = htmlContent.match(regex);
      
      if (match && match[1]) {
        // Tìm đoạn HTML bao quanh nội dung
        let htmlSnippet = match[1];
        
        // Mở rộng để lấy thẻ HTML đầy đủ
        const startTagIndex = htmlContent.lastIndexOf('<', htmlContent.indexOf(match[1]));
        const endTagIndex = htmlContent.indexOf('>', htmlContent.indexOf(match[1]) + match[1].length) + 1;
        
        if (startTagIndex !== -1 && endTagIndex !== -1) {
          // Cố gắng lấy phần tử HTML hoàn chỉnh
          htmlSnippet = htmlContent.substring(startTagIndex, endTagIndex);
          
          // Kiểm tra tính hợp lệ của HTML
          if (htmlSnippet.match(/<[^>]+>/)) {
            return htmlSnippet;
          }
        }
        
        // Nếu không tìm thấy thẻ hoàn chỉnh, bọc nội dung trong <p>
        return `<p>${match[1]}</p>`;
      }
      
      // Trả về nội dung gốc nếu không tìm thấy
      return `<p>${searchText}</p>`;
    };
    
    // Tìm các phần thêm mới
    const additions = [];
    currentTokens.forEach(currentToken => {
      // Tính điểm tương đồng tối đa với các token của văn bản trước
      let maxSimilarity = 0;
      
      previousTokens.forEach(prevToken => {
        // Tính độ tương đồng
        const similarity = similarityScore(currentToken.content, prevToken.content);
        maxSimilarity = Math.max(maxSimilarity, similarity);
      });
      
      // Nếu độ tương đồng thấp (dưới 60%), coi là phần thêm mới
      if (maxSimilarity < 0.6) {
        // Tìm đoạn HTML gốc tương ứng
        const originalHtml = findOriginalHtml(currentToken.content, currentContent);
        
        additions.push({
          content: originalHtml,
          location: `Đoạn ${currentToken.paragraphIndex + 1}`
        });
      }
    });
    
    // Tìm các phần đã xóa
    const deletions = [];
    previousTokens.forEach(prevToken => {
      // Tính điểm tương đồng tối đa với các token của văn bản hiện tại
      let maxSimilarity = 0;
      
      currentTokens.forEach(currentToken => {
        // Tính độ tương đồng
        const similarity = similarityScore(prevToken.content, currentToken.content);
        maxSimilarity = Math.max(maxSimilarity, similarity);
      });
      
      // Nếu độ tương đồng thấp (dưới 60%), coi là phần đã xóa
      if (maxSimilarity < 0.6) {
        // Tìm đoạn HTML gốc tương ứng
        const originalHtml = findOriginalHtml(prevToken.content, previousContent);
        
        deletions.push({
          content: originalHtml,
          location: `Đoạn ${prevToken.paragraphIndex + 1} (trong văn bản cũ)`
        });
      }
    });
    
    // Tìm các phần đã sửa đổi
    const modifications = [];
    currentTokens.forEach(currentToken => {
      previousTokens.forEach(prevToken => {
        // Tính độ tương đồng
        const similarity = similarityScore(currentToken.content, prevToken.content);
        
        // Nếu có độ tương đồng vừa phải (từ 0.6 đến 0.85), coi là phần sửa đổi
        if (similarity >= 0.6 && similarity <= 0.85) {
          // Tìm HTML gốc cho cả phiên bản cũ và mới
          const oldHtmlContent = findOriginalHtml(prevToken.content, previousContent);
          const newHtmlContent = findOriginalHtml(currentToken.content, currentContent);
          
          modifications.push({
            oldContent: oldHtmlContent,
            newContent: newHtmlContent,
            location: `Đoạn ${currentToken.paragraphIndex + 1} (hiện tại) / Đoạn ${prevToken.paragraphIndex + 1} (cũ)`
          });
        }
      });
    });
    
    // Tính độ tương đồng giữa hai chuỗi
    function similarityScore(s1, s2) {
      if (!s1 || !s2) return 0;
      
      const longer = s1.length > s2.length ? s1 : s2;
      const shorter = s1.length > s2.length ? s2 : s1;
      
      if (longer.length === 0) {
        return 1.0;
      }
      
      return (longer.length - editDistance(longer, shorter)) / longer.length;
    }
    
    // Tính khoảng cách Levenshtein
    function editDistance(s1, s2) {
      s1 = s1.toLowerCase();
      s2 = s2.toLowerCase();
      
      const costs = [];
      
      for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
          if (i === 0) {
            costs[j] = j;
          } else if (j > 0) {
            let newValue = costs[j - 1];
            if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            }
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
        if (i > 0) {
          costs[s2.length] = lastValue;
        }
      }
      
      return costs[s2.length];
    }
    
    // Tạo tóm tắt
    const summary = `<p>Phân tích văn bản với độ chính xác cao đã tìm thấy:</p>
    <ul>
      <li><strong>${additions.length}</strong> phần thêm mới</li>
      <li><strong>${deletions.length}</strong> phần đã xóa</li>
      <li><strong>${modifications.length}</strong> phần được sửa đổi</li>
    </ul>
    <p><strong>Lưu ý:</strong> Hệ thống đã phân tích cả những thay đổi nhỏ và cố gắng hiển thị chính xác các thay đổi giữa hai phiên bản.</p>`;
    
    console.log('Phân tích văn bản hoàn tất.');
    return {
      status: 'success',
      data: {
        additions,
        deletions,
        modifications,
        summary
      }
    };
    
  } catch (error) {
    console.error('Lỗi khi so sánh nội dung:', error);
    throw new Error('Không thể so sánh văn bản. Vui lòng thử lại sau.');
  }
};

/**
 * Lấy các văn bản tương tự bằng cách phân tích nội dung từ AI
 * @param {string} documentTitle - Tiêu đề văn bản
 * @param {object} currentDocument - Dữ liệu của văn bản hiện tại
 * @param {number} limit - Số lượng văn bản tối đa
 * @returns {Promise<Array>} - Danh sách văn bản tương tự
 */
const getSimilarDocuments = async (documentTitle, currentDocument = null, limit = 400) => {
  try {
    // Lấy tất cả văn bản có thể liên quan dựa trên tiêu đề
    const searchTerms = documentTitle.replace(/\d{4}$/, '').trim();
    
    const response = await axios.get(
      `${API_URL}/legal/search?search=${encodeURIComponent(searchTerms)}&limit=50`, 
      getHeaders()
    );
    
    if (!response.data || !response.data.status === 'success' || !response.data.data) {
      return {
        status: 'error',
        message: 'Không thể tìm thấy văn bản tương tự',
        data: []
      };
    }
    
    // Lọc bỏ văn bản hiện tại
    const allDocuments = response.data.data.filter(doc => 
      doc.title.toLowerCase() !== documentTitle.toLowerCase()
    );
    
    // Nếu có nội dung của văn bản hiện tại, sử dụng AI để phân tích
    if (currentDocument && currentDocument.content && allDocuments.length > 0) {
      try {
        // Chuẩn bị dữ liệu để gửi cho AI
        const documentsList = allDocuments.map(doc => ({
          id: doc.id,
          title: doc.title,
          content_preview: doc.content ? doc.content.substring(0, 500) : ''
        }));
        
        // Tạo prompt cho AI để so sánh nội dung
        const prompt = `
        Tôi muốn tìm các văn bản pháp luật tương tự với văn bản hiện tại dựa trên nội dung.
        
        Văn bản hiện tại:
        Tiêu đề: ${documentTitle}
        Nội dung (phần đầu): ${currentDocument.content ? currentDocument.content.substring(0, 1000) : 'Không có nội dung'}
        
        Danh sách các văn bản cần so sánh:
        ${documentsList.map(doc => `ID: ${doc.id}, Tiêu đề: ${doc.title}, Nội dung (phần đầu): ${doc.content_preview}`).join('\n\n')}
        
        Hãy trả về một danh sách các ID văn bản có nội dung tương đồng với văn bản hiện tại, sắp xếp theo mức độ tương đồng từ cao xuống thấp.
        Chỉ trả về các ID mà có nội dung tương đồng ít nhất 50%.
        Cần phân tích cả nội dung chi tiết không chỉ dựa vào tiêu đề.
        
        Kết quả trả về phải theo định dạng:
        [ID1, ID2, ID3, ...]
        `;
        
        // Gọi AI để phân tích
        const aiResponse = await aiService.sendMessageToAI(prompt);
        
        // Trích xuất danh sách ID từ phản hồi AI
        let similarIds = [];
        const idsPattern = /\[(.*?)\]/;
        const match = aiResponse.match(idsPattern);
        
        if (match && match[1]) {
          similarIds = match[1].split(',')
            .map(id => id.trim().replace(/['"]/g, ''))
            .filter(id => id && !isNaN(parseInt(id)))
            .map(id => parseInt(id));
        }
        
        // Nếu AI trả về kết quả, sắp xếp lại theo thứ tự này
        if (similarIds.length > 0) {
          const similarDocs = [];
          // Gán điểm tương đồng dựa trên thứ tự từ AI (thứ tự đầu = tương đồng cao nhất)
          similarIds.forEach((id, index) => {
            const doc = allDocuments.find(d => d.id === id);
            if (doc) {
              // Tính điểm tương đồng dựa trên vị trí (thứ tự ngược)
              const similarityScore = 100 - (index * (50 / similarIds.length));
              similarDocs.push({
                ...doc,
                similarity_score: Math.round(similarityScore) // Làm tròn số
              });
            }
          });
          
          // Thêm các văn bản khác với điểm tương đồng thấp
          const remainingDocs = allDocuments.filter(doc => 
            !similarIds.includes(doc.id)
          ).map(doc => ({
            ...doc,
            similarity_score: 0
          }));
          
          return {
            status: 'success',
            data: [...similarDocs, ...remainingDocs].slice(0, limit)
          };
        }
      } catch (aiError) {
        console.error('Lỗi khi sử dụng AI để phân tích tương đồng:', aiError);
        // Nếu có lỗi với AI, tiếp tục với phương pháp thay thế bên dưới
      }
    }
    
    // Phương pháp thay thế nếu không thể sử dụng AI
    // Sắp xếp theo thứ tự từ mới đến cũ và giới hạn số lượng
    allDocuments.sort((a, b) => {
      const dateA = new Date(a.issued_date || 0);
      const dateB = new Date(b.issued_date || 0);
      return dateB - dateA;
    });
    
    // Nếu có nội dung văn bản hiện tại, sử dụng thuật toán Levenshtein để phân tích độ tương đồng
    if (currentDocument && currentDocument.content) {
      // Lấy nội dung đầy đủ của các văn bản cần so sánh
      const docsWithContent = await Promise.all(
        allDocuments.slice(0, Math.min(20, allDocuments.length)).map(async (doc) => {
          if (!doc.content && doc.id) {
            try {
              // Lấy nội dung đầy đủ nếu chưa có
              const fullDoc = await legalService.getLegalDocumentById(doc.id);
              if (fullDoc && fullDoc.status === 'success' && fullDoc.data) {
                return { ...doc, content: fullDoc.data.content };
              }
            } catch (error) {
              console.error(`Lỗi khi lấy nội dung văn bản ID ${doc.id}:`, error);
            }
          }
          return doc;
        })
      );
      
      // Phân tích độ tương đồng và sắp xếp kết quả
      const docsWithSimilarity = analyzeSimilarityByAlgorithm(currentDocument, docsWithContent);
      
      // Kết hợp với các văn bản khác không có trong phân tích
      const otherDocs = allDocuments.filter(doc => 
        !docsWithSimilarity.some(d => d.id === doc.id)
      ).map(doc => ({ ...doc, similarity_score: 0 }));
      
      return {
        status: 'success',
        data: [...docsWithSimilarity, ...otherDocs].slice(0, limit)
      };
    }
    
    return {
      status: 'success',
      data: allDocuments.slice(0, limit)
    };
  } catch (error) {
    console.error('Lỗi khi tìm kiếm văn bản tương tự:', error);
    return {
      status: 'error',
      message: 'Lỗi khi tìm kiếm văn bản tương tự',
      data: []
    };
  }
};

/**
 * Lấy các văn bản tương tự bằng cách truy vấn trực tiếp từ database
 * @param {string} documentId - ID của văn bản hiện tại
 * @param {number} limit - Số lượng văn bản tối đa
 * @returns {Promise<Object>} - Danh sách văn bản tương tự
 */
const getSimilarDocumentsFromDatabase = async (documentId, limit = 20) => {
  try {
    const headers = getHeaders();
    console.log(`Đang tìm kiếm văn bản tương tự cho ID: ${documentId}`);

    try {
      // Thử gọi API từ backend - nếu API này chưa được triển khai sẽ nhảy vào catch
      const response = await axios.get(`${API_URL}/legal/documents/${documentId}/similar?limit=${limit}`, headers);
      
      if (response.data && response.data.status === 'success') {
        return response.data;
      }
      throw new Error('API không trả về kết quả hợp lệ');
    } catch (apiError) {
      console.log('API văn bản tương tự chưa sẵn sàng, sử dụng phương pháp client-side fallback');

      // Nếu API chưa sẵn sàng, thực hiện tìm kiếm thủ công phía client
      // Bước 1: Lấy thông tin văn bản hiện tại
      const currentDocResponse = await legalService.getLegalDocumentById(documentId);
      if (!currentDocResponse || currentDocResponse.status !== 'success') {
        throw new Error('Không thể lấy thông tin văn bản hiện tại');
      }
      
      const currentDocument = currentDocResponse.data;
      
      // Bước 2: Lấy tất cả văn bản có cùng loại
      const allDocsResponse = await legalService.getLegalDocuments({
        document_type: currentDocument.document_type,
        limit: 100 // Tăng lên để có nhiều văn bản hơn để so sánh
      });
      
      if (!allDocsResponse || allDocsResponse.status !== 'success') {
        throw new Error('Không thể lấy danh sách văn bản');
      }
      
      // Bước 3: Lọc ra các văn bản khác với văn bản hiện tại
      let similarDocuments = allDocsResponse.data.filter(doc => 
        doc.id !== parseInt(documentId) && 
        doc.id.toString() !== documentId &&
        // Thêm điều kiện để văn bản phải cũ hơn văn bản hiện tại
        new Date(doc.issued_date) <= new Date(currentDocument.issued_date)
      );
      
      // Bước 4: Tính toán điểm tương đồng tiêu đề cho mỗi văn bản
      const calculateTitleSimilarity = (title1, title2) => {
        if (!title1 || !title2) return 0;
        
        // Chuẩn hóa tiêu đề
        const normalize = (title) => {
          return title.toLowerCase()
                    .replace(/[.,(){}[\]\/\-:;]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
        };
        
        const normalizedTitle1 = normalize(title1);
        const normalizedTitle2 = normalize(title2);
        
        // Tách thành các từ
        const words1 = normalizedTitle1.split(' ');
        const words2 = normalizedTitle2.split(' ');
        
        // Đếm số từ trùng
        let matchingWords = 0;
        
        words1.forEach(w1 => {
          if (words2.includes(w1)) {
            matchingWords++;
          }
        });
        
        // Tính tỷ lệ % số từ trùng trên tổng số từ
        const totalWords = Math.max(words1.length, words2.length);
        return totalWords > 0 ? (matchingWords / totalWords) * 100 : 0;
      };
      
      // Trích xuất số hiệu từ tiêu đề (nếu có) cho việc so sánh
      const extractNumberCode = (title) => {
        // Tìm các mã số, số hiệu trong tiêu đề
        const matches = title.match(/\d+\/\d+|[0-9]+[A-Za-z]+[0-9]+|\b\d{2,}\/\d{4}\b|\b\d{4}\/\d{2,}\b/g);
        return matches ? matches : [];
      };
      
      // Tính điểm tương đồng cho mỗi văn bản
      similarDocuments.forEach(doc => {
        // Tính điểm tương đồng tiêu đề
        const titleSimilarity = calculateTitleSimilarity(currentDocument.title, doc.title);
        
        // Kiểm tra số hiệu (nếu có)
        const currentNumberCodes = extractNumberCode(currentDocument.title);
        const docNumberCodes = extractNumberCode(doc.title);
        
        // Nếu cả hai văn bản có số hiệu và có ít nhất một số hiệu trùng nhau, tăng điểm tương đồng
        let codeMatch = 0;
        if (currentNumberCodes.length > 0 && docNumberCodes.length > 0) {
          for (const code1 of currentNumberCodes) {
            for (const code2 of docNumberCodes) {
              if (code1 === code2) {
                codeMatch = 1;
                break;
              }
            }
            if (codeMatch) break;
          }
        }
        
        // Tính điểm tương đồng tổng hợp
        // Giảm ngưỡng tìm kiếm từ 85 xuống 25 để có nhiều kết quả hơn
        const similarityScore = titleSimilarity * 0.8 + codeMatch * 20;
        
        // Đánh giá độ tương đồng
        doc.similarity_score = similarityScore;
        doc.has_code_match = codeMatch > 0;
      });
      
      // Bước 5: Sắp xếp theo điểm tương đồng và chọn top n kết quả
      similarDocuments = similarDocuments
        .filter(doc => doc.similarity_score >= 25) // Giảm ngưỡng từ 60 xuống 25
        .sort((a, b) => {
          // Ưu tiên sắp xếp theo thời gian, gần nhất lên đầu
          if (Math.abs(a.similarity_score - b.similarity_score) < 10) {
            return new Date(b.issued_date) - new Date(a.issued_date);
          }
          // Nếu độ tương đồng chênh lệch nhiều, sắp xếp theo độ tương đồng
          return b.similarity_score - a.similarity_score;
        })
        .slice(0, limit);
      
      console.log(`Tìm thấy ${similarDocuments.length} văn bản tương tự`);
      
      return {
        status: 'success',
        data: similarDocuments,
        needFallback: false
      };
    }
  } catch (error) {
    console.error('Lỗi khi tìm kiếm văn bản tương tự:', error);
    return {
      status: 'error',
      message: 'Không thể tìm kiếm văn bản tương tự',
      needFallback: true
    };
  }
};

/**
 * Phân tích sự khác biệt giữa hai văn bản
 * @param {Object} currentDocument - Văn bản hiện tại
 * @param {Object} previousDocument - Văn bản trước đó
 * @returns {Promise<Object>} - Kết quả phân tích
 */
const analyzeDocumentDifferences = async (currentDocument, previousDocument) => {
  try {
    if (!currentDocument || !previousDocument) {
      throw new Error('Thiếu thông tin văn bản để so sánh');
    }
    
    // Kiểm tra các trường bắt buộc
    if (!currentDocument.content) {
      console.warn('Văn bản hiện tại không có nội dung');
      currentDocument.content = '';
    }
    
    if (!previousDocument.content) {
      console.warn('Văn bản so sánh không có nội dung');
      previousDocument.content = '';
    }
    
    // Đảm bảo các trường cơ bản tồn tại
    const safeCurrentDoc = {
      id: currentDocument.id || 'unknown',
      title: currentDocument.title || 'Không có tiêu đề',
      document_type: currentDocument.document_type || 'Không xác định',
      issued_date: currentDocument.issued_date || null,
      version: currentDocument.version || 'Hiện hành',
      content: currentDocument.content || ''
    };
    
    const safePreviousDoc = {
      id: previousDocument.id || 'unknown',
      title: previousDocument.title || 'Không có tiêu đề',
      document_type: previousDocument.document_type || 'Không xác định',
      issued_date: previousDocument.issued_date || null,
      version: previousDocument.version || 'Phiên bản trước',
      content: previousDocument.content || ''
    };
    
    // Kiểm tra độ tương đồng cơ bản
    const isSameDocumentType = safeCurrentDoc.document_type === safePreviousDoc.document_type;
    
    // Tính độ tương đồng tiêu đề
    const calculateTitleSimilarity = (title1, title2) => {
      if (!title1 || !title2) return 0;
      
      // Chuẩn hóa tiêu đề
      const normalize = (title) => {
        return title.toLowerCase()
          .replace(/[.,(){}[\]\/\-:;]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      };
      
      const normalizedTitle1 = normalize(title1);
      const normalizedTitle2 = normalize(title2);
      
      // Tách thành các từ
      const words1 = normalizedTitle1.split(' ');
      const words2 = normalizedTitle2.split(' ');
      
      // Đếm số từ trùng
      let matchingWords = 0;
      words1.forEach(w1 => {
        if (words2.includes(w1)) {
          matchingWords++;
        }
      });
      
      // Tính tỷ lệ % số từ trùng
      return Math.round((matchingWords / Math.max(words1.length, words2.length)) * 100);
    };
    
    const titleSimilarity = calculateTitleSimilarity(safeCurrentDoc.title, safePreviousDoc.title);
    
    // So sánh nội dung
    const contentCompare = await compareContents(
      safeCurrentDoc.content, 
      safePreviousDoc.content
    );
    
    // Thêm cảnh báo nếu văn bản quá khác nhau
    let warningMessage = '';
    if (!isSameDocumentType) {
      warningMessage += `<div class="warning-message"><strong>Cảnh báo:</strong> Đang so sánh hai loại văn bản khác nhau (${safeCurrentDoc.document_type} và ${safePreviousDoc.document_type}).</div>`;
    }
    
    if (titleSimilarity < 50) {
      warningMessage += `<div class="warning-message"><strong>Cảnh báo:</strong> Hai văn bản có tiêu đề khá khác nhau (chỉ giống ${titleSimilarity}%).</div>`;
    }
    
    // Bổ sung cảnh báo vào phần tóm tắt
    let summary = contentCompare.data.summary;
    if (warningMessage) {
      summary = warningMessage + summary;
    }
    
    // Tạo phân tích tổng hợp
    return {
      status: 'success',
      data: {
        documentsInfo: {
          current: {
            id: safeCurrentDoc.id,
            title: safeCurrentDoc.title,
            document_type: safeCurrentDoc.document_type,
            issued_date: safeCurrentDoc.issued_date,
            version: safeCurrentDoc.version
          },
          previous: {
            id: safePreviousDoc.id,
            title: safePreviousDoc.title,
            document_type: safePreviousDoc.document_type,
            issued_date: safePreviousDoc.issued_date,
            version: safePreviousDoc.version
          },
          similarity: {
            isSameType: isSameDocumentType,
            titleSimilarity: titleSimilarity
          }
        },
        comparison: {
          ...contentCompare.data,
          summary
        }
      }
    };
  } catch (error) {
    console.error('Lỗi khi phân tích sự khác biệt:', error);
    return {
      status: 'error',
      message: error.message || 'Lỗi khi phân tích sự khác biệt',
      data: null
    };
  }
};

/**
 * Tính độ tương đồng giữa hai chuỗi sử dụng độ đo Levenshtein Distance
 * @param {string} str1 - Chuỗi thứ nhất
 * @param {string} str2 - Chuỗi thứ hai
 * @returns {number} - Độ tương đồng, nằm trong khoảng 0-100
 */
const calculateSimilarity = (str1 = '', str2 = '') => {
  if (!str1 || !str2) return 0;
  
  // Chuẩn hóa chuỗi
  const text1 = str1.toLowerCase().replace(/\s+/g, ' ').trim();
  const text2 = str2.toLowerCase().replace(/\s+/g, ' ').trim();
  
  // Nếu hai chuỗi giống nhau
  if (text1 === text2) return 100;
  
  // Độ dài lớn nhất giữa hai chuỗi
  const maxLength = Math.max(text1.length, text2.length);
  if (maxLength === 0) return 100;
  
  // Tính khoảng cách Levenshtein
  const levenshteinDistance = (s1, s2) => {
    const m = s1.length;
    const n = s2.length;
    
    // Ma trận khoảng cách
    const d = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
    
    // Khởi tạo
    for (let i = 0; i <= m; i++) d[i][0] = i;
    for (let j = 0; j <= n; j++) d[0][j] = j;
    
    // Fill the matrix
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = s1[i-1] === s2[j-1] ? 0 : 1;
        d[i][j] = Math.min(
          d[i-1][j] + 1,      // deletion
          d[i][j-1] + 1,      // insertion
          d[i-1][j-1] + cost  // substitution
        );
      }
    }
    
    return d[m][n];
  };
  
  // Tính khoảng cách
  const distance = levenshteinDistance(text1, text2);
  
  // Tính độ tương đồng (100% - tỷ lệ khác biệt)
  return Math.round((1 - distance / maxLength) * 100);
};

/**
 * Phân tích độ tương đồng dựa trên thuật toán, không sử dụng AI
 */
const analyzeSimilarityByAlgorithm = (currentDocument, documentsList) => {
  if (!currentDocument || !currentDocument.content) return documentsList;
  
  // Lấy mẫu nội dung từ văn bản hiện tại
  const currentContent = currentDocument.content.substring(0, 3000);
  
  // Tính điểm tương đồng cho từng văn bản
  return documentsList.map(doc => {
    // Lấy mẫu nội dung từ văn bản so sánh
    const docContent = doc.content ? doc.content.substring(0, 3000) : '';
    
    // Tính điểm tương đồng
    const similarity = calculateSimilarity(currentContent, docContent);
    
    // Tính điểm tương đồng của tiêu đề
    const titleSimilarity = calculateSimilarity(currentDocument.title, doc.title);
    
    // Tính điểm tương đồng tổng hợp (nội dung quan trọng hơn tiêu đề)
    const combinedScore = docContent ? (similarity * 0.7 + titleSimilarity * 0.3) : titleSimilarity;
    
    return {
      ...doc,
      similarity_score: Math.round(combinedScore)
    };
  }).sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0));
};

export default {
  getPreviousVersions,
  compareContents,
  getSimilarDocuments,
  analyzeDocumentDifferences,
  analyzeSimilarityByAlgorithm,
  getSimilarDocumentsFromDatabase
}; 