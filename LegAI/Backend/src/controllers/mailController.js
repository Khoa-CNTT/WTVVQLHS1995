const emailService = require('../services/emailService');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Gửi email xác minh tài khoản
 * @route   POST /api/mail/send-verification
 * @access  Public
 */
exports.sendVerificationEmail = asyncHandler(async (req, res, next) => {
  const { email, username, otp } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!email || !username || !otp) {
    return next(new ErrorResponse('Vui lòng cung cấp đầy đủ thông tin: email, username, otp', 400));
  }

  const result = await emailService.sendVerificationEmail(email, username, otp);
  
  if (!result) {
    return next(new ErrorResponse('Không thể gửi email xác minh', 500));
  }

  res.status(200).json({
    success: true,
    message: 'Email xác minh đã được gửi thành công'
  });
});

/**
 * @desc    Gửi email đặt lại mật khẩu
 * @route   POST /api/mail/send-password-reset
 * @access  Public
 */
exports.sendPasswordResetEmail = asyncHandler(async (req, res, next) => {
  const { email, username, otp } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!email || !username || !otp) {
    return next(new ErrorResponse('Vui lòng cung cấp đầy đủ thông tin: email, username, otp', 400));
  }

  const result = await emailService.sendPasswordResetEmail(email, username, otp);
  
  if (!result) {
    return next(new ErrorResponse('Không thể gửi email đặt lại mật khẩu', 500));
  }

  res.status(200).json({
    success: true,
    message: 'Email đặt lại mật khẩu đã được gửi thành công'
  });
});

/**
 * @desc    Gửi email từ form liên hệ
 * @route   POST /api/mail/send-contact
 * @access  Public
 */
exports.sendContactEmail = asyncHandler(async (req, res, next) => {
  const { name, email, subject, message } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!name || !email || !subject || !message) {
    return next(new ErrorResponse('Vui lòng cung cấp đầy đủ thông tin liên hệ', 400));
  }

  // Tạo nội dung email tối ưu gửi tới admin
  const adminContent = `
    <h2 class="content-title" style="font-size: 20px; margin-bottom: 12px;">Tin nhắn liên hệ mới</h2>
    <p style="font-size: 14px; margin-bottom: 12px;">Tin nhắn liên hệ mới từ website LegAI.</p>
    
    <div class="highlight-box" style="padding: 12px 16px; margin: 12px 0;">
      <p style="font-size: 13px; margin: 4px 0;"><strong>Người gửi:</strong> ${name}</p>
      <p style="font-size: 13px; margin: 4px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: var(--primary-color); text-decoration: none;">${email}</a></p>
      <p style="font-size: 13px; margin: 4px 0;"><strong>Tiêu đề:</strong> ${subject}</p>
      <p style="font-size: 13px; margin: 4px 0;"><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
    </div>
    
    <h3 style="font-size: 16px; color: var(--primary-color); margin: 12px 0 8px; font-weight: 500;">Nội dung:</h3>
    <div style="background-color: #fafafa; padding: 12px 16px; border-radius: 6px; font-size: 13px; line-height: 1.5; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
      ${message.replace(/\n/g, '<br>')}
    </div>
    
    <div style="text-align: center; margin: 12px 0;">
      <a href="mailto:${email}" class="btn" style="padding: 10px 20px; font-size: 13px;">Trả lời ngay</a>
    </div>
    
    <div class="info-text" style="font-size: 12px; padding: 10px; margin-top: 12px;">
      <p>Email tự động từ LegAI. Sử dụng nút "Trả lời ngay" để liên hệ.</p>
    </div>
  `;

  // Tạo nội dung xác nhận tối ưu gửi cho người dùng
  const userContent = `
    <h2 class="content-title" style="font-size: 20px; margin-bottom: 12px;">Xác nhận tin nhắn</h2>
    <p style="font-size: 14px; margin-bottom: 12px;">Xin chào <strong>${name}</strong>,</p>
    <p style="font-size: 14px; margin-bottom: 12px;">Cảm ơn bạn đã liên hệ với LegAI. Tin nhắn của bạn đã được nhận.</p>
    
    <div class="highlight-box" style="padding: 12px 16px; margin: 12px 0;">
      <p style="font-size: 13px; margin: 4px 0;"><strong>Tiêu đề:</strong> ${subject}</p>
      <p style="font-size: 13px; margin: 4px 0;"><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
      <p style="font-size: 13px; margin: 4px 0;"><strong>Trạng thái:</strong> <span class="badge badge-success">Đã nhận</span></p>
    </div>
    
    <h3 style="font-size: 16px; color: var(--primary-color); margin: 12px 0 8px; font-weight: 500;">Nội dung bạn gửi:</h3>
    <div style="background-color: #fafafa; padding: 12px 16px; border-radius: 6px; font-size: 13px; line-height: 1.5; color: var(--light-text); font-style: italic; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
      ${message.replace(/\n/g, '<br>')}
    </div>
    
    <div style="text-align: center; margin: 12px 0;">
      <p style="font-size: 14px; color: var(--primary-color); margin-bottom: 8px;">Phản hồi trong 24 giờ làm việc</p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/services" class="btn" style="padding: 10px 20px; font-size: 13px;">Khám phá dịch vụ</a>
    </div>
    
    <div class="info-text" style="font-size: 12px; padding: 10px; margin-top: 12px;">
      <p>Liên hệ hỗ trợ tại <a href="mailto:support@legai.vn" style="color: var(--primary-color); text-decoration: none;">support@legai.vn</a> hoặc hotline 9999 9999.</p>
    </div>
  `;

  // Gửi email đến admin
  const adminEmail = process.env.ADMIN_EMAIL || 'phapluatlegai@gmail.com';
  const adminResult = await emailService.sendEmail({
    email: adminEmail,
    subject: `[LegAI] Liên hệ mới: ${subject}`,
    html: emailService.getEmailTemplate(adminContent)
  });

  // Gửi email xác nhận cho người dùng
  const userResult = await emailService.sendEmail({
    email: email,
    subject: 'Cảm ơn bạn đã liên hệ với LegAI',
    html: emailService.getEmailTemplate(userContent)
  });

  if (!adminResult || !userResult) {
    return next(new ErrorResponse('Không thể gửi email liên hệ', 500));
  }

  res.status(200).json({
    success: true,
    message: 'Tin nhắn liên hệ đã được gửi thành công'
  });
});

