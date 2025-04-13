const nodemailer = require('nodemailer');

// Cấu hình transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
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

module.exports = {
    sendVerificationEmail
}; 