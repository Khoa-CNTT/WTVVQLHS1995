const nodemailer = require('nodemailer');

// Cấu hình transporter
const createTransporter = () => {
    // Kiểm tra môi trường phát triển
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (isDevelopment) {
        // Sử dụng ethereal.email cho môi trường phát triển - không thực sự gửi email
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: 'ethereal.user@ethereal.email',
                pass: 'ethereal_pass'
            }
        });
    } else {
        // Cấu hình thật cho môi trường sản xuất
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'your-email@gmail.com',
                pass: process.env.EMAIL_PASSWORD || 'your-app-password'
            }
        });
    }
};

// Hàm chung để gửi email
const sendEmail = async (options) => {
    try {
        const transporter = createTransporter();
        
        // Kiểm tra nếu đang trong môi trường phát triển thì không thực sự gửi email
        if (process.env.NODE_ENV !== 'production') {
            console.log('DEBUG - Giả lập gửi email trong môi trường phát triển');
            console.log(`To: ${options.email}`);
            console.log(`Subject: ${options.subject}`);
            console.log(`Content: ${options.text || options.html}`);
            return true;
        }
        
        const mailOptions = {
            from: `"LegAI" <${process.env.EMAIL_USER || 'trankimt11@gmail.com'}>`,
            to: options.email,
            subject: options.subject,
            text: options.text,
            html: options.html
        };
        
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Lỗi gửi email:', error);
        // Không throw error để tránh ảnh hưởng đến các chức năng khác
        console.log('SKIP - Bỏ qua lỗi gửi email trong môi trường phát triển');
        return false;
    }
};

// Gửi email xác minh tài khoản với mã OTP
const sendVerificationEmail = async (email, username, otp) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: `"LegAI" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Xác minh tài khoản LegAI',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #333;">Xác minh tài khoản LegAI</h2>
                    </div>
                    <div style="padding: 20px 0; border-top: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">
                        <p>Xin chào <strong>${username}</strong>,</p>
                        <p>Cảm ơn bạn đã đăng ký tài khoản tại LegAI. Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã OTP dưới đây để xác minh tài khoản của bạn:</p>
                        <div style="text-align: center; margin: 20px 0;">
                            <div style="display: inline-block; background-color: #f5f5f5; padding: 10px 20px; border-radius: 4px; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
                                ${otp}
                            </div>
                        </div>
                        <p>Mã OTP này sẽ hết hạn sau 10 phút.</p>
                        <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi để được hỗ trợ.</p>
                    </div>
                    <div style="margin-top: 20px; text-align: center; color: #777; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} LegAI - Hệ thống tư vấn pháp luật thông minh</p>
                    </div>
                </div>
            `
        };
        
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Lỗi gửi email xác minh:', error);
        throw new Error(`Lỗi gửi email: ${error.message}`);
    }
};

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
        const transporter = createTransporter();
        const { appointmentId, customerName, customerEmail, startTime, endTime, purpose } = appointmentData;
        
        const mailOptions = {
            from: `"LegAI" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Thông báo lịch hẹn mới',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #333;">Thông báo lịch hẹn mới</h2>
                    </div>
                    <div style="padding: 20px 0; border-top: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">
                        <p>Xin chào <strong>${lawyerName}</strong>,</p>
                        <p>Bạn có một yêu cầu lịch hẹn mới từ khách hàng. Chi tiết như sau:</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                            <p><strong>Mã lịch hẹn:</strong> #${appointmentId}</p>
                            <p><strong>Khách hàng:</strong> ${customerName} (${customerEmail})</p>
                            <p><strong>Thời gian bắt đầu:</strong> ${formatDateTime(startTime)}</p>
                            <p><strong>Thời gian kết thúc:</strong> ${formatDateTime(endTime)}</p>
                            <p><strong>Mục đích:</strong> ${purpose}</p>
                        </div>
                        
                        <p>Vui lòng đăng nhập vào hệ thống để xác nhận hoặc từ chối lịch hẹn này.</p>
                        <div style="text-align: center; margin: 20px 0;">
                            <a href="${process.env.FRONTEND_URL}/lawyer-dashboard/appointments" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                                Quản lý lịch hẹn
                            </a>
                        </div>
                    </div>
                    <div style="margin-top: 20px; text-align: center; color: #777; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} LegAI - Hệ thống tư vấn pháp luật thông minh</p>
                    </div>
                </div>
            `
        };
        
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Lỗi gửi email thông báo lịch hẹn mới cho luật sư:', error);
        throw new Error(`Lỗi gửi email: ${error.message}`);
    }
};