/**
 * @desc    Gửi email xác nhận liên hệ cho người dùng
 * @route   POST /api/mail/send-contact-confirmation
 * @access  Public
 */
exports.sendContactConfirmationEmail = asyncHandler(async (req, res, next) => {
  const { email, name, subject } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!email || !name) {
    return next(new ErrorResponse('Vui lòng cung cấp đầy đủ thông tin: email, name', 400));
  }

  // Tạo nội dung xác nhận cho người dùng
  const userContent = `
    <h2 class="content-title" style="font-size: 20px; margin-bottom: 12px;">Xác nhận tin nhắn</h2>
    <p style="font-size: 14px; margin-bottom: 12px;">Xin chào <strong>${name}</strong>,</p>
    <p style="font-size: 14px; margin-bottom: 12px;">Cảm ơn bạn đã liên hệ với LegAI. Tin nhắn của bạn đã được nhận.</p>
    
    <div class="highlight-box" style="padding: 12px 16px; margin: 12px 0;">
      <p style="font-size: 13px; margin: 4px 0;"><strong>Tiêu đề:</strong> ${subject || 'Liên hệ với LegAI'}</p>
      <p style="font-size: 13px; margin: 4px 0;"><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
      <p style="font-size: 13px; margin: 4px 0;"><strong>Trạng thái:</strong> <span class="badge badge-success">Đã nhận</span></p>
    </div>
    
    <div style="text-align: center; margin: 12px 0;">
      <p style="font-size: 14px; color: var(--primary-color); margin-bottom: 8px;">Phản hồi trong 24 giờ làm việc</p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/services" class="btn" style="padding: 10px 20px; font-size: 13px;">Khám phá dịch vụ</a>
    </div>
    
    <div class="info-text" style="font-size: 12px; padding: 10px; margin-top: 12px;">
      <p>Liên hệ hỗ trợ tại <a href="mailto:support@legai.vn" style="color: var(--primary-color); text-decoration: none;">support@legai.vn</a> hoặc hotline 9999 9999.</p>
    </div>
  `;

  // Gửi email xác nhận cho người dùng
  const result = await emailService.sendEmail({
    email: email,
    subject: 'Cảm ơn bạn đã liên hệ với LegAI',
    html: emailService.getEmailTemplate(userContent)
  });

  if (!result) {
    return next(new ErrorResponse('Không thể gửi email xác nhận liên hệ', 500));
  }

  res.status(200).json({
    success: true,
    message: 'Email xác nhận liên hệ đã được gửi thành công'
  });
});

/**
 * @desc    Gửi email xác nhận đặt hẹn
 * @route   POST /api/mail/appointment-confirmation
 * @access  Public
 */
