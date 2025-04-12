import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import styles from './Contact.module.css';
import Navbar from '../../components/layout/Nav/Navbar';
import PageTransition from '../../components/layout/TransitionPage/PageTransition';
import ChatManager from '../../components/layout/Chat/ChatManager';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Danh sách văn phòng
  const offices = [
    {
      name: 'Trụ sở chính - TP. Hồ Chí Minh',
      address: '268 Lý Thường Kiệt, Phường 14, Quận 10, TP. Hồ Chí Minh',
      phone: '(+84) 28 3864 7256',
      email: 'hcm@legai.vn',
      hours: 'Thứ 2 - Thứ 6: 8:00 - 17:30, Thứ 7: 8:00 - 12:00'
    },
    {
      name: 'Văn phòng Hà Nội',
      address: '96 Định Công, Phường Định Công, Quận Hoàng Mai, Hà Nội',
      phone: '(+84) 24 3212 3445',
      email: 'hanoi@legai.vn',
      hours: 'Thứ 2 - Thứ 6: 8:00 - 17:30, Thứ 7: 8:00 - 12:00'
    },
    {
      name: 'Văn phòng Đà Nẵng',
      address: '123 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, Đà Nẵng',
      phone: '(+84) 236 3653 789',
      email: 'danang@legai.vn',
      hours: 'Thứ 2 - Thứ 6: 8:00 - 17:30'
    }
  ];

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Vui lòng nhập họ tên';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/[^0-9]/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }
    
    if (!formData.subject.trim()) newErrors.subject = 'Vui lòng nhập tiêu đề';
    if (!formData.message.trim()) newErrors.message = 'Vui lòng nhập nội dung tin nhắn';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Xóa lỗi khi người dùng đang nhập
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Mô phỏng gửi form (sẽ thay bằng API thực khi có)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Gửi thông tin liên hệ thành công! Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.');
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      toast.error('Có lỗi xảy ra khi gửi thông tin. Vui lòng thử lại sau!');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
  };

  return (
    <PageTransition>
      <div className={styles.contactPage}>
        <Navbar />
        
        {/* Banner */}
        <div className={styles.banner}>
          <div className={styles.bannerOverlay}></div>
          <div className={styles.bannerContent}>
            <h1>Liên Hệ Với Chúng Tôi</h1>
            <p>Chúng tôi luôn sẵn sàng lắng nghe và giải đáp mọi thắc mắc của bạn</p>
          </div>
        </div>
        
        {/* Thông tin liên hệ */}
        <section className={styles.contactInfo}>
          <div className={styles.container}>
            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <i className="fa-solid fa-phone"></i>
                </div>
                <h3>Điện thoại</h3>
                <p>(+84) 28 3864 7256</p>
                <p>(+84) 909 123 456</p>
              </div>
              
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <i className="fa-solid fa-envelope"></i>
                </div>
                <h3>Email</h3>
                <p>info@legai.vn</p>
                <p>support@legai.vn</p>
              </div>
              
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <i className="fa-solid fa-location-dot"></i>
                </div>
                <h3>Địa chỉ</h3>
                <p>268 Lý Thường Kiệt, Phường 14</p>
                <p>Quận 10, TP. Hồ Chí Minh</p>
              </div>
              
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <i className="fa-solid fa-clock"></i>
                </div>
                <h3>Giờ làm việc</h3>
                <p>Thứ 2 - Thứ 6: 8:00 - 17:30</p>
                <p>Thứ 7: 8:00 - 12:00</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Form liên hệ và bản đồ */}
        <section className={styles.contactSection}>
          <div className={styles.container}>
            <div className={styles.contactGrid}>
              {/* Form liên hệ */}
              <div className={styles.contactForm}>
                <div className={styles.formHeader}>
                  <h2>Gửi tin nhắn cho chúng tôi</h2>
                  <p>Hãy điền thông tin vào form dưới đây, chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất</p>
                </div>
                
                {submitted ? (
                  <div className={styles.successMessage}>
                    <div className={styles.successIcon}>
                      <i className="fa-solid fa-check-circle"></i>
                    </div>
                    <h3>Cảm ơn bạn đã liên hệ!</h3>
                    <p>Chúng tôi đã nhận được thông tin và sẽ phản hồi trong thời gian sớm nhất.</p>
                    <button onClick={resetForm} className={styles.resetButton}>
                      Gửi yêu cầu khác
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="name">Họ và tên <span className={styles.required}>*</span></label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          placeholder="Nhập họ và tên"
                          value={formData.name}
                          onChange={handleChange}
                          className={errors.name ? styles.inputError : ''}
                        />
                        {errors.name && <span className={styles.errorMessage}>{errors.name}</span>}
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label htmlFor="email">Email <span className={styles.required}>*</span></label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          placeholder="Nhập địa chỉ email"
                          value={formData.email}
                          onChange={handleChange}
                          className={errors.email ? styles.inputError : ''}
                        />
                        {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
                      </div>
                    </div>
                    
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="phone">Số điện thoại <span className={styles.required}>*</span></label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          placeholder="Nhập số điện thoại"
                          value={formData.phone}
                          onChange={handleChange}
                          className={errors.phone ? styles.inputError : ''}
                        />
                        {errors.phone && <span className={styles.errorMessage}>{errors.phone}</span>}
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label htmlFor="subject">Tiêu đề <span className={styles.required}>*</span></label>
                        <input
                          type="text"
                          id="subject"
                          name="subject"
                          placeholder="Nhập tiêu đề"
                          value={formData.subject}
                          onChange={handleChange}
                          className={errors.subject ? styles.inputError : ''}
                        />
                        {errors.subject && <span className={styles.errorMessage}>{errors.subject}</span>}
                      </div>
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label htmlFor="message">Nội dung tin nhắn <span className={styles.required}>*</span></label>
                      <textarea
                        id="message"
                        name="message"
                        rows="5"
                        placeholder="Nhập nội dung tin nhắn"
                        value={formData.message}
                        onChange={handleChange}
                        className={errors.message ? styles.inputError : ''}
                      ></textarea>
                      {errors.message && <span className={styles.errorMessage}>{errors.message}</span>}
                    </div>
                    
                    <button 
                      type="submit" 
                      className={styles.submitButton}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin"></i> Đang gửi...
                        </>
                      ) : (
                        <>
                          Gửi tin nhắn <i className="fa-solid fa-paper-plane"></i>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
              
              {/* Google Map */}
              <div className={styles.mapContainer}>
                <div className={styles.mapWrapper}>
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.5177580776767!2d106.65842937465815!3d10.773374089387625!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752ec3c161a3fb%3A0xef77cd47a1cc691e!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBCw6FjaCBraG9hIC0gxJDhuqFpIGjhu41jIFF14buRYyBnaWEgVFAuSENN!5e0!3m2!1svi!2s!4v1680955978975!5m2!1svi!2s" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen="" 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Bản đồ LegAI"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Danh sách văn phòng */}
        <section className={styles.officesSection}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2>Văn phòng của chúng tôi</h2>
              <div className={styles.titleBar}></div>
              <p>Chúng tôi có mặt trên toàn quốc để phục vụ nhu cầu của bạn</p>
            </div>
            
            <div className={styles.officesGrid}>
              {offices.map((office, index) => (
                <div key={index} className={styles.officeCard}>
                  <h3>{office.name}</h3>
                  <div className={styles.officeDetail}>
                    <i className="fa-solid fa-location-dot"></i>
                    <p>{office.address}</p>
                  </div>
                  <div className={styles.officeDetail}>
                    <i className="fa-solid fa-phone"></i>
                    <p>{office.phone}</p>
                  </div>
                  <div className={styles.officeDetail}>
                    <i className="fa-solid fa-envelope"></i>
                    <p>{office.email}</p>
                  </div>
                  <div className={styles.officeDetail}>
                    <i className="fa-solid fa-clock"></i>
                    <p>{office.hours}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className={styles.faqSection}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2>Câu hỏi thường gặp</h2>
              <div className={styles.titleBar}></div>
              <p>Một số câu hỏi phổ biến từ khách hàng</p>
            </div>
            
            <div className={styles.faqGrid}>
              <div className={styles.faqItem}>
                <h3>Làm thế nào để đặt lịch hẹn với luật sư?</h3>
                <p>Bạn có thể đặt lịch hẹn bằng cách gọi điện theo số hotline, gửi email, hoặc điền vào form liên hệ trên trang web này. Chúng tôi sẽ liên hệ lại và sắp xếp cuộc hẹn phù hợp với thời gian của bạn.</p>
              </div>
              
              <div className={styles.faqItem}>
                <h3>Chi phí tư vấn pháp lý như thế nào?</h3>
                <p>Chi phí tư vấn phụ thuộc vào loại vụ việc và phạm vi công việc. Chúng tôi có nhiều gói dịch vụ khác nhau phù hợp với từng nhu cầu. Vui lòng liên hệ với chúng tôi để được tư vấn chi tiết về chi phí.</p>
              </div>
              
              <div className={styles.faqItem}>
                <h3>Tôi có thể tư vấn trực tuyến được không?</h3>
                <p>Có, chúng tôi cung cấp dịch vụ tư vấn trực tuyến qua video call hoặc chat. Bạn có thể tiết kiệm thời gian đi lại và nhận tư vấn từ bất kỳ đâu. Hãy liên hệ để được hướng dẫn.</p>
              </div>
              
              <div className={styles.faqItem}>
                <h3>Các lĩnh vực pháp luật nào LegAI đang hỗ trợ?</h3>
                <p>Chúng tôi cung cấp dịch vụ tư vấn trong nhiều lĩnh vực bao gồm: Doanh nghiệp, Dân sự, Hành chính, Hình sự, Lao động, Sở hữu trí tuệ, Đất đai và nhiều lĩnh vực khác.</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaOverlay}></div>
          <div className={styles.container}>
            <div className={styles.ctaContent}>
              <h2>Bạn cần tư vấn pháp lý ngay lập tức?</h2>
              <p>Đội ngũ luật sư của chúng tôi sẵn sàng hỗ trợ bạn 24/7</p>
              <div className={styles.ctaButtons}>
                <a href="tel:+842838647256" className={styles.ctaPhone}>
                  <i className="fa-solid fa-phone"></i> (+84) 28 3864 7256
                </a>
                <button className={styles.ctaChat} onClick={() => {
                  const event = new CustomEvent('toggleChat', { 
                    detail: { action: 'open' } 
                  });
                  window.dispatchEvent(event);
                }}>
                  <i className="fa-solid fa-message"></i> Chat với tư vấn viên
                </button>
              </div>
            </div>
          </div>
        </section>
        
        <ChatManager />
      </div>
    </PageTransition>
  );
}

export default Contact; 