// Gửi email thông báo cập nhật trạng thái lịch hẹn cho khách hàng
const sendAppointmentStatusUpdateToCustomer = async (email, customerName, appointmentData) => {
    try {
        const transporter = createTransporter();
        const { appointmentId, lawyerName, startTime, endTime, status, notes } = appointmentData;
        
        // Map trạng thái tiếng Anh sang tiếng Việt
        const statusMap = {
            'pending': 'Đang chờ xác nhận',
            'confirmed': 'Đã xác nhận',
            'completed': 'Đã hoàn thành',
            'cancelled': 'Đã huỷ'
        };
        
        // Màu sắc theo trạng thái
        const statusColorMap = {
            'pending': '#FFC107', // Màu vàng
            'confirmed': '#4CAF50', // Màu xanh lá
            'completed': '#2196F3', // Màu xanh dương
            'cancelled': '#F44336' // Màu đỏ
        };
        
        const vietnameseStatus = statusMap[status] || status;
        const statusColor = statusColorMap[status] || '#333';
        
        const mailOptions = {
            from: `"LegAI" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Cập nhật trạng thái lịch hẹn #${appointmentId}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #333;">Cập nhật trạng thái lịch hẹn</h2>
                    </div>
                    <div style="padding: 20px 0; border-top: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">
                        <p>Xin chào <strong>${customerName}</strong>,</p>
                        <p>Lịch hẹn của bạn với luật sư <strong>${lawyerName}</strong> đã được cập nhật trạng thái.</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                            <p><strong>Mã lịch hẹn:</strong> #${appointmentId}</p>
                            <p><strong>Luật sư:</strong> ${lawyerName}</p>
                            <p><strong>Thời gian bắt đầu:</strong> ${formatDateTime(startTime)}</p>
                            <p><strong>Thời gian kết thúc:</strong> ${formatDateTime(endTime)}</p>
                            <p>
                                <strong>Trạng thái:</strong> 
                                <span style="color: ${statusColor}; font-weight: bold;">${vietnameseStatus}</span>
                            </p>
                            ${notes ? `<p><strong>Ghi chú:</strong> ${notes}</p>` : ''}
                        </div>
                        
                        <div style="text-align: center; margin: 20px 0;">
                            <a href="${process.env.FRONTEND_URL}/profile/appointments" style="display: inline-block; background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                                Xem chi tiết lịch hẹn
                            </a>
                        </div>
                    </div>
                    <div style="margin-top: 20px; text-align: center; color: #777; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} LegAI - Hệ thống tư vấn pháp luật thông minh</p>
                    </div>
                </div>
            `
        };
        
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Lỗi gửi email cập nhật trạng thái lịch hẹn cho khách hàng:', error);
        throw new Error(`Lỗi gửi email: ${error.message}`);
    }
};