exports.sendAppointmentConfirmationEmail = asyncHandler(async (req, res, next) => {
  const { email, name, appointmentDetails } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!email || !name || !appointmentDetails) {
    return next(new ErrorResponse('Vui lòng cung cấp đầy đủ thông tin về cuộc hẹn', 400));
  }

  const { date, time, lawyerName, service } = appointmentDetails;

  // Tạo nội dung xác nhận đặt hẹn
  const content = `
    <h2 class="content-title" style="font-size: 20px; margin-bottom: 12px;">Xác nhận đặt hẹn thành công</h2>
    <p style="font-size: 14px; margin-bottom: 12px;">Xin chào <strong>${name}</strong>,</p>
    <p style="font-size: 14px; margin-bottom: 12px;">Cảm ơn bạn đã đặt hẹn với LegAI. Cuộc hẹn của bạn đã được xác nhận.</p>
    
    <div class="highlight-box" style="padding: 12px 16px; margin: 12px 0;">
      <p style="font-size: 13px; margin: 4px 0;"><strong>Ngày:</strong> ${date}</p>
      <p style="font-size: 13px; margin: 4px 0;"><strong>Thời gian:</strong> ${time}</p>
      <p style="font-size: 13px; margin: 4px 0;"><strong>Luật sư:</strong> ${lawyerName}</p>
      <p style="font-size: 13px; margin: 4px 0;"><strong>Dịch vụ:</strong> ${service}</p>
      <p style="font-size: 13px; margin: 4px 0;"><strong>Trạng thái:</strong> <span class="badge badge-success">Đã xác nhận</span></p>
    </div>
    
    <div style="text-align: center; margin: 12px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile/appointments" class="btn" style="padding: 10px 20px; font-size: 13px;">Xem chi tiết cuộc hẹn</a>
    </div>
    
    <div class="info-text" style="font-size: 12px; padding: 10px; margin-top: 12px;">
      <p>Nếu bạn cần thay đổi hoặc hủy cuộc hẹn, vui lòng truy cập trang cá nhân hoặc liên hệ hỗ trợ tại <a href="mailto:support@legai.vn" style="color: var(--primary-color); text-decoration: none;">support@legai.vn</a>.</p>
    </div>
  `;

  // Gửi email xác nhận đặt hẹn
  const result = await emailService.sendEmail({
    email: email,
    subject: 'Xác nhận đặt hẹn thành công - LegAI',
    html: emailService.getEmailTemplate(content)
  });

  if (!result) {
    return next(new ErrorResponse('Không thể gửi email xác nhận đặt hẹn', 500));
  }

  res.status(200).json({
    success: true,
    message: 'Email xác nhận đặt hẹn đã được gửi thành công'
  });
});

/**
 * @desc    Gửi email thông báo hủy đặt hẹn
 * @route   POST /api/mail/appointment-cancellation
 * @access  Public
 */
exports.sendAppointmentCancellationEmail = asyncHandler(async (req, res, next) => {
  const { email, name, appointmentDetails } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!email || !name || !appointmentDetails) {
    return next(new ErrorResponse('Vui lòng cung cấp đầy đủ thông tin về cuộc hẹn', 400));
  }

  const { date, time, lawyerName, service, reason } = appointmentDetails;

  // Tạo nội dung thông báo hủy đặt hẹn
  const content = `
    <h2 class="content-title" style="font-size: 20px; margin-bottom: 12px; color: #e74c3c;">Thông báo hủy cuộc hẹn</h2>
    <p style="font-size: 14px; margin-bottom: 12px;">Xin chào <strong>${name}</strong>,</p>
    <p style="font-size: 14px; margin-bottom: 12px;">Cuộc hẹn của bạn đã được hủy thành công.</p>
    
    <div class="highlight-box" style="padding: 12px 16px; margin: 12px 0; border-left-color: #e74c3c;">
      <p style="font-size: 13px; margin: 4px 0;"><strong>Ngày:</strong> ${date}</p>
      <p style="font-size: 13px; margin: 4px 0;"><strong>Thời gian:</strong> ${time}</p>
      <p style="font-size: 13px; margin: 4px 0;"><strong>Luật sư:</strong> ${lawyerName}</p>
      <p style="font-size: 13px; margin: 4px 0;"><strong>Dịch vụ:</strong> ${service}</p>
      <p style="font-size: 13px; margin: 4px 0;"><strong>Trạng thái:</strong> <span style="color: #e74c3c;">Đã hủy</span></p>
      ${reason ? `<p style="font-size: 13px; margin: 4px 0;"><strong>Lý do hủy:</strong> ${reason}</p>` : ''}
    </div>
    
    <div style="text-align: center; margin: 12px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/services" class="btn" style="padding: 10px 20px; font-size: 13px;">Đặt hẹn lại</a>
    </div>
    
    <div class="info-text" style="font-size: 12px; padding: 10px; margin-top: 12px;">
      <p>Nếu bạn có thắc mắc, vui lòng liên hệ hỗ trợ tại <a href="mailto:support@legai.vn" style="color: var(--primary-color); text-decoration: none;">support@legai.vn</a>.</p>
    </div>
  `;

  // Gửi email thông báo hủy đặt hẹn
  const result = await emailService.sendEmail({
    email: email,
    subject: 'Thông báo hủy cuộc hẹn - LegAI',
    html: emailService.getEmailTemplate(content)
  });

  if (!result) {
    return next(new ErrorResponse('Không thể gửi email thông báo hủy đặt hẹn', 500));
  }

  res.status(200).json({
    success: true,
    message: 'Email thông báo hủy đặt hẹn đã được gửi thành công'
  });
});

