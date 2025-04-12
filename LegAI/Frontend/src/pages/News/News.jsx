import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './News.module.css';
import Navbar from '../../components/layout/Nav/Navbar';
import PageTransition from '../../components/layout/TransitionPage/PageTransition';
import ChatManager from '../../components/layout/Chat/ChatManager';

const News = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [visibleNews, setVisibleNews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 6;

  // Danh mục tin tức
  const categories = [
    { id: 'all', name: 'Tất cả' },
    { id: 'legal-updates', name: 'Cập nhật pháp luật' },
    { id: 'case-studies', name: 'Án lệ' },
    { id: 'business-law', name: 'Pháp luật doanh nghiệp' },
    { id: 'civil-law', name: 'Pháp luật dân sự' },
    { id: 'criminal-law', name: 'Pháp luật hình sự' }
  ];

  // Dữ liệu mẫu tin tức
  const newsData = [
    {
      id: 1,
      title: 'Luật Đất đai 2024: Những thay đổi quan trọng',
      category: 'legal-updates',
      date: '28/05/2024',
      author: 'Luật sư Nguyễn Văn Minh',
      summary: 'Luật Đất đai 2024 có hiệu lực từ 01/08/2024 với nhiều điểm mới đáng chú ý về quyền sử dụng đất và các quy định về bồi thường giải phóng mặt bằng.',
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1973&auto=format&fit=crop',
      views: 1250,
      featured: true
    },
    {
      id: 2,
      title: 'Án lệ số 56/2024/AL: Hướng dẫn xử lý tranh chấp hợp đồng chuyển nhượng quyền sử dụng đất',
      category: 'case-studies',
      date: '15/05/2024',
      author: 'Luật sư Trần Thị Hương',
      summary: 'Hội đồng Thẩm phán TAND Tối cao đã ban hành án lệ mới về giải quyết tranh chấp hợp đồng chuyển nhượng quyền sử dụng đất khi không đủ điều kiện công chứng.',
      image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=2070&auto=format&fit=crop',
      views: 845,
      featured: false
    },
    {
      id: 3,
      title: 'Những điểm mới trong Bộ luật Lao động sửa đổi 2024',
      category: 'legal-updates',
      date: '10/05/2024',
      author: 'Luật sư Lê Thanh Tùng',
      summary: 'Bộ luật Lao động sửa đổi 2024 bổ sung nhiều quy định mới về thời giờ làm việc, nghỉ ngơi và chế độ bảo hiểm xã hội, có lợi hơn cho người lao động.',
      image: 'https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?q=80&w=2047&auto=format&fit=crop',
      views: 980,
      featured: true
    },
    {
      id: 4,
      title: 'Hướng dẫn chi tiết thủ tục đăng ký thành lập doanh nghiệp trực tuyến',
      category: 'business-law',
      date: '05/05/2024',
      author: 'Luật sư Phạm Minh Hiếu',
      summary: 'Bài viết hướng dẫn chi tiết các bước đăng ký thành lập doanh nghiệp qua Cổng thông tin quốc gia về đăng ký doanh nghiệp, giúp tiết kiệm thời gian và chi phí.',
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=2071&auto=format&fit=crop',
      views: 1120,
      featured: false
    },
    {
      id: 5,
      title: 'Tòa án tuyên án vụ tranh chấp tài sản thừa kế lớn nhất năm 2024',
      category: 'civil-law',
      date: '28/04/2024',
      author: 'Luật sư Nguyễn Thị Mai',
      summary: 'TAND TP.HCM vừa tuyên án vụ tranh chấp tài sản thừa kế trị giá hơn 1.000 tỷ đồng, thiết lập tiền lệ mới trong việc giải quyết các tranh chấp thừa kế phức tạp.',
      image: 'https://images.unsplash.com/photo-1589578527966-fdac0f44566c?q=80&w=1974&auto=format&fit=crop',
      views: 1650,
      featured: true
    },
    {
      id: 6,
      title: 'Quy định mới về bảo vệ dữ liệu cá nhân trong lĩnh vực tài chính-ngân hàng',
      category: 'legal-updates',
      date: '20/04/2024',
      author: 'Luật sư Trần Văn Hoàng',
      summary: 'Ngân hàng Nhà nước ban hành thông tư mới về bảo vệ dữ liệu cá nhân trong lĩnh vực tài chính-ngân hàng, tăng cường bảo mật thông tin khách hàng.',
      image: 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?q=80&w=2074&auto=format&fit=crop',
      views: 765,
      featured: false
    },
    {
      id: 7,
      title: 'Hướng dẫn xử lý vụ án hình sự liên quan đến tội phạm mạng',
      category: 'criminal-law',
      date: '15/04/2024',
      author: 'Luật sư Nguyễn Đức Thành',
      summary: 'Viện Kiểm sát nhân dân tối cao ban hành hướng dẫn mới về xử lý các vụ án hình sự liên quan đến tội phạm mạng, tăng cường công tác đấu tranh với loại tội phạm ngày càng phức tạp này.',
      image: 'https://images.unsplash.com/photo-1633265486501-0cf524a07213?q=80&w=2070&auto=format&fit=crop',
      views: 890,
      featured: false
    },
    {
      id: 8,
      title: 'Án lệ mới về giải quyết tranh chấp hợp đồng vay tài sản',
      category: 'case-studies',
      date: '10/04/2024',
      author: 'Luật sư Phạm Thị Lan',
      summary: 'Án lệ số 55/2024/AL của TAND Tối cao hướng dẫn cách xác định thời hiệu khởi kiện trong các tranh chấp hợp đồng vay tài sản không có thời hạn trả.',
      image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=1912&auto=format&fit=crop',
      views: 720,
      featured: false
    },
    {
      id: 9,
      title: 'Quy định mới về bảo vệ quyền lợi người tiêu dùng trong thương mại điện tử',
      category: 'legal-updates',
      date: '05/04/2024',
      author: 'Luật sư Lê Thanh Tùng',
      summary: 'Bộ Công Thương vừa ban hành thông tư quy định chi tiết về trách nhiệm của các sàn thương mại điện tử trong việc bảo vệ quyền lợi người tiêu dùng.',
      image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=2070&auto=format&fit=crop',
      views: 855,
      featured: false
    },
    {
      id: 10,
      title: 'Luật Thuế thu nhập doanh nghiệp sửa đổi: Cơ hội cho doanh nghiệp nhỏ và vừa',
      category: 'business-law',
      date: '01/04/2024',
      author: 'Luật sư Phạm Minh Hiếu',
      summary: 'Luật Thuế thu nhập doanh nghiệp sửa đổi có hiệu lực từ 01/07/2024 với nhiều ưu đãi và miễn giảm thuế cho doanh nghiệp nhỏ và vừa, khuyến khích đầu tư vào công nghệ cao.',
      image: 'https://images.unsplash.com/photo-1543286386-713bdd548da4?q=80&w=2070&auto=format&fit=crop',
      views: 930,
      featured: true
    },
    {
      id: 11,
      title: 'Giải quyết tranh chấp hợp đồng mua bán nhà hình thành trong tương lai',
      category: 'civil-law',
      date: '28/03/2024',
      author: 'Luật sư Nguyễn Thị Mai',
      summary: 'Bài viết phân tích các vướng mắc pháp lý và cách giải quyết tranh chấp phát sinh từ hợp đồng mua bán nhà hình thành trong tương lai, bảo vệ quyền lợi người mua nhà.',
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1973&auto=format&fit=crop',
      views: 810,
      featured: false
    },
    {
      id: 12,
      title: 'Xử lý nghiêm các hành vi vi phạm trong lĩnh vực an toàn thực phẩm',
      category: 'criminal-law',
      date: '20/03/2024',
      author: 'Luật sư Nguyễn Đức Thành',
      summary: 'Cơ quan chức năng tăng cường xử lý hình sự các hành vi vi phạm nghiêm trọng trong lĩnh vực an toàn thực phẩm, bảo vệ sức khỏe người tiêu dùng.',
      image: 'https://images.unsplash.com/photo-1563739017251-8421d07b0839?q=80&w=1074&auto=format&fit=crop',
      views: 695,
      featured: false
    }
  ];

  // Hiệu ứng
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Lọc bài viết theo danh mục và từ khóa tìm kiếm
  useEffect(() => {
    let filtered = [...newsData];
    
    // Lọc theo danh mục
    if (activeCategory !== 'all') {
      filtered = filtered.filter(item => item.category === activeCategory);
    }
    
    // Lọc theo từ khóa tìm kiếm
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(term) || 
        item.summary.toLowerCase().includes(term) ||
        item.author.toLowerCase().includes(term)
      );
    }
    
    setVisibleNews(filtered);
    setCurrentPage(1); // Reset về trang 1 khi thay đổi bộ lọc
  }, [activeCategory, searchTerm]);

  // Xử lý phân trang
  const totalPages = Math.ceil(visibleNews.length / itemsPerPage);
  const currentItems = visibleNews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Xử lý thay đổi trang
  const handlePageChange = (pageNumber) => {
    window.scrollTo(0, 0);
    setCurrentPage(pageNumber);
  };

  // Xử lý tìm kiếm
  const handleSearch = (e) => {
    e.preventDefault();
    // Đã được xử lý bằng useEffect khi searchTerm thay đổi
  };

  // Hiệu ứng
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  // Component hiển thị bài viết nổi bật
  const FeaturedNews = () => {
    const featuredItems = newsData.filter(item => item.featured).slice(0, 3);
    
    return (
      <div className={styles.featuredSection}>
        {featuredItems.map((item, index) => (
          <div 
            key={item.id} 
            className={`${styles.featuredItem} ${index === 0 ? styles.mainFeature : ''}`}
            onClick={() => window.location.href = `/news/${item.id}`}
          >
            <div className={styles.featuredImage}>
              <img src={item.image} alt={item.title} />
              <div className={styles.featuredOverlay}></div>
              <div className={styles.featuredCategory}>
                {categories.find(cat => cat.id === item.category)?.name}
              </div>
            </div>
            <div className={styles.featuredContent}>
              <h3>{item.title}</h3>
              <div className={styles.newsInfo}>
                <span><i className="fa-solid fa-user"></i> {item.author}</span>
                <span><i className="fa-solid fa-calendar"></i> {item.date}</span>
                <span><i className="fa-solid fa-eye"></i> {item.views}</span>
              </div>
              <p>{item.summary}</p>
              <button className={styles.readMoreButton}>
                Đọc tiếp <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Component hiển thị phân trang
  const Pagination = () => {
    if (totalPages <= 1) return null;
    
    const pageNumbers = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pageNumbers.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pageNumbers.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return (
      <div className={styles.pagination}>
        <button 
          className={`${styles.pageButton} ${currentPage === 1 ? styles.disabled : ''}`}
          onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        
        {pageNumbers.map((page, index) => (
          <button 
            key={index}
            className={`
              ${styles.pageButton} 
              ${page === currentPage ? styles.active : ''} 
              ${page === '...' ? styles.ellipsis : ''}
            `}
            onClick={() => page !== '...' && handlePageChange(page)}
            disabled={page === '...'}
          >
            {page}
          </button>
        ))}
        
        <button 
          className={`${styles.pageButton} ${currentPage === totalPages ? styles.disabled : ''}`}
          onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <PageTransition>
        <div className={styles.newsContainer}>
          <div className={styles.newsHero}>
            <div className={styles.heroOverlay}></div>
            <div className={styles.heroContent}>
              <h1>Tin Tức Pháp Luật</h1>
              <p>Cập nhật thông tin pháp luật mới nhất và những phân tích chuyên sâu</p>
            </div>
          </div>

          <div className={styles.newsContent}>
            {/* Các bài viết nổi bật */}
            <div className={styles.sectionHeader}>
              <h2>Bài Viết Nổi Bật</h2>
              <div className={styles.titleBar}></div>
            </div>
            
            <FeaturedNews />

            {/* Bộ lọc và tìm kiếm */}
            <div className={styles.filterSection}>
              <div className={styles.categories}>
                {categories.map((category) => (
                  <button 
                    key={category.id}
                    className={`${styles.categoryButton} ${activeCategory === category.id ? styles.active : ''}`}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
              
              <form className={styles.searchForm} onSubmit={handleSearch}>
                <input 
                  type="text"
                  placeholder="Tìm kiếm bài viết..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit">
                  <i className="fa-solid fa-search"></i>
                </button>
              </form>
            </div>

            {/* Danh sách bài viết */}
            <div className={styles.sectionHeader}>
              <h2>Tin Tức Mới Nhất</h2>
              <div className={styles.titleBar}></div>
            </div>
            
            {isLoading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Đang tải bài viết...</p>
              </div>
            ) : currentItems.length > 0 ? (
              <motion.div 
                className={styles.newsGrid}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {currentItems.map((item) => (
                  <motion.div 
                    key={item.id} 
                    className={styles.newsCard}
                    variants={itemVariants}
                    onClick={() => window.location.href = `/news/${item.id}`}
                  >
                    <div className={styles.newsImage}>
                      <img src={item.image} alt={item.title} />
                      <div className={styles.newsCategory}>
                        {categories.find(cat => cat.id === item.category)?.name}
                      </div>
                    </div>
                    <div className={styles.newsCardContent}>
                      <h3>{item.title}</h3>
                      <div className={styles.newsInfo}>
                        <span><i className="fa-solid fa-user"></i> {item.author}</span>
                        <span><i className="fa-solid fa-calendar"></i> {item.date}</span>
                      </div>
                      <p>{item.summary}</p>
                      <div className={styles.newsCardFooter}>
                        <span><i className="fa-solid fa-eye"></i> {item.views}</span>
                        <button className={styles.readMoreButton}>
                          Đọc tiếp <i className="fa-solid fa-arrow-right"></i>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className={styles.noResults}>
                <i className="fa-solid fa-search"></i>
                <h3>Không tìm thấy bài viết nào</h3>
                <p>Không có bài viết nào phù hợp với tiêu chí tìm kiếm của bạn.</p>
                <button onClick={() => {
                  setActiveCategory('all');
                  setSearchTerm('');
                }}>
                  Xem tất cả bài viết
                </button>
              </div>
            )}

            {/* Phân trang */}
            {currentItems.length > 0 && <Pagination />}
          </div>

          {/* CTA Section */}
          <div className={styles.ctaSection}>
            <div className={styles.ctaContent}>
              <h2>Đăng ký nhận tin tức pháp luật mới nhất</h2>
              <p>Cập nhật các thông tin pháp luật mới nhất và những phân tích chuyên sâu từ đội ngũ luật sư của chúng tôi</p>
              <form className={styles.subscribeForm}>
                <input type="email" placeholder="Địa chỉ email của bạn" required />
                <button type="submit">Đăng ký</button>
              </form>
            </div>
          </div>
        </div>
        <ChatManager />
      </PageTransition>
    </>
  );
};

export default News; 