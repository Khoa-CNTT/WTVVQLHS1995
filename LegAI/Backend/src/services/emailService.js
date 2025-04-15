const nodemailer = require('nodemailer');

// Cấu hình transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER || 'trankimt11@gmail.com',
            pass: process.env.EMAIL_PASSWORD || 'trankimthinh208'
        }
    });
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

module.exports = {
    sendVerificationEmail,
    sendAppointmentNotificationToLawyer,
    sendAppointmentStatusUpdateToCustomer,
    sendAppointmentCancellationToCustomer,
    sendAppointmentCancellationToLawyer
}; 