/**
 * @desc    Gửi email cập nhật trạng thái cuộc hẹn
 * @route   POST /api/mail/appointment-status-update
 * @access  Public
 */
exports.sendAppointmentStatusUpdateEmail = asyncHandler(async (req, res, next) => {
  const { email, name, appointmentDetails } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!email || !name || !appointmentDetails) {
    return next(new ErrorResponse('Vui lòng cung cấp đầy đủ thông tin về cuộc hẹn', 400));
  }

  const { date, time, lawyerName, service, status, notes } = appointmentDetails;

  // Định dạng trạng thái
  let statusText = 'Chờ xác nhận';
  let statusColor = '#ffb300';
  
  if (status === 'confirmed') {
    statusText = 'Đã xác nhận';
    statusColor = 'green';
  } else if (status === 'completed') {
    statusText = 'Đã hoàn thành';
    statusColor = 'green';
  } else if (status === 'cancelled') {
    statusText = 'Đã hủy';
    statusColor = 'red';
  } else if (status === 'pending') {
    statusText = 'Chờ xác nhận';
    statusColor = '#ffb300';
  }

  // Tạo nội dung cập nhật trạng thái
  const content = `
    <h2 class="content-title" style="font-size: 20px; margin-bottom: 12px;">Cập nhật trạng thái cuộc hẹn</h2>
    <p style="font-size: 14px; margin-bottom: 12px;">Xin chào <strong>${name}</strong>,</p>
    <p style="font-size: 14px; margin-bottom: 12px;">Trạng thái cuộc hẹn của bạn đã được cập nhật.</p>
    
    <div class="highlight-box" style="padding: 12px 16px; margin: 12px 0;">
      <p style="font-size: 13px; margin: 4px 0;"><strong>Ngày:</strong> ${date}</p>
      <p style="font-size: 13px; margin: 4px 0;"><strong>Thời gian:</strong> ${time}</p>
      <p style="font-size: 13px; margin: 4px 0;"><strong>Luật sư:</strong> ${lawyerName}</p>
      <p style="font-size: 13px; margin: 4px 0;"><strong>Dịch vụ:</strong> ${service}</p>
      <p style="font-size: 13px; margin: 4px 0;"><strong>Trạng thái mới:</strong> <span style="color: ${statusColor};">${statusText}</span></p>
      ${notes ? `<p style="font-size: 13px; margin: 4px 0;"><strong>Ghi chú:</strong> ${notes}</p>` : ''}
    </div>
    
    <div style="text-align: center; margin: 12px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile/appointments" class="btn" style="padding: 10px 20px; font-size: 13px;">Xem chi tiết cuộc hẹn</a>
    </div>
    
    <div class="info-text" style="font-size: 12px; padding: 10px; margin-top: 12px;">
      <p>Nếu bạn cần hỗ trợ, vui lòng liên hệ tại <a href="mailto:support@legai.vn" style="color: var(--primary-color); text-decoration: none;">support@legai.vn</a>.</p>
    </div>
  `;

  // Gửi email cập nhật trạng thái
  const result = await emailService.sendEmail({
    email: email,
    subject: 'Cập nhật trạng thái cuộc hẹn - LegAI',
    html: emailService.getEmailTemplate(content)
  });

  if (!result) {
    return next(new ErrorResponse('Không thể gửi email cập nhật trạng thái cuộc hẹn', 500));
  }

  res.status(200).json({
    success: true,
    message: 'Email cập nhật trạng thái cuộc hẹn đã được gửi thành công'
  });
});