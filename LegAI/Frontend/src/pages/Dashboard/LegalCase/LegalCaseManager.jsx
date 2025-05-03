import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LegalCaseManager.module.css';
import * as legalCaseService from '../../../services/legalCaseService';
import authService from '../../../services/authService';
import { formatDate } from '../../../utils/formatters';

const LegalCaseManager = () => {
  const navigate = useNavigate();
  const [legalCases, setLegalCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    case_type: '',
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [caseTypes, setCaseTypes] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Kiểm tra xem người dùng có phải là admin không
  useEffect(() => {
    const checkUserRole = () => {
      const isAdmin = authService.hasRole('admin');
      if (!isAdmin) {
        navigate('/dashboard');
      }
    };
    
    checkUserRole();
  }, [navigate]);

  // Fetch vụ án khi component được load và khi filters thay đổi
  useEffect(() => {
    fetchLegalCases();
    fetchCaseTypes();
  }, [pagination.page, pagination.limit, filters]);

  const fetchLegalCases = async () => {
    try {
      setLoading(true);
      const response = await legalCaseService.getAllLegalCases({
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status,
        case_type: filters.case_type,
        search: filters.search,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order
      });

      if (response.success) {
        setLegalCases(response.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.total || 0
        }));
      } else {
        setError(response.message || 'Không thể tải danh sách vụ án');
      }
    } catch (error) {
      console.error('Lỗi khi tải vụ án:', error);
      setError('Có lỗi xảy ra khi tải danh sách vụ án');
    } finally {
      setLoading(false);
    }
  };

  const fetchCaseTypes = async () => {
    try {
      const response = await legalCaseService.getCaseTypes();
      if (response.success) {
        setCaseTypes(response.data || []);
      }
    } catch (error) {
      console.error('Lỗi khi tải loại vụ án:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    // Reset trang về 1 khi thay đổi bộ lọc
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  const handleSortChange = (field) => {
    setFilters(prev => {
      const newSortOrder = prev.sort_by === field && prev.sort_order === 'asc' ? 'desc' : 'asc';
      return {
        ...prev,
        sort_by: field,
        sort_order: newSortOrder
      };
    });
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({
      ...prev,
      page
    }));
  };

  const handleShowDetail = async (caseId) => {
    try {
      setLoading(true);
      const response = await legalCaseService.getLegalCaseById(caseId);
      
      if (response.success) {
        setSelectedCase(response.data);
        setShowDetailModal(true);
      } else {
        setError(response.message || 'Không thể tải chi tiết vụ án');
      }
    } catch (error) {
      console.error('Lỗi khi tải chi tiết vụ án:', error);
      setError('Có lỗi xảy ra khi tải chi tiết vụ án');
    } finally {
      setLoading(false);
    }
  };

  const handleShowEdit = async (caseId) => {
    try {
      setLoading(true);
      const response = await legalCaseService.getLegalCaseById(caseId);
      
      if (response.success) {
        setSelectedCase(response.data);
        setShowEditModal(true);
      } else {
        setError(response.message || 'Không thể tải chi tiết vụ án');
      }
    } catch (error) {
      console.error('Lỗi khi tải chi tiết vụ án:', error);
      setError('Có lỗi xảy ra khi tải chi tiết vụ án');
    } finally {
      setLoading(false);
    }
  };

  const handleShowDelete = async (caseId) => {
    try {
      setLoading(true);
      const response = await legalCaseService.getLegalCaseById(caseId);
      
      if (response.success) {
        setSelectedCase(response.data);
        setShowDeleteModal(true);
      } else {
        setError(response.message || 'Không thể tải chi tiết vụ án');
      }
    } catch (error) {
      console.error('Lỗi khi tải chi tiết vụ án:', error);
      setError('Có lỗi xảy ra khi tải chi tiết vụ án');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCase = async () => {
    try {
      setLoading(true);
      const response = await legalCaseService.updateLegalCase(selectedCase.id, {
        status: selectedCase.status,
        notes: selectedCase.notes
      });
      
      if (response.success) {
        setShowEditModal(false);
        fetchLegalCases();
      } else {
        setError(response.message || 'Không thể cập nhật vụ án');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật vụ án:', error);
      setError('Có lỗi xảy ra khi cập nhật vụ án');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCase = async () => {
    try {
      setLoading(true);
      const response = await legalCaseService.deleteLegalCase(selectedCase.id);
      
      if (response.success) {
        setShowDeleteModal(false);
        fetchLegalCases();
      } else {
        setError(response.message || 'Không thể xóa vụ án');
      }
    } catch (error) {
      console.error('Lỗi khi xóa vụ án:', error);
      setError('Có lỗi xảy ra khi xóa vụ án');
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (status) => {
    let statusClass = '';
    let statusText = '';
    
    switch (status) {
      case 'new':
        statusClass = styles.statusNew;
        statusText = 'Mới';
        break;
      case 'in_progress':
        statusClass = styles.statusInProgress;
        statusText = 'Đang xử lý';
        break;
      case 'completed':
        statusClass = styles.statusCompleted;
        statusText = 'Hoàn thành';
        break;
      case 'cancelled':
        statusClass = styles.statusCancelled;
        statusText = 'Đã hủy';
        break;
      case 'pending_payment':
        statusClass = styles.statusPendingPayment;
        statusText = 'Chờ thanh toán';
        break;
      default:
        statusClass = styles.statusUnknown;
        statusText = status || 'Không xác định';
    }
    
    return <span className={`${styles.statusBadge} ${statusClass}`}>{statusText}</span>;
  };

  const renderLegalCasesTable = () => {
    if (loading && legalCases.length === 0) {
      return (
        <div className={styles.loading}>
          <i className="fas fa-spinner fa-spin"></i>
          <p>Đang tải dữ liệu...</p>
        </div>
      );
    }

    if (error && legalCases.length === 0) {
      return (
        <div className={styles.error}>
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={fetchLegalCases} className={styles.retryButton}>
            <i className="fas fa-sync-alt"></i> Thử lại
          </button>
        </div>
      );
    }

    if (legalCases.length === 0) {
      return (
        <div className={styles.empty}>
          <i className="fas fa-folder-open"></i>
          <p>Không có vụ án nào</p>
        </div>
      );
    }

    return (
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th onClick={() => handleSortChange('id')}>
                ID {filters.sort_by === 'id' && (
                  <i className={`fas fa-sort-${filters.sort_order === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th onClick={() => handleSortChange('title')}>
                Tiêu đề {filters.sort_by === 'title' && (
                  <i className={`fas fa-sort-${filters.sort_order === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th onClick={() => handleSortChange('case_type')}>
                Loại vụ án {filters.sort_by === 'case_type' && (
                  <i className={`fas fa-sort-${filters.sort_order === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th onClick={() => handleSortChange('user_id')}>
                Khách hàng {filters.sort_by === 'user_id' && (
                  <i className={`fas fa-sort-${filters.sort_order === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th onClick={() => handleSortChange('lawyer_id')}>
                Luật sư {filters.sort_by === 'lawyer_id' && (
                  <i className={`fas fa-sort-${filters.sort_order === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th onClick={() => handleSortChange('status')}>
                Trạng thái {filters.sort_by === 'status' && (
                  <i className={`fas fa-sort-${filters.sort_order === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th onClick={() => handleSortChange('created_at')}>
                Ngày tạo {filters.sort_by === 'created_at' && (
                  <i className={`fas fa-sort-${filters.sort_order === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {legalCases.map((legalCase) => (
              <tr key={legalCase.id}>
                <td>{legalCase.id}</td>
                <td className={styles.titleCell}>{legalCase.title}</td>
                <td>{legalCase.case_type}</td>
                <td>{legalCase.user_name || legalCase.user_id}</td>
                <td>{legalCase.lawyer_name || legalCase.lawyer_id || 'Chưa phân công'}</td>
                <td>{renderStatusBadge(legalCase.status)}</td>
                <td>{formatDate(legalCase.created_at)}</td>
                <td className={styles.actions}>
                  <button 
                    className={styles.detailButton}
                    onClick={() => handleShowDetail(legalCase.id)}
                    title="Xem chi tiết"
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                  <button 
                    className={styles.editButton}
                    onClick={() => handleShowEdit(legalCase.id)}
                    title="Cập nhật trạng thái"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button 
                    className={styles.deleteButton}
                    onClick={() => handleShowDelete(legalCase.id)}
                    title="Xóa vụ án"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;
    
    if (totalPages <= 1) {
      return null;
    }
    
    return (
      <div className={styles.pagination}>
        <button 
          className={styles.pageButton}
          disabled={pagination.page === 1}
          onClick={() => handlePageChange(pagination.page - 1)}
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        
        {[...Array(totalPages)].map((_, index) => {
          const pageNumber = index + 1;
          
          // Chỉ hiển thị trang hiện tại, trang trước, trang sau và các trang đầu/cuối
          if (
            pageNumber === 1 ||
            pageNumber === totalPages ||
            (pageNumber >= pagination.page - 1 && pageNumber <= pagination.page + 1)
          ) {
            return (
              <button
                key={pageNumber}
                className={`${styles.pageButton} ${pageNumber === pagination.page ? styles.activePage : ''}`}
                onClick={() => handlePageChange(pageNumber)}
              >
                {pageNumber}
              </button>
            );
          }
          
          // Hiển thị dấu "..." giữa các trang
          if (
            (pageNumber === 2 && pagination.page > 3) ||
            (pageNumber === totalPages - 1 && pagination.page < totalPages - 2)
          ) {
            return <span key={pageNumber} className={styles.ellipsis}>...</span>;
          }
          
          return null;
        })}
        
        <button 
          className={styles.pageButton}
          disabled={pagination.page === totalPages}
          onClick={() => handlePageChange(pagination.page + 1)}
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    );
  };

  const renderDetailModal = () => {
    if (!selectedCase) return null;
    
    return (
      <div className={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3>Chi tiết vụ án</h3>
            <button 
              className={styles.closeButton} 
              onClick={() => setShowDetailModal(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.detailItem}>
              <span>ID:</span>
              <span>{selectedCase.id}</span>
            </div>
            <div className={styles.detailItem}>
              <span>Tiêu đề:</span>
              <span>{selectedCase.title}</span>
            </div>
            <div className={styles.detailItem}>
              <span>Mô tả:</span>
              <span>{selectedCase.description || 'Không có mô tả'}</span>
            </div>
            <div className={styles.detailItem}>
              <span>Loại vụ án:</span>
              <span>{selectedCase.case_type}</span>
            </div>
            <div className={styles.detailItem}>
              <span>Khách hàng:</span>
              <span>{selectedCase.user_name || selectedCase.user_id}</span>
            </div>
            <div className={styles.detailItem}>
              <span>Luật sư:</span>
              <span>{selectedCase.lawyer_name || selectedCase.lawyer_id || 'Chưa phân công'}</span>
            </div>
            <div className={styles.detailItem}>
              <span>Trạng thái:</span>
              <span>{renderStatusBadge(selectedCase.status)}</span>
            </div>
            <div className={styles.detailItem}>
              <span>Phí:</span>
              <span>{selectedCase.fee_amount ? `${selectedCase.fee_amount.toLocaleString()} VNĐ` : 'Chưa tính phí'}</span>
            </div>
            <div className={styles.detailItem}>
              <span>Ngày tạo:</span>
              <span>{formatDate(selectedCase.created_at)}</span>
            </div>
            <div className={styles.detailItem}>
              <span>Ngày cập nhật:</span>
              <span>{formatDate(selectedCase.updated_at)}</span>
            </div>
            {selectedCase.notes && (
              <div className={styles.detailItem}>
                <span>Ghi chú:</span>
                <span>{selectedCase.notes}</span>
              </div>
            )}
            {selectedCase.has_transactions && (
              <div className={styles.detailItem}>
                <span>Giao dịch:</span>
                <span>Vụ án có giao dịch thanh toán</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderEditModal = () => {
    if (!selectedCase) return null;
    
    return (
      <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3>Cập nhật vụ án</h3>
            <button 
              className={styles.closeButton} 
              onClick={() => setShowEditModal(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.detailItem}>
              <span>ID:</span>
              <span>{selectedCase.id}</span>
            </div>
            <div className={styles.detailItem}>
              <span>Tiêu đề:</span>
              <span>{selectedCase.title}</span>
            </div>
            <div className={styles.formGroup}>
              <label>Trạng thái:</label>
              <select 
                className={styles.formControl}
                value={selectedCase.status || ''}
                onChange={(e) => setSelectedCase({
                  ...selectedCase,
                  status: e.target.value
                })}
              >
                <option value="new">Mới</option>
                <option value="in_progress">Đang xử lý</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
                <option value="pending_payment">Chờ thanh toán</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Ghi chú:</label>
              <textarea 
                className={styles.formControl}
                rows="3"
                value={selectedCase.notes || ''}
                onChange={(e) => setSelectedCase({
                  ...selectedCase,
                  notes: e.target.value
                })}
              />
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowEditModal(false)}
              >
                Hủy
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleUpdateCase}
                disabled={loading}
              >
                {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDeleteModal = () => {
    if (!selectedCase) return null;
    
    return (
      <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
        <div className={styles.modalDelete} onClick={e => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3>Xác nhận xóa vụ án</h3>
            <button 
              className={styles.closeButton} 
              onClick={() => setShowDeleteModal(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.deleteWarning}>
              <i className="fas fa-exclamation-triangle"></i>
              <p>Bạn có chắc chắn muốn xóa vụ án này?</p>
              <p>Hành động này không thể hoàn tác.</p>
            </div>
            <div className={styles.caseInfo}>
              <div className={styles.detailItem}>
                <span>ID:</span>
                <span>{selectedCase.id}</span>
              </div>
              <div className={styles.detailItem}>
                <span>Tiêu đề:</span>
                <span>{selectedCase.title}</span>
              </div>
              <div className={styles.detailItem}>
                <span>Khách hàng:</span>
                <span>{selectedCase.user_name || selectedCase.user_id}</span>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowDeleteModal(false)}
              >
                Hủy
              </button>
              <button 
                className={styles.deleteConfirmButton}
                onClick={handleDeleteCase}
                disabled={loading}
              >
                {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Quản lý vụ án</h2>
        <div className={styles.filters}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Tìm kiếm theo tiêu đề, mô tả..."
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
          />
          <select 
            className={styles.filterSelect}
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="new">Mới</option>
            <option value="in_progress">Đang xử lý</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
            <option value="pending_payment">Chờ thanh toán</option>
          </select>
          <select 
            className={styles.filterSelect}
            name="case_type"
            value={filters.case_type}
            onChange={handleFilterChange}
          >
            <option value="">Tất cả loại vụ án</option>
            {caseTypes.map(type => (
              <option key={type.case_type} value={type.case_type}>
                {type.case_type}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {renderLegalCasesTable()}
      {renderPagination()}
      {showDetailModal && renderDetailModal()}
      {showEditModal && renderEditModal()}
      {showDeleteModal && renderDeleteModal()}
    </div>
  );
};

export default LegalCaseManager; 