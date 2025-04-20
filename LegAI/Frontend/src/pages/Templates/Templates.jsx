import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faCalendarAlt, faEye, faDownload } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import styles from './Templates.module.css';
import Navbar from '../../components/layout/Nav/Navbar';
import ChatManager from '../../components/layout/Chat/ChatManager';
import { API_URL } from '../../config/constants';

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [templateTypes, setTemplateTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  
  const navigate = useNavigate();

    const fetchTemplates = async (page = 1) => {
        setLoading(true);
        try {
            // Gọi API tìm kiếm mẫu văn bản với các tham số
            const response = await axios.get(`${API_URL}/legal/templates`, {
                params: {
                    page,
                    q: searchTerm, // Gửi searchTerm ngay cả khi rỗng
                    type: selectedType || undefined
                }
            });

            if (response.data && response.data.status === 'success') {
                setTemplates(response.data.data || []);
                setTotalPages(
                    Math.ceil(response.data.pagination?.total / response.data.pagination?.limit) || 1
                );
                setError(null);
            } else {
                setError('Không thể tải mẫu văn bản. Vui lòng thử lại sau.');
                console.error('API trả về lỗi:', response.data);
            }
        } catch (err) {
            setError('Không thể tải mẫu văn bản. Vui lòng thử lại sau.');
            console.error('Error fetching templates:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplateTypes = async () => {
        try {
            const response = await axios.get(`${API_URL}/legal/template-types`);
            if (response.data && response.data.status === 'success') {
                setTemplateTypes(response.data.data || []);
            } else {
                console.error('Không thể tải loại mẫu văn bản:', response.data);
            }
        } catch (err) {
            console.error('Error fetching template types:', err);
        }
    };

    // Tải dữ liệu ban đầu khi component được mount
    useEffect(() => {
        fetchTemplates(currentPage);
        fetchTemplateTypes();
    }, [currentPage]);

  const handleFilterChange = (e) => {
    setSelectedType(e.target.value);
  };

  const handleApplyFilter = () => {
    setCurrentPage(1);
    fetchTemplates(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchTemplates(1);
  };

  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleTemplateClick = (templateId) => {
    navigate(`/templates/${templateId}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  };

  const renderPagination = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    // Previous button
    pages.push(
      <button
        key="prev"
        className={styles['pagination-button']}
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        &lt;
      </button>
    );

    // Page buttons
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`${styles['pagination-button']} ${currentPage === i ? styles.active : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    // Next button
    pages.push(
      <button
        key="next"
        className={styles['pagination-button']}
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        &gt;
      </button>
    );

    return pages;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles['templates-container']}>
        <div className={styles['templates-header']}>
          <h1>Mẫu Văn Bản Pháp Lý</h1>
          <p>Tìm kiếm và sử dụng các mẫu văn bản pháp lý đã được biên soạn sẵn</p>
        </div>

        <div className={styles['search-section']}>
          <form className={styles['search-form']} onSubmit={handleSearch}>
            <div className={styles['search-input-wrapper']}>
              <input
                type="text"
                className={styles['search-input']}
                placeholder="Tìm kiếm mẫu văn bản..."
                value={searchTerm}
                onChange={handleSearchInputChange}
              />
              <button type="submit" className={styles['search-button']}>
                <FontAwesomeIcon icon={faSearch} />
              </button>
            </div>
          </form>
        </div>

        <div className={styles['filters-section']}>
          <div className={styles['filter-controls']}>
            <div className={styles['filter-group']}>
              <label htmlFor="templateType">Loại văn bản</label>
              <select
                id="templateType"
                className={styles['filter-select']}
                value={selectedType}
                onChange={handleFilterChange}
              >
                <option value="">Tất cả</option>
                {templateTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={handleApplyFilter} className={styles['filter-button']}>
              Áp dụng
            </button>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>Đang tải mẫu văn bản...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : templates.length === 0 ? (
          <div className={styles['no-templates']}>
            Không tìm thấy mẫu văn bản nào. Vui lòng thử lại với từ khóa khác.
          </div>
        ) : (
          <>
            <div className={styles['templates-grid']}>
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={styles['template-card']}
                  onClick={() => handleTemplateClick(template.id)}
                >
                  <div className={styles['template-type']}>
                    {template.type_name || template.type || 'Mẫu văn bản'}
                  </div>
                  <h3 className={styles['template-title']}>{template.title}</h3>
                  <div className={styles['template-meta']}>
                    <span className={styles['template-date']}>
                      <FontAwesomeIcon icon={faCalendarAlt} /> {formatDate(template.created_at)}
                    </span>
                    <span className={styles['template-views']}>
                      <FontAwesomeIcon icon={faEye} /> {template.views || 0}
                    </span>
                  </div>
                  <p className={styles['template-description']}>{template.description}</p>
                  <div className={styles['template-actions']}>
                    <button className={styles['action-button']}>
                      Xem chi tiết
                    </button>
                    <button className={styles['action-button']}>
                      <FontAwesomeIcon icon={faDownload} /> Tải xuống
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.pagination}>{renderPagination()}</div>
          </>
        )}
      </div>
      <ChatManager />
    </>
  );
};

export default Templates; 