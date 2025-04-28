import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import styles from './DocumentTemplatesManager.module.css';
import axiosInstance from '../../../config/axios';
import { API_URL } from '../../../config/constants';
import Spinner from '../../../components/Common/Spinner';

const DocumentTemplatesManager = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplateType, setSelectedTemplateType] = useState('');
  const [templateTypes, setTemplateTypes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const pdfFileRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    template_type: '',
    content: '',
    language: 'Tiếng Việt'
  });

  useEffect(() => {
    fetchTemplates();
    fetchTemplateTypes();
  }, [currentPage, searchTerm, selectedTemplateType]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', 10);
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (selectedTemplateType) {
        params.append('template_type', selectedTemplateType);
      }
      
      const response = await axiosInstance.get(`${API_URL}/legal/templates?${params.toString()}`);
      
      if (response.data && response.data.status === 'success') {
        setTemplates(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách mẫu văn bản:', err);
      setError('Không thể tải danh sách mẫu văn bản');
      toast.error('Không thể tải danh sách mẫu văn bản');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplateTypes = async () => {
    try {
      const response = await axiosInstance.get(`${API_URL}/legal/template-types`);
      if (response.data && response.data.status === 'success') {
        setTemplateTypes(response.data.data);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách loại mẫu văn bản:', err);
    }
  };

  const openAddModal = () => {
    setFormData({
      title: '',
      template_type: '',
      content: '',
      language: 'Tiếng Việt'
    });
    setModalMode('add');
    setIsModalOpen(true);
  };

  const openEditModal = (template) => {
    setSelectedTemplate(template);
    setFormData({
      ...template,
      template_type: template.template_type
    });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const openDeleteModal = (template) => {
    setSelectedTemplate(template);
    setIsDeleteModalOpen(true);
  };

  const openPdfModal = () => {
    setHtmlContent('');
    setIsPdfModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset về trang 1 khi tìm kiếm mới
  };

  const handleTemplateTypeChange = (e) => {
    setSelectedTemplateType(e.target.value);
    setCurrentPage(1); // Reset về trang 1 khi thay đổi loại mẫu
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.template_type || !formData.content) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    
    try {
      if (modalMode === 'add') {
        const response = await axiosInstance.post(`${API_URL}/legal/templates`, formData);
        if (response.data && response.data.status === 'success') {
          toast.success('Thêm mẫu văn bản thành công');
          fetchTemplates();
          closeModal();
        }
      } else {
        const response = await axiosInstance.put(
          `${API_URL}/legal/templates/${selectedTemplate.id}`, 
          formData
        );
        if (response.data && response.data.status === 'success') {
          toast.success('Cập nhật mẫu văn bản thành công');
          fetchTemplates();
          closeModal();
        }
      }
    } catch (err) {
      console.error('Lỗi khi lưu mẫu văn bản:', err);
      toast.error(err.response?.data?.message || 'Lỗi khi lưu mẫu văn bản');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await axiosInstance.delete(`${API_URL}/legal/templates/${selectedTemplate.id}`);
      if (response.data && response.data.status === 'success') {
        toast.success('Xóa mẫu văn bản thành công');
        fetchTemplates();
        closeDeleteModal();
      }
    } catch (err) {
      console.error('Lỗi khi xóa mẫu văn bản:', err);
      toast.error(err.response?.data?.message || 'Lỗi khi xóa mẫu văn bản');
    }
  };

  const handleUploadPdf = async (e) => {
    e.preventDefault();
    const fileInput = pdfFileRef.current;
    
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      toast.error('Vui lòng chọn file PDF để tải lên');
      return;
    }
    
    const file = fileInput.files[0];
    if (file.type !== 'application/pdf') {
      toast.error('Vui lòng chỉ chọn file PDF');
      return;
    }
    
    const formDataForUpload = new FormData();
    formDataForUpload.append('pdf_file', file);
    
    try {
      setIsUploading(true);
      const response = await axiosInstance.post(
        `${API_URL}/legal/upload-pdf`, 
        formDataForUpload,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );
      
      if (response.data && response.data.status === 'success') {
        setHtmlContent(response.data.data.html);
        setFormData({
          ...formData,
          content: response.data.data.html
        });
        toast.success('Chuyển đổi PDF thành HTML thành công');
        closePdfModal();
      }
    } catch (err) {
      console.error('Lỗi khi tải lên file PDF:', err);
      toast.error('Lỗi khi tải lên hoặc chuyển đổi file PDF');
    } finally {
      setIsUploading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTemplate(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedTemplate(null);
  };

  const closePdfModal = () => {
    setIsPdfModalOpen(false);
    if (pdfFileRef.current) {
      pdfFileRef.current.value = '';
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderPagination = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`${styles.pageButton} ${currentPage === i ? styles.activePage : ''}`}
          onClick={() => handlePageChange(i)}
          disabled={currentPage === i}
        >
          {i}
        </button>
      );
    }
    
    return (
      <div className={styles.pagination}>
        <button
          className={styles.pageButton}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          &laquo;
        </button>
        {pages}
        <button
          className={styles.pageButton}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          &raquo;
        </button>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Tìm kiếm mẫu văn bản..."
            value={searchTerm}
            onChange={handleSearchInputChange}
            className={styles.searchInput}
          />
          <select
            value={selectedTemplateType}
            onChange={handleTemplateTypeChange}
            className={styles.selectFilter}
          >
            <option value="">Tất cả loại mẫu</option>
            {templateTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
        <button className={styles.addButton} onClick={openAddModal}>
          <i className="fas fa-plus"></i> Thêm mẫu mới
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <Spinner />
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : error ? (
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
          <button className={styles.retryButton} onClick={fetchTemplates}>
            Thử lại
          </button>
        </div>
      ) : templates.length === 0 ? (
        <div className={styles.emptyContainer}>
          <p>Không có mẫu văn bản nào</p>
          <button className={styles.addButton} onClick={openAddModal}>
            <i className="fas fa-plus"></i> Thêm mẫu mới
          </button>
        </div>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Tiêu đề</th>
                  <th>Loại mẫu</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template, index) => (
                  <tr key={template.id}>
                    <td>{(currentPage - 1) * 10 + index + 1}</td>
                    <td>
                      <div className={styles.templateTitle}>
                        {template.title}
                      </div>
                    </td>
                    <td>{template.template_type}</td>
                    <td>{formatDate(template.created_at)}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.editButton}
                          onClick={() => openEditModal(template)}
                          title="Chỉnh sửa"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => openDeleteModal(template)}
                          title="Xóa"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && renderPagination()}
        </>
      )}

      {/* Modal thêm/sửa mẫu */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{modalMode === 'add' ? 'Thêm mẫu văn bản mới' : 'Chỉnh sửa mẫu văn bản'}</h2>
              <button className={styles.closeButton} onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <form onSubmit={handleSubmitForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="title">Tiêu đề <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="template_type">Loại mẫu <span className={styles.required}>*</span></label>
                    <input
                      type="text"
                      id="template_type"
                      name="template_type"
                      value={formData.template_type}
                      onChange={handleInputChange}
                      placeholder="Ví dụ: Hợp đồng, Đơn, Biên bản..."
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="language">Ngôn ngữ</label>
                    <select
                      id="language"
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                    >
                      <option value="Tiếng Việt">Tiếng Việt</option>
                      <option value="English">Tiếng Anh</option>
                    </select>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="content">Nội dung <span className={styles.required}>*</span></label>
                  <div className={styles.editorControls}>
                    <button
                      type="button"
                      className={styles.pdfButton}
                      onClick={openPdfModal}
                      title="Tải lên file PDF"
                    >
                      <i className="fas fa-file-pdf"></i> Tải lên PDF
                    </button>
                  </div>
                  <textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    rows={15}
                    required
                  ></textarea>
                </div>
                <div className={styles.modalActions}>
                  <button type="submit" className={styles.saveButton}>
                    {modalMode === 'add' ? 'Thêm mẫu văn bản' : 'Cập nhật'}
                  </button>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={closeModal}
                  >
                    Hủy bỏ
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa */}
      {isDeleteModalOpen && selectedTemplate && (
        <div className={styles.modalOverlay}>
          <div className={styles.deleteModal}>
            <div className={styles.modalHeader}>
              <h2>Xác nhận xóa</h2>
              <button className={styles.closeButton} onClick={closeDeleteModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Bạn có chắc chắn muốn xóa mẫu văn bản <strong>"{selectedTemplate.title}"</strong> không?</p>
              <p className={styles.warningText}>
                <i className="fas fa-exclamation-triangle"></i> Hành động này không thể hoàn tác!
              </p>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.deleteButton} onClick={handleDelete}>
                Xóa mẫu văn bản
              </button>
              <button className={styles.cancelButton} onClick={closeDeleteModal}>
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal tải lên PDF */}
      {isPdfModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.pdfModal}>
            <div className={styles.modalHeader}>
              <h2>Tải lên và chuyển đổi file PDF</h2>
              <button className={styles.closeButton} onClick={closePdfModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Chọn file PDF để tự động chuyển đổi thành nội dung HTML.</p>
              <div className={styles.pdfUploadForm}>
                <input
                  type="file"
                  accept="application/pdf"
                  ref={pdfFileRef}
                  className={styles.fileInput}
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.uploadButton}
                onClick={handleUploadPdf}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Spinner size="small" /> Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className="fas fa-upload"></i> Tải lên và chuyển đổi
                  </>
                )}
              </button>
              <button className={styles.cancelButton} onClick={closePdfModal}>
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentTemplatesManager; 