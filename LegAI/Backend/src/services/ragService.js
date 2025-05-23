// src/services/ragService.js
const fs = require('fs').promises;
const path = require('path');
// Thay thế hnswlib-node bằng triển khai đơn giản hơn
const { HierarchicalNSW } = require('../utils/simpleVectorStore');
// Sửa lại cách import từ @xenova/transformers
const { pipeline } = require('@xenova/transformers');
const pool = require('../config/database');
const simpleVectorStore = require('../utils/simpleVectorStore');

// Đường dẫn đến file JSON chứa dữ liệu pháp luật
const LEGAL_DATA_PATH = path.join(__dirname, '../data/legal_data.json');

// Kích thước vector của mô hình embedding
const VECTOR_SIZE = 384; // Phù hợp với mô hình sentence-transformers

// Số lượng neighbors trả về khi tìm kiếm (k trong kNN)
const TOP_K = 5;

// Số lượng phần tử tối đa có thể lưu trữ trong index
const MAX_ELEMENTS = 100000;

// Biến lưu trữ index và dữ liệu
let vectorIndex = null;
let legalData = null;
let documentMap = {};
let embeddingModel = null;

/**
 * Khởi tạo mô hình embedding
 * @returns {Promise<void>}
 */
const initEmbeddingModel = async () => {
  if (!embeddingModel) {
    try {
      // Sử dụng pipeline thay vì Embeddings constructor
      embeddingModel = await pipeline('feature-extraction', 'Xenova/multilingual-e5-small');
      console.log('Đã khởi tạo mô hình embedding thành công');
    } catch (error) {
      console.error('Lỗi khi khởi tạo mô hình embedding:', error);
      throw error;
    }
  }
};

/**
 * Tạo embedding cho văn bản
 * @param {string} text - Văn bản cần tạo embedding
 * @returns {Promise<Float32Array>} - Vector embedding
 */
const createEmbedding = async (text) => {
  try {
    if (!embeddingModel) await initEmbeddingModel();
    
    // Chuẩn bị văn bản (cắt ngắn nếu quá dài)
    const truncatedText = text.length > 2000 
      ? text.substring(0, 2000) 
      : text;
    
    // Tạo embedding sử dụng API mới của pipeline
    const result = await embeddingModel(truncatedText, { pooling: 'mean', normalize: true });
    return result.data;
  } catch (error) {
    console.error('Lỗi khi tạo embedding:', error);
    throw error;
  }
};

/**
 * Tải dữ liệu pháp luật từ file JSON
 * @returns {Promise<Object>} - Dữ liệu pháp luật đã tải
 */
