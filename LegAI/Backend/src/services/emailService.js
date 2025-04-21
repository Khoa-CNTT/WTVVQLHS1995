const nodemailer = require('nodemailer');
const { emailConfig } = require('../config/env');

// Tạo transporter cho Nodemailer
const createTransporter = () => {
  return nodemailer.createTransport({
    host: emailConfig.MAIL_HOST,
    port: emailConfig.MAIL_PORT,
    secure: false, // true cho 465, false cho các port khác
    auth: {
      user: emailConfig.MAIL_USER,
      pass: emailConfig.MAIL_PASS
    }
  });
};

// Hàm chung để gửi email
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: emailConfig.MAIL_FROM,
      to: options.email,
      subject: options.subject,
      text: options.text || '',
      html: options.html || ''
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email đã được gửi: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Lỗi gửi email:', error);
    return false;
  }
};

// Email header và footer dùng chung cho tất cả email
const getEmailTemplate = (content) => {
  return `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LegAI Email</title>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
      :root {
        --primary-color: #1e88e5;
        --secondary-color: #4fc3f7;
        --accent-color: #ffb300;
        --text-color: #212121;
        --light-text: #757575;
        --bg-color: #f5f7fa;
        --card-color: #ffffff;
        --border-color: #e0e0e0;
        --gradient-primary: linear-gradient(135deg, #1e88e5, #4fc3f7);
        --gradient-success: linear-gradient(135deg, #43a047, #66bb6a);
        --gradient-warning: linear-gradient(135deg, #ffb300, #ffca28);
        --gradient-danger: linear-gradient(135deg, #e53935, #ef5350);
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        line-height: 1.5;
        color: var(--text-color);
        background-color: var(--bg-color);
        margin: 0;
        padding: 15px 0;
        background-image: linear-gradient(135deg, #f5f7fa 0%, #e3f2fd 100%);
      }

      .container {
        max-width: 580px;
        margin: 20px auto;
        border-radius: 12px;
        overflow: hidden;
        background-color: var(--card-color);
        box-shadow: 0 3px 15px rgba(0, 0, 0, 0.06);
        border: 1px solid rgba(0, 0, 0, 0.05);
      }

      .header {
        background: var(--gradient-primary);
        padding: 25px 15px;
        text-align: center;
        position: relative;
      }

      .header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.1), transparent 50%);
        opacity: 0.4;
      }

      .logo-container {
        position: relative;
        z-index: 1;
      }

      .logo {
        font-size: 28px;
        font-weight: 700;
        color: #ffffff;
        margin: 0;
        letter-spacing: 0.5px;
      }

      .logo-subtext {
        color: rgba(255, 255, 255, 0.85);
        font-size: 12px;
        margin-top: 4px;
        font-weight: 300;
      }

      .content {
        padding: 20px 15px;
        background-color: var(--card-color);
      }

      .content-title {
        font-size: 20px;
        font-weight: 500;
        color: var(--primary-color);
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--border-color);
        position: relative;
      }

      .content-title::after {
        content: '';
        position: absolute;
        left: 0;
        bottom: -1px;
        width: 50px;
        height: 1px;
        background: var(--gradient-primary);
      }

      .footer {
        background: linear-gradient(to bottom, #fafafa, #f5f5f5);
        padding: 15px;
        text-align: center;
        font-size: 11px;
        color: #333333;
        border-top: 1px solid var(--border-color);
      }

      .footer p {
        margin: 3px 0;
      }

      .social-links {
        margin: 8px 0;
      }

      .social-link {
        display: inline-block;
        margin: 0 6px;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background-color: var(--card-color);
        text-align: center;
        line-height: 28px;
        color: var(--primary-color);
        text-decoration: none;
        transition: all 0.3s ease;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        font-size: 12px;
        font-weight: bold;
      }

      .social-link:hover {
        background: var(--gradient-primary);
        color: #000000;
        transform: translateY(-1px);
      }

      .btn {
        display: inline-block;
        padding: 10px 20px;
        background: var(--gradient-primary);
        color: #000000;
        text-decoration: none;
        border-radius: 20px;
        font-weight: 500;
        font-size: 13px;
        margin: 10px 0;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        position: relative;
        overflow: hidden;
      }

      .btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      }

      .btn::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
        transition: all 0.4s ease;
      }

      .btn:hover::after {
        left: 100%;
      }

      .highlight-box {
        background-color: #fafafa;
        border-left: 3px solid var(--primary-color);
        padding: 12px 16px;
        margin: 12px 0;
        border-radius: 6px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
      }

      .highlight-box p {
        margin: 4px 0;
        font-size: 13px;
      }

      .highlight-box p strong {
        color: var(--primary-color);
        font-weight: 500;
      }

      .otp-box {
        text-align: center;
        margin: 12px 0;
        padding: 12px;
        background: linear-gradient(135deg, #f5f7fa, #e3f2fd);
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }

      .otp-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--light-text);
        margin-bottom: 8px;
        font-weight: 400;
      }

      .otp-code {
        font-size: 24px;
        font-weight: 700;
        color: var(--primary-color);
        padding: 12px 20px;
        border-radius: 8px;
        background: #ffffff;
        display: inline-block;
        letter-spacing: 6px;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.06);
      }

      .otp-expiry {
        font-size: 11px;
        color: var(--light-text);
        margin-top: 8px;
      }

      .info-text {
        margin-top: 12px;
        font-size: 12px;
        color: #333333;
        background-color: rgba(0, 0, 0, 0.02);
        padding: 10px;
        border-radius: 6px;
      }

      .info-text a {
        color: var(--primary-color);
        text-decoration: none;
        font-weight: 500;
        border-bottom: 1px solid rgba(30, 136, 229, 0.3);
        transition: all 0.2s ease;
      }

      .info-text a:hover {
        border-bottom-color: var(--primary-color);
      }

      .section-divider {
        height: 1px;
        background: linear-gradient(to right, transparent, var(--border-color), transparent);
        margin: 12px 0;
      }

      .badge {
        display: inline-block;
        padding: 4px 10px;
        font-size: 12px;
        font-weight: 500;
        border-radius: 16px;
        margin-right: 6px;
        color: #000000;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .badge-success {
        background: var(--gradient-success);
      }

      .badge-warning {
        background: var(--gradient-warning);
      }

      .badge-danger {
        background: var(--gradient-danger);
      }

      .badge-info {
        background: var(--gradient-primary);
      }

      @media (max-width: 600px) {
        .container {
          width: 90%;
          margin: 10px auto;
          border-radius: 10px;
        }

        .header {
          padding: 20px 10px;
        }

        .logo {
          font-size: 24px;
        }

        .content {
          padding: 15px 10px;
        }

        .otp-code {
          font-size: 20px;
          letter-spacing: 5px;
          padding: 10px 15px;
        }

        .content-title {
          font-size: 18px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <div class="social-links">
          <a href="#" class="social-link">L</a>
          <a href="#" class="social-link">E</a>
          <a href="#" class="social-link">G</a>
          <a href="#" class="social-link">A</a>
          <a href="#" class="social-link">I</a>
        </div>
        <p>© ${new Date().getFullYear()} LegAI - Mọi quyền bảo lưu</p>
        <p>Địa chỉ: Đà Nẵng, Việt Nam</p>
        <p>Email: contact@legai.vn | Hotline: 9999 9999</p>
      </div>
    </div>
  </body>
  </html>
  `;
};

