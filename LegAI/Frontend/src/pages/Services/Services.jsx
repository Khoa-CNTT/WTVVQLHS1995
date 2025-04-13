import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './Services.module.css';
import Navbar from '../../components/layout/Nav/Navbar';
import PageTransition from '../../components/layout/TransitionPage/PageTransition';
import ChatManager from '../../components/layout/Chat/ChatManager';

const Services = () => {
  const [activeService, setActiveService] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mô phỏng tải dữ liệu
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Danh sách dịch vụ
  const services = [
    {
      id: 'business',
      title: 'Tư vấn doanh nghiệp',
      icon: 'fa-solid fa-building',
      description: 'Cung cấp giải pháp pháp lý toàn diện cho doanh nghiệp',
      details: [
        'Thành lập doanh nghiệp và đăng ký kinh doanh',
        'Tư vấn tuân thủ pháp luật doanh nghiệp',
        'Soạn thảo và rà soát hợp đồng thương mại',
        'Tư vấn mua bán, sáp nhập doanh nghiệp (M&A)',
        'Giải quyết tranh chấp thương mại',
        'Tư vấn thuế và kế toán cho doanh nghiệp'
      ],
      benefits: [
        'Tránh rủi ro pháp lý trong hoạt động kinh doanh',
        'Bảo vệ tài sản và lợi ích của doanh nghiệp',
        'Tối ưu hóa cơ cấu pháp lý của doanh nghiệp'
      ],
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=2071&auto=format&fit=crop'
    },
    {
      id: 'civil',
      title: 'Tư vấn dân sự',
      icon: 'fa-solid fa-handshake',
      description: 'Hỗ trợ giải quyết các vấn đề pháp lý dân sự phát sinh trong đời sống',
      details: [
        'Tư vấn về hợp đồng dân sự',
        'Giải quyết tranh chấp đất đai, nhà ở',
        'Tư vấn thừa kế, di chúc',
        'Tư vấn hôn nhân, gia đình',
        'Đại diện khách hàng giải quyết tranh chấp dân sự',
        'Tư vấn bồi thường thiệt hại'
      ],
      benefits: [
        'Bảo vệ quyền và lợi ích hợp pháp',
        'Giải quyết tranh chấp nhanh chóng, hiệu quả',
        'Đảm bảo tính pháp lý cho các giao dịch dân sự'
      ],
      image: 'https://images.unsplash.com/photo-1521791055366-0d553872125f?q=80&w=2069&auto=format&fit=crop'
    },
    {
      id: 'criminal',
      title: 'Tư vấn hình sự',
      icon: 'fa-solid fa-gavel',
      description: 'Bảo vệ quyền và lợi ích hợp pháp trong các vụ án hình sự',
      details: [
        'Tư vấn pháp luật hình sự',
        'Bào chữa cho người bị buộc tội',
        'Bảo vệ quyền lợi người bị hại',
        'Đại diện tham gia tố tụng hình sự',
        'Tư vấn về thi hành án hình sự',
        'Xin giảm nhẹ hình phạt, xin ân xá'
      ],
      benefits: [
        'Bảo vệ quyền và lợi ích hợp pháp theo luật định',
        'Giảm thiểu rủi ro và hậu quả pháp lý',
        'Được bào chữa bởi luật sư chuyên nghiệp'
      ],
      image: 'https://images.unsplash.com/photo-1589578527966-fdac0f44566c?q=80&w=1974&auto=format&fit=crop'
    },
    {
      id: 'labor',
      title: 'Tư vấn lao động',
      icon: 'fa-solid fa-people-group',
      description: 'Tư vấn và giải quyết các vấn đề liên quan đến lao động và việc làm',
      details: [
        'Soạn thảo và rà soát hợp đồng lao động',
        'Tư vấn về chế độ tiền lương, bảo hiểm',
        'Giải quyết tranh chấp lao động',
        'Tư vấn về kỷ luật lao động',
        'Đại diện người lao động trong tranh chấp',
        'Tư vấn về an toàn lao động và bảo hộ lao động'
      ],
      benefits: [
        'Bảo vệ quyền lợi của người lao động',
        'Tuân thủ quy định pháp luật lao động',
        'Giảm thiểu rủi ro tranh chấp trong quan hệ lao động'
      ],
      image: 'https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?q=80&w=2047&auto=format&fit=crop'
    },
    {
      id: 'intellectual',
      title: 'Sở hữu trí tuệ',
      icon: 'fa-solid fa-lightbulb',
      description: 'Bảo vệ tài sản trí tuệ và quyền sở hữu trí tuệ',
      details: [
        'Đăng ký bảo hộ nhãn hiệu, sáng chế, kiểu dáng công nghiệp',
        'Tư vấn chiến lược bảo hộ quyền sở hữu trí tuệ',
        'Xử lý hành vi xâm phạm quyền sở hữu trí tuệ',
        'Soạn thảo hợp đồng chuyển giao quyền sở hữu trí tuệ',
        'Đại diện khách hàng trong tranh chấp về sở hữu trí tuệ',
        'Tư vấn bản quyền và quyền liên quan'
      ],
      benefits: [
        'Bảo vệ tài sản trí tuệ của cá nhân và doanh nghiệp',
        'Tạo lợi thế cạnh tranh trên thị trường',
        'Phòng ngừa và xử lý hành vi xâm phạm'
      ],
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=2000&auto=format&fit=crop'
    },
    {
      id: 'land',
      title: 'Đất đai & Bất động sản',
      icon: 'fa-solid fa-house',
      description: 'Tư vấn pháp lý về đất đai và bất động sản',
      details: [
        'Tư vấn thủ tục mua bán, chuyển nhượng bất động sản',
        'Rà soát pháp lý dự án bất động sản',
        'Giải quyết tranh chấp đất đai',
        'Tư vấn pháp lý về quyền sử dụng đất',
        'Hỗ trợ thủ tục cấp Giấy chứng nhận quyền sử dụng đất',
        'Tư vấn pháp lý cho dự án đầu tư bất động sản'
      ],
      benefits: [
        'Đảm bảo giao dịch bất động sản an toàn, hợp pháp',
        'Giảm thiểu rủi ro pháp lý khi đầu tư bất động sản',
        'Bảo vệ quyền sử dụng đất hợp pháp'
      ],
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1973&auto=format&fit=crop'
    }
  ];

  const handleServiceClick = (serviceId) => {
    if (activeService === serviceId) {
      setActiveService(null);
    } else {
      setActiveService(serviceId);
    }
  };

  // Hiệu ứng cho các thành phần
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.3
      } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  // Hiệu ứng cho chi tiết dịch vụ
  const detailsVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: { 
      height: 'auto', 
      opacity: 1,
      transition: { 
        duration: 0.5,
        ease: 'easeInOut'
      }
    }
  };

  return (
    <>
      <Navbar />
      <PageTransition>
        <div className={styles.servicesContainer}>
          <div className={styles.servicesHero}>
            <div className={styles.heroOverlay}></div>
            <div className={styles.heroContent}>
              <h1>Dịch Vụ Pháp Lý</h1>
              <p>Giải pháp pháp lý toàn diện cho mọi nhu cầu</p>
            </div>
          </div>

          <div className={styles.servicesContentWrapper}>
            <div className={styles.introSection}>
              <h2>Chúng tôi cung cấp đa dạng dịch vụ pháp lý chuyên nghiệp</h2>
              <p>
                Với đội ngũ luật sư giàu kinh nghiệm, LegAI cam kết mang đến các dịch vụ tư vấn pháp luật 
                chất lượng cao, đáp ứng mọi nhu cầu của khách hàng cá nhân và doanh nghiệp.
              </p>
            </div>

            <motion.div 
              className={styles.servicesGrid}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {services.map((service) => (
                <motion.div 
                  key={service.id}
                  className={`${styles.serviceCard} ${activeService === service.id ? styles.active : ''}`}
                  variants={itemVariants}
                  onClick={() => handleServiceClick(service.id)}
                >
                  <div className={styles.serviceHeader}>
                    <div className={styles.serviceIcon}>
                      <i className={service.icon}></i>
                    </div>
                    <h3>{service.title}</h3>
                  </div>
                  <p className={styles.serviceShortDesc}>{service.description}</p>
                  
                  {activeService === service.id && (
                    <motion.div 
                      className={styles.serviceDetails}
                      variants={detailsVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                    >
                      <img src={service.image} alt={service.title} className={styles.serviceImage} />
                      
                      <div className={styles.detailsContent}>
                        <h4>Dịch vụ bao gồm:</h4>
                        <ul className={styles.servicesList}>
                          {service.details.map((detail, index) => (
                            <li key={index}>
                              <i className="fa-solid fa-check"></i>
                              {detail}
                            </li>
                          ))}
                        </ul>
                        
                        <h4>Lợi ích:</h4>
                        <ul className={styles.benefitsList}>
                          {service.benefits.map((benefit, index) => (
                            <li key={index}>
                              <i className="fa-solid fa-award"></i>
                              {benefit}
                            </li>
                          ))}
                        </ul>
                        
                        <div className={styles.serviceActions}>
                          <button className={styles.contactBtn} 
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/contact?service=${service.id}`;
                            }}
                          >
                            <i className="fa-solid fa-envelope"></i> Liên hệ tư vấn
                          </button>
                          <button className={styles.moreInfoBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/lawyers?specialty=${service.id}`;
                            }}
                          >
                            <i className="fa-solid fa-user-tie"></i> Xem luật sư chuyên môn
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div className={styles.serviceFooter}>
                    <button className={styles.expandButton}>
                      {activeService === service.id ? (
                        <>Thu gọn <i className="fa-solid fa-chevron-up"></i></>
                      ) : (
                        <>Xem chi tiết <i className="fa-solid fa-chevron-down"></i></>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <div className={styles.ctaSection}>
            <div className={styles.ctaContent}>
              <h2>Bạn cần hỗ trợ pháp lý?</h2>
              <p>Đội ngũ luật sư của chúng tôi sẵn sàng hỗ trợ bạn với mọi vấn đề pháp lý.</p>
              <div className={styles.ctaButtons}>
                <button className={styles.primaryButton} onClick={() => window.location.href = '/contact'}>
                  <i className="fa-solid fa-envelope"></i> Liên hệ ngay
                </button>
                <button className={styles.secondaryButton} onClick={() => window.location.href = '/lawyers'}>
                  <i className="fa-solid fa-user-tie"></i> Gặp luật sư
                </button>
              </div>
            </div>
          </div>
        </div>
        <ChatManager />
      </PageTransition>
    </>
  );
};

export default Services; 