const loadLegalData = async () => {
  try {
    // Nếu đã tải dữ liệu rồi thì trả về luôn
    if (legalData) return legalData;
    
    // Kiểm tra thư mục data có tồn tại không, nếu không thì tạo
    const dataDir = path.join(__dirname, '../data');
    try {
      await fs.access(dataDir);
    } catch {
      console.log('Thư mục data không tồn tại, đang tạo...');
      await fs.mkdir(dataDir, { recursive: true });
    }
    
    // Đường dẫn đến file dữ liệu
    const dataFilePath = path.join(dataDir, 'legal_data.json');
    
    // Đọc file JSON
    try {
      // Kiểm tra file có tồn tại không
      try {
        await fs.access(dataFilePath);
        const data = await fs.readFile(dataFilePath, 'utf8');
        legalData = JSON.parse(data);
        console.log('Đã tải dữ liệu pháp luật thành công');
      } catch {
        // Nếu file không tồn tại, tạo file với dữ liệu mẫu
        console.log('File dữ liệu pháp luật không tồn tại, đang tạo file mẫu...');
        
        // Sử dụng dữ liệu mẫu
        legalData = {
          laws: [
            {
              id: 1,
              title: "Luật Hôn nhân và Gia đình 2014",
              content: "Luật Hôn nhân và Gia đình số 52/2014/QH13 được Quốc hội thông qua ngày 19/6/2014 và có hiệu lực từ ngày 01/01/2015. Luật này quy định chế độ hôn nhân và gia đình, chuẩn mực pháp lý cho cách ứng xử của các thành viên trong gia đình; trách nhiệm của cá nhân, tổ chức, Nhà nước và xã hội trong việc xây dựng, củng cố chế độ hôn nhân và gia đình Việt Nam."
            },
            {
              id: 2,
              title: "Bộ luật Dân sự 2015",
              content: "Bộ luật Dân sự số 91/2015/QH13 được Quốc hội thông qua ngày 24/11/2015 và có hiệu lực từ ngày 01/01/2017. Bộ luật này quy định địa vị pháp lý, chuẩn mực pháp lý cho cách ứng xử của cá nhân, pháp nhân, chủ thể khác; quyền, nghĩa vụ về nhân thân và tài sản của các chủ thể trong các quan hệ dân sự, hôn nhân và gia đình, kinh doanh, thương mại, lao động."
            },
            {
              id: 3,
              title: "Luật Doanh nghiệp 2020",
              content: "Luật Doanh nghiệp số 59/2020/QH14 được Quốc hội thông qua ngày 17/6/2020 và có hiệu lực từ ngày 01/01/2021. Luật này quy định về thành lập, tổ chức quản lý, tổ chức lại, giải thể và hoạt động có liên quan của doanh nghiệp, bao gồm công ty trách nhiệm hữu hạn, công ty cổ phần, công ty hợp danh và doanh nghiệp tư nhân."
            }
          ],
          faqs: [
            {
              id: 1,
              question: "Thủ tục đăng ký kết hôn tại Việt Nam?",
              answer: "Thủ tục đăng ký kết hôn tại Việt Nam theo Luật Hôn nhân và Gia đình 2014 gồm các bước: Chuẩn bị hồ sơ (đơn đăng ký kết hôn, giấy tờ tùy thân, giấy xác nhận tình trạng hôn nhân), nộp hồ sơ tại UBND cấp xã nơi cư trú của một trong hai bên, tổ chức đăng ký kết hôn và nhận giấy chứng nhận kết hôn."
            },
            {
              id: 2,
              question: "Điều kiện thành lập doanh nghiệp tư nhân?",
              answer: "Theo Luật Doanh nghiệp 2020, để thành lập doanh nghiệp tư nhân, chủ doanh nghiệp phải là cá nhân từ đủ 18 tuổi trở lên, có năng lực hành vi dân sự đầy đủ, không thuộc đối tượng bị cấm thành lập doanh nghiệp, và không đồng thời là chủ hộ kinh doanh hoặc chủ doanh nghiệp tư nhân khác."
            },
            {
              id: 3,
              question: "Quyền thừa kế theo pháp luật Việt Nam?",
              answer: "Theo Bộ luật Dân sự 2015, thừa kế theo pháp luật được áp dụng khi người chết không để lại di chúc hoặc di chúc không hợp pháp. Thừa kế theo pháp luật được chia thành ba hàng: Hàng thừa kế thứ nhất gồm vợ, chồng, cha đẻ, mẹ đẻ, cha nuôi, mẹ nuôi, con đẻ, con nuôi; Hàng thừa kế thứ hai gồm ông nội, bà nội, ông ngoại, bà ngoại, anh ruột, chị ruột, em ruột; Hàng thừa kế thứ ba gồm cụ nội, cụ ngoại, bác ruột, chú ruột, cậu ruột, cô ruột, dì ruột, cháu ruột."
            }
          ],
          articles: [
            {
              id: 1,
              title: "Hướng dẫn đăng ký kinh doanh",
              content: "Đăng ký kinh doanh là thủ tục bắt buộc đối với mọi cá nhân, tổ chức khi bắt đầu hoạt động kinh doanh tại Việt Nam. Các bước cơ bản gồm: chuẩn bị tên doanh nghiệp, xác định loại hình doanh nghiệp, chuẩn bị hồ sơ đăng ký, nộp hồ sơ tại Phòng Đăng ký kinh doanh thuộc Sở Kế hoạch và Đầu tư, nhận giấy chứng nhận đăng ký doanh nghiệp."
            },
            {
              id: 2,
              title: "Quy trình khởi kiện dân sự",
              content: "Khởi kiện dân sự là quyền của cá nhân, tổ chức khi quyền, lợi ích hợp pháp bị xâm phạm. Quy trình khởi kiện gồm: chuẩn bị đơn khởi kiện và tài liệu, chứng cứ; nộp đơn tại Tòa án có thẩm quyền; đóng tạm ứng án phí; Tòa án thụ lý vụ án; tham gia phiên hòa giải; tham gia phiên tòa xét xử."
            }
          ]
        };
        
        // Lưu dữ liệu mẫu vào file
        await fs.writeFile(dataFilePath, JSON.stringify(legalData, null, 2), 'utf8');
        console.log('Đã tạo file dữ liệu pháp luật mẫu thành công');
      }
    } catch (readError) {
      console.error('Lỗi khi đọc/tạo file dữ liệu pháp luật:', readError);
      
      // Sử dụng dữ liệu mẫu nếu gặp lỗi
      console.log('Sử dụng dữ liệu mẫu...');
      legalData = {
        laws: [
          {
            id: 1,
            title: "Luật Hôn nhân và Gia đình 2014",
            content: "Luật Hôn nhân và Gia đình số 52/2014/QH13 được Quốc hội thông qua ngày 19/6/2014 và có hiệu lực từ ngày 01/01/2015."
          }
        ],
        faqs: [
          {
            id: 1,
            question: "Thủ tục đăng ký kết hôn tại Việt Nam?",
            answer: "Thủ tục đăng ký kết hôn tại Việt Nam theo Luật Hôn nhân và Gia đình 2014 gồm các bước: Chuẩn bị hồ sơ, nộp hồ sơ tại UBND cấp xã, tổ chức đăng ký kết hôn."
          }
        ],
        articles: [
          {
            id: 1,
            title: "Hướng dẫn đăng ký kinh doanh",
            content: "Đăng ký kinh doanh là thủ tục bắt buộc đối với mọi cá nhân, tổ chức khi bắt đầu hoạt động kinh doanh tại Việt Nam."
          }
        ]
      };
    }
    
    return legalData;
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu pháp luật:', error);
    throw new Error('Không thể tải dữ liệu pháp luật');
  }
};

