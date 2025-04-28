/**
 * Lớp SimpleVectorStore - Thay thế cho HierarchicalNSW từ hnswlib-node
 * Đây là một triển khai đơn giản hóa để làm việc trên mọi môi trường Node.js
 */
class SimpleVectorStore {
  /**
   * Khởi tạo vector store
   * @param {string} metric - Phương pháp đo lường khoảng cách (cosine, l2, ip)
   * @param {number} dimensions - Số chiều của vector
   */
  constructor(metric, dimensions) {
    this.metric = metric;
    this.dimensions = dimensions;
    this.vectors = [];
    this.items = [];
    console.log(`SimpleVectorStore: Khởi tạo với ${dimensions} chiều và metric ${metric}`);
  }

  /**
   * Khởi tạo index
   * @param {number} maxElements - Số lượng phần tử tối đa
   */
  initIndex(maxElements) {
    // Không cần làm gì phức tạp, chỉ khởi tạo mảng trống
    this.vectors = [];
    this.items = [];
    this.maxElements = maxElements;
    console.log(`SimpleVectorStore: Khởi tạo với tối đa ${maxElements} phần tử`);
  }

  /**
   * Thêm một vector vào store
   * @param {Float32Array} vector - Vector cần thêm
   * @param {number} item - ID của item liên quan
   * @returns {number} - Index của vector trong store
   */
  addPoint(vector, item) {
    this.vectors.push(Array.from(vector));
    this.items.push(item);
    return this.vectors.length - 1;
  }

  /**
   * Tìm k vector gần nhất với vector truy vấn
   * @param {Float32Array} queryVector - Vector truy vấn
   * @param {number} k - Số lượng kết quả cần trả về
   * @returns {Object} - Kết quả tìm kiếm
   */
  searchKnn(queryVector, k) {
    // Tính khoảng cách với từng vector trong store
    const queryVectorArray = Array.from(queryVector);
    const distances = this.vectors.map(vector => {
      if (this.metric === 'cosine') {
        return this.cosineSimilarity(queryVectorArray, vector);
      } else {
        return this.l2Distance(queryVectorArray, vector);
      }
    });

    // Sắp xếp theo khoảng cách và lấy k kết quả đầu tiên
    let indices;
    if (this.metric === 'cosine') {
      // Với cosine similarity, giá trị cao hơn = tốt hơn
      indices = Array.from(Array(distances.length).keys())
        .sort((a, b) => distances[b] - distances[a])
        .slice(0, k);
    } else {
      // Với L2 distance, giá trị thấp hơn = tốt hơn
      indices = Array.from(Array(distances.length).keys())
        .sort((a, b) => distances[a] - distances[b])
        .slice(0, k);
    }

    return {
      neighbors: indices.map(i => this.items[i]),
      distances: indices.map(i => distances[i])
    };
  }

  /**
   * Tính cosine similarity giữa hai vector
   * @param {Array} vecA - Vector thứ nhất
   * @param {Array} vecB - Vector thứ hai
   * @returns {number} - Cosine similarity
   */
  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Tính khoảng cách Euclidean (L2) giữa hai vector
   * @param {Array} vecA - Vector thứ nhất
   * @param {Array} vecB - Vector thứ hai
   * @returns {number} - Khoảng cách L2
   */
  l2Distance(vecA, vecB) {
    let sum = 0;
    for (let i = 0; i < vecA.length; i++) {
      const diff = vecA[i] - vecB[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }
}

module.exports = {
  HierarchicalNSW: SimpleVectorStore
}; 