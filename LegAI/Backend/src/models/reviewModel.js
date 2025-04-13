const pool = require('../config/database');

// Tạo một review mới
const createReview = async (reviewData) => {
  const { user_id, lawyer_id, rating, comment } = reviewData;
  
  try {
    const result = await pool.query(
      `INSERT INTO Reviews (user_id, lawyer_id, rating, comment) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [user_id, lawyer_id, rating, comment]
    );
    
    // Cập nhật rating trung bình cho luật sư
    await updateLawyerAverageRating(lawyer_id);
    
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Kiểm tra xem người dùng đã đánh giá luật sư chưa
const findExistingReview = async (userId, lawyerId) => {
  try {
    const result = await pool.query(
      'SELECT * FROM Reviews WHERE user_id = $1 AND lawyer_id = $2',
      [userId, lawyerId]
    );
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Lấy tất cả đánh giá của một luật sư
const getReviewsByLawyer = async (lawyerId) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.full_name, u.avatar_url 
       FROM Reviews r 
       JOIN Users u ON r.user_id = u.id 
       WHERE r.lawyer_id = $1 
       ORDER BY r.created_at DESC`,
      [lawyerId]
    );
    return result.rows;
  } catch (error) {
    throw error;
  }
};

// Cập nhật đánh giá
const updateReview = async (reviewId, reviewData) => {
  const { rating, comment } = reviewData;
  
  try {
    const result = await pool.query(
      `UPDATE Reviews 
       SET rating = $1, comment = $2 
       WHERE id = $3 
       RETURNING *`,
      [rating, comment, reviewId]
    );
    
    if (result.rows.length > 0) {
      await updateLawyerAverageRating(result.rows[0].lawyer_id);
      return result.rows[0];
    }
    return null;
  } catch (error) {
    throw error;
  }
};

// Xóa đánh giá
const deleteReview = async (reviewId) => {
  try {
    // Lấy lawyer_id trước khi xóa
    const reviewResult = await pool.query(
      'SELECT lawyer_id FROM Reviews WHERE id = $1',
      [reviewId]
    );
    
    if (reviewResult.rows.length === 0) {
      return null;
    }
    
    const lawyerId = reviewResult.rows[0].lawyer_id;
    
    // Xóa đánh giá
    const result = await pool.query(
      'DELETE FROM Reviews WHERE id = $1 RETURNING *',
      [reviewId]
    );
    
    if (result.rows.length > 0) {
      // Cập nhật rating trung bình sau khi xóa
      await updateLawyerAverageRating(lawyerId);
      return result.rows[0];
    }
    return null;
  } catch (error) {
    throw error;
  }
};

// Lấy đánh giá theo ID
const getReviewById = async (reviewId) => {
  try {
    const result = await pool.query(
      'SELECT * FROM Reviews WHERE id = $1',
      [reviewId]
    );
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Cập nhật rating trung bình cho luật sư
const updateLawyerAverageRating = async (lawyerId) => {
  try {
    // Tính rating trung bình
    const avgResult = await pool.query(
      'SELECT AVG(rating) as average_rating FROM Reviews WHERE lawyer_id = $1',
      [lawyerId]
    );
    
    const averageRating = avgResult.rows[0].average_rating || 0;
    
    // Cập nhật vào bảng LawyerDetails
    await pool.query(
      'UPDATE LawyerDetails SET rating = $1 WHERE lawyer_id = $2',
      [parseFloat(averageRating).toFixed(1), lawyerId]
    );
    
    return averageRating;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createReview,
  findExistingReview,
  getReviewsByLawyer,
  updateReview,
  deleteReview,
  getReviewById,
  updateLawyerAverageRating
}; 