/**
 * Chuẩn bị dữ liệu để tạo vector store
 * @returns {Promise<Array>} - Mảng các document để tạo vector
 */
const prepareDocuments = async () => {
  try {
    // Tải dữ liệu nếu chưa có
    if (!legalData) await loadLegalData();
    
    const documents = [];
    let docIndex = 0;
    
    // Xử lý laws (luật)
    if (legalData.laws && Array.isArray(legalData.laws)) {
      legalData.laws.forEach(law => {
        // Tách content thành các chunk nhỏ hơn nếu quá dài
        const chunks = chunkText(law.content, 1000, 200);
        chunks.forEach((chunk, i) => {
          const doc = {
            id: `law-${law.id}-chunk-${i}`,
            title: law.title,
            content: chunk,
            type: 'law',
            originalId: law.id
          };
          documentMap[docIndex] = doc;
          documents.push(doc);
          docIndex++;
        });
      });
    }
    
    // Xử lý faqs (câu hỏi thường gặp)
    if (legalData.faqs && Array.isArray(legalData.faqs)) {
      legalData.faqs.forEach(faq => {
        const doc = {
          id: `faq-${faq.id}`,
          title: faq.question,
          content: `Câu hỏi: ${faq.question}\nTrả lời: ${faq.answer}`,
          type: 'faq',
          originalId: faq.id
        };
        documentMap[docIndex] = doc;
        documents.push(doc);
        docIndex++;
      });
    }
    
    // Xử lý articles (bài viết)
    if (legalData.articles && Array.isArray(legalData.articles)) {
      legalData.articles.forEach(article => {
        // Tách content thành các chunk nhỏ hơn nếu quá dài
        const chunks = chunkText(article.content, 1000, 200);
        chunks.forEach((chunk, i) => {
          const doc = {
            id: `article-${article.id}-chunk-${i}`,
            title: article.title,
            content: chunk,
            type: 'article',
            originalId: article.id
          };
          documentMap[docIndex] = doc;
          documents.push(doc);
          docIndex++;
        });
      });
    }
    
    console.log(`Đã chuẩn bị ${documents.length} tài liệu`);
    return documents;
  } catch (error) {
    console.error('Lỗi khi chuẩn bị dữ liệu:', error);
    throw error;
  }
};

/**
 * Tách văn bản thành các chunk nhỏ hơn với overlap
 * @param {string} text - Văn bản cần tách
 * @param {number} chunkSize - Kích thước mỗi chunk
 * @param {number} overlap - Số lượng ký tự overlap giữa các chunk
 * @returns {Array<string>} - Mảng các chunk
 */
