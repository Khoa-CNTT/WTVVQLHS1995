const pool = require('../config/database');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Đánh giá luật sư - Đơn giản hóa tối đa
// @route   POST /api/reviews/lawyer/:lawyerId
// @access  Private
exports.createReview = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const lawyerId = req.params.lawyerId;
  const { rating } = req.body;
  
  if (!rating || rating < 1 || rating > 5) {
    return next(new ErrorResponse('Vui lòng cung cấp đánh giá từ 1-5 sao', 400));
  }
  
  try {
    // Trực tiếp cập nhật rating cho luật sư
    await pool.query(
      "UPDATE LawyerDetails SET rating = $1 WHERE lawyer_id = $2",
      [rating, lawyerId]
    );
    
    // Ghi log vào AuditLogs để theo dõi
    await pool.query(
      `INSERT INTO AuditLogs (user_id, action, table_name, record_id, details) 
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'RATE', 'LawyerDetails', lawyerId, `Đánh giá ${rating} sao`]
    );
    
    res.status(200).json({
    success: true,
      message: 'Đánh giá thành công'
    });
  } catch (error) {
    console.error('Lỗi khi đánh giá:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi đánh giá'
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
      JOIN LawyerDetails ld ON u.id = ld.lawyer_id 
      LEFT JOIN UserProfiles up ON u.id = up.user_id
      WHERE u.id = $1 AND u.role = 'Lawyer'
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
      avatarUrl: lawyer.avatar_url ? `/uploads/${lawyer.avatar_url}` : '',
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

// @desc    Check trạng thái đánh giá - API được bỏ
// @route   GET /api/reviews/check/:lawyerId
// @access  Private
exports.checkUserReview = asyncHandler(async (req, res, next) => {
  // Đơn giản hóa luôn phần check, luôn cho phép đánh giá
  res.status(200).json({
    success: true,
    data: {
      hasReviewed: false
    }
  });
});

// @desc    Cập nhật đánh giá - API được bỏ
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = asyncHandler(async (req, res, next) => {
  return next(new ErrorResponse('API này đã được loại bỏ', 400));
});

// @desc    Xóa đánh giá - API được bỏ
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = asyncHandler(async (req, res, next) => {
  return next(new ErrorResponse('API này đã được loại bỏ', 400));
}); 