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
import { FaHeadset, FaFileContract, FaArchive, FaRobot, FaSearch, FaChevronLeft, FaChevronRight, FaBook, FaGavel, FaUniversity, FaRegFileAlt, FaRegFilePdf, FaCalendarAlt, FaBriefcase, FaBuilding, FaHome, FaBalanceScale, FaShieldAlt } from 'react-icons/fa';
import { GiHandcuffs } from 'react-icons/gi';
import moment from 'moment';
import 'moment/locale/vi';

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
  const [activeService, setActiveService] = useState(0);
  const searchContainerRef = useRef(null);
  const popularDocsRef = useRef(null);
  const legalFieldsRef = useRef(null);
  const recentDocsRef = useRef(null);
  const servicesRef = useRef(null);

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
      // Kiểm tra xem types có phải là mảng không
      if (Array.isArray(types)) {
        setDocumentTypes(types);
      } else {
        console.warn('Dữ liệu documentTypes không phải là mảng:', types);
        setDocumentTypes([]); // Set mảng rỗng nếu không phải mảng
      }

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
      // Đảm bảo state luôn là mảng rỗng khi có lỗi
      setDocumentTypes([]);
      setRecentDocuments([]);
      setPopularTemplates([]);
    }
  };

  // Định dạng ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return 'Không có ngày';
    moment.locale('vi');
    return moment(dateString).format('DD/MM/YYYY');
  };

  // Xử lý tìm kiếm
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Xử lý chuyển hướng đến trang chi tiết văn bản
  const handleDocumentClick = (documentId) => {
    navigate(`/legal/documents/${documentId}`);
  };

  // Xử lý khi click vào thẻ dịch vụ
  const handleServiceClick = (index) => {
    setActiveService(index);
  };

  // Xử lý khi click vào nút Liên hệ
  const handleContactClick = () => {
    navigate('/contact');
  };

  // Dữ liệu cho các lĩnh vực pháp lý
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

  // Dữ liệu dịch vụ pháp lý
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

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <video className={styles.videoBackground} autoPlay loop muted>
            <source src="/video/3.mp4" type="video/mp4" />
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
              {Array.isArray(documentTypes) 
                ? documentTypes.slice(0, 6).map((type, index) => (
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
                ))
                : <div className={styles.loadingTypes}>Đang tải loại văn bản...</div>
              }
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
                    onClick={() => handleDocumentClick(doc.id)}
                  >
                    <div className={styles.recentDocImage}>
                      <img 
                        src="https://images.unsplash.com/photo-1505663912202-ac22d4cb3707?q=80&w=2070&auto=format&fit=crop" 
                        alt={doc.title} 
                      />
                      <div className={styles.recentDocOverlay}></div>
                      <div className={styles.recentDocType}>{doc.document_type}</div>
                    </div>
                    <div className={styles.recentDocContent}>
                      <h3 className={styles.recentDocTitle}>{doc.title}</h3>
                      <div className={styles.recentDocInfo}>
                        <span><i className="fa-solid fa-bookmark"></i> {doc.document_type}</span>
                        <span><i className="fa-solid fa-calendar"></i> {formatDate(doc.issued_date)}</span>
                      </div>
                      <p className={styles.recentDocSummary}>
                        {doc.summary ? (doc.summary.length > 120 ? doc.summary.substring(0, 120) + '...' : doc.summary) : 'Không có tóm tắt'}
                      </p>
                      <div className={styles.recentDocFooter}>
                        <button className={styles.viewDetailButton}>
                          Xem chi tiết <i className="fa-solid fa-arrow-right"></i>
                        </button>
                      </div>
                    </div>
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

        {/* Services Section */}
        <section ref={servicesRef} className={styles.servicesSection}>
          <div className={styles.sectionContainer}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.servicesTitle}>Dịch vụ pháp lý chuyên nghiệp</h2>
              <p className={styles.servicesDescription}>
                Cung cấp các dịch vụ pháp lý toàn diện, chất lượng cao với đội ngũ luật sư giàu kinh nghiệm
              </p>
            </div>

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