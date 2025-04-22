import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import styles from './LegalDocumentsManager.module.css';
import axiosInstance from '../../../config/axios';
import { API_URL } from '../../../config/constants';
import Spinner from '../../../components/Common/Spinner';

const LegalDocumentsManager = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [documentTypes, setDocumentTypes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const pdfFileRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    document_type: '',
    version: '',
    content: '',
    summary: '',
    issued_date: '',
    language: 'Tiếng Việt',
    keywords: []
  });

  useEffect(() => {
    fetchDocuments();
    fetchDocumentTypes();
  }, [currentPage, searchTerm, selectedDocumentType]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', 10);

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (selectedDocumentType) {
        params.append('document_type', selectedDocumentType);
      }

      const response = await axiosInstance.get(`${API_URL}/legal/documents?${params.toString()}`);

      if (response.data && response.data.status === 'success') {
        setDocuments(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách văn bản pháp luật:', err);
      setError('Không thể tải danh sách văn bản pháp luật');
      toast.error('Không thể tải danh sách văn bản pháp luật');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentTypes = async () => {
    try {
      const response = await axiosInstance.get(`${API_URL}/legal/document-types`);
      if (response.data && response.data.status === 'success') {
        setDocumentTypes(response.data.data);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách loại văn bản:', err);
    }
  };

  const openAddModal = () => {
    setFormData({
      title: '',
      document_type: '',
      version: '',
      content: '',
      summary: '',
      issued_date: new Date().toISOString().split('T')[0],
      language: 'Tiếng Việt',
      keywords: []
    });
    setModalMode('add');
    setIsModalOpen(true);
  };

  const openEditModal = (document) => {
    const date = new Date(document.issued_date);
    // Chuyển đổi ngày theo múi giờ Việt Nam
    const formattedDate = date.toLocaleDateString('sv-SE', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).split('/').reverse().join('-'); // Định dạng YYYY-MM-DD

    const formattedDocument = {
      ...document,
      issued_date: formattedDate,
      keywords: document.keywords || [],
    };

    setSelectedDocument(document);
    setFormData(formattedDocument);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const openDeleteModal = (document) => {
    setSelectedDocument(document);
    setIsDeleteModalOpen(true);
  };

  const openPdfModal = () => {
    setHtmlContent('');
    setIsPdfModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'keywords') {
      // Xử lý từ khóa (chuỗi phân cách bằng dấu phẩy)
      setFormData({
        ...formData,
        keywords: value.split(',').map(keyword => keyword.trim()).filter(keyword => keyword)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset về trang 1 khi tìm kiếm mới
  };

  const handleDocumentTypeChange = (e) => {
    setSelectedDocumentType(e.target.value);
    setCurrentPage(1); // Reset về trang 1 khi thay đổi loại văn bản
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.document_type || !formData.content) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      if (modalMode === 'add') {
        const response = await axiosInstance.post(`${API_URL}/legal/documents`, formData);
        if (response.data && response.data.status === 'success') {
          toast.success('Thêm văn bản pháp luật thành công');
          fetchDocuments();
          closeModal();
        }
      } else {
        const response = await axiosInstance.put(
          `${API_URL}/legal/documents/${selectedDocument.id}`,
          formData
        );
        if (response.data && response.data.status === 'success') {
          toast.success('Cập nhật văn bản pháp luật thành công');
          fetchDocuments();
          closeModal();
        }
      }
    } catch (err) {
      console.error('Lỗi khi lưu văn bản pháp luật:', err);
      toast.error(err.response?.data?.message || 'Lỗi khi lưu văn bản pháp luật');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await axiosInstance.delete(`${API_URL}/legal/documents/${selectedDocument.id}`);
      if (response.data && response.data.status === 'success') {
        toast.success('Xóa văn bản pháp luật thành công');
        fetchDocuments();
        closeDeleteModal();
      }
    } catch (err) {
      console.error('Lỗi khi xóa văn bản pháp luật:', err);
      toast.error(err.response?.data?.message || 'Lỗi khi xóa văn bản pháp luật');
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

    // Kiểm tra kích thước file (giới hạn 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('Kích thước file vượt quá giới hạn 10MB');
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
      // Hiển thị thông báo lỗi cụ thể từ server nếu có
      if (err.response && err.response.data && err.response.data.message) {
        toast.error(`Lỗi: ${err.response.data.message}`);
      } else if (err.message) {
        toast.error(`Lỗi: ${err.message}`);
      } else {
        toast.error('Lỗi khi tải lên hoặc chuyển đổi file PDF');
      }

      // Giữ modal mở để người dùng có thể chọn lại file
      setIsUploading(false);
      // Không đóng modal, reset file input để người dùng có thể chọn lại
      if (pdfFileRef.current) {
        pdfFileRef.current.value = '';
      }
    } finally {
      setIsUploading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDocument(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedDocument(null);
  };

  const closePdfModal = () => {
    setIsPdfModalOpen(false);
    pdfFileRef.current.value = '';
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
            placeholder="Tìm kiếm văn bản..."
            value={searchTerm}
            onChange={handleSearchInputChange}
            className={styles.searchInput}
          />
          <select
            value={selectedDocumentType}
            onChange={handleDocumentTypeChange}
            className={styles.selectFilter}
          >
            <option value="">Tất cả loại văn bản</option>
            {documentTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
        <button className={styles.addButton} onClick={openAddModal}>
          <i className="fas fa-plus"></i> Thêm văn bản mới
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
          <button className={styles.retryButton} onClick={fetchDocuments}>
            Thử lại
          </button>
        </div>
      ) : documents.length === 0 ? (
        <div className={styles.emptyContainer}>
          <p>Không có văn bản pháp luật nào</p>
          <button className={styles.addButton} onClick={openAddModal}>
            <i className="fas fa-plus"></i> Thêm văn bản mới
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
                  <th>Loại văn bản</th>
                  <th>Ngày ban hành</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document, index) => (
                  <tr key={document.id}>
                    <td>{(currentPage - 1) * 10 + index + 1}</td>
                    <td>
                      <div className={styles.documentTitle}>
                        {document.title}
                      </div>
                      {document.keywords && document.keywords.length > 0 && (
                        <div className={styles.keywordsList}>
                          {document.keywords.map((keyword, idx) => (
                            <span key={idx} className={styles.keywordTag}>
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>{document.document_type}</td>
                    <td>{formatDate(document.issued_date)}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.editButton}
                          onClick={() => openEditModal(document)}
                          title="Chỉnh sửa"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => openDeleteModal(document)}
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

      {/* Modal thêm/sửa văn bản */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{modalMode === 'add' ? 'Thêm văn bản mới' : 'Chỉnh sửa văn bản'}</h2>
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
                    <label htmlFor="document_type">Loại văn bản <span className={styles.required}>*</span></label>
                    <select
                      id="document_type"
                      name="document_type"
                      value={formData.document_type}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Chọn loại văn bản</option>
                      {documentTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="version">Phiên bản</label>
                    <input
                      type="text"
                      id="version"
                      name="version"
                      value={formData.version}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="issued_date">Ngày ban hành <span className={styles.required}>*</span></label>
                    <input
                      type="date"
                      id="issued_date"
                      name="issued_date"
                      value={formData.issued_date}
                      onChange={handleInputChange}
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
                  <label htmlFor="summary">Tóm tắt</label>
                  <textarea
                    id="summary"
                    name="summary"
                    value={formData.summary}
                    onChange={handleInputChange}
                    rows={3}
                  ></textarea>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="keywords">Từ khóa (ngăn cách bằng dấu phẩy)</label>
                  <input
                    type="text"
                    id="keywords"
                    name="keywords"
                    value={formData.keywords.join(', ')}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: luật, hợp đồng, dân sự"
                  />
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
                    rows={10}
                    required
                  ></textarea>
                </div>
                <div className={styles.modalActions}>
                  <button type="submit" className={styles.saveButton}>
                    {modalMode === 'add' ? 'Thêm văn bản' : 'Cập nhật'}
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
      {isDeleteModalOpen && selectedDocument && (
        <div className={styles.modalOverlay}>
          <div className={styles.deleteModal}>
            <div className={styles.modalHeader}>
              <h2>Xác nhận xóa</h2>
              <button className={styles.closeButton} onClick={closeDeleteModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Bạn có chắc chắn muốn xóa văn bản <strong>"{selectedDocument.title}"</strong> không?</p>
              <p className={styles.warningText}>
                <i className="fas fa-exclamation-triangle"></i> Hành động này không thể hoàn tác!
              </p>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.deleteButton} onClick={handleDelete}>
                Xóa văn bản
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

export default LegalDocumentsManager; 