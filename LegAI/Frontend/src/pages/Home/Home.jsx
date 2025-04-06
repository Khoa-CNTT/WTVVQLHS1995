import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, Pagination, EffectFade, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import 'swiper/css/effect-coverflow';
import styles from './Home.module.css';
import Navbar from '../../components/layout/Navbar';
import ChatManager from '../../components/layout/ChatManager';

const Home = () => {
  // Dữ liệu cho slider chính
  const slides = [
    {
      image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=1912&auto=format&fit=crop',
      title: 'TƯ VẤN PHÁP LUẬT',
      description: 'Đội ngũ luật sư chuyên nghiệp sẵn sàng tư vấn mọi vấn đề pháp lý bạn gặp phải',
      buttonText: 'Tìm hiểu thêm'
    },
    {
      image: 'https://images.unsplash.com/photo-1589578527966-fdac0f44566c?q=80&w=1974&auto=format&fit=crop',
      title: 'HỖ TRỢ DOANH NGHIỆP',
      description: 'Giải pháp pháp lý toàn diện cho doanh nghiệp với chi phí hợp lý',
      buttonText: 'Dịch vụ của chúng tôi'
    },
    {
      image: 'https://images.unsplash.com/photo-1505663912202-ac22d4cb3707?q=80&w=2070&auto=format&fit=crop',
      title: 'BẢO VỆ QUYỀN LỢI',
      description: 'Đảm bảo quyền lợi hợp pháp cho khách hàng trong mọi tình huống',
      buttonText: 'Liên hệ ngay'
    }
  ];

  // Dữ liệu cho swiper "Chuyên nghiệp & Uy tín"
  const trustSlides = [
    {
      icon: 'fa-solid fa-scale-balanced',
      title: 'CHUYÊN NGHIỆP',
      text: 'Đội ngũ luật sư giàu kinh nghiệm, được đào tạo bài bản'
    },
    {
      icon: 'fa-solid fa-handshake',
      title: 'UY TÍN',
      text: 'Cam kết bảo mật thông tin và quyền lợi của khách hàng'
    },
    {
      icon: 'fa-solid fa-gavel',
      title: 'HIỆU QUẢ',
      text: 'Tỷ lệ thành công cao trong các vụ kiện và tư vấn pháp lý'
    },
    {
      icon: 'fa-solid fa-graduation-cap',
      title: 'CHUYÊN MÔN CAO',
      text: 'Chuyên gia trong nhiều lĩnh vực pháp luật khác nhau'
    },
    {
      icon: 'fa-solid fa-clock',
      title: 'NHANH CHÓNG',
      text: 'Đáp ứng nhanh mọi yêu cầu từ khách hàng'
    }
  ];

  // Dữ liệu cho các tính năng/dịch vụ
  const features = [
    {
      image: 'https://images.unsplash.com/photo-1521791055366-0d553872125f?q=80&w=2069&auto=format&fit=crop',
      title: 'Tư vấn doanh nghiệp',
      description: 'Chúng tôi cung cấp dịch vụ tư vấn toàn diện cho doanh nghiệp từ khi thành lập đến các vấn đề pháp lý phát sinh.'
    },
    {
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=2071&auto=format&fit=crop',
      title: 'Tranh tụng tòa án',
      description: 'Đội ngũ luật sư giàu kinh nghiệm sẽ đại diện và bảo vệ quyền lợi của bạn trước tòa án.'
    },
    {
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop',
      title: 'Hợp đồng & thỏa thuận',
      description: 'Soạn thảo và rà soát các loại hợp đồng, thỏa thuận đảm bảo tính pháp lý và bảo vệ lợi ích của bạn.'
    }
  ];

  // Số liệu thống kê
  const stats = [
    { number: '1200+', text: 'KHÁCH HÀNG' },
    { number: '50+', text: 'LUẬT SƯ' },
    { number: '95%', text: 'TỶ LỆ THÀNH CÔNG' },
    { number: '15+', text: 'NĂM KINH NGHIỆM' }
  ];

  return (
    <>
    <Navbar></Navbar>
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <video className={styles.videoBackground} autoPlay loop muted>
          <source src="https://cdn-cf-east.streamable.com/video/mp4/wiabn8.mp4?Expires=1744082203290&Key-Pair-Id=APKAIEYUVEN4EVB2OKEQ&Signature=YIZLMeHJdCMyFuyKy~RegZJAitRShNk1i2NjtuuBaOv2Wzm5GOWz43T82CSW--HKM7XeYUF5FWWvTHs29K23c1nQbsIASVzwOeDFXktJ5VYB0IzJCH8~ERd0hbg1SVjuGpdIaLHQ6b2vN8p8yFGFW1zZi2TCYvyGg7ZZHorAUS7n0jXWdwAHVwJMCNZtrpFaKgPxSRNg0TxSjTnIaW37CB1RwMZrlE8CZ4BqymQd7oPn2QtjvSnpGV8OM5xmWNWNSXraAiYZuwfewq9Afa1oBMo~-d081xE~hprcbUcQ58EuAiBU2xSMGvoTJKNlFB2IrDKmlbPtXTCSiMlxC84bgg__" type="video/mp4" />
        </video>
        <div className={styles.heroContent}>
          {/* Swiper cho phần "Chuyên nghiệp & Uy tín" */}
          <Swiper
            modules={[Autoplay]}
            direction="vertical"
            autoplay={{ delay: 2000, disableOnInteraction: false }}
            loop
            className={styles.trustSwiper}
          >
            {trustSlides.map((slide, index) => (
              <SwiperSlide key={index} className={styles.trustSlide}>
                <p className={styles.heroSubtitle}>
                  <i className={`${slide.icon} ${styles.trustIcon}`}></i> {slide.title}
                </p>
              </SwiperSlide>
            ))}
          </Swiper>
          
          <h1 className={styles.heroTitle}>Giải pháp pháp lý toàn diện</h1>
          
          <div className={styles.heroBtnGroup}>
            <button className={styles.exploreButton}>Khám phá ngay</button>
            <button className={styles.contactButton}>
              <i className="fa-solid fa-message"></i> Nhắn tin ngay
            </button>
          </div>
        </div>
        
        <div className={styles.heroStats}>
          {stats.map((stat, index) => (
            <div key={index} className={styles.statItem}>
              <h3 className={styles.statNumber}>{stat.number}</h3>
              <p className={styles.statText}>{stat.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Section with Detail */}
      <section className={styles.trustDetailSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Tại Sao Chọn Chúng Tôi</h2>
          <div className={styles.titleBar}></div>
        </div>
        
        <Swiper
          modules={[EffectCoverflow, Pagination, Autoplay]}
          effect="coverflow"
          grabCursor={true}
          centeredSlides={true}
          slidesPerView="auto"
          coverflowEffect={{
            rotate: 50,
            stretch: 0,
            depth: 100,
            modifier: 1,
            slideShadows: true,
          }}
          pagination={{ clickable: true }}
          autoplay={{ delay: 3000 }}
          loop
          className={styles.trustDetailSwiper}
        >
          {trustSlides.map((slide, index) => (
            <SwiperSlide key={index} className={styles.trustDetailSlide}>
              <div className={styles.trustCard}>
                <div className={styles.trustIconWrapper}>
                  <i className={slide.icon}></i>
                </div>
                <h3 className={styles.trustCardTitle}>{slide.title}</h3>
                <p className={styles.trustCardText}>{slide.text}</p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Dịch vụ của chúng tôi</h2>
          <div className={styles.titleBar}></div>
        </div>
        
        <div className={styles.featureGrid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureCard}>
              <div className={styles.featureImageContainer}>
                <img src={feature.image} alt={feature.title} className={styles.featureImage} />
                <div className={styles.featureOverlay}></div>
              </div>
              <div className={styles.featureContent}>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
                <a href="#" className={styles.featureLink}>
                  Xem thêm <i className="fa-solid fa-arrow-right"></i>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Slideshow Section */}
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        navigation
        pagination={{ clickable: true }}
        effect="fade"
        autoplay={{ delay: 5000 }}
        loop
        className={styles.swiper}
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index} className={styles.swiperSlide}>
            <img src={slide.image} alt={slide.title} className={styles.swiperImage} />
            <div className={styles.slideOverlay}></div>
            <div className={styles.slideContent}>
              <h2 className={styles.slideTitle}>{slide.title}</h2>
              <p className={styles.slideDescription}>{slide.description}</p>
              <button className={styles.slideButton}>
                {slide.buttonText} <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <ChatManager />

    </div></>
  );
};

export default Home;