// src/services/ragService.js
const fs = require('fs').promises;
const path = require('path');
// Thay thế hnswlib-node bằng triển khai đơn giản hơn
const { HierarchicalNSW } = require('../utils/simpleVectorStore');
// Sửa lại cách import từ @xenova/transformers
const { pipeline } = require('@xenova/transformers');

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
    
    // Đọc file JSON
    try {
      const data = await fs.readFile(LEGAL_DATA_PATH, 'utf8');
      legalData = JSON.parse(data);
      console.log('Đã tải dữ liệu pháp luật thành công');
    } catch (readError) {
      console.error('Không thể đọc file dữ liệu pháp luật:', readError);
      
      // Sử dụng dữ liệu mẫu nếu không tìm thấy file
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

module.exports = {
  loadLegalData,
  createVectorStore,
  query,
  initEmbeddingModel
}; 