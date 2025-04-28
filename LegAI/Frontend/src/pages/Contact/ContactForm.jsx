import React, { useState, useEffect, useRef } from 'react';
import { sendContactEmail, sendContactConfirmationEmail } from '../../services/emailService';
import { toast } from 'react-toastify';
import authService from '../../services/authService';
import { FaEnvelope, FaUser, FaHeading, FaPaperPlane, FaCheck } from 'react-icons/fa';
import styles from './Contact.module.css';

const ContactForm = () => {
  const currentUser = authService.getCurrentUser();
  const [formData, setFormData] = useState({
    name: currentUser ? currentUser.fullName : '',
    email: currentUser ? currentUser.email : '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Vui lòng nhập họ tên';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Vui lòng nhập email';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }
    
    if (!formData.subject.trim()) errors.subject = 'Vui lòng nhập tiêu đề';
    if (!formData.message.trim()) errors.message = 'Vui lòng nhập nội dung';
    if (formData.message.trim().length < 10) errors.message = 'Nội dung quá ngắn, vui lòng mô tả chi tiết hơn';
    
    setFormError(errors);
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    
    // Xóa thông báo lỗi khi người dùng đang nhập
    if (formError[name]) {
      setFormError(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsError(false);
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormError(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Send the contact email to admin
      await sendContactEmail(formData);
      
      // Send confirmation email to the user
      await sendContactConfirmationEmail({
        email: formData.email,
        name: formData.name,
        subject: formData.subject
      });
      
      setIsSuccess(true);
      // Reset form data but keep user info if logged in
      setFormData({
        name: currentUser ? currentUser.fullName : '',
        email: currentUser ? currentUser.email : '',
        subject: '',
        message: ''
      });
      setFormError({});
    } catch (error) {
      console.error('Error sending contact form:', error);
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      name: currentUser ? currentUser.fullName : '',
      email: currentUser ? currentUser.email : '',
      subject: '',
      message: ''
    });
    setSubmitted(false);
  };
  
  // Effect để animation fade in khi component mount
  useEffect(() => {
    const formContainer = document.querySelector(`.${styles['contact-form-container']}`);
    if (formContainer) {
      formContainer.classList.add(styles['fade-in']);
    }
  }, []);

  return (
    <div className={styles['contact-form-container']}>
      {isSuccess ? (
        <div className={styles['success-container']}>
          <div className={styles['success-icon']}>
            <FaCheck />
          </div>
          <h2>Cảm ơn bạn đã liên hệ!</h2>
          <p>Tin nhắn của bạn đã được gửi thành công. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.</p>
          <p className={styles['email-notification']}>
            Một email xác nhận đã được gửi đến LegAI <strong>{formData.email}</strong>
          </p>
          <button className={styles['reset-button']} onClick={() => setIsSuccess(false)}>
            Gửi tin nhắn khác
          </button>
        </div>
      ) : (
        <>

          {isError && (
            <div className={styles['error-notification']}>
              <p>Đã xảy ra lỗi khi gửi tin nhắn. Vui lòng thử lại sau.</p>
            </div>
          )}

          <form className={styles['contact-form']} onSubmit={handleSubmit}>
            <div className={styles['form-row']}>
              <div className={styles['form-group']}>
                <label htmlFor="name">
                  <FaUser className={styles['input-icon']} /> Họ và tên
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên của bạn"
                  className={formError.name ? styles['input-error'] : ''}
                  required
                />
                {formError.name && <span className={styles['error-message']}>{formError.name}</span>}
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="email">
                  <FaEnvelope className={styles['input-icon']} /> Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Nhập địa chỉ email của bạn"
                  className={formError.email ? styles['input-error'] : ''}
                  required
                />
                {formError.email && <span className={styles['error-message']}>{formError.email}</span>}
              </div>
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="subject">
                <FaHeading className={styles['input-icon']} /> Tiêu đề
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Tiêu đề tin nhắn"
                className={formError.subject ? styles['input-error'] : ''}
                required
              />
              {formError.subject && <span className={styles['error-message']}>{formError.subject}</span>}
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="message">Nội dung</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Hãy mô tả chi tiết vấn đề của bạn..."
                rows="6"
                className={formError.message ? styles['input-error'] : ''}
                required
              ></textarea>
              {formError.message && <span className={styles['error-message']}>{formError.message}</span>}
            </div>

            <button 
              type="submit" 
              className={styles['contact-submit-btn']}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className={styles['loading-spinner']}></span>
                  Đang gửi...
                </>
              ) : (
                <>
                  <FaPaperPlane className={styles['submit-icon']} />
                  Gửi tin nhắn
                </>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ContactForm;
