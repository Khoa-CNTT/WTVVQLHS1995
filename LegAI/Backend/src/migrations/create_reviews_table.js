const pool = require('../config/database');

const createReviewsTable = async () => {
  try {
    console.log('Tạo bảng Reviews...');
    
    // Kiểm tra xem bảng Reviews đã tồn tại chưa
    const tableExistsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'reviews'
      );
    `);
    
    if (tableExistsResult.rows[0].exists) {
      console.log('Bảng Reviews đã tồn tại. Bỏ qua...');
      return;
    }
    
    // Tạo bảng Reviews
    await pool.query(`
      CREATE TABLE Reviews (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        lawyer_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES Users(id),
        FOREIGN KEY (lawyer_id) REFERENCES Users(id),
        UNIQUE(user_id, lawyer_id)
      );
    `);
    
    console.log('Tạo bảng Reviews thành công!');
  } catch (error) {
    console.error('Lỗi khi tạo bảng Reviews:', error);
    throw error;
  }
};

module.exports = createReviewsTable;

// Thực thi trực tiếp nếu được gọi từ dòng lệnh
if (require.main === module) {
  createReviewsTable()
    .then(() => {
      console.log('Migration hoàn tất!');
      process.exit(0);
    })
    .catch(err => {
      console.error('Migration thất bại:', err);
      process.exit(1);
    });
} 