const chunkText = (text, chunkSize = 1000, overlap = 200) => {
  if (!text || text.length <= chunkSize) return [text];
  
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.substring(start, end));
    start = end - overlap;
    
    // Nếu chunk cuối quá ngắn, gộp với chunk trước đó
    if (text.length - start < chunkSize / 2) {
      chunks[chunks.length - 1] += text.substring(start);
      break;
    }
  }
  
  return chunks;
};

/**
 * Tạo vector store từ các documents
 * @returns {Promise<void>}
 */
const createVectorStore = async () => {
  try {
    // Reset vector index để tạo mới
    vectorIndex = null;
    
    // Chuẩn bị documents
    const documents = await prepareDocuments();
    
    // Khởi tạo model embedding nếu chưa có
    if (!embeddingModel) await initEmbeddingModel();
    
    // Khởi tạo HierarchicalNSW index (sử dụng SimpleVectorStore thay thế)
    vectorIndex = new HierarchicalNSW('cosine', VECTOR_SIZE);
    vectorIndex.initIndex(MAX_ELEMENTS);
    
    // Thêm các document vào index
    console.log('Bắt đầu tạo embedding và thêm vào vector store...');
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const contentForEmbedding = `${doc.title}. ${doc.content}`;
      
      try {
        // Tạo embedding cho document
        const embedding = await createEmbedding(contentForEmbedding);
        
        // Thêm embedding vào index
        vectorIndex.addPoint(embedding, i);
        
        // Báo tiến độ sau mỗi 10 document
        if ((i + 1) % 10 === 0 || i === documents.length - 1) {
          console.log(`Đã xử lý ${i + 1}/${documents.length} tài liệu`);
        }
      } catch (embeddingError) {
        console.error(`Lỗi khi tạo embedding cho tài liệu ${i}:`, embeddingError);
        // Tiếp tục với tài liệu tiếp theo
        continue;
      }
    }
    
    console.log('Đã tạo vector store thành công');
  } catch (error) {
    console.error('Lỗi khi tạo vector store:', error);
    throw error;
  }
};

/**
 * Truy vấn vector store để tìm tài liệu liên quan đến câu hỏi
 * @param {string} query - Câu hỏi của người dùng
 * @param {number} k - Số lượng kết quả trả về
 * @returns {Promise<Array>} - Mảng các tài liệu liên quan
 */
const query = async (query, k = TOP_K) => {
  try {
    // Tạo vector store nếu chưa có
    if (!vectorIndex) await createVectorStore();
    
    // Tạo embedding cho query
    const queryEmbedding = await createEmbedding(query);
    
    // Tìm kiếm các neighbor gần nhất
    const result = vectorIndex.searchKnn(queryEmbedding, k);
    
    // Lấy thông tin tài liệu từ documentMap
    const documents = result.neighbors.map(index => documentMap[index]);
    
    return documents;
  } catch (error) {
    console.error('Lỗi khi truy vấn vector store:', error);
    // Trả về mảng rỗng thay vì ném lỗi
    return [];
  }
};

/**
 * Lấy dữ liệu văn bản pháp luật để trả lời câu hỏi
 * @param {string} query - Câu hỏi của người dùng
 * @returns {Promise<Object>} Kết quả tìm kiếm
 */
const getLegalDocumentsForQuery = async (query) => {
  try {
    // Kiểm tra xem query có phải là yêu cầu về văn bản pháp luật không
    const isLegalQuery = checkIfLegalQuery(query);
    
    if (!isLegalQuery) {
      return {
        success: false,
        message: "Câu hỏi không liên quan đến văn bản pháp luật",
        data: []
      };
    }
    
    // Xử lý query để tìm kiếm hiệu quả hơn
    const { searchTerms, documentType, timeRange, documentNumber } = extractSearchParams(query);
    
    // Log thông tin tìm kiếm để debug
    console.log("Thông tin tìm kiếm:", {
      searchTerms,
      documentType,
      timeRange,
      documentNumber
    });
    
    // Tìm kiếm văn bản pháp luật từ database
    const documents = await searchLegalDocuments(searchTerms, documentType, timeRange, documentNumber);
    
    if (documents.length === 0) {
      // Nếu không tìm thấy kết quả, thử cập nhật dữ liệu mới
      await updateLatestLegalDocuments();
      
      // Tìm kiếm lại sau khi cập nhật
      const updatedDocuments = await searchLegalDocuments(searchTerms, documentType, timeRange, documentNumber);
      
      return {
        success: true,
        message: updatedDocuments.length > 0 
          ? "Đã tìm thấy văn bản pháp luật sau khi cập nhật dữ liệu" 
          : "Không tìm thấy văn bản pháp luật phù hợp",
        data: updatedDocuments
      };
    }
    
    return {
      success: true,
      message: "Đã tìm thấy văn bản pháp luật",
      data: documents
    };
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu văn bản pháp luật:", error);
    return {
      success: false,
      message: "Đã xảy ra lỗi khi truy xuất dữ liệu pháp luật",
      error: error.message
    };
  }
};

