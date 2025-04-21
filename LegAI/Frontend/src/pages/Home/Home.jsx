import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, Pagination, EffectFade, EffectCards, EffectCreative, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import 'swiper/css/effect-cards';
import 'swiper/css/effect-creative';
import 'swiper/css/effect-coverflow';
import styles from './Home.module.css';
import Navbar from '../../components/layout/Nav/Navbar';
import ChatManager from '../../components/layout/Chat/ChatManager';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import authService from '../../services/authService';
import { FaHeadset, FaFileContract, FaArchive, FaRobot, FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Home = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [animateApp, setAnimateApp] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeService, setActiveService] = useState(0);
  const featureSwiperRef = useRef(null);
  const testimonialSwiperRef = useRef(null);
  const categorySwiperRef = useRef(null);

  // Kiểm tra đăng nhập khi component được render
  useEffect(() => {
    const checkAuth = () => {
      const loggedIn = authService.isAuthenticated();
      setIsLoggedIn(loggedIn);
    };

    checkAuth();
    // Khởi động animation cho "App step" sau khi trang đã load
    const timer = setTimeout(() => {
      setAnimateApp(true);
    }, 1000);

    setLoading(false);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Tự động thay đổi bước trong animation "App steps"
    if (animateApp) {
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev >= 5 ? 1 : prev + 1));
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [animateApp]);

  // Features section
  const features = [
    {
      title: "Tư vấn pháp lý trực tuyến",
      description: "Kết nối với luật sư trong vài phút cho mọi vấn đề pháp lý",
      icon: <FaHeadset className={styles.featureIcon} />,
    },
    {
      title: "Hỗ trợ soạn thảo hợp đồng",
      description: "Mẫu hợp đồng phù hợp với nhu cầu của bạn, được soạn thảo bởi các chuyên gia",
      icon: <FaFileContract className={styles.featureIcon} />,
    },
    {
      title: "Lưu trữ hồ sơ pháp lý",
      description: "Quản lý và lưu trữ tài liệu pháp lý của bạn an toàn trên hệ thống của chúng tôi",
      icon: <FaArchive className={styles.featureIcon} />,
    },
    {
      title: "Phân tích pháp lý bằng AI",
      description: "Công nghệ AI giúp phân tích và đưa ra giải pháp phù hợp cho vấn đề của bạn",
      icon: <FaRobot className={styles.featureIcon} />,
    },
    {
      title: "Tìm kiếm luật sư chuyên ngành",
      description: "Tìm kiếm luật sư phù hợp với vấn đề pháp lý của bạn",
      icon: <FaSearch className={styles.featureIcon} />,
    },
  ];

  // Dữ liệu cho các lĩnh vực pháp lý
  const legalCategories = [
    {
      icon: 'fa-solid fa-building',
      title: 'Doanh nghiệp',
      description: 'Thành lập công ty, thuế, sở hữu trí tuệ, tranh chấp thương mại.'
    },
    {
      icon: 'fa-solid fa-house',
      title: 'Bất động sản',
      description: 'Mua bán, cho thuê, tranh chấp đất đai, quy hoạch xây dựng.'
    },
    {
      icon: 'fa-solid fa-scale-balanced',
      title: 'Dân sự',
      description: 'Hôn nhân gia đình, thừa kế, hợp đồng, bồi thường thiệt hại.'
    },
    {
      icon: 'fa-solid fa-handcuffs',
      title: 'Hình sự',
      description: 'Bào chữa, tố tụng hình sự, thi hành án.'
    },
    {
      icon: 'fa-solid fa-briefcase',
      title: 'Lao động',
      description: 'Hợp đồng lao động, bảo hiểm, tranh chấp lao động.'
    }
  ];

  // Dữ liệu cho phản hồi khách hàng
  const testimonials = [
    {
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      name: 'Nguyễn Văn A',
      role: 'Doanh nhân',
      content: 'Dịch vụ tư vấn AI rất nhanh chóng và chính xác. Giúp tôi tiết kiệm thời gian tra cứu thông tin pháp lý.'
    },
    {
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      name: 'Trần Thị B',
      role: 'Quản lý nhân sự',
      content: 'Hệ thống quản lý hồ sơ pháp lý giúp công ty tôi theo dõi và cập nhật tài liệu một cách hiệu quả.'
    },
    {
      avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
      name: 'Lê Văn C',
      role: 'Chủ doanh nghiệp',
      content: 'Các luật sư tư vấn rất chuyên nghiệp và tận tâm. Đã giúp tôi giải quyết nhiều vấn đề pháp lý phức tạp.'
    }
  ];

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <video className={styles.videoBackground} autoPlay loop muted>
            <source src="/video/2.mp4" type="video/mp4" />
          </video>
          <div className={styles.heroBackgroundOverlay}></div>
          <div className={styles.heroContent}>
            <div className={styles.glowCircle}></div>
            <h1 className={styles.heroTitle}>
              <span className={styles.heroTitleSecondary}>Quản lý hồ sơ pháp lý</span>
              <span className={styles.heroTitlePrimary}>TƯ VẤN PHÁP LUẬT <br />TÍCH HỢP TRÍ TUỆ NHÂN TẠO</span>
            </h1>
            <p className={styles.heroDescription}>
              Nền tảng pháp lý toàn diện cho cá nhân và doanh nghiệp với công nghệ AI hiện đại
            </p>
            <div className={styles.heroBtnGroup}>
              <button
                className={styles.primaryButton}
                onClick={() => navigate('/documents')}
              >
                <i className="fas fa-rocket"></i> Dùng ngay
              </button>
              <button
                className={styles.outlineButton}
                onClick={() => navigate('/services')}
              >
                <i className="fas fa-info-circle"></i> Tìm hiểu thêm
              </button>
            </div>
          </div>

          <div className={styles.appPreviewContainer}>
            <div className={`${styles.appStepsContainer} ${animateApp ? styles.animate : ''}`}>
              <div className={styles.appStepNumbers}>
                {[1, 2, 3, 4, 5].map(step => (
                  <div
                    key={step}
                    className={`${styles.stepNumber} ${currentStep === step ? styles.activeStep : ''}`}
                    onClick={() => setCurrentStep(step)}
                  >
                    {step < currentStep ? <i className="fas fa-check"></i> : step}
                  </div>
                ))}
              </div>
              <div className={styles.appPreview}>
                <div className={`${styles.appStep} ${currentStep === 1 ? styles.activeAppStep : ''}`}>
                  <i className="fas fa-user-plus"></i>
                  <h4>Đăng ký tài khoản</h4>
                </div>
                <div className={`${styles.appStep} ${currentStep === 2 ? styles.activeAppStep : ''}`}>
                  <i className="fas fa-file-upload"></i>
                  <h4>Tải lên hồ sơ</h4>
                </div>
                <div className={`${styles.appStep} ${currentStep === 3 ? styles.activeAppStep : ''}`}>
                  <i className="fas fa-robot"></i>
                  <h4>AI phân tích</h4>
                </div>
                <div className={`${styles.appStep} ${currentStep === 4 ? styles.activeAppStep : ''}`}>
                  <i className="fas fa-user-tie"></i>
                  <h4>Tư vấn luật sư</h4>
                </div>
                <div className={`${styles.appStep} ${currentStep === 5 ? styles.activeAppStep : ''}`}>
                  <i className="fas fa-check-circle"></i>
                  <h4>Giải quyết vấn đề</h4>
                </div>

                <button className={styles.restartButton} onClick={() => setCurrentStep(1)}>
                  <i className="fas fa-redo"></i>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className={styles.featuresSection} id="features">
          <div className={styles.featuresContainer}>
            <div className={styles.sectionHeader}>
              <h2>Tính năng nổi bật</h2>
              <p>
                Khám phá các tính năng giúp bạn tiếp cận dịch vụ pháp lý một cách
                dễ dàng và hiệu quả.
              </p>
            </div>

            <div className={styles.serviceNavigation}>
              <div
                className={styles.navArrow}
                onClick={() => featureSwiperRef.current.slidePrev()}
              >
                <FaChevronLeft />
              </div>
              <div
                className={styles.navArrow}
                onClick={() => featureSwiperRef.current.slideNext()}
              >
                <FaChevronRight />
              </div>
            </div>

            <Swiper
              onSwiper={(swiper) => (featureSwiperRef.current = swiper)}
              effect={"coverflow"}
              grabCursor={true}
              centeredSlides={true}
              slidesPerView={"auto"}
              coverflowEffect={{
                rotate: 0,
                stretch: 0,
                depth: 100,
                modifier: 1.5,
                slideShadows: false,
              }}
              initialSlide={1}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              pagination={{
                clickable: true,
                el: ".service-pagination",
                bulletClass: styles.serviceIndicator,
                bulletActiveClass: styles.activeIndicator,
              }}
              modules={[Pagination, Navigation, Autoplay, EffectCoverflow]}
              className={styles.featureSwiper}
            >
              {features.map((feature, index) => (
                <SwiperSlide key={index} className={styles.featureSwiperSlide}>
                  <div className={styles.featureCard}>
                    <div className={styles.featureIconWrapper}>{feature.icon}</div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
            <div className="service-pagination"></div>
          </div>
        </section>

        {/* Lĩnh vực pháp lý */}
        <section className={styles.exchangeSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.titleHighlight}>Lĩnh vực pháp lý</span>
            </h2>
            <p className={styles.sectionDescription}>
              Đội ngũ luật sư chuyên nghiệp trong nhiều lĩnh vực
            </p>
          </div>

          <div className={styles.exchangeContainer}>
            <div className={styles.categoryControls}>
              <div
                className={styles.navArrow}
                onClick={() => categorySwiperRef.current.slidePrev()}
              >
                <FaChevronLeft />
              </div>
              <div
                className={styles.navArrow}
                onClick={() => categorySwiperRef.current.slideNext()}
              >
                <FaChevronRight />
              </div>
            </div>

            <Swiper
              onSwiper={(swiper) => (categorySwiperRef.current = swiper)}
              modules={[Pagination, Autoplay, Navigation]}
              grabCursor={true}
              pagination={{ clickable: true }}
              slidesPerView={1}
              spaceBetween={30}
              breakpoints={{
                640: { slidesPerView: 2 },
                960: { slidesPerView: 3 },
                1200: { slidesPerView: 4 }
              }}
              autoplay={{
                delay: 5000,
                disableOnInteraction: false
              }}
              className={styles.legalCategoriesSwiper}
            >
              {legalCategories.map((category, index) => (
                <SwiperSlide key={index} className={styles.legalCategorySlide}>
                  <div className={styles.legalCategoryCard}>
                    <div className={styles.categoryIcon}>
                      <i className={category.icon}></i>
                    </div>
                    <div className={styles.categoryContent}>
                      <h3 className={styles.categoryTitle}>{category.title}</h3>
                      <p className={styles.categoryDescription}>{category.description}</p>
                      <button className={styles.categoryButton} onClick={() => navigate('/services')}>
                        Xem chi tiết <i className="fas fa-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>

        {/* Card Feature Section */}
        <section className={styles.cardFeatureSection}>
          <div className={styles.cardFeatureContainer}>
            <div className={styles.cardImageContainer}>
              <div className={styles.cardImageOverlay}></div>
              <img
                src="https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=1912&auto=format&fit=crop"
                alt="AI Legal Assistant"
                className={styles.cardImage}
              />
            </div>
            <div className={styles.cardContent}>
              <h2 className={styles.cardTitle}>
                <span className={styles.titleHighlight}>Trợ lý AI</span> pháp lý của bạn
              </h2>
              <p className={styles.cardDescription}>
                Công nghệ AI tiên tiến giúp bạn tra cứu nhanh chóng, phân tích hồ sơ và đề xuất giải pháp pháp lý phù hợp.
                Tiết kiệm thời gian và chi phí với trí tuệ nhân tạo được đào tạo bởi các chuyên gia pháp lý hàng đầu.
              </p>
              <ul className={styles.cardFeatureList}>
                <li><i className="fas fa-check-circle"></i> Phân tích hồ sơ pháp lý</li>
                <li><i className="fas fa-check-circle"></i> Trả lời câu hỏi pháp lý 24/7</li>
                <li><i className="fas fa-check-circle"></i> Soạn thảo văn bản pháp lý</li>
                <li><i className="fas fa-check-circle"></i> Đề xuất phương án giải quyết</li>
              </ul>
              <button
                className={styles.cardButton}
                onClick={() => navigate('/services')}
              >
                Khám phá ngay <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className={styles.testimonialsSection}>
          <div className={styles.sectionHeader}>
            <h2>Nhận xét từ khách hàng</h2>
            <p>
              Những gì khách hàng nói về dịch vụ của chúng tôi
            </p>
          </div>

          <div className={styles.testimonialControls}>
            <div
              className={styles.navArrow}
              onClick={() => testimonialSwiperRef.current.slidePrev()}
            >
              <FaChevronLeft />
            </div>
            <div
              className={styles.navArrow}
              onClick={() => testimonialSwiperRef.current.slideNext()}
            >
              <FaChevronRight />
            </div>
          </div>

          <Swiper
            onSwiper={(swiper) => (testimonialSwiperRef.current = swiper)}
            effect={"coverflow"}
            grabCursor={true}
            centeredSlides={true}
            slidesPerView={1}
            coverflowEffect={{
              rotate: 0,
              stretch: 0,
              depth: 50,
              modifier: 2,
              slideShadows: false,
            }}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
            }}
            pagination={{
              clickable: true,
            }}
            breakpoints={{
              768: {
                slidesPerView: 1.5,
              },
              1024: {
                slidesPerView: 2.5,
              },
            }}
            modules={[EffectCoverflow, Pagination, Autoplay]}
            className={styles.testimonialsSwiper}
          >
            {testimonials.map((testimonial, index) => (
              <SwiperSlide key={index} className={styles.testimonialSlide}>
                <div className={styles.testimonialCard}>
                  <div className={styles.testimonialQuote}>
                    <i className="fas fa-quote-left"></i>
                  </div>
                  <p className={styles.testimonialContent}>"{testimonial.content}"</p>
                  <div className={styles.testimonialRating}>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                  </div>
                  <div className={styles.testimonialHeader}>
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className={styles.testimonialAvatar}
                    />
                    <div className={styles.testimonialInfo}>
                      <h4 className={styles.testimonialName}>{testimonial.name}</h4>
                      <p className={styles.testimonialRole}>{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>

        {/* Get Started Section - Chỉ hiển thị khi chưa đăng nhập */}
        {!isLoggedIn && (
          <section className={styles.getStartedSection}>
            <div className={styles.getStartedContent}>
              <h2 className={styles.getStartedTitle}>Bắt đầu ngay hôm nay</h2>
              <p className={styles.getStartedDescription}>
                Hơn 1000+ khách hàng đã tin tưởng sử dụng dịch vụ của chúng tôi
              </p>
              <div className={styles.getStartedButtons}>
                <button
                  className={styles.registerButton}
                  onClick={() => navigate('/register')}
                >
                  <i className="fas fa-user-plus"></i> Đăng ký
                </button>
                <button
                  className={styles.loginButton}
                  onClick={() => navigate('/login')}
                >
                  <i className="fas fa-sign-in-alt"></i> Đăng nhập
                </button>
              </div>
              <div className={styles.appLinks}>
                <a href="#" className={styles.appLink}>
                  <i className="fab fa-google-play"></i> Google Play
                </a>
                <a href="#" className={styles.appLink}>
                  <i className="fab fa-apple"></i> App Store
                </a>
              </div>
            </div>
          </section>
        )}

        {/* Footer Awards */}
        <section className={styles.awardsSection}>
          <div className={styles.awardContainer}>
            <div className={styles.award}>
              <i className="fas fa-award"></i>
              <span>Top best website LegAI 2025</span>
            </div>
            <div className={styles.award}>
              <i className="fas fa-shield-alt"></i>
              <span>Bảo mật</span>
            </div>
            <div className={styles.award}>
              <i className="fas fa-star"></i>
              <span>Đánh giá tốt</span>
            </div>
            <div className={styles.award}>
              <i className="fas fa-medal"></i>
              <span>Giải thưởng AI google</span>
            </div>
          </div>
        </section>
      </div>
      <ChatManager />
    </>
  );
};

export default Home;