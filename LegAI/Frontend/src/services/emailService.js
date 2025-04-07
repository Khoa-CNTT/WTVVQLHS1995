import emailjs from 'emailjs-com';

// Khởi tạo EmailJS
const emailjsInit = () => {
  emailjs.init("id9cyROG23KWmOHnX"); // User ID của EmailJS
};

// Gửi email OTP bằng EmailJS
const sendOTPEmail = async (email, username, otp) => {
  try {
    // Tạo thời gian hết hạn (15 phút từ bây giờ)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);
    
    // Format thời gian
    const timeString = expiresAt.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    // Tạo template params - sử dụng tên tham số theo đúng template EmailJS
    const templateParams = {
      email: email,        // Tên tham số trong template EmailJS
      to_name: username,   // Tên tham số trong template EmailJS
      code: otp,           // Tên tham số trong template EmailJS
      time: timeString     // Tên tham số trong template EmailJS
    };
    
    // Gửi email (SERVICE_ID và TEMPLATE_ID từ EmailJS)
    const response = await emailjs.send(
      "service_i8g3yb6", // Service ID
      "template_7gmoisf", // Template ID
      templateParams
    );
    
    console.log('Email OTP đã được gửi:', response);
    return true;
  } catch (error) {
    console.error('Lỗi gửi email OTP:', error);
    throw new Error(`Lỗi gửi email: ${error.message}`);
  }
};

export { emailjsInit, sendOTPEmail }; 