/**
 * Kiểm tra xem câu hỏi có liên quan đến văn bản pháp luật không
 * @param {string} query - Câu hỏi cần kiểm tra
 * @returns {boolean} Kết quả kiểm tra
 */
const checkIfLegalQuery = (query) => {
  if (!query) return false;
  
  const queryLower = query.toLowerCase();
  
  // Kiểm tra số hiệu văn bản
  const docNumberRegex = /(\d+)\/([A-Za-z0-9\-]+)/;
  if (docNumberRegex.test(queryLower)) {
    return true;
  }
  
  // Kiểm tra tên loại văn bản
  const docTypeRegex = /(luật|nghị định|thông tư|quyết định|nghị quyết|công văn|thông báo|chỉ thị|công điện)/i;
  if (docTypeRegex.test(queryLower)) {
    return true;
  }
  
  // Kiểm tra nếu có năm trong câu hỏi (ví dụ: năm 2025)
  const yearRegex = /năm\s+(\d{4})|(\d{4})/;
  if (yearRegex.test(queryLower) && (queryLower.includes('văn bản') || 
      docTypeRegex.test(queryLower) || 
      queryLower.includes('pháp luật'))) {
    return true;
  }
  
  const legalKeywords = [
    'luật', 'pháp luật', 'nghị định', 'thông tư', 'quyết định', 'nghị quyết',
    'văn bản', 'hiến pháp', 'bộ luật', 'điều', 'khoản', 'quy định',
    'hợp đồng', 'tranh chấp', 'khiếu nại', 'tố cáo', 'hình sự', 'dân sự',
    'hành chính', 'lao động', 'thuế', 'bảo hiểm', 'đất đai', 'thừa kế',
    'hôn nhân', 'ly hôn', 'giấy phép', 'kinh doanh', 'doanh nghiệp', 'công điện'
  ];
  
  // Kiểm tra nếu query chứa từ khóa pháp luật
  return legalKeywords.some(keyword => queryLower.includes(keyword));
};

/**
 * Trích xuất các tham số tìm kiếm từ câu hỏi
 * @param {string} query - Câu hỏi cần trích xuất
 * @returns {Object} Các tham số tìm kiếm
 */
