const pool = require('../config/database');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Đánh giá luật sư - Chỉ admin mới được đánh giá
// @route   POST /api/reviews/lawyer/:lawyerId
// @access  Private/Admin
exports.createReview = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const lawyerId = req.params.lawyerId;
  const { rating, comment } = req.body;
  
  // Kiểm tra xem người dùng có phải là admin hay không (không phân biệt hoa thường)
  if (!req.user || !req.user.role || req.user.role.toLowerCase() !== 'admin') {
    return next(new ErrorResponse('Chỉ quản trị viên mới có quyền đánh giá luật sư', 403));
  }
  
  if (!rating || rating < 1 || rating > 5) {
    return next(new ErrorResponse('Vui lòng cung cấp đánh giá từ 1-5 sao', 400));
  }
  
  try {
    // Kiểm tra xem luật sư có tồn tại không
    const lawyerCheck = await pool.query(
      "SELECT id FROM Users WHERE id = $1 AND role ILIKE 'Lawyer'",
      [lawyerId]
    );
    
    if (lawyerCheck.rows.length === 0) {
      return next(new ErrorResponse('Không tìm thấy luật sư', 404));
    }
    
    // Kiểm tra xem đã có bản ghi trong LawyerDetails chưa
    const lawyerDetailsCheck = await pool.query(
      "SELECT lawyer_id FROM LawyerDetails WHERE lawyer_id = $1",
      [lawyerId]
    );
    
    if (lawyerDetailsCheck.rows.length === 0) {
      // Nếu chưa có, tạo mới bản ghi
      await pool.query(
        "INSERT INTO LawyerDetails (lawyer_id, rating, certification, experience_years, specialization) VALUES ($1, $2, '', 0, '')",
        [lawyerId, rating]
      );
    } else {
      // Nếu đã có, cập nhật rating
      await pool.query(
        "UPDATE LawyerDetails SET rating = $1 WHERE lawyer_id = $2",
        [rating, lawyerId]
      );
    }
    
    // Ghi log vào AuditLogs để theo dõi
    await pool.query(
      `INSERT INTO AuditLogs (user_id, action, table_name, record_id, details) 
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'RATE', 'LawyerDetails', lawyerId, `Đánh giá ${rating} sao${comment ? ': ' + comment : ''}`]
    );
    
    res.status(200).json({
      success: true,
      message: 'Đánh giá luật sư thành công'
    });
  } catch (error) {
    console.error('Lỗi khi đánh giá luật sư:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi đánh giá luật sư'
    });
  }
});

// @desc    Lấy tất cả thông tin của luật sư
// @route   GET /api/reviews/lawyer/:lawyerId
// @access  Public
exports.getReviewsByLawyer = asyncHandler(async (req, res, next) => {
  const lawyerId = req.params.lawyerId;
  
  try {
    // Truy vấn thông tin luật sư
    const lawyerQuery = `
      SELECT 
        u.id, 
        u.full_name, 
        u.email, 
        u.phone,
        ld.rating, 
        ld.specialization, 
        ld.experience_years, 
        ld.certification,
        COALESCE(up.address, '') as address,
        COALESCE(up.avatar_url, '') as avatar_url,
        COALESCE(up.bio, '') as bio
      FROM Users u 
      LEFT JOIN LawyerDetails ld ON u.id = ld.lawyer_id 
      LEFT JOIN UserProfiles up ON u.id = up.user_id
      WHERE u.id = $1 AND u.role ILIKE 'Lawyer'
    `;
    
    const lawyerResult = await pool.query(lawyerQuery, [lawyerId]);
    
    if (lawyerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy luật sư'
      });
    }
    
    const lawyer = lawyerResult.rows[0];
    
    // Đảm bảo dữ liệu đầy đủ và đúng định dạng
    const responseData = {
      id: lawyer.id,
      fullName: lawyer.full_name,
      email: lawyer.email || '',
      phone: lawyer.phone || '',
      rating: parseFloat(lawyer.rating || 0),
      specialization: lawyer.specialization || '',
      experienceYears: lawyer.experience_years ? parseInt(lawyer.experience_years) : 0,
      certification: lawyer.certification || '',
      address: lawyer.address || '',
      avatarUrl: lawyer.avatar_url || '',
      bio: lawyer.bio || '',
      reviews: 0,
      position: 'Luật sư' // Mặc định
    };
    
    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin luật sư:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin luật sư'
    });
  }
});

// @desc    Kiểm tra quyền đánh giá - Chỉ admin mới được đánh giá
// @route   GET /api/reviews/check/:lawyerId
// @access  Private
exports.checkUserReview = asyncHandler(async (req, res, next) => {
  // Kiểm tra xem người dùng có phải là admin không
  const isAdmin = req.user && req.user.role && req.user.role.toLowerCase() === 'admin';
  
  res.status(200).json({
    success: true,
    data: {
      hasReviewed: false,
      canReview: isAdmin
    }
  });
});

// @desc    Cập nhật đánh giá - Chỉ admin mới được cập nhật
// @route   PUT /api/reviews/:id
// @access  Private/Admin
exports.updateReview = asyncHandler(async (req, res, next) => {
  // Chỉ admin mới có quyền cập nhật đánh giá
  if (!req.user || !req.user.role || req.user.role.toLowerCase() !== 'admin') {
    return next(new ErrorResponse('Chỉ quản trị viên mới có quyền cập nhật đánh giá', 403));
  }
  
  const { rating, comment } = req.body;
  const lawyerId = req.params.id;
  
  if (!rating || rating < 1 || rating > 5) {
    return next(new ErrorResponse('Vui lòng cung cấp đánh giá từ 1-5 sao', 400));
  }
  
  try {
    // Cập nhật rating
    await pool.query(
      "UPDATE LawyerDetails SET rating = $1 WHERE lawyer_id = $2",
      [rating, lawyerId]
    );
    
    // Ghi log
    await pool.query(
      `INSERT INTO AuditLogs (user_id, action, table_name, record_id, details) 
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'UPDATE_RATE', 'LawyerDetails', lawyerId, `Cập nhật đánh giá: ${rating} sao${comment ? ': ' + comment : ''}`]
    );
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật đánh giá thành công'
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật đánh giá:', error);
    return next(new ErrorResponse('Lỗi khi cập nhật đánh giá', 500));
  }
});

// @desc    Xóa đánh giá - API được bỏ
// @route   DELETE /api/reviews/:id
// @access  Private/Admin
exports.deleteReview = asyncHandler(async (req, res, next) => {
  return next(new ErrorResponse('API này đã được loại bỏ', 400));
}); 