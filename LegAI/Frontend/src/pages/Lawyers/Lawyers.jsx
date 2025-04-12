import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Lawyers.module.css';
import Navbar from '../../components/layout/Nav/Navbar';
import PageTransition from '../../components/layout/TransitionPage/PageTransition';
import ChatManager from '../../components/layout/Chat/ChatManager';

function Lawyers() {
  const [activeTab, setActiveTab] = useState('all');
  const [visibleLawyers, setVisibleLawyers] = useState([]);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Danh sách các chuyên môn
  const specialties = [
    { id: 'all', name: 'Tất cả' },
    { id: 'business', name: 'Doanh nghiệp' },
    { id: 'civil', name: 'Dân sự' },
    { id: 'criminal', name: 'Hình sự' },
    { id: 'labor', name: 'Lao động' },
    { id: 'intellectual', name: 'Sở hữu trí tuệ' },
    { id: 'land', name: 'Đất đai' }
  ];

  // Dữ liệu luật sư
  const lawyers = [
    {
      id: 1,
      name: 'Nguyễn Văn Minh',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      position: 'Luật sư Trưởng',
      specialty: ['business', 'civil'],
      experience: '15 năm',
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
    {
      id: 2,
      name: 'Trần Thị Hương',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      position: 'Luật sư Cấp cao',
      specialty: ['civil', 'labor'],
      experience: '12 năm',
      education: 'Thạc sĩ Luật - Đại học Luật TP. HCM',
      bio: 'Luật sư Trần Thị Hương chuyên về lĩnh vực luật lao động và dân sự. Cô được biết đến với khả năng giải quyết các vụ tranh chấp lao động phức tạp và bảo vệ quyền lợi cho người lao động.',
      achievements: [
        'Giải quyết thành công hơn 500 vụ tranh chấp lao động',
        'Tư vấn chính sách nhân sự cho nhiều tập đoàn đa quốc gia',
        'Diễn giả tại nhiều hội thảo quốc tế về luật lao động'
      ],
      contact: {
        email: 'huong.tran@legai.vn',
        phone: '(+84) 909 234 567'
      },
      rating: 4.8,
      reviews: 95,
      featured: true
    },
    {
      id: 3,
      name: 'Lê Thanh Tùng',
      avatar: 'https://randomuser.me/api/portraits/men/62.jpg',
      position: 'Luật sư Hình sự',
      specialty: ['criminal'],
      experience: '18 năm',
      education: 'Thạc sĩ Luật - Học viện Tư pháp',
      bio: 'Luật sư Lê Thanh Tùng là một trong những luật sư hình sự hàng đầu tại Việt Nam với 18 năm kinh nghiệm. Ông nổi tiếng với sự am hiểu sâu sắc về luật hình sự và khả năng biện hộ xuất sắc tại tòa.',
      achievements: [
        'Bào chữa thành công trong hơn 300 vụ án hình sự',
        'Từng là Thẩm phán tại Tòa án Nhân dân TP.HCM',
        'Giảng viên thỉnh giảng tại Đại học Luật TP.HCM'
      ],
      contact: {
        email: 'tung.le@legai.vn',
        phone: '(+84) 909 345 678'
      },
      rating: 4.9,
      reviews: 150,
      featured: true
    },
    {
      id: 4,
      name: 'Phạm Minh Hiếu',
      avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
      position: 'Luật sư Sở hữu Trí tuệ',
      specialty: ['intellectual', 'business'],
      experience: '10 năm',
      education: 'Thạc sĩ Luật Sở hữu Trí tuệ - Đại học Washington',
      bio: 'Luật sư Phạm Minh Hiếu là chuyên gia về luật sở hữu trí tuệ và bảo hộ thương hiệu. Với kinh nghiệm làm việc tại Mỹ và Việt Nam, ông có hiểu biết sâu rộng về luật sở hữu trí tuệ quốc tế.',
      achievements: [
        'Đại diện đăng ký bảo hộ thành công hơn 500 nhãn hiệu trong nước và quốc tế',
        'Tư vấn chiến lược sở hữu trí tuệ cho nhiều startup công nghệ',
        'Chuyên gia tư vấn của Cục Sở hữu Trí tuệ Việt Nam'
      ],
      contact: {
        email: 'hieu.pham@legai.vn',
        phone: '(+84) 909 456 789'
      },
      rating: 4.7,
      reviews: 88,
      featured: false
    },
    {
      id: 5,
      name: 'Nguyễn Thị Mai',
      avatar: 'https://randomuser.me/api/portraits/women/29.jpg',
      position: 'Luật sư Đất đai',
      specialty: ['land', 'civil'],
      experience: '14 năm',
      education: 'Thạc sĩ Luật - Đại học Quốc gia Hà Nội',
      bio: 'Luật sư Nguyễn Thị Mai chuyên về lĩnh vực luật đất đai và bất động sản. Với 14 năm kinh nghiệm, cô đã tư vấn cho nhiều dự án bất động sản lớn và giải quyết nhiều tranh chấp phức tạp về đất đai.',
      achievements: [
        'Tư vấn pháp lý cho hơn 50 dự án bất động sản lớn',
        'Giải quyết thành công nhiều vụ tranh chấp đất đai phức tạp',
        'Tác giả của nhiều bài báo chuyên sâu về luật đất đai'
      ],
      contact: {
        email: 'mai.nguyen@legai.vn',
        phone: '(+84) 909 567 890'
      },
      rating: 4.8,
      reviews: 102,
      featured: false
    },
    {
      id: 6,
      name: 'Trần Văn Hoàng',
      avatar: 'https://randomuser.me/api/portraits/men/42.jpg',
      position: 'Luật sư Doanh nghiệp',
      specialty: ['business', 'intellectual'],
      experience: '11 năm',
      education: 'Thạc sĩ Luật Thương mại Quốc tế - Đại học London',
      bio: 'Luật sư Trần Văn Hoàng chuyên về luật doanh nghiệp và đầu tư quốc tế. Với kinh nghiệm làm việc tại các công ty luật quốc tế, ông có kiến thức sâu rộng về các giao dịch M&A và đầu tư nước ngoài.',
      achievements: [
        'Tư vấn thành công nhiều thương vụ M&A trị giá hàng trăm triệu USD',
        'Chuyên gia tư vấn cho nhiều tập đoàn đa quốc gia',
        'Thành viên Hiệp hội Luật sư Thương mại Quốc tế'
      ],
      contact: {
        email: 'hoang.tran@legai.vn',
        phone: '(+84) 909 678 901'
      },
      rating: 4.7,
      reviews: 75,
      featured: false
    },
    {
      id: 7,
      name: 'Phạm Thị Lan',
      avatar: 'https://randomuser.me/api/portraits/women/17.jpg',
      position: 'Luật sư Dân sự',
      specialty: ['civil', 'labor'],
      experience: '9 năm',
      education: 'Cử nhân Luật - Đại học Luật Hà Nội',
      bio: 'Luật sư Phạm Thị Lan chuyên về lĩnh vực luật dân sự và luật gia đình. Với 9 năm kinh nghiệm, cô đã hỗ trợ nhiều khách hàng trong các vấn đề về thừa kế, hôn nhân và tranh chấp dân sự.',
      achievements: [
        'Giải quyết thành công hơn 200 vụ tranh chấp dân sự',
        'Tư vấn về di chúc và thừa kế cho nhiều gia đình',
        'Hỗ trợ pháp lý cho các tổ chức phi chính phủ'
      ],
      contact: {
        email: 'lan.pham@legai.vn',
        phone: '(+84) 909 789 012'
      },
      rating: 4.6,
      reviews: 63,
      featured: false
    },
    {
      id: 8,
      name: 'Nguyễn Đức Thành',
      avatar: 'https://randomuser.me/api/portraits/men/77.jpg',
      position: 'Luật sư Hình sự',
      specialty: ['criminal'],
      experience: '13 năm',
      education: 'Thạc sĩ Luật Hình sự - Đại học Luật TP.HCM',
      bio: 'Luật sư Nguyễn Đức Thành chuyên về luật hình sự và tố tụng hình sự. Với 13 năm kinh nghiệm trong lĩnh vực này, ông đã đại diện bào chữa cho nhiều thân chủ trong các vụ án hình sự phức tạp.',
      achievements: [
        'Bào chữa thành công trong hơn 150 vụ án hình sự',
        'Từng công tác tại Viện Kiểm sát Nhân dân TP.HCM',
        'Giảng viên thỉnh giảng về luật hình sự tại nhiều trường đại học'
      ],
      contact: {
        email: 'thanh.nguyen@legai.vn',
        phone: '(+84) 909 890 123'
      },
      rating: 4.8,
      reviews: 92,
      featured: false
    }
  ];

  // Lọc luật sư theo chuyên môn và từ khóa tìm kiếm
  useEffect(() => {
    let filtered = [...lawyers];
    
    // Lọc theo chuyên môn
    if (activeTab !== 'all') {
      filtered = filtered.filter(lawyer => 
        lawyer.specialty.includes(activeTab)
      );
    }
    
    // Lọc theo từ khóa tìm kiếm
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(lawyer => 
        lawyer.name.toLowerCase().includes(term) || 
        lawyer.position.toLowerCase().includes(term) ||
        lawyer.specialty.some(s => specialties.find(sp => sp.id === s)?.name.toLowerCase().includes(term)) ||
        lawyer.bio.toLowerCase().includes(term)
      );
    }
    
    setVisibleLawyers(filtered);
  }, [activeTab, searchTerm]);

  // Xử lý khi nhấp vào luật sư để xem chi tiết
  const handleLawyerClick = (lawyer) => {
    setSelectedLawyer(lawyer);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden'; // Ngăn cuộn trang khi modal mở
  };

  // Đóng modal chi tiết
  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = 'auto'; // Khôi phục cuộn trang
  };

  // Xử lý khi nhấp vào nút đặt lịch hẹn
  const handleAppointment = (lawyer) => {
    // Điều hướng đến trang liên hệ với thông tin luật sư
    window.location.href = `/contact?lawyer=${lawyer.id}`;
  };

  return (
    <PageTransition>
      <div className={styles.lawyersPage}>
        <Navbar />
        
        {/* Banner */}
        <div className={styles.banner}>
          <div className={styles.bannerOverlay}></div>
          <div className={styles.bannerContent}>
            <h1>Đội Ngũ Luật Sư</h1>
            <p>Chuyên nghiệp - Uy tín - Tận tâm</p>
          </div>
        </div>
        
        {/* Luật sư nổi bật */}
        <section className={styles.featuredSection}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2>Luật Sư Tiêu Biểu</h2>
              <div className={styles.titleBar}></div>
              <p>Đội ngũ luật sư hàng đầu với kinh nghiệm và chuyên môn cao</p>
            </div>
            
            <div className={styles.featuredGrid}>
              {lawyers.filter(lawyer => lawyer.featured).map(lawyer => (
                <div key={lawyer.id} className={styles.featuredCard} onClick={() => handleLawyerClick(lawyer)}>
                  <div className={styles.featuredImageContainer}>
                    <img 
                      src={lawyer.avatar} 
                      alt={lawyer.name} 
                      className={styles.featuredImage} 
                    />
                    <div className={styles.featuredOverlay}>
                      <button className={styles.viewProfileButton}>
                        Xem hồ sơ
                      </button>
                    </div>
                  </div>
                  
                  <div className={styles.featuredContent}>
                    <h3>{lawyer.name}</h3>
                    <p className={styles.position}>{lawyer.position}</p>
                    
                    <div className={styles.specialtyTags}>
                      {lawyer.specialty.map(spec => (
                        <span key={spec} className={styles.specialtyTag}>
                          {specialties.find(s => s.id === spec)?.name}
                        </span>
                      ))}
                    </div>
                    
                    <div className={styles.experience}>
                      <i className="fas fa-briefcase"></i> {lawyer.experience} kinh nghiệm
                    </div>
                    
                    <div className={styles.rating}>
                      <div className={styles.stars}>
                        {[...Array(5)].map((_, index) => (
                          <i 
                            key={index} 
                            className={`fas fa-star ${index < Math.floor(lawyer.rating) ? styles.filled : styles.empty}`}
                          ></i>
                        ))}
                      </div>
                      <span>{lawyer.rating} ({lawyer.reviews} đánh giá)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Tìm kiếm luật sư */}
        <section className={styles.searchSection}>
          <div className={styles.container}>
            <div className={styles.searchContainer}>
              <div className={styles.searchBox}>
                <i className="fas fa-search"></i>
                <input 
                  type="text"
                  placeholder="Tìm kiếm luật sư theo tên, chuyên môn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button 
                    className={styles.clearButton}
                    onClick={() => setSearchTerm('')}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
              
              <div className={styles.specialtyTabs}>
                {specialties.map(specialty => (
                  <button
                    key={specialty.id}
                    className={`${styles.specialtyTab} ${activeTab === specialty.id ? styles.active : ''}`}
                    onClick={() => setActiveTab(specialty.id)}
                  >
                    {specialty.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* Danh sách luật sư */}
        <section className={styles.lawyersSection}>
          <div className={styles.container}>
            {visibleLawyers.length > 0 ? (
              <div className={styles.lawyersGrid}>
                {visibleLawyers.map(lawyer => (
                  <div key={lawyer.id} className={styles.lawyerCard} onClick={() => handleLawyerClick(lawyer)}>
                    <div className={styles.lawyerImageContainer}>
                      <img 
                        src={lawyer.avatar} 
                        alt={lawyer.name} 
                        className={styles.lawyerImage} 
                      />
                    </div>
                    
                    <div className={styles.lawyerContent}>
                      <h3>{lawyer.name}</h3>
                      <p className={styles.position}>{lawyer.position}</p>
                      
                      <div className={styles.specialtyTags}>
                        {lawyer.specialty.slice(0, 2).map(spec => (
                          <span key={spec} className={styles.specialtyTag}>
                            {specialties.find(s => s.id === spec)?.name}
                          </span>
                        ))}
                        {lawyer.specialty.length > 2 && (
                          <span className={styles.specialtyTagMore}>+{lawyer.specialty.length - 2}</span>
                        )}
                      </div>
                      
                      <div className={styles.lawyerFooter}>
                        <div className={styles.experience}>
                          <i className="fas fa-briefcase"></i> {lawyer.experience}
                        </div>
                        
                        <div className={styles.rating}>
                          <i className="fas fa-star filled"></i>
                          <span>{lawyer.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noResults}>
                <i className="fas fa-search"></i>
                <h3>Không tìm thấy kết quả</h3>
                <p>Không tìm thấy luật sư phù hợp với tiêu chí tìm kiếm của bạn.</p>
                <button onClick={() => {setSearchTerm(''); setActiveTab('all');}}>
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>
        </section>
        
        {/* Modal chi tiết luật sư */}
        {isModalOpen && selectedLawyer && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <button className={styles.closeButton} onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
              
              <div className={styles.modalHeader}>
                <div className={styles.lawyerProfile}>
                  <img src={selectedLawyer.avatar} alt={selectedLawyer.name} />
                  <div className={styles.profileInfo}>
                    <h2>{selectedLawyer.name}</h2>
                    <p className={styles.position}>{selectedLawyer.position}</p>
                    
                    <div className={styles.infoItem}>
                      <i className="fas fa-graduation-cap"></i>
                      <span>{selectedLawyer.education}</span>
                    </div>
                    
                    <div className={styles.infoItem}>
                      <i className="fas fa-briefcase"></i>
                      <span>{selectedLawyer.experience} kinh nghiệm</span>
                    </div>
                    
                    <div className={styles.ratingDetail}>
                      <div className={styles.stars}>
                        {[...Array(5)].map((_, index) => (
                          <i 
                            key={index} 
                            className={`fas fa-star ${index < Math.floor(selectedLawyer.rating) ? styles.filled : styles.empty}`}
                          ></i>
                        ))}
                      </div>
                      <span>{selectedLawyer.rating} ({selectedLawyer.reviews} đánh giá)</span>
                    </div>
                  </div>
                </div>
                
                <div className={styles.lawyerActions}>
                  <button 
                    className={styles.appointmentButton}
                    onClick={() => handleAppointment(selectedLawyer)}
                  >
                    <i className="fas fa-calendar-alt"></i> Đặt lịch hẹn
                  </button>
                  
                  <div className={styles.contactInfo}>
                    <div className={styles.contactItem}>
                      <i className="fas fa-envelope"></i>
                      <a href={`mailto:${selectedLawyer.contact.email}`}>{selectedLawyer.contact.email}</a>
                    </div>
                    
                    <div className={styles.contactItem}>
                      <i className="fas fa-phone"></i>
                      <a href={`tel:${selectedLawyer.contact.phone}`}>{selectedLawyer.contact.phone}</a>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={styles.modalBody}>
                <div className={styles.specialtySection}>
                  <h3>Chuyên môn</h3>
                  <div className={styles.specialtyTagsLarge}>
                    {selectedLawyer.specialty.map(spec => (
                      <span key={spec} className={styles.specialtyTagLarge}>
                        {specialties.find(s => s.id === spec)?.name}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className={styles.bioSection}>
                  <h3>Giới thiệu</h3>
                  <p>{selectedLawyer.bio}</p>
                </div>
                
                <div className={styles.achievementsSection}>
                  <h3>Thành tựu nổi bật</h3>
                  <ul className={styles.achievementsList}>
                    {selectedLawyer.achievements.map((achievement, index) => (
                      <li key={index}>
                        <i className="fas fa-trophy"></i>
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* CTA */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaOverlay}></div>
          <div className={styles.container}>
            <div className={styles.ctaContent}>
              <h2>Bạn cần tư vấn pháp lý?</h2>
              <p>Đội ngũ luật sư chuyên nghiệp của chúng tôi sẵn sàng hỗ trợ</p>
              <div className={styles.ctaButtons}>
                <Link to="/contact" className={styles.primaryButton}>
                  Liên hệ ngay <i className="fas fa-arrow-right"></i>
                </Link>
                <button 
                  className={styles.secondaryButton}
                  onClick={() => {
                    const event = new CustomEvent('toggleChat', { 
                      detail: { action: 'open' } 
                    });
                    window.dispatchEvent(event);
                  }}
                >
                  <i className="fas fa-comments"></i> Chat với tư vấn viên
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

export default Lawyers; 