const extractSearchParams = (query) => {
  const queryLower = query.toLowerCase();
  
  // Xác định loại văn bản
  let documentType = '';
  const docTypes = {
    'luật': 'LUẬT',
    'nghị định': 'NGHỊ ĐỊNH',
    'thông tư': 'THÔNG TƯ',
    'quyết định': 'QUYẾT ĐỊNH',
    'nghị quyết': 'NGHỊ QUYẾT',
    'công văn': 'CÔNG VĂN',
    'thông báo': 'THÔNG BÁO',
    'chỉ thị': 'CHỈ THỊ',
    'công điện': 'CÔNG ĐIỆN'
  };
  
  Object.entries(docTypes).forEach(([key, value]) => {
    if (queryLower.includes(key)) {
      documentType = value;
    }
  });
  
  // Xác định khoảng thời gian
  let timeRange = {
    fromDate: null,
    toDate: null
  };
  
  // Tìm năm trong câu hỏi (ví dụ: năm 2025)
  const yearMatch = queryLower.match(/năm\s+(\d{4})/);
  // Tìm năm độc lập trong câu hỏi (ví dụ: 2025)
  const yearOnlyMatch = !yearMatch && queryLower.match(/\b(20\d{2})\b/);
  
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    if (year >= 2000 && year <= 2100) { // Kiểm tra năm hợp lệ
      timeRange.fromDate = `${year}-01-01`;
      timeRange.toDate = `${year}-12-31`;
    }
  } else if (yearOnlyMatch) {
    const year = parseInt(yearOnlyMatch[1]);
    if (year >= 2000 && year <= 2100) { // Kiểm tra năm hợp lệ
      timeRange.fromDate = `${year}-01-01`;
      timeRange.toDate = `${year}-12-31`;
    }
  } else if (queryLower.includes('mới nhất') || 
      queryLower.includes('gần đây') || 
      queryLower.includes('mới ban hành')) {
    // Lấy văn bản trong 3 tháng gần đây
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    timeRange.fromDate = threeMonthsAgo.toISOString().split('T')[0];
  }
  
  // Tìm số hiệu văn bản (ví dụ: 319/QĐ-VPCP)
  let documentNumber = null;
  
  // Mẫu regex cho số hiệu văn bản tiếng Việt
  const docNumberPatterns = [
    /(\d+)\/(\d{4})\/([A-Za-z0-9\-]+)/i,  // Dạng 123/2025/NĐ-CP
    /(\d+)\/([A-Za-z0-9\-]+)/i,           // Dạng 123/NĐ-CP
    /(\d+)\/([A-Za-z0-9\-]+)-(\d{4})/i    // Dạng 123/NĐ-CP-2025
  ];
  
  // Tìm kiếm theo các mẫu số hiệu
  for (const pattern of docNumberPatterns) {
    const match = query.match(pattern);
    if (match) {
      documentNumber = match[0];
      console.log(`Đã tìm thấy số hiệu văn bản: ${documentNumber}`);
      break;
    }
  }
  
  // Trích xuất các từ khóa tìm kiếm
  let searchTerms = query
    .replace(/luật|nghị định|thông tư|quyết định|nghị quyết|văn bản|pháp luật|mới nhất|gần đây|năm \d{4}|công điện/gi, '')
    .trim()
    .split(/\s+/)
    .filter(term => term.length > 2);
  
  // Nếu có số hiệu văn bản, thêm vào từ khóa tìm kiếm
  if (documentNumber) {
    // Thêm số hiệu vào đầu danh sách từ khóa để ưu tiên tìm kiếm
    searchTerms.unshift(documentNumber);
    
    // Thêm các biến thể của số hiệu (không có dấu cách)
    const numberWithoutSpaces = documentNumber.replace(/\s+/g, '');
    if (numberWithoutSpaces !== documentNumber) {
      searchTerms.unshift(numberWithoutSpaces);
    }
  }
  
  // Nếu có loại văn bản, thêm vào từ khóa tìm kiếm
  if (documentType && !searchTerms.includes(documentType.toLowerCase())) {
    searchTerms.push(documentType.toLowerCase());
  }
  
  // Nếu có năm, thêm vào từ khóa tìm kiếm
  if (timeRange.fromDate) {
    const year = timeRange.fromDate.split('-')[0];
    if (!searchTerms.includes(year)) {
      searchTerms.push(year);
    }
  }
  
  console.log("Đã trích xuất các tham số tìm kiếm:", {
    searchTerms,
    documentType,
    timeRange,
    documentNumber
  });
  
  return {
    searchTerms,
    documentType,
    timeRange,
    documentNumber
  };
};

/**
 * Tìm kiếm văn bản pháp luật từ database
 * @param {Array} searchTerms - Các từ khóa tìm kiếm
 * @param {string} documentType - Loại văn bản
 * @param {Object} timeRange - Khoảng thời gian
 * @param {string} documentNumber - Số hiệu văn bản
 * @returns {Promise<Array>} Danh sách văn bản pháp luật
 */