// Gửi email thông báo huỷ lịch hẹn cho khách hàng
const sendAppointmentCancellationToCustomer = async (email, customerName, appointmentData) => {
    try {
        const transporter = createTransporter();
        const { appointmentId, lawyerName, startTime, endTime, reason } = appointmentData;
        
        const mailOptions = {
            from: `"LegAI" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Lịch hẹn #${appointmentId} đã bị huỷ`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #333;">Thông báo huỷ lịch hẹn</h2>
                    </div>
                    <div style="padding: 20px 0; border-top: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">
                        <p>Xin chào <strong>${customerName}</strong>,</p>
                        <p>Rất tiếc phải thông báo rằng lịch hẹn của bạn với luật sư <strong>${lawyerName}</strong> đã bị huỷ.</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                            <p><strong>Mã lịch hẹn:</strong> #${appointmentId}</p>
                            <p><strong>Luật sư:</strong> ${lawyerName}</p>
                            <p><strong>Thời gian bắt đầu:</strong> ${formatDateTime(startTime)}</p>
                            <p><strong>Thời gian kết thúc:</strong> ${formatDateTime(endTime)}</p>
                            <p><strong>Lý do huỷ:</strong> ${reason}</p>
                        </div>
                        
                        <p>Bạn có thể đặt lịch hẹn mới vào thời gian khác với luật sư. Chúng tôi xin lỗi vì sự bất tiện này.</p>
                        
                        <div style="text-align: center; margin: 20px 0;">
                            <a href="${process.env.FRONTEND_URL}/lawyers" style="display: inline-block; background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                                Đặt lịch hẹn mới
                            </a>
                        </div>
                    </div>
                    <div style="margin-top: 20px; text-align: center; color: #777; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} LegAI - Hệ thống tư vấn pháp luật thông minh</p>
                    </div>
                </div>
            `
        };
        
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Lỗi gửi email thông báo huỷ lịch hẹn cho khách hàng:', error);
        throw new Error(`Lỗi gửi email: ${error.message}`);
    }
};

// Gửi email thông báo huỷ lịch hẹn cho luật sư
const sendAppointmentCancellationToLawyer = async (email, lawyerName, appointmentData) => {
    try {
        const transporter = createTransporter();
        const { appointmentId, customerName, startTime, endTime, reason } = appointmentData;
        
        const mailOptions = {
            from: `"LegAI" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Lịch hẹn #${appointmentId} đã bị huỷ`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #333;">Thông báo huỷ lịch hẹn</h2>
                    </div>
                    <div style="padding: 20px 0; border-top: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">
                        <p>Xin chào <strong>${lawyerName}</strong>,</p>
                        <p>Khách hàng <strong>${customerName}</strong> đã huỷ lịch hẹn với bạn.</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                            <p><strong>Mã lịch hẹn:</strong> #${appointmentId}</p>
                            <p><strong>Khách hàng:</strong> ${customerName}</p>
                            <p><strong>Thời gian bắt đầu:</strong> ${formatDateTime(startTime)}</p>
                            <p><strong>Thời gian kết thúc:</strong> ${formatDateTime(endTime)}</p>
                            <p><strong>Lý do huỷ:</strong> ${reason}</p>
                        </div>
                        
                        <p>Thời gian này đã được giải phóng trong lịch làm việc của bạn.</p>
                        
                        <div style="text-align: center; margin: 20px 0;">
                            <a href="${process.env.FRONTEND_URL}/lawyer-dashboard/appointments" style="display: inline-block; background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                                Quản lý lịch hẹn
                            </a>
                        </div>
                    </div>
                    <div style="margin-top: 20px; text-align: center; color: #777; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} LegAI - Hệ thống tư vấn pháp luật thông minh</p>
                    </div>
                </div>
            `
        };
        
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Lỗi gửi email thông báo huỷ lịch hẹn cho luật sư:', error);
        throw new Error(`Lỗi gửi email: ${error.message}`);
    }
};

/**
 * Gửi email thông báo về cuộc hẹn đến người dùng (luật sư hoặc khách hàng)
 * @param {Object} options - Các thông số cần thiết
 */
const sendAppointmentNotification = async (options) => {
  const {
    email,
    name,
    role, // 'lawyer' hoặc 'customer'
    appointmentId,
    customerName,
    lawyerName,
    startTime,
    endTime,
    notes,
    type,
    meetLink
  } = options;

  // Format thời gian
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  const formattedDate = startDate.toLocaleDateString('vi-VN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedStartTime = startDate.toLocaleTimeString('vi-VN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  const formattedEndTime = endDate.toLocaleTimeString('vi-VN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  let subject, text, html;

  if (role === 'lawyer') {
    subject = `Thông báo: Bạn có cuộc hẹn mới với khách hàng ${customerName}`;
    
    text = `Kính gửi ${name},
      
Bạn có một cuộc hẹn mới với khách hàng ${customerName}.
Mã cuộc hẹn: ${appointmentId}
Thời gian: ${formattedDate}, từ ${formattedStartTime} đến ${formattedEndTime}
Loại: ${type}
Ghi chú: ${notes}
${meetLink ? `Link họp trực tuyến: ${meetLink}` : ''}

Xin vui lòng xác nhận cuộc hẹn này bằng cách đăng nhập vào hệ thống LegAI.

Trân trọng,
Đội ngũ LegAI`;

    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Thông báo cuộc hẹn mới</h2>
        <p>Kính gửi <strong>${name}</strong>,</p>
        <p>Bạn có một cuộc hẹn mới với khách hàng <strong>${customerName}</strong>.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Mã cuộc hẹn:</strong> ${appointmentId}</p>
          <p><strong>Thời gian:</strong> ${formattedDate}, từ ${formattedStartTime} đến ${formattedEndTime}</p>
          <p><strong>Loại:</strong> ${type}</p>
          <p><strong>Ghi chú:</strong> ${notes}</p>
          ${meetLink ? `<p><strong>Link họp trực tuyến:</strong> <a href="${meetLink}" target="_blank">${meetLink}</a></p>` : ''}
        </div>
        
        <p>Xin vui lòng <a href="https://legai.vn/login" style="color: #3498db;">đăng nhập</a> vào hệ thống để xác nhận cuộc hẹn này.</p>
        
        <p>Trân trọng,<br>Đội ngũ LegAI</p>
      </div>
    `;
  } else {
    subject = `Xác nhận đặt lịch hẹn với luật sư ${lawyerName}`;
    
    text = `Kính gửi ${name},
      
Cảm ơn bạn đã đặt lịch hẹn với luật sư ${lawyerName}.
Mã cuộc hẹn: ${appointmentId}
Thời gian: ${formattedDate}, từ ${formattedStartTime} đến ${formattedEndTime}
Loại: ${type}
Ghi chú: ${notes}
${meetLink ? `Link họp trực tuyến: ${meetLink}` : ''}

Vui lòng chờ xác nhận từ phía luật sư. Bạn sẽ nhận được email thông báo khi luật sư xác nhận cuộc hẹn.

Trân trọng,
Đội ngũ LegAI`;

    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Xác nhận đặt lịch hẹn</h2>
        <p>Kính gửi <strong>${name}</strong>,</p>
        <p>Cảm ơn bạn đã đặt lịch hẹn với luật sư <strong>${lawyerName}</strong>.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Mã cuộc hẹn:</strong> ${appointmentId}</p>
          <p><strong>Thời gian:</strong> ${formattedDate}, từ ${formattedStartTime} đến ${formattedEndTime}</p>
          <p><strong>Loại:</strong> ${type}</p>
          <p><strong>Ghi chú:</strong> ${notes}</p>
          ${meetLink ? `<p><strong>Link họp trực tuyến:</strong> <a href="${meetLink}" target="_blank">${meetLink}</a></p>` : ''}
        </div>
        
        <p>Vui lòng chờ xác nhận từ phía luật sư. Bạn sẽ nhận được email thông báo khi luật sư xác nhận cuộc hẹn.</p>
        
        <p>Trân trọng,<br>Đội ngũ LegAI</p>
      </div>
    `;
  }

  await sendEmail({
    email,
    subject,
    text,
    html
  });
};

module.exports = {
    sendVerificationEmail,
    sendAppointmentNotificationToLawyer,
    sendAppointmentStatusUpdateToCustomer,
    sendAppointmentCancellationToCustomer,
    sendAppointmentCancellationToLawyer,
    sendAppointmentNotification,
    sendEmail
}; 