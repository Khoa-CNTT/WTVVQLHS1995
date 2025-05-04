import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './News.module.css';
import Navbar from '../../components/layout/Nav/Navbar';
import PageTransition from '../../components/layout/TransitionPage/PageTransition';
import ChatManager from '../../components/layout/Chat/ChatManager';
import legalService from '../../services/legalService';
import moment from 'moment';
import 'moment/locale/vi';

const News = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [visibleNews, setVisibleNews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [featuredDocuments, setFeaturedDocuments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 6;

  // Danh mục tin tức - sử dụng các loại văn bản pháp luật
  const categories = [
    { id: 'all', name: 'Tất cả' },
    { id: 'luật', name: 'Luật' },
    { id: 'nghị định', name: 'Nghị định' },
    { id: 'thông tư', name: 'Thông tư' },
    { id: 'quyết định', name: 'Quyết định' },
    { id: 'nghị quyết', name: 'Nghị quyết' }
  ];

  // Lấy dữ liệu văn bản pháp luật từ API
  useEffect(() => {
    const fetchLegalDocuments = async () => {
      setIsLoading(true);
      try {
        // Lấy tất cả văn bản pháp luật có thể
        const response = await legalService.getLegalDocuments({
          page: 1,
          limit: 500, // Tăng limit lên rất cao để lấy tất cả văn bản
        });

        if (response && response.data) {
          // Lưu toàn bộ dữ liệu
          setDocuments(response.data);
          setTotalItems(response.pagination?.total || response.data.length);
          
          // Lấy 3 văn bản mới nhất làm featured
          const featured = [...response.data]
            .sort((a, b) => new Date(b.issued_date || 0) - new Date(a.issued_date || 0))
            .slice(0, 3);
          
          setFeaturedDocuments(featured);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu văn bản pháp luật:', error);
        setIsLoading(false);
        
        // Thử lấy dữ liệu ở nhiều trang nếu API giới hạn số lượng trên một trang
        try {
          const allDocuments = [];
          let currentPage = 1;
          let hasMoreData = true;
          const pageSize = 100;
          
          while (hasMoreData && currentPage <= 5) { // Lấy tối đa 5 trang (500 văn bản)
            const pageResponse = await legalService.getLegalDocuments({
              page: currentPage,
              limit: pageSize,
            });
            
            if (pageResponse && pageResponse.data && pageResponse.data.length > 0) {
              allDocuments.push(...pageResponse.data);
              
              // Kiểm tra xem còn dữ liệu không
              hasMoreData = pageResponse.data.length >= pageSize;
              currentPage++;
            } else {
              hasMoreData = false;
            }
          }
          
          if (allDocuments.length > 0) {
            setDocuments(allDocuments);
            setTotalItems(allDocuments.length);
            
            // Lấy 3 văn bản mới nhất làm featured
            const featured = [...allDocuments]
              .sort((a, b) => new Date(b.issued_date || 0) - new Date(a.issued_date || 0))
              .slice(0, 3);
              
            setFeaturedDocuments(featured);
          }
          
          setIsLoading(false);
        } catch (fallbackError) {
          console.error('Lỗi khi lấy dữ liệu từ nhiều trang:', fallbackError);
          setIsLoading(false);
        }
      }
    };

    fetchLegalDocuments();
  }, []);

  // Lọc văn bản theo danh mục và từ khóa tìm kiếm
  useEffect(() => {
    let filtered = [...documents];
    
    // Lọc theo danh mục (loại văn bản) - không phân biệt hoa thường
    if (activeCategory !== 'all') {
      const categoryLower = activeCategory.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.document_type && doc.document_type.toLowerCase().includes(categoryLower)
      );
    }
    
    // Lọc theo từ khóa tìm kiếm
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(doc => 
        (doc.title ? doc.title.toLowerCase().includes(term) : false) || 
        (doc.summary ? doc.summary.toLowerCase().includes(term) : false) ||
        (doc.document_type ? doc.document_type.toLowerCase().includes(term) : false)
      );
    }
    
    setVisibleNews(filtered);
    setCurrentPage(1); // Reset về trang 1 khi thay đổi bộ lọc
  }, [activeCategory, searchTerm, documents]);

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

  // Định dạng ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return 'Không có ngày';
    moment.locale('vi');
    return moment(dateString).format('DD/MM/YYYY');
  };

  // Xử lý chuyển hướng đến trang chi tiết văn bản
  const handleDocumentClick = (documentId) => {
    window.location.href = `/legal/documents/${documentId}`;
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

  // Component hiển thị văn bản nổi bật
  const FeaturedNews = () => {
    if (featuredDocuments.length === 0) {
      return <div className={styles.loadingContainer}>Không có văn bản nổi bật</div>;
    }
    
    // Hiển thị 3 văn bản mới nhất làm featured
    return (
      <div className={styles.featuredSection}>
        {featuredDocuments.map((doc, index) => (
          <div 
            key={doc.id} 
            className={`${styles.featuredItem} ${index === 0 ? styles.mainFeature : ''}`}
            onClick={() => handleDocumentClick(doc.id)}
          >
            <div className={styles.featuredImage}>
              <img 
                src="https://images.unsplash.com/photo-1505663912202-ac22d4cb3707?q=80&w=2070&auto=format&fit=crop" 
                alt={doc.title} 
              />
              <div className={styles.featuredOverlay}></div>
              <div className={styles.featuredCategory}>
                {doc.document_type || 'Văn bản pháp luật'}
              </div>
            </div>
            <div className={styles.featuredContent}>
              <h3>{doc.title}</h3>
              <div className={styles.newsInfo}>
                <span><i className="fa-solid fa-bookmark"></i> {doc.document_type}</span>
                <span><i className="fa-solid fa-calendar"></i> {formatDate(doc.issued_date)}</span>
              </div>
              <p>{doc.summary || 'Văn bản pháp luật mới được ban hành, bao gồm những quy định quan trọng ảnh hưởng đến nhiều lĩnh vực của đời sống xã hội và hoạt động kinh doanh.'}</p>
              <button className={styles.readMoreButton}>
                Xem chi tiết <i className="fa-solid fa-arrow-right"></i>
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
              <h1>Văn Bản Pháp Luật Mới</h1>
              <p>Cập nhật thông tin pháp luật mới nhất và những văn bản quan trọng</p>
            </div>
          </div>

          <div className={styles.newsContent}>
            {/* Các văn bản nổi bật */}
            <div className={styles.sectionHeader}>
              <h2>Văn Bản Mới Ban Hành</h2>
              <div className={styles.titleBar}></div>
            </div>
            
            {isLoading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Đang tải văn bản...</p>
              </div>
            ) : (
              <FeaturedNews />
            )}

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
                  placeholder="Tìm kiếm văn bản..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit">
                  <i className="fa-solid fa-search"></i>
                </button>
              </form>
            </div>

            {/* Danh sách văn bản */}
            <div className={styles.sectionHeader}>
              <h2>Văn Bản Pháp Luật</h2>
              <div className={styles.titleBar}></div>
            </div>
            
            {isLoading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Đang tải văn bản pháp luật...</p>
              </div>
            ) : currentItems.length > 0 ? (
              <motion.div 
                className={styles.newsGrid}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {currentItems.map((doc) => (
                  <motion.div 
                    key={doc.id} 
                    className={styles.newsCard}
                    variants={itemVariants}
                    onClick={() => handleDocumentClick(doc.id)}
                  >
                    <div className={styles.newsImage}>
                      <img 
                        src="https://images.unsplash.com/photo-1505663912202-ac22d4cb3707?q=80&w=2070&auto=format&fit=crop" 
                        alt={doc.title} 
                      />
                      <div className={styles.newsCategory}>
                        {doc.document_type || 'Văn bản pháp luật'}
                      </div>
                    </div>
                    <div className={styles.newsCardContent}>
                      <h3>{doc.title}</h3>
                      <div className={styles.newsInfo}>
                        <span><i className="fa-solid fa-bookmark"></i> {doc.document_type}</span>
                        <span><i className="fa-solid fa-calendar"></i> {formatDate(doc.issued_date)}</span>
                      </div>
                      <p>{doc.summary || 'Văn bản pháp luật quan trọng có tác động đến nhiều lĩnh vực.'}</p>
                      <div className={styles.newsCardFooter}>
                        <button className={styles.readMoreButton}>
                          Xem chi tiết <i className="fa-solid fa-arrow-right"></i>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className={styles.noResults}>
                <i className="fa-solid fa-search"></i>
                <h3>Không tìm thấy văn bản nào</h3>
                <p>Không có văn bản nào phù hợp với tiêu chí tìm kiếm của bạn.</p>
                <button onClick={() => {
                  setActiveCategory('all');
                  setSearchTerm('');
                }}>
                  Xem tất cả văn bản
                </button>
              </div>
            )}

            {/* Phân trang */}
            {currentItems.length > 0 && <Pagination />}
          </div>

          {/* CTA Section */}
          <div className={styles.ctaSection}>
            <div className={styles.ctaContent}>
              <h2>Đăng ký nhận cập nhật văn bản pháp luật mới</h2>
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