const searchLegalDocuments = async (searchTerms, documentType, timeRange, documentNumber) => {
  try {
    console.log("Tìm kiếm văn bản pháp luật với các tham số:", {
      searchTerms,
      documentType,
      timeRange,
      documentNumber
    });
    
    let query = `
      SELECT 
        id, 
        title, 
        document_type, 
        summary,
        content,
        issued_date,
        source_url,
        document_number
      FROM LegalDocuments
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;
    
    // Nếu là tìm kiếm theo số hiệu
    if (documentNumber) {
      // Tìm kiếm chính xác hơn với số hiệu văn bản
      query += ` AND (
        document_number ILIKE $${paramIndex} OR 
        title ILIKE $${paramIndex+1} OR
        content ILIKE $${paramIndex+2}
      )`;
      queryParams.push(`%${documentNumber}%`);
      queryParams.push(`%${documentNumber}%`);
      queryParams.push(`%${documentNumber}%`);
      paramIndex += 3;
      
      console.log(`Tìm kiếm theo số hiệu: ${documentNumber}`);
    } 
    // Nếu không, tìm kiếm theo từ khóa thông thường
    else if (searchTerms && searchTerms.length > 0) {
      const searchConditions = searchTerms.map((term, index) => {
        queryParams.push(`%${term}%`);
        return `(title ILIKE $${paramIndex + index} OR content ILIKE $${paramIndex + index} OR summary ILIKE $${paramIndex + index})`;
      }).join(' AND ');
      
      query += ` AND (${searchConditions})`;
      paramIndex += searchTerms.length;
    }
    
    // Thêm điều kiện tìm kiếm theo loại văn bản
    if (documentType) {
      query += ` AND document_type = $${paramIndex}`;
      queryParams.push(documentType);
      paramIndex++;
    }
    
    // Thêm điều kiện tìm kiếm theo khoảng thời gian
    if (timeRange.fromDate) {
      query += ` AND issued_date >= $${paramIndex}`;
      queryParams.push(timeRange.fromDate);
      paramIndex++;
    }
    
    if (timeRange.toDate) {
      query += ` AND issued_date <= $${paramIndex}`;
      queryParams.push(timeRange.toDate);
      paramIndex++;
    }
    
    // Sắp xếp kết quả theo ngày ban hành giảm dần
    query += ` ORDER BY issued_date DESC LIMIT 20`;
    
    // In ra câu truy vấn để debug
    console.log("SQL Query:", query);
    console.log("Query Params:", queryParams);
    
    // Thực hiện truy vấn
    const result = await pool.query(query, queryParams);
    
    console.log(`Tìm thấy ${result.rows.length} kết quả`);
    
    // Xử lý kết quả
    return result.rows.map(doc => {
      // Tạo đoạn tóm tắt ngắn từ nội dung nếu không có sẵn
      let summary = doc.summary;
      if (!summary || summary.length < 50) {
        const content = doc.content.replace(/<[^>]*>/g, ' ').trim();
        summary = content.length > 300 ? content.substring(0, 300) + '...' : content;
      }
      
      return {
        id: doc.id,
        title: doc.title,
        documentType: doc.document_type,
        documentNumber: doc.document_number,
        summary: summary,
        issuedDate: doc.issued_date,
        sourceUrl: doc.source_url
      };
    });
  } catch (error) {
    console.error("Lỗi khi tìm kiếm văn bản pháp luật:", error);
    return [];
  }
};

/**
 * Cập nhật các văn bản pháp luật mới nhất
 * @returns {Promise<boolean>} Kết quả cập nhật
 */
const updateLatestLegalDocuments = async () => {
  try {
    const autoUpdateService = require('./autoUpdateService');
    const result = await autoUpdateService.autoUpdateLegalDocuments(10);
    return result.success;
  } catch (error) {
    console.error("Lỗi khi cập nhật văn bản pháp luật mới:", error);
    return false;
  }
};

/**
 * Lấy chi tiết văn bản pháp luật theo ID
 * @param {number} documentId - ID của văn bản
 * @returns {Promise<Object>} Chi tiết văn bản pháp luật
 */
const getLegalDocumentById = async (documentId) => {
  try {
    const query = `
      SELECT 
        id, 
        title, 
        document_type, 
        content,
        summary,
        issued_date,
        source_url
      FROM LegalDocuments 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [documentId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const document = result.rows[0];
    
    // Lấy từ khóa cho văn bản
    const keywordsQuery = `
      SELECT keyword 
      FROM LegalKeywords 
      WHERE document_id = $1
    `;
    
    const keywordsResult = await pool.query(keywordsQuery, [documentId]);
    const keywords = keywordsResult.rows.map(row => row.keyword);
    
    return {
      id: document.id,
      title: document.title,
      documentType: document.document_type,
      content: document.content,
      summary: document.summary,
      issuedDate: document.issued_date,
      sourceUrl: document.source_url,
      keywords: keywords
    };
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết văn bản pháp luật:", error);
    return null;
  }
};

module.exports = {
  getLegalDocumentsForQuery,
  getLegalDocumentById,
  updateLatestLegalDocuments,
  loadLegalData,
  createVectorStore,
  query,
  initEmbeddingModel
}; 