// Gửi email xác minh tài khoản với mã OTP
const sendVerificationEmail = async (email, username, otp) => {
  try {
    const content = `
      <h2 class="content-title" style="font-size: 20px; margin-bottom: 12px;">Xác minh tài khoản</h2>
      <p style="font-size: 14px; margin-bottom: 12px;">Xin chào <strong>${username}</strong>,</p>
      <p style="font-size: 14px; margin-bottom: 12px;">Cảm ơn bạn đã đăng ký LegAI. Xác minh email bằng mã OTP:</p>
      
      <div class="otp-box" style="margin: 12px 0; padding: 12px;">
        <div class="otp-label">Mã xác minh</div>
        <div class="otp-code">${otp}</div>
        <div class="otp-expiry">Hết hạn sau 10 phút</div>
      </div>
      
      <div class="info-text" style="font-size: 12px; padding: 10px; margin-top: 12px;">
        <p>Nếu không yêu cầu, vui lòng bỏ qua. Hỗ trợ tại <a href="mailto:support@legai.vn">support@legai.vn</a> hoặc 9999 9999.</p>
      </div>
    `;
    
    const mailOptions = {
      email,
      subject: 'Xác minh tài khoản LegAI',
      html: getEmailTemplate(content)
    };
    
    return await sendEmail(mailOptions);
  } catch (error) {
    console.error('Lỗi gửi email xác minh:', error);
    return false;
  }
};

// Alias của sendVerificationEmail để tương thích với code đã có
const sendOTPEmail = sendVerificationEmail;

// Format thời gian để hiển thị đẹp hơn trong email
const formatDateTime = (dateTimeStr) => {
  const date = new Date(dateTimeStr);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
};

// Gửi email thông báo lịch hẹn mới cho luật sư
const sendAppointmentNotificationToLawyer = async (email, lawyerName, appointmentData) => {
  try {
    const { appointmentId, customerName, customerEmail, startTime, endTime, purpose } = appointmentData;
    
    const content = `
      <h2 class="content-title" style="font-size: 20px; margin-bottom: 12px;">Lịch hẹn mới</h2>
      <p style="font-size: 14px; margin-bottom: 12px;">Xin chào <strong>${lawyerName}</strong>,</p>
      <p style="font-size: 14px; margin-bottom: 12px;">Bạn có lịch hẹn mới từ khách hàng:</p>
      
      <div class="highlight-box" style="padding: 12px 16px; margin: 12px 0;">
        <p style="font-size: 13px; margin: 4px 0;"><strong>Mã:</strong> #${appointmentId}</p>
        <p style="font-size: 13px; margin: 4px 0;"><strong>Khách hàng:</strong> ${customerName}</p>
        <p style="font-size: 13px; margin: 4px 0;"><strong>Bắt đầu:</strong> ${formatDateTime(startTime)}</p>
        <p style="font-size: 13px; margin: 4px 0;"><strong>Kết thúc:</strong> ${formatDateTime(endTime)}</p>
        <p style="font-size: 13px; margin: 4px 0;"><strong>Mục đích:</strong> ${purpose}</p>
      </div>
      
      <div style="text-align: center; margin: 12px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/lawyer-dashboard/" class="btn" style="padding: 10px 20px; font-size: 13px;">Quản lý lịch hẹn</a>
      </div>
      
      <div class="info-text" style="font-size: 12px; padding: 10px; margin-top: 12px;">
        <p>Phản hồi nhanh để nâng cao trải nghiệm khách hàng. Hỗ trợ tại <a href="mailto:support@legai.vn">support@legai.vn</a>.</p>
      </div>
    `;
    
    const mailOptions = {
      email,
      subject: 'Yêu cầu lịch hẹn mới - LegAI',
      html: getEmailTemplate(content)
    };
    
    return await sendEmail(mailOptions);
  } catch (error) {
    console.error('Lỗi gửi email thông báo lịch hẹn mới cho luật sư:', error);
    return false;
  }
};

// Gửi email thông báo cập nhật trạng thái lịch hẹn cho khách hàng
const sendAppointmentStatusUpdateToCustomer = async (email, customerName, appointmentData) => {
  try {
    const { appointmentId, lawyerName, startTime, endTime, status, notes } = appointmentData;
    
    const statusMap = {
      'pending': 'Đang chờ',
      'confirmed': 'Đã xác nhận',
      'completed': 'Đã hoàn thành',
      'cancelled': 'Đã hủy'
    };
    
    const badgeClassMap = {
      'pending': 'badge-warning',
      'confirmed': 'badge-success',
      'completed': 'badge-info',
      'cancelled': 'badge-danger'
    };
    
    const vietnameseStatus = statusMap[status] || status;
    const badgeClass = badgeClassMap[status] || 'badge-info';
    
    const content = `
      <h2 class="content-title" style="font-size: 20px; margin-bottom: 12px;">Cập nhật lịch hẹn</h2>
      <p style="font-size: 14px; margin-bottom: 12px;">Xin chào <strong>${customerName}</strong>,</p>
      <p style="font-size: 14px; margin-bottom: 12px;">Lịch hẹn với <strong>${lawyerName}</strong> đã được cập nhật:</p>
      
      <div class="highlight-box" style="padding: 12px 16px; margin: 12px 0;">
        <p style="font-size: 13px; margin: 4px 0;"><strong>Mã:</strong> #${appointmentId}</p>
        <p style="font-size: 13px; margin: 4px 0;"><strong>Luật sư:</strong> ${lawyerName}</p>
        <p style="font-size: 13px; margin: 4px 0;"><strong>Bắt đầu:</strong> ${formatDateTime(startTime)}</p>
        <p style="font-size: 13px; margin: 4px 0;"><strong>Kết thúc:</strong> ${formatDateTime(endTime)}</p>
        <p style="font-size: 13px; margin: 4px 0;"><strong>Trạng thái:</strong> <span class="badge ${badgeClass}">${vietnameseStatus}</span></p>
        ${notes ? `<p style="font-size: 13px; margin: 4px 0;"><strong>Ghi chú:</strong> ${notes}</p>` : ''}
      </div>
      
      <div style="text-align: center; margin: 12px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile/" class="btn" style="padding: 10px 20px; font-size: 13px;">Xem chi tiết</a>
      </div>
      
      <div class="info-text" style="font-size: 12px; padding: 10px; margin-top: 12px;">
        <p>Hỗ trợ tại <a href="mailto:support@legai.vn">support@legai.vn</a>.</p>
      </div>
    `;
    
    const mailOptions = {
      email,
      subject: `Cập nhật lịch hẹn #${appointmentId} - LegAI`,
      html: getEmailTemplate(content)
    };
    
    return await sendEmail(mailOptions);
  } catch (error) {
    console.error('Lỗi gửi email cập nhật trạng thái lịch hẹn cho khách hàng:', error);
    return false;
  }
};

// Gửi email thông báo hủy lịch hẹn cho khách hàng
const sendAppointmentCancellationToCustomer = async (email, customerName, appointmentData) => {
  try {
    const { appointmentId, lawyerName, startTime, endTime, reason } = appointmentData;
    
    const content = `
      <h2 class="content-title" style="font-size: 20px; margin-bottom: 12px;">Hủy lịch hẹn</h2>
      <p style="font-size: 14px; margin-bottom: 12px;">Xin chào <strong>${customerName}</strong>,</p>
      <p style="font-size: 14px; margin-bottom: 12px;">Lịch hẹn với <strong>${lawyerName}</strong> đã bị hủy:</p>
      
      <div class="highlight-box" style="padding: 12px 16px; margin: 12px 0;">
        <p style="font-size: 13px; margin: 4px 0;"><strong>Mã:</strong> #${appointmentId}</p>
        <p style="font-size: 13px; margin: 4px 0;"><strong>Luật sư:</strong> ${lawyerName}</p>
        <p style="font-size: 13px; margin: 4px 0;"><strong>Bắt đầu:</strong> ${formatDateTime(startTime)}</p>
        <p style="font-size: 13px; margin: 4px 0;"><strong>Kết thúc:</strong> ${formatDateTime(endTime)}</p>
        <p style="font-size: 13px; margin: 4px 0;"><strong>Lý do:</strong> ${reason}</p>
      </div>
      
      <div style="text-align: center; margin: 12px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/lawyers" class="btn" style="padding: 10px 20px; font-size: 13px;">Đặt lịch mới</a>
      </div>
      
      <div class="info-text" style="font-size: 12px; padding: 10px; margin-top: 12px;">
        <p>Xin lỗi vì sự bất tiện. Hỗ trợ tại <a href="mailto:support@legai.vn">support@legai.vn</a> hoặc 1900 1234.</p>
      </div>
    `;
    
    const mailOptions = {
      email,
      subject: `Lịch hẹn #${appointmentId} đã hủy - LegAI`,
      html: getEmailTemplate(content)
    };
    
    return await sendEmail(mailOptions);
  } catch (error) {
    console.error('Lỗi gửi email thông báo hủy lịch hẹn cho khách hàng:', error);
    return false;
  }
};

// Gửi email thông báo hủy lịch hẹn cho luật sư
const sendAppointmentCancellationToLawyer = async (email, lawyerName, appointmentData) => {
  try {
    const { appointmentId, customerName, startTime, endTime, reason } = appointmentData;
    
    const content = `
      <h2 class="content-title" style="font-size: 20px; margin-bottom: 12px;">Hủy lịch hẹn</h2>
      <p style="font-size: 14px; margin-bottom: 12px;">Xin chào <strong>${lawyerName}</strong>,</p>
      <p style="font-size: 14px; margin-bottom: 12px;">Khách hàng <strong>${customerName}</strong> đã hủy lịch hẹn:</p>
      
      <div class="highlight-box" style="padding: 12px 16px; margin: 12px 0;">
        <p style="font-size: 13px; margin: 4px 0;"><strong>Mã:</strong> #${appointmentId}</p>
        <p style="font-size: 13px; margin: 4px 0;"><strong>Khách hàng:</strong> ${customerName}</p>
        <p style="font-size: 13px; margin: 4px 0;"><strong>Bắt đầu:</strong> ${formatDateTime(startTime)}</p>
        <p style="font-size: 13px; margin: 4px 0;"><strong>Kết thúc:</strong> ${formatDateTime(endTime)}</p>
        <p style="font-size: 13px; margin: 4px 0;"><strong>Lý do:</strong> ${reason}</p>
      </div>
      
      <div style="text-align: center; margin: 12px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/lawyer-dashboard/" class="btn" style="padding: 10px 20px; font-size: 13px;">Quản lý lịch hẹn</a>
      </div>
      
      <div class="info-text" style="font-size: 12px; padding: 10px; margin-top: 12px;">
        <p>Hỗ trợ tại <a href="mailto:lawyers@legai.vn">lawyers@legai.vn</a>.</p>
      </div>
    `;
    
    const mailOptions = {
      email,
      subject: `Hủy lịch hẹn #${appointmentId} - LegAI`,
      html: getEmailTemplate(content)
    };
    
    return await sendEmail(mailOptions);
  } catch (error) {
    console.error('Lỗi gửi email thông báo hủy lịch hẹn cho luật sư:', error);
    return false;
  }
};

// Gửi email quên mật khẩu với mã OTP
const sendPasswordResetEmail = async (email, username, otp) => {
  try {
    const content = `
      <h2 class="content-title" style="font-size: 20px; margin-bottom: 12px;">Đặt lại mật khẩu</h2>
      <p style="font-size: 14px; margin-bottom: 12px;">Xin chào <strong>${username}</strong>,</p>
      <p style="font-size: 14px; margin-bottom: 12px;">Dùng mã OTP để đặt lại mật khẩu LegAI:</p>
      
      <div class="otp-box" style="margin: 12px 0; padding: 12px;">
        <div class="otp-label">Mã đặt lại</div>
        <div class="otp-code">${otp}</div>
        <div class="otp-expiry">Hết hạn sau 10 phút</div>
      </div>
      
      <div class="info-text" style="font-size: 12px; padding: 10px; margin-top: 12px;">
        <p>Nếu không yêu cầu, bỏ qua hoặc <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/change-password">đổi mật khẩu</a>. Hỗ trợ tại <a href="mailto:support@legai.vn">support@legai.vn</a>.</p>
      </div>
    `;
    
    const mailOptions = {
      email,
      subject: 'Đặt lại mật khẩu LegAI',
      html: getEmailTemplate(content)
    };
    
    return await sendEmail(mailOptions);
  } catch (error) {
    console.error('Lỗi gửi email đặt lại mật khẩu:', error);
    return false;
  }
};

// Gửi email thông báo lịch hẹn cho cả luật sư và khách hàng
const sendAppointmentNotification = async (data) => {
  try {
    const { email, name, role, appointmentId, startTime, endTime, notes, type, meetLink, purpose } = data;
    
    if (role === 'lawyer') {
      // Email cho luật sư
      const { customerName, customerEmail } = data;
      return await sendAppointmentNotificationToLawyer(email, name, {
        appointmentId,
        customerName,
        customerEmail,
        startTime,
        endTime,
        notes,
        type,
        meetLink,
        purpose
      });
    } else {
      // Email cho khách hàng
      const { lawyerName } = data;
      
      const content = `
        <h2 class="content-title" style="font-size: 20px; margin-bottom: 12px;">Xác nhận đặt hẹn thành công</h2>
        <p style="font-size: 14px; margin-bottom: 12px;">Xin chào <strong>${name}</strong>,</p>
        <p style="font-size: 14px; margin-bottom: 12px;">Cảm ơn bạn đã đặt hẹn với LegAI. Cuộc hẹn của bạn đã được tạo.</p>
        
        <div class="highlight-box" style="padding: 12px 16px; margin: 12px 0;">
          <p style="font-size: 13px; margin: 4px 0;"><strong>Mã:</strong> #${appointmentId}</p>
          <p style="font-size: 13px; margin: 4px 0;"><strong>Luật sư:</strong> ${lawyerName}</p>
          <p style="font-size: 13px; margin: 4px 0;"><strong>Bắt đầu:</strong> ${formatDateTime(startTime)}</p>
          <p style="font-size: 13px; margin: 4px 0;"><strong>Kết thúc:</strong> ${formatDateTime(endTime)}</p>
          <p style="font-size: 13px; margin: 4px 0;"><strong>Loại:</strong> ${type}</p>
          ${notes ? `<p style="font-size: 13px; margin: 4px 0;"><strong>Ghi chú:</strong> ${notes}</p>` : ''}
          ${meetLink ? `<p style="font-size: 13px; margin: 4px 0;"><strong>Link họp:</strong> <a href="${meetLink}">${meetLink}</a></p>` : ''}
          <p style="font-size: 13px; margin: 4px 0;"><strong>Trạng thái:</strong> <span class="badge badge-warning">Đang chờ xác nhận</span></p>
        </div>
        
        <div style="text-align: center; margin: 12px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile/" class="btn" style="padding: 10px 20px; font-size: 13px;">Xem chi tiết cuộc hẹn</a>
        </div>
        
        <div class="info-text" style="font-size: 12px; padding: 10px; margin-top: 12px;">
          <p>Nếu bạn cần thay đổi hoặc hủy cuộc hẹn, vui lòng truy cập trang cá nhân hoặc liên hệ hỗ trợ tại <a href="mailto:support@legai.vn" style="color: var(--primary-color); text-decoration: none;">support@legai.vn</a>.</p>
        </div>
      `;
      
      const mailOptions = {
        email,
        subject: `Đặt hẹn thành công - LegAI`,
        html: getEmailTemplate(content)
      };
      
      return await sendEmail(mailOptions);
    }
  } catch (error) {
    console.error('Lỗi gửi email thông báo lịch hẹn:', error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendOTPEmail,
  sendAppointmentNotification,
  sendAppointmentNotificationToLawyer,
  sendAppointmentStatusUpdateToCustomer,
  sendAppointmentCancellationToCustomer,
  sendAppointmentCancellationToLawyer,
  sendPasswordResetEmail,
  sendEmail,
  getEmailTemplate
};