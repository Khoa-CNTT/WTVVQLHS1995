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
import legalService from '../../services/legalService';
import { FaHeadset, FaFileContract, FaArchive, FaRobot, FaSearch, FaChevronLeft, FaChevronRight, FaBook, FaGavel, FaUniversity, FaRegFileAlt, FaRegFilePdf, FaCalendarAlt, FaBriefcase, FaBuilding, FaHome, FaBalanceScale } from 'react-icons/fa';
import { GiHandcuffs } from 'react-icons/gi';

const Home = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [animateApp, setAnimateApp] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [popularTemplates, setPopularTemplates] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const searchContainerRef = useRef(null);
  const popularDocsRef = useRef(null);
  const legalFieldsRef = useRef(null);
  const recentDocsRef = useRef(null);

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

    fetchInitialData();
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

  // Animation khi scroll
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const animateOnScroll = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (entry.target === searchContainerRef.current) {
            entry.target.classList.add('visible');
          } else if (entry.target === popularDocsRef.current) {
            entry.target.classList.add('visible');
          } else if (entry.target === legalFieldsRef.current) {
            entry.target.classList.add('visible');
          } else if (entry.target === recentDocsRef.current) {
            entry.target.classList.add('visible');
          }
        }
      });
    };

    const observer = new IntersectionObserver(animateOnScroll, observerOptions);
    
    if (searchContainerRef.current) observer.observe(searchContainerRef.current);
    if (popularDocsRef.current) observer.observe(popularDocsRef.current);
    if (legalFieldsRef.current) observer.observe(legalFieldsRef.current);
    if (recentDocsRef.current) observer.observe(recentDocsRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Lấy dữ liệu ban đầu khi trang được tải
  const fetchInitialData = async () => {
    try {
      // Lấy loại văn bản pháp luật
      const types = await legalService.getDocumentTypes();
      setDocumentTypes(types);

      // Lấy văn bản pháp luật mới nhất
      const docsResponse = await legalService.getLegalDocuments({
        limit: 6,
        sort_by: 'issued_date',
        sort_direction: 'desc'
      });
      
      if (docsResponse && docsResponse.status === 'success') {
        setRecentDocuments(docsResponse.data);
      }

      // Lấy mẫu văn bản phổ biến
      const templatesResponse = await legalService.getDocumentTemplates({
        limit: 6
      });
      
      if (templatesResponse && templatesResponse.status === 'success') {
        setPopularTemplates(templatesResponse.data);
      }
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu ban đầu:', error);
    }
  };

  // Xử lý tìm kiếm
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Định dạng ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return 'Không có ngày';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Dữ liệu cho các lĩnh vực pháp lýok
  const legalCategories = [
    {
      icon: <FaBuilding />,
      title: 'Doanh nghiệp',
      description: 'Thành lập công ty, thuế, sở hữu trí tuệ, tranh chấp thương mại',
      searchTerm: 'doanh nghiệp công ty thuế sở hữu trí tuệ'
    },
    {
      icon: <FaHome />,
      title: 'Bất động sản',
      description: 'Mua bán, cho thuê, tranh chấp đất đai, quy hoạch xây dựng',
      searchTerm: 'bất động sản đất đai nhà ở quy hoạch'
    },
    {
      icon: <FaBalanceScale />,
      title: 'Dân sự',
      description: 'Hôn nhân gia đình, thừa kế, hợp đồng, bồi thường thiệt hại',
      searchTerm: 'dân sự hôn nhân gia đình thừa kế'
    },
    {
      icon: <GiHandcuffs />,
      title: 'Hình sự',
      description: 'Bào chữa, tố tụng hình sự, thi hành án',
      searchTerm: 'hình sự tố tụng'
    },
    {
      icon: <FaBriefcase />,
      title: 'Lao động',
      description: 'Hợp đồng lao động, bảo hiểm, tranh chấp lao động',
      searchTerm: 'lao động bảo hiểm lương'
    }
  ];

  return (
    <>
      <Navbar />
<<<<<<< HEAD
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <video className={styles.videoBackground} autoPlay loop muted>
            <source src="/video/vid.mp4" type="video/mp4" />
        </video>
=======
      <div className={styles.container}>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <video className={styles.videoBackground} autoPlay loop muted>
            <source src="/video/3.mp4" type="video/mp4" />
          </video>
>>>>>>> main
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

        {/* Search Section */}
        <section ref={searchContainerRef} className={styles.searchSection}>
          <div className={`${styles.searchContainer} ${styles.fadeInUp}`}>
            <h2 className={`${styles.searchTitle} ${styles.fadeInUp}`}>Tra cứu pháp luật thông minh</h2>
            <p className={`${styles.searchDescription} ${styles.fadeInUp}`}>
              Hệ thống tìm kiếm thông minh giúp bạn tìm thấy văn bản pháp luật và mẫu tài liệu nhanh chóng
            </p>
            <form onSubmit={handleSearch} className={`${styles.searchForm} ${styles.fadeInUp}`}>
              <div className={styles.searchInputContainer}>
                <FaSearch className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Nhập từ khóa, số hiệu văn bản, nội dung tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                <button type="submit" className={styles.searchButton}>
                  Tìm kiếm
                </button>
              </div>
              <div className={`${styles.searchHints} ${styles.fadeInUp}`}>
                <p>Gợi ý: <span onClick={() => navigate('/search?q=Luật dân sự')}>Luật dân sự</span> • <span onClick={() => navigate('/search?q=Luật hình sự')}>Luật hình sự</span> • <span onClick={() => navigate('/search?q=Luật doanh nghiệp')}>Luật doanh nghiệp</span> • <span onClick={() => navigate('/search?q=Nghị định')}>Nghị định</span></p>
              </div>
            </form>

            <div className={`${styles.searchQuickLinks} ${styles.fadeInUp}`}>
              <div 
                className={styles.quickLinkItem}
                onClick={() => navigate('/documents')}
              >
                <FaBook className={styles.quickLinkIcon} />
                <span>Văn bản pháp luật</span>
              </div>
              <div 
                className={styles.quickLinkItem}
                onClick={() => navigate('/templates')}
              >
                <FaRegFileAlt className={styles.quickLinkIcon} />
                <span>Mẫu tài liệu</span>
              </div>
              {isLoggedIn && (
                <div 
                  className={styles.quickLinkItem}
                  onClick={() => navigate('/chat')}
                >
                  <FaRobot className={styles.quickLinkIcon} />
                  <span>Hỏi AI pháp lý</span>
                </div>
              )}
              <div 
                className={styles.quickLinkItem}
                onClick={() => navigate('/lawyers')}
              >
                <FaGavel className={styles.quickLinkIcon} />
                <span>Tư vấn luật sư</span>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Legal Documents */}
        <section ref={popularDocsRef} className={styles.popularDocsSection}>
          <div className={styles.sectionContainer}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.fadeInUp}>Văn bản pháp luật phổ biến</h2>
              <p className={styles.fadeInUp}>Tra cứu các văn bản pháp luật được sử dụng nhiều nhất</p>
            </div>

            <div className={styles.docTypeCategories}>
              {documentTypes.slice(0, 6).map((type, index) => (
                <div 
                  key={index} 
                  className={`${styles.docTypeCard} ${styles.fadeInUp}`}
                  onClick={() => navigate(`/documents?document_type=${encodeURIComponent(type.name)}`)}
                >
                  <div className={styles.docTypeIcon}>
                    <FaRegFilePdf />
                  </div>
                  <h3>{type.name}</h3>
                  <p>{type.description || `Các văn bản ${type.name.toLowerCase()}`}</p>
                </div>
              ))}
            </div>

            <div className={`${styles.viewAllContainer} ${styles.fadeInUp}`}>
              <button 
                className={styles.viewAllButton}
                onClick={() => navigate('/documents')}
              >
                Xem tất cả văn bản
              </button>
            </div>
          </div>
        </section>

        {/* Legal Fields Section */}
        <section ref={legalFieldsRef} className={styles.legalFieldsSection}>
          <div className={styles.sectionContainer}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.legalFieldsTitle}>Lĩnh vực pháp lý</h2>
              <p className={styles.legalFieldsDescription}>Khám phá thông tin pháp luật theo lĩnh vực chuyên môn</p>
            </div>

            <div className={styles.legalFieldsGrid}>
              {legalCategories.map((category, index) => (
                <div 
                  key={index} 
                  className={`${styles.legalFieldCard} ${styles.fadeIn}`}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(category.searchTerm)}`)}
                >
                  <div className={styles.legalFieldIcon}>
                    {category.icon}
                  </div>
                  <div className={styles.legalFieldContent}>
                    <h3>{category.title}</h3>
                    <p>{category.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Documents */}
        <section ref={recentDocsRef} className={styles.recentDocsSection}>
          <div className={styles.sectionContainer}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.fadeInRight}>Văn bản mới cập nhật</h2>
              <p className={styles.fadeInRight}>Những văn bản pháp luật mới nhất được cập nhật trên hệ thống</p>
            </div>

            <div className={styles.recentDocsGrid}>
              {recentDocuments.length > 0 ? (
                recentDocuments.map((doc, index) => (
                  <div 
                    key={index} 
                    className={`${styles.recentDocCard} ${styles.fadeInRight}`}
                    onClick={() => navigate(`legal/documents/${doc.id}`)}
                  >
                    <div className={styles.recentDocMeta}>
                      <span className={styles.recentDocType}>{doc.document_type}</span>
                      <span className={styles.recentDocDate}>
                        <FaCalendarAlt />
                        {formatDate(doc.issued_date)}
                      </span>
                    </div>
                    <h3 className={styles.recentDocTitle}>{doc.title}</h3>
                    <p className={styles.recentDocSummary}>
                      {doc.summary ? (doc.summary.length > 120 ? doc.summary.substring(0, 120) + '...' : doc.summary) : 'Không có tóm tắt'}
                    </p>
                  </div>
                ))
              ) : (
                <div className={`${styles.noDocsMessage} ${styles.fadeInRight}`}>
                  <p>Không có văn bản mới</p>
                </div>
              )}
            </div>

            <div className={`${styles.viewAllContainer} ${styles.fadeInRight}`}>
              <button 
                className={styles.viewAllButton}
                onClick={() => navigate('/documents')}
              >
                Xem tất cả văn bản
              </button>
            </div>
          </div>
        </section>

        {/* Get Started Section */}
        <section className={styles.getStartedSection}>
          <div className={styles.getStartedContent}>
            <h2 className={styles.getStartedTitle}>Bắt đầu sử dụng ngay hôm nay</h2>
            <p className={styles.getStartedDescription}>
              Tạo tài khoản để trải nghiệm đầy đủ tính năng của LegAI - nền tảng pháp lý tích hợp trí tuệ nhân tạo hàng đầu
            </p>
            <div className={styles.getStartedButtons}>
              {!isLoggedIn ? (
                <>
                  <button
                    className={styles.registerButton}
                    onClick={() => navigate('/register')}
                  >
                    Đăng ký
                  </button>
                  <button
                    className={styles.loginButton}
                    onClick={() => navigate('/login')}
                  >
                    Đăng nhập
                  </button>
                </>
              ) : (
                <button
                  className={styles.primaryButton}
                  onClick={() => navigate('/profile')}
                >
                  Quản lý tài khoản
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
      
      <ChatManager />
    </>
  );
};

export default Home;