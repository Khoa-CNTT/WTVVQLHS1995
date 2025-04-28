import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Lawyers.module.css';
import Navbar from '../../components/layout/Nav/Navbar';
import PageTransition from '../../components/layout/TransitionPage/PageTransition';
import ChatManager from '../../components/layout/Chat/ChatManager';
import userService from '../../services/userService';
import authService from '../../services/authService';
import { API_URL } from '../../config/constants';
import { toast } from 'react-toastify';
import AppointmentForm from './components/AppointmentForm';

function Lawyers() {
  const [activeTab, setActiveTab] = useState('all');
  const [lawyers, setLawyers] = useState([]);
  const [visibleLawyers, setVisibleLawyers] = useState([]);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // Lấy danh sách chuyên môn từ backend
  const [specialties, setSpecialties] = useState([
    { id: 'all', name: 'Tất cả' },
    { id: 'Dân sự', name: 'Dân sự' },
    { id: 'Hình sự', name: 'Hình sự' },
    { id: 'Hôn nhân', name: 'Hôn nhân' },
    { id: 'Đất đai', name: 'Đất đai' },
    { id: 'Doanh nghiệp', name: 'Doanh nghiệp' },
    { id: 'Sở hữu trí tuệ', name: 'Sở hữu trí tuệ' },
    { id: 'Lao động', name: 'Lao động' },
    { id: 'Hành chính', name: 'Hành chính' }
  ]);

  // Kiểm tra đăng nhập và tải danh sách chuyên môn
  useEffect(() => {
    // Kiểm tra trạng thái đăng nhập
    const checkLoginStatus = () => {
      const isLoggedIn = authService.isAuthenticated();
      setUserLoggedIn(isLoggedIn);
    };

    // Tải danh sách chuyên môn từ backend
    const fetchSpecializations = async () => {
      try {
        // Lấy danh sách luật sư từ backend
        const response = await userService.getAllLawyers(1, 50); // Lấy 50 luật sư để có đủ specialization
        
        if (response && response.data && response.data.lawyers) {
          // Tập hợp tất cả specialization
          const uniqueSpecializations = new Set();
          
          // Thêm mục "Tất cả" luôn đầu tiên
          uniqueSpecializations.add('all');
          
          // Lấy tất cả specialization từ các luật sư
          response.data.lawyers.forEach(lawyer => {
            if (lawyer.specialization) {
              if (Array.isArray(lawyer.specialization)) {
                lawyer.specialization.forEach(spec => {
                  if (spec && spec.trim()) uniqueSpecializations.add(spec.trim());
                });
              } else if (typeof lawyer.specialization === 'string') {
                lawyer.specialization.split(',').forEach(spec => {
                  if (spec && spec.trim()) uniqueSpecializations.add(spec.trim());
                });
              }
            }
          });
          
          // Chuyển đổi set thành mảng và định dạng
          const specializationsList = Array.from(uniqueSpecializations).map(spec => {
            return spec === 'all' ? { id: 'all', name: 'Tất cả' } : { id: spec, name: spec };
          });
          
          // Sắp xếp với "Tất cả" ở đầu tiên
          specializationsList.sort((a, b) => {
            if (a.id === 'all') return -1;
            if (b.id === 'all') return 1;
            return a.name.localeCompare(b.name);
          });
          
          setSpecialties(specializationsList);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách chuyên môn:', error);
      }
    };
    
    checkLoginStatus();
    fetchSpecializations();
  }, []);

  // Gọi API lấy luật sư mỗi khi thay đổi trang, tab, hoặc từ khóa tìm kiếm
  useEffect(() => {
    fetchLawyers();
  }, [page, activeTab, searchTerm]);

  const fetchLawyers = async () => {
    try {
      setLoading(true);
      
      // Sử dụng getAllLawyers với các tham số phù hợp
      const response = await userService.getAllLawyers(
        page, 
        10, 
        searchTerm, 
        activeTab === 'all' ? '' : activeTab
      );

      if (response && response.data) {
        // Xử lý đường dẫn avatar và đảm bảo dữ liệu nhất quán
        const lawyersWithValidImages = response.data.lawyers.map(lawyer => {
          // Lấy đường dẫn avatar từ nhiều nguồn khác nhau
          const avatarUrl = lawyer.avatar || lawyer.avatarUrl || lawyer.avatar_url;

          // Sử dụng hàm getFullAvatarUrl để lấy đường dẫn đầy đủ
          const fullAvatarUrl = userService.getFullAvatarUrl(avatarUrl);

          // Đánh dấu featured cho luật sư có rating 5 sao
          const featured = lawyer.featured || lawyer.rating >= 4.5;

          return {
            ...lawyer,
            avatarUrl: fullAvatarUrl,
            featured: featured
          };
        });

        setLawyers(lawyersWithValidImages || []);
        setVisibleLawyers(lawyersWithValidImages || []);
        setTotalPages(response.data.totalPages || 1);
      } else {
        // Nếu chưa có API hoặc có lỗi, sẽ hiển thị dữ liệu mẫu
        setVisibleLawyers(sampleLawyers);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách luật sư:', error);
      setVisibleLawyers(sampleLawyers);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setPage(1); // Reset về trang đầu tiên khi tìm kiếm
  };

  const clearSearch = () => {
    setSearchTerm('');
    setPage(1);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1); // Reset về trang đầu tiên khi chuyển tab
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  // Xử lý khi click vào luật sư
  const handleLawyerClick = async (lawyer) => {
    try {
      // Lấy thông tin chi tiết của luật sư
      const lawyerDetails = await userService.getLawyerById(lawyer.id);

      // Đảm bảo có ít nhất một object không rỗng để hiển thị
      const combinedData = lawyerDetails || lawyer || {};

      // Xử lý experienceYears - đảm bảo luôn là số
      let experienceYears = 0;
      if (combinedData.experienceYears) {
        experienceYears = parseInt(combinedData.experienceYears) || 0;
      }

      // Xử lý avatar URL sử dụng hàm getFullAvatarUrl
      const avatarUrl = userService.getFullAvatarUrl(
        combinedData.avatarUrl || combinedData.avatar || combinedData.avatar_url
      );

      // Kết hợp thông tin và cập nhật experienceYears và avatarUrl
      setSelectedLawyer({
        ...lawyer,
        ...lawyerDetails,
        experienceYears, // Đảm bảo là số
        avatarUrl // Đảm bảo có URL hợp lệ
      });
    } catch (error) {
      console.error('Lỗi lấy thông tin chi tiết luật sư:', error);

      // Xử lý mặc định nếu có lỗi
      const experienceYears = parseInt(lawyer.experienceYears) || 0;
      const avatarUrl = userService.getFullAvatarUrl(lawyer.avatarUrl);

      setSelectedLawyer({
        ...lawyer,
        experienceYears,
        avatarUrl
      });
    }

    setIsModalOpen(true);
    // Reset trạng thái đánh giá
    setUserRating(0);
    setReviewText('');
    setReviewSuccess(false);
  };

  // Đóng modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLawyer(null);
  };

  // Xử lý đặt lịch hẹn
  const handleAppointment = (lawyer) => {
    setSelectedLawyer(lawyer);
    setShowAppointmentModal(true);
  };

  const handleAppointmentSuccess = (appointment) => {
    // Hiển thị thông báo thành công
    setSuccessMessage('Đặt lịch hẹn thành công! Luật sư sẽ xác nhận lịch hẹn của bạn sớm.');
    setShowAppointmentModal(false);
    setTimeout(() => {
      setSuccessMessage('');
    }, 5000);
  };

  // Hàm xử lý gửi đánh giá - đã sửa lỗi process is not defined
  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!userRating) {
      toast.error('Vui lòng chọn số sao đánh giá');
      return;
    }

    setSubmittingReview(true);

    try {
      // Sử dụng API_URL từ constants thay vì process.env
      const response = await fetch(`${API_URL}/reviews/lawyer/${selectedLawyer.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          rating: userRating
        })
      });
      // Đơn giản hóa xử lý kết quả
      if (response.status === 200) {
        setReviewSuccess(true);

        // Cập nhật rating hiển thị trên UI
        setSelectedLawyer(prev => ({
          ...prev,
          rating: userRating, // Đơn giản hóa: hiển thị đúng rating vừa đánh giá
          reviews: (prev.reviews || 0) + 1
        }));
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Không thể gửi đánh giá. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Lỗi khi gửi đánh giá:', error);
      toast.error('Không thể gửi đánh giá. Vui lòng thử lại sau.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Dữ liệu mẫu luật sư - dùng khi API chưa hoàn thiện
  const sampleLawyers = [
    {
      id: 1,
      fullName: 'Nguyễn Văn Minh',
      avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
      position: 'Luật sư Trưởng',
      specialization: ['Doanh nghiệp', 'Dân sự'],
      experienceYears: 15,
      education: 'Tiến sĩ Luật - Đại học Luật Hà Nội',
      bio: 'Luật sư Nguyễn Văn Minh là một trong những chuyên gia hàng đầu về luật doanh nghiệp và luật dân sự tại Việt Nam. Với hơn 15 năm kinh nghiệm, ông đã tư vấn và đại diện cho nhiều doanh nghiệp lớn trong nước và quốc tế.',
      achievements: [
        'Đại diện pháp lý cho hơn 200 doanh nghiệp',
        'Giải quyết thành công nhiều vụ tranh chấp thương mại phức tạp',
        'Được vinh danh trong Top 10 Luật sư xuất sắc nhất năm 2022'
      ],
      contact: {
        email: 'minh.nguyen@legai.vn',
        phone: '(+84) 909 123 456'
      },
      rating: 4.9,
      reviews: 120,
      featured: true
    },
    // ... keep other sample lawyers
  ];

  // Phần đánh giá luật sư renderReviewSection
  const renderReviewSection = () => {
    if (!userLoggedIn) {
      return (
        <div className={styles.reviewSection}>
          <h3>Đánh giá</h3>
          <div className={styles.loginToReview}>
            <p>Vui lòng <Link to="/login" className={styles.loginLink}>đăng nhập</Link> để đánh giá luật sư này</p>
          </div>
        </div>
      );
    }

    if (reviewSuccess) {
      return (
        <div className={styles.reviewSection}>
          <h3>Đánh giá</h3>
          <div className={styles.reviewSuccess}>
            <i className="fas fa-check-circle"></i>
            <p>Cảm ơn bạn đã đánh giá luật sư này!</p>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.reviewSection}>
        <h3>Đánh giá</h3>
        <form onSubmit={handleSubmitReview} className={styles.reviewForm}>
          <div className={styles.ratingSelect}>
            <span>Chọn đánh giá của bạn:</span>
            <div className={styles.starRating}>
              {[1, 2, 3, 4, 5].map((star) => (
                <i
                  key={`review-star-${selectedLawyer.id}-${star}`}
                  className={`fas fa-star ${star <= userRating ? styles.selected : ''}`}
                  onClick={() => setUserRating(star)}
                ></i>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={submittingReview || !userRating}
            className={styles.submitReviewButton}
          >
            {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
        </form>
      </div>
    );
  };

  return (
    <PageTransition>
      <Navbar />
      <ChatManager />

      <div className={styles.lawyersPage}>
        <div className={styles.banner}>
          <div className={styles.bannerOverlay}></div>
          <div className={styles.bannerContent}>
            <h1>Đội ngũ Luật sư chuyên nghiệp</h1>
            <p>Kết nối với những luật sư hàng đầu trong lĩnh vực bạn cần tư vấn</p>
          </div>
        </div>

        {/* Featured Lawyers Section */}
        <section className={styles.featuredSection}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2>Luật sư hàng đầu</h2>
              <div className={styles.titleBar}></div>
              <p>Những luật sư có kinh nghiệm chuyên sâu và đánh giá cao từ khách hàng</p>
            </div>

            <div className={styles.featuredGrid}>
              {visibleLawyers
                .filter(lawyer => lawyer.featured || parseFloat(lawyer.rating || 0) >= 4.5)
                .sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0))  // Sắp xếp theo rating giảm dần
                .slice(0, 3)
                .map(lawyer => (
                  <div key={lawyer.id} className={styles.featuredCard}>
                    {/* Thêm badge cho luật sư 5 sao */}
                    {parseFloat(lawyer.rating || 0) >= 5.0 && (
                      <div className={styles.topRatedBadge}>
                        <i className="fas fa-star"></i> Top
                      </div>
                    )}
                    <div className={styles.featuredImageContainer}>
                      <img
                        src={lawyer.avatarUrl}
                        alt={lawyer.fullName}
                        className={styles.featuredImage}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/default-avatar.png';
                        }}
                      />
                      <div className={styles.featuredOverlay}>
                        <button className={styles.viewProfileButton} onClick={() => handleLawyerClick(lawyer)}>Xem hồ sơ</button>
                      </div>
                    </div>
                    <div className={styles.featuredContent}>
                      <h3>{lawyer.fullName}</h3>
                      <p className={styles.position}>{lawyer.position || 'Luật sư'}</p>
                      <div className={styles.specialtyTags}>
                        {(lawyer.specialization && typeof lawyer.specialization === 'string'
                          ? lawyer.specialization.split(',')
                          : lawyer.specialization || []
                        ).slice(0, 2).map((specialty, index) => (
                          <span key={`${lawyer.id}-specialty-${index}`} className={styles.specialtyTag}>{specialty}</span>
                        ))}
                      </div>
                      <div className={styles.experience}>
                        <i className="fas fa-briefcase"></i>
                        {(lawyer.experienceYears !== undefined && lawyer.experienceYears !== null)
                          ? parseInt(lawyer.experienceYears) + ' năm kinh nghiệm'
                          : '0 năm kinh nghiệm'}
                      </div>
                      <div className={styles.rating}>
                        <div className={styles.stars}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <i key={`lawyer-star-${lawyer.id}-${star}`} className={`fas fa-star ${star <= Math.round(parseFloat(lawyer.rating || 0)) ? styles.filled : styles.empty}`}></i>
                          ))}
                        </div>
                        <span>{parseFloat(lawyer.rating || 0).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className={styles.searchSection}>
          <div className={styles.container}>
            <div className={styles.searchContainer}>
              <div className={styles.searchBox}>
                <input
                  type="text"
                  placeholder="Tìm kiếm luật sư theo tên, chuyên môn..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
                <i className="fas fa-search"></i>
                {searchTerm && (
                  <button className={styles.clearButton} onClick={clearSearch}>
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>

              <div className={styles.specialtyTabs}>
                {specialties.map(specialty => (
                  <button
                    key={specialty.id}
                    className={`${styles.specialtyTab} ${activeTab === specialty.id ? styles.active : ''}`}
                    onClick={() => handleTabChange(specialty.id)}
                  >
                    {specialty.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* All Lawyers Section */}
        <section className={styles.lawyersSection}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2>Danh sách Luật sư</h2>
              <div className={styles.titleBar}></div>
            </div>

            {loading ? (
              <div className={styles.loading}>
                <i className="fas fa-spinner fa-spin"></i>
                <p>Đang tải danh sách luật sư...</p>
              </div>
            ) : visibleLawyers.length > 0 ? (
              <>
                <div className={styles.lawyersGrid}>
                  {visibleLawyers.map(lawyer => (
                    <div key={lawyer.id} className={styles.lawyerCard} onClick={() => handleLawyerClick(lawyer)}>
                      <div className={styles.lawyerImageContainer}>
                        <img
                          src={lawyer.avatarUrl}
                          alt={lawyer.fullName}
                          className={styles.lawyerImage}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/default-avatar.png';
                          }}
                        />
                      </div>
                      <div className={styles.lawyerContent}>
                        <h3>{lawyer.fullName}</h3>
                        <p className={styles.position}>{lawyer.position || 'Luật sư'}</p>
                        <div className={styles.rating}>
                          <div className={styles.stars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <i key={`card-star-${lawyer.id}-${star}`} className={`fas fa-star ${star <= Math.round(parseFloat(lawyer.rating || 0)) ? styles.filled : styles.empty}`}></i>
                            ))}
                          </div>
                          <span>{parseFloat(lawyer.rating || 0).toFixed(1)}</span>
                        </div>
                        <div className={styles.lawyerFooter}>
                          {(lawyer.specialization && typeof lawyer.specialization === 'string'
                            ? lawyer.specialization.split(',')
                            : lawyer.specialization || []
                          ).slice(0, 2).map((specialty, index) => (
                            <span key={`${lawyer.id}-specialty-${index}`} className={styles.specialtyTag}>{specialty}</span>
                          ))}
                          {(lawyer.specialization &&
                            ((typeof lawyer.specialization === 'string'
                              ? lawyer.specialization.split(',')
                              : lawyer.specialization
                            ) || []).length > 2) && (
                              <span className={styles.specialtyTagMore}>+{(typeof lawyer.specialization === 'string'
                                ? lawyer.specialization.split(',')
                                : lawyer.specialization || []).length - 2}</span>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      className={`${styles.paginationButton} ${page === 1 ? styles.disabled : ''}`}
                      onClick={handlePrevPage}
                      disabled={page === 1}
                    >
                      <i className="fas fa-chevron-left"></i> Trước
                    </button>
                    <span>Trang {page} / {totalPages}</span>
                    <button
                      className={`${styles.paginationButton} ${page === totalPages ? styles.disabled : ''}`}
                      onClick={handleNextPage}
                      disabled={page === totalPages}
                    >
                      Sau <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.noResults}>
                <i className="fas fa-search"></i>
                <h3>Không tìm thấy luật sư phù hợp</h3>
                <p>Hãy thử tìm kiếm với từ khóa khác hoặc chọn lại danh mục chuyên môn</p>
                <button onClick={clearSearch}>Xem tất cả luật sư</button>
              </div>
            )}
          </div>
        </section>

        {/* Lawyer Profile Modal */}
        {isModalOpen && selectedLawyer && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <button className={styles.closeButton} onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>

              <div className={styles.modalHeader}>
                <div className={styles.lawyerProfile}>
                  <img
                    src={selectedLawyer.avatarUrl}
                    alt={selectedLawyer.fullName}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/default-avatar.png';
                    }}
                  />
                  <div className={styles.profileInfo}>
                    <h2>{selectedLawyer.fullName}</h2>
                    <div className={styles.infoItem}>
                      <i className="fas fa-user-tie"></i>
                      <span>{selectedLawyer.position || 'Luật sư'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <i className="fas fa-graduation-cap"></i>
                      <span>{selectedLawyer.education || 'Cử nhân Luật'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <i className="fas fa-briefcase"></i>
                      <span>
                        {(selectedLawyer.experienceYears !== undefined && selectedLawyer.experienceYears !== null)
                          ? parseInt(selectedLawyer.experienceYears) + ' năm kinh nghiệm'
                          : '0 năm kinh nghiệm'}
                      </span>
                    </div>
                    <div className={styles.ratingDetail}>
                      <div className={styles.stars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <i key={`detail-star-${selectedLawyer.id}-${star}`} className={`fas fa-star ${star <= Math.round(parseFloat(selectedLawyer.rating || 0)) ? styles.filled : styles.empty}`}></i>
                        ))}
                      </div>
                      <span>{parseFloat(selectedLawyer.rating || 0).toFixed(1)} ({selectedLawyer.reviews || 0} đánh giá)</span>
                    </div>
                  </div>
                </div>
                <div className={styles.lawyerActions}>
                  <button className={styles.appointmentButton} onClick={() => handleAppointment(selectedLawyer)}>
                    <i className="fas fa-calendar-alt"></i> Đặt lịch hẹn
                  </button>
                </div>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.contactInfo}>
                  <div className={styles.contactItem}>
                    <i className="fas fa-envelope"></i>
                    <a href={`mailto:${selectedLawyer.contact?.email || selectedLawyer.email || 'contact@legai.vn'}`}>
                      {selectedLawyer.contact?.email || selectedLawyer.email || 'contact@legai.vn'}
                    </a>
                  </div>
                  <div className={styles.contactItem}>
                    <i className="fas fa-phone"></i>
                    <a href={`tel:${selectedLawyer.contact?.phone || selectedLawyer.phone || '(+84) 909 123 456'}`}>
                      {selectedLawyer.contact?.phone || selectedLawyer.phone || '(+84) 909 123 456'}
                    </a>
                  </div>
                </div>

                <div className={styles.specialtySection}>
                  <h3>Lĩnh vực chuyên môn</h3>
                  <div className={styles.specialtyTagsLarge}>
                    {(selectedLawyer.specialization && typeof selectedLawyer.specialization === 'string'
                      ? selectedLawyer.specialization.split(',')
                      : selectedLawyer.specialization || []
                    ).map((specialty, index) => (
                      <span key={`modal-specialty-${index}`} className={styles.specialtyTagLarge}>{specialty}</span>
                    ))}
                  </div>
                </div>

                <div className={styles.bioSection}>
                  <h3>Giới thiệu</h3>
                  <p>{selectedLawyer.bio || 'Thông tin giới thiệu đang được cập nhật.'}</p>
                </div>

                {selectedLawyer.achievements && selectedLawyer.achievements.length > 0 && (
                  <div className={styles.bioSection}>
                    <h3>Thành tựu nổi bật</h3>
                    <ul className={styles.achievementsList}>
                      {selectedLawyer.achievements.map((achievement, index) => (
                        <li key={`achievement-${index}`}>
                          <i className="fas fa-trophy"></i>
                          <span>{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Phần đánh giá luật sư */}
                {renderReviewSection()}
              </div>
            </div>
          </div>
        )}

        {showAppointmentModal && selectedLawyer && (
          <AppointmentForm 
            lawyer={selectedLawyer} 
            onClose={() => setShowAppointmentModal(false)}
            onSuccess={handleAppointmentSuccess}
          />
        )}

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaOverlay}></div>
          <div className={styles.container}>
            <div className={styles.ctaContent}>
              <h2>Bạn là luật sư muốn tham gia cộng đồng?</h2>
              <p>Tham gia LegAI để kết nối với khách hàng tiềm năng và mở rộng cơ hội nghề nghiệp</p>
              <div className={styles.ctaButtons}>
                <Link to="/lawyers/signup" className={styles.primaryButton}>
                  <i className="fas fa-user-plus"></i> Đăng ký làm luật sư
                </Link>
                <a href="#" className={styles.secondaryButton}>
                  <i className="fas fa-info-circle"></i> Tìm hiểu thêm
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}

export default Lawyers; 