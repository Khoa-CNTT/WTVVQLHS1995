import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Services.module.css';
import Navbar from '../../components/layout/Nav/Navbar';
import ChatManager from '../../components/layout/Chat/ChatManager';
import { FaGavel, FaBuilding, FaHome, FaBalanceScale, FaFileContract, FaShieldAlt } from 'react-icons/fa';

const Services = () => {
  const [activeService, setActiveService] = useState(0);
  const navigate = useNavigate();

  const services = [
    {
      id: 1,
      title: 'Tư vấn pháp lý doanh nghiệp',
      icon: <FaBuilding />,
      shortDesc: 'Tư vấn và giải quyết các vấn đề pháp lý cho doanh nghiệp.',
      description: 'Dịch vụ tư vấn pháp lý doanh nghiệp của chúng tôi cung cấp các giải pháp pháp lý toàn diện cho công ty ở mọi quy mô. Từ thành lập doanh nghiệp, soạn thảo và rà soát hợp đồng, tư vấn tuân thủ pháp luật đến giải quyết tranh chấp và quyền sở hữu trí tuệ.',
      details: [
        'Thành lập doanh nghiệp và tư vấn cơ cấu tổ chức',
        'Soạn thảo và rà soát hợp đồng kinh doanh',
        'Tư vấn tuân thủ pháp luật',
        'Tư vấn về thuế và môi trường',
        'Tư vấn quyền sở hữu trí tuệ',
        'Giải quyết tranh chấp kinh doanh'
      ],
      benefits: [
        'Giảm thiểu rủi ro pháp lý cho doanh nghiệp',
        'Tiết kiệm chi phí và thời gian quản lý pháp lý',
        'Đảm bảo tuân thủ quy định pháp luật',
        'Bảo vệ tài sản trí tuệ của doanh nghiệp'
      ],
      image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1932&auto=format&fit=crop'
    },
    {
      id: 2,
      title: 'Tư vấn pháp lý bất động sản',
      icon: <FaHome />,
      shortDesc: 'Hỗ trợ pháp lý cho các giao dịch và tranh chấp bất động sản.',
      description: 'Chúng tôi cung cấp dịch vụ tư vấn pháp lý toàn diện về bất động sản, từ thẩm định pháp lý, hỗ trợ giao dịch mua bán, cho thuê đến giải quyết tranh chấp đất đai. Đội ngũ luật sư giàu kinh nghiệm của chúng tôi sẽ đảm bảo quyền lợi của bạn trong mọi giao dịch bất động sản.',
      details: [
        'Thẩm định pháp lý bất động sản',
        'Tư vấn mua bán, chuyển nhượng bất động sản',
        'Tư vấn cho thuê, thuê bất động sản',
        'Giải quyết tranh chấp đất đai',
        'Tư vấn về quy hoạch và xây dựng',
        'Hỗ trợ pháp lý dự án bất động sản'
      ],
      benefits: [
        'Đảm bảo giao dịch an toàn, hợp pháp',
        'Giảm thiểu rủi ro pháp lý',
        'Bảo vệ quyền lợi trong tranh chấp',
        'Tư vấn chuyên sâu về luật đất đai'
      ],
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1973&auto=format&fit=crop'
    },
    {
      id: 3,
      title: 'Tư vấn pháp lý dân sự',
      icon: <FaBalanceScale />,
      shortDesc: 'Tư vấn và giải quyết các vấn đề pháp lý dân sự, hôn nhân gia đình.',
      description: 'Dịch vụ tư vấn pháp lý dân sự của chúng tôi cung cấp giải pháp cho các vấn đề pháp lý cá nhân như hôn nhân gia đình, thừa kế, hợp đồng dân sự và bồi thường thiệt hại. Chúng tôi luôn đồng hành cùng bạn để đảm bảo quyền lợi hợp pháp của bạn được bảo vệ.',
      details: [
        'Tư vấn hôn nhân và gia đình',
        'Tư vấn thừa kế và di chúc',
        'Soạn thảo và tư vấn hợp đồng dân sự',
        'Giải quyết tranh chấp dân sự',
        'Bồi thường thiệt hại ngoài hợp đồng',
        'Đại diện trong tố tụng dân sự'
      ],
      benefits: [
        'Bảo vệ quyền và lợi ích hợp pháp',
        'Giải quyết tranh chấp hiệu quả',
        'Đảm bảo tính pháp lý trong các giao dịch',
        'Hỗ trợ toàn diện trong quá trình tố tụng'
      ],
      image: 'https://images.unsplash.com/photo-1589391886645-d51c72dc3563?q=80&w=1974&auto=format&fit=crop'
    },
    {
      id: 4,
      title: 'Tư vấn pháp lý hình sự',
      icon: <FaGavel />,
      shortDesc: 'Bào chữa và tư vấn pháp lý trong các vụ án hình sự.',
      description: 'Dịch vụ tư vấn pháp lý hình sự của chúng tôi cung cấp dịch vụ bào chữa và tư vấn chuyên nghiệp trong các vụ án hình sự. Đội ngũ luật sư giàu kinh nghiệm của chúng tôi sẽ đại diện và bảo vệ quyền lợi hợp pháp của bạn trong mọi giai đoạn của quá trình tố tụng hình sự.',
      details: [
        'Tư vấn pháp luật hình sự',
        'Bào chữa trong vụ án hình sự',
        'Đại diện tại các giai đoạn điều tra, truy tố, xét xử',
        'Hỗ trợ người bị hại, người làm chứng',
        'Tư vấn thi hành án hình sự',
        'Bảo vệ quyền lợi người bị tạm giữ, tạm giam'
      ],
      benefits: [
        'Bảo vệ quyền và lợi ích hợp pháp tối đa',
        'Chiến lược bào chữa hiệu quả',
        'Giảm thiểu rủi ro pháp lý',
        'Hỗ trợ 24/7 trong trường hợp khẩn cấp'
      ],
      image: 'https://images.unsplash.com/photo-1589578228447-e1a4e481c6c8?q=80&w=1932&auto=format&fit=crop'
    },
    {
      id: 5,
      title: 'Dịch vụ soạn thảo hợp đồng',
      icon: <FaFileContract />,
      shortDesc: 'Soạn thảo, rà soát và tư vấn các loại hợp đồng.',
      description: 'Dịch vụ soạn thảo hợp đồng của chúng tôi cung cấp giải pháp toàn diện về soạn thảo, rà soát và tư vấn các loại hợp đồng phổ biến. Chúng tôi đảm bảo hợp đồng của bạn đáp ứng đầy đủ các yêu cầu pháp lý, bảo vệ quyền lợi của bạn và giảm thiểu rủi ro tranh chấp trong tương lai.',
      details: [
        'Soạn thảo hợp đồng kinh doanh',
        'Soạn thảo hợp đồng dân sự',
        'Rà soát và tư vấn hợp đồng',
        'Đàm phán điều khoản hợp đồng',
        'Tư vấn giải quyết tranh chấp hợp đồng',
        'Cung cấp mẫu hợp đồng chuẩn'
      ],
      benefits: [
        'Đảm bảo tính pháp lý của hợp đồng',
        'Bảo vệ quyền lợi các bên tham gia',
        'Giảm thiểu rủi ro tranh chấp',
        'Tiết kiệm thời gian và chi phí'
      ],
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1470&auto=format&fit=crop'
    },
    {
      id: 6,
      title: 'Tư vấn pháp lý qua AI',
      icon: <FaShieldAlt />,
      shortDesc: 'Tư vấn pháp lý tức thì 24/7 qua trí tuệ nhân tạo.',
      description: 'Dịch vụ tư vấn pháp lý qua AI của chúng tôi cung cấp giải pháp tư vấn tức thời 24/7 thông qua công nghệ trí tuệ nhân tạo tiên tiến. Hệ thống AI được đào tạo bởi đội ngũ chuyên gia pháp lý hàng đầu, có khả năng phân tích và cung cấp thông tin pháp lý chính xác, đáng tin cậy cho hầu hết các vấn đề pháp lý phổ biến.',
      details: [
        'Tư vấn pháp lý 24/7 không giới hạn',
        'Phân tích vấn đề pháp lý nhanh chóng',
        'Truy cập thông tin pháp luật cập nhật',
        'Soạn thảo văn bản pháp lý cơ bản',
        'Cung cấp mẫu văn bản pháp lý',
        'Đề xuất các bước giải quyết vấn đề'
      ],
      benefits: [
        'Tiết kiệm thời gian và chi phí tư vấn',
        'Truy cập thông tin pháp lý 24/7',
        'Phản hồi tức thì cho các vấn đề pháp lý',
        'Giải pháp pháp lý ban đầu nhanh chóng'
      ],
      image: 'https://images.unsplash.com/photo-1595515660353-3f86c6592d17?q=80&w=1932&auto=format&fit=crop'
    }
  ];

  const handleServiceClick = (index) => {
    setActiveService(index);
  };

  const handleContactClick = () => {
    navigate('/contact');
  };

  return (
    <>
      <Navbar />
      <div className={styles.servicesContainer}>
        {/* Hero Section */}
        <section className={styles.servicesHero}>
          <div className={styles.heroOverlay}></div>
          <div className={styles.heroContent}>
            <h1>Dịch vụ pháp lý<span className={styles.highlightText}> chuyên nghiệp</span></h1>
            <p>Cung cấp các dịch vụ pháp lý toàn diện, chất lượng cao với đội ngũ luật sư giàu kinh nghiệm</p>
          </div>
        </section>

        <div className={styles.servicesContentWrapper}>
          {/* Intro Section */}
          <section className={styles.introSection}>
            <h2>Dịch vụ của chúng tôi</h2>
            <p>
              LegAI cung cấp các dịch vụ pháp lý chuyên nghiệp, đa dạng được thiết kế để đáp ứng mọi nhu cầu của khách hàng cá nhân và doanh nghiệp. Với đội ngũ luật sư giàu kinh nghiệm và công nghệ AI tiên tiến, chúng tôi cam kết mang đến giải pháp pháp lý hiệu quả, tiết kiệm thời gian và chi phí cho khách hàng.
            </p>
          </section>

          {/* Services Grid */}
          <div className={styles.servicesGrid}>
            {services.map((service, index) => (
              <div
                key={service.id}
                className={`${styles.serviceCard} ${activeService === index ? styles.active : ''}`}
                onClick={() => handleServiceClick(index)}
              >
                <div className={styles.serviceHeader}>
                  <div className={styles.serviceIcon}>
                    {service.icon}
                  </div>
                  <h3>{service.title}</h3>
                </div>
                <p className={styles.serviceShortDesc}>{service.shortDesc}</p>
                {activeService === index && (
                  <div className={styles.serviceDetails}>
                    <div className={styles.serviceImage}>
                      <img src={service.image} alt={service.title} />
                    </div>
                    <div className={styles.detailsContent}>
                      <p>{service.description}</p>
                      <h4>Dịch vụ bao gồm:</h4>
                      <ul className={styles.servicesList}>
                        {service.details.map((detail, i) => (
                          <li key={i}><i className="fas fa-check-circle"></i>{detail}</li>
                        ))}
                      </ul>
                      <h4>Lợi ích:</h4>
                      <ul className={styles.benefitsList}>
                        {service.benefits.map((benefit, i) => (
                          <li key={i}><i className="fas fa-star"></i>{benefit}</li>
                        ))}
                      </ul>
                      <div className={styles.serviceActions}>
                        <button className={styles.contactBtn} onClick={handleContactClick}>
                          <i className="fas fa-envelope"></i> Liên hệ ngay
                        </button>
                        <button className={styles.moreInfoBtn}>
                          <i className="fas fa-info-circle"></i> Thông tin chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {activeService !== index && (
                  <div className={styles.serviceFooter}>
                    <button className={styles.expandButton}>
                      Chi tiết <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <section className={styles.ctaSection}>
            <div className={styles.ctaContent}>
              <h2>Bạn cần hỗ trợ pháp lý?</h2>
              <p>Đội ngũ luật sư giàu kinh nghiệm của chúng tôi luôn sẵn sàng hỗ trợ</p>
              <div className={styles.ctaButtons}>
                <button 
                  className={styles.primaryButton}
                  onClick={handleContactClick}
                >
                  <i className="fas fa-envelope"></i> Liên hệ tư vấn
                </button>
                <button 
                  className={styles.secondaryButton}
                  onClick={() => navigate('/lawyers')}
                >
                  <i className="fas fa-user-tie"></i> Tìm luật sư
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
      <ChatManager />
    </>
  );
};

export default Services; 