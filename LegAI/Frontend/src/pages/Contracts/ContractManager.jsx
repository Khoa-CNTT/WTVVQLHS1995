import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaDownload, FaPlus, FaFileContract, FaList, FaTimes } from 'react-icons/fa';
import { getContracts, createContract, updateContract, deleteContract, downloadContractFile } from '../../services/contractService';
import styles from './ContractManager.module.css';
import Navbar from '../../components/layout/Nav/Navbar';
import ContractForm from './components/ContractForm';
import ContractDetails from './components/ContractDetails';
import DeleteConfirmation from './components/DeleteConfirmation';

const CustomModal = ({ show, onClose, title, children }) => {
  if (!show) return null;
  
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button className={styles.modalClose} onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className={styles.modalBody}>
          {children}
        </div>
      </div>
    </div>
  );
};

const ContractManager = () => {
  // State để lưu trữ dữ liệu
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // State cho form và modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentContract, setCurrentContract] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    contract_type: '',
    partner: '',
    start_date: '',
    end_date: '',
    signature: '',
    file: null
  });
  
  // Các loại hợp đồng mẫu
  const contractTypes = [
    'Hợp đồng lao động',
    'Hợp đồng thuê nhà',
    'Hợp đồng mua bán',
    'Hợp đồng xây dựng',
    'Hợp đồng cho thuê',
    'Hợp đồng hợp tác kinh doanh',
    'Hợp đồng cung cấp dịch vụ',
    'Hợp đồng khác'
  ];

  // Tải danh sách hợp đồng khi component được mount
  useEffect(() => {
    loadContracts();
  }, []);

  // Hàm tải danh sách hợp đồng
  const loadContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Bỏ qua bước kiểm tra kết nối và chỉ gọi API trực tiếp
      const data = await getContracts();
      setContracts(data.contracts || []);
    } catch (err) {
      setError('Không thể tải danh sách hợp đồng: ' + (err.message || 'Vui lòng thử lại sau.'));
      console.error('Lỗi khi tải hợp đồng:', err);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thay đổi input trong form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Xử lý thay đổi file
  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      file: e.target.files[0]
    }));
  };

  // Xử lý mở modal tạo hợp đồng mới
  const handleShowCreateModal = () => {
    setFormData({
      title: '',
      contract_type: '',
      partner: '',
      start_date: '',
      end_date: '',
      signature: '',
      file: null
    });
    setShowCreateModal(true);
  };

  // Xử lý mở modal xem chi tiết hợp đồng
  const handleShowDetailModal = (contract) => {
    setCurrentContract(contract);
    setShowDetailModal(true);
  };

  // Xử lý mở modal chỉnh sửa hợp đồng
  const handleShowEditModal = (contract) => {
    setCurrentContract(contract);
    setFormData({
      title: contract.title,
      contract_type: contract.contract_type,
      partner: contract.partner || '',
      start_date: contract.start_date ? new Date(contract.start_date).toISOString().split('T')[0] : '',
      end_date: contract.end_date ? new Date(contract.end_date).toISOString().split('T')[0] : '',
      signature: contract.signature || '',
      file: null // File không thể tự động điền
    });
    setShowEditModal(true);
  };

  // Xử lý mở modal xác nhận xóa
  const handleShowDeleteModal = (contract) => {
    setCurrentContract(contract);
    setShowDeleteModal(true);
  };

  // Xử lý đóng các modal
  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowDetailModal(false);
    setCurrentContract(null);
  };

  // Xử lý tạo hợp đồng mới
  const handleCreateContract = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await createContract(formData);
      setSuccess('Tạo hợp đồng thành công!');
      handleCloseModals();
      loadContracts(); // Tải lại danh sách sau khi tạo
      
      // Xóa thông báo thành công sau 3 giây
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('Lỗi khi tạo hợp đồng: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Xử lý cập nhật hợp đồng
  const handleUpdateContract = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await updateContract(currentContract.id, formData);
      setSuccess('Cập nhật hợp đồng thành công!');
      handleCloseModals();
      loadContracts(); // Tải lại danh sách sau khi cập nhật
      
      // Xóa thông báo thành công sau 3 giây
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('Lỗi khi cập nhật hợp đồng: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Xử lý xóa hợp đồng
  const handleDeleteContract = async () => {
    try {
      setLoading(true);
      setError(null);
      await deleteContract(currentContract.id);
      setSuccess('Xóa hợp đồng thành công!');
      handleCloseModals();
      loadContracts(); // Tải lại danh sách sau khi xóa
      
      // Xóa thông báo thành công sau 3 giây
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('Lỗi khi xóa hợp đồng: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Xử lý tải xuống file hợp đồng
  const handleDownloadFile = async (contractId) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Bắt đầu tải xuống hợp đồng ID: ${contractId}`);
      const result = await downloadContractFile(contractId);
      
      if (result && result.success) {
        setSuccess(`Đã tải xuống thành công: ${result.filename || 'Contract File'}`);
        console.log('Tải xuống thành công:', result);
        
        // Xóa thông báo thành công sau 3 giây
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      }
    } catch (err) {
      console.error('Chi tiết lỗi tải xuống:', err);
      let errorMessage = 'Lỗi khi tải xuống file';
      
      if (err.response) {
        const status = err.response.status;
        if (status === 404) {
          errorMessage = 'Không tìm thấy file hợp đồng, có thể file đã bị xóa';
        } else if (status === 403) {
          errorMessage = 'Bạn không có quyền tải xuống file này';
        } else if (status === 500) {
          errorMessage = 'Lỗi máy chủ khi tải xuống file';
        } else {
          errorMessage = `Lỗi khi tải xuống file: ${err.response.data?.message || err.message || 'Không xác định'}`;
        }
      } else if (err.request) {
        errorMessage = 'Không nhận được phản hồi từ máy chủ khi tải xuống';
      } else {
        errorMessage = `Lỗi khi tải xuống file: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Định dạng ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa xác định';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  return (
    <>
      <Navbar />
      <div className={styles.contractManagerContainer}>
        <div className={styles.sectionHeader}>
          <h1 className={styles.sectionTitle}>Quản lý hợp đồng</h1>
          <p className={styles.sectionDescription}>
            Quản lý tất cả các hợp đồng của bạn tại một nơi. Bạn có thể xem, tạo mới, cập nhật hoặc xóa hợp đồng.
          </p>
        </div>
        
        {error && <div className={styles.alertError}>{error}</div>}
        {success && <div className={styles.alertSuccess}>{success}</div>}
        
        <div className={styles.actionHeader}>
          <button onClick={handleShowCreateModal} className={styles.addButton}>
            <FaPlus /> Tạo hợp đồng mới
          </button>
        </div>
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : contracts.length > 0 ? (
          <div className={styles.tableContainer}>
            <table className={styles.contractTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tiêu đề</th>
                  <th>Loại hợp đồng</th>
                  <th>Đối tác</th>
                  <th>Ngày bắt đầu</th>
                  <th>Ngày kết thúc</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract, index) => (
                  <tr key={contract.id}>
                    <td>{index + 1}</td>
                    <td>
                      <span 
                        className={styles.contractTitleLink}
                        onClick={() => handleShowDetailModal(contract)}
                      >
                        {contract.title}
                      </span>
                    </td>
                    <td>{contract.contract_type}</td>
                    <td>{contract.partner || 'Chưa xác định'}</td>
                    <td>{formatDate(contract.start_date)}</td>
                    <td>{formatDate(contract.end_date)}</td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button 
                          title="Chi tiết"
                          onClick={() => handleShowDetailModal(contract)}
                        >
                          <FaList />
                        </button>
                        <button 
                          title="Chỉnh sửa"
                          onClick={() => handleShowEditModal(contract)}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          title="Tải xuống"
                          onClick={() => handleDownloadFile(contract.id)}
                        >
                          <FaDownload />
                        </button>
                        <button 
                          title="Xóa"
                          onClick={() => handleShowDeleteModal(contract)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <FaFileContract />
            </div>
            <h3 className={styles.emptyStateTitle}>Chưa có hợp đồng nào</h3>
            <p className={styles.emptyStateDescription}>
              Bạn chưa có hợp đồng nào. Hãy tạo hợp đồng mới để bắt đầu quản lý các thỏa thuận pháp lý của bạn.
            </p>
            <button onClick={handleShowCreateModal} className={styles.addButton}>
              <FaPlus /> Tạo hợp đồng mới
            </button>
          </div>
        )}
      </div>

      {/* Modal tạo hợp đồng mới */}
      <CustomModal 
        show={showCreateModal} 
        onClose={handleCloseModals} 
        title="Tạo hợp đồng mới"
      >
        <ContractForm 
          formData={formData}
          handleInputChange={handleInputChange}
          handleFileChange={handleFileChange}
          handleSubmit={handleCreateContract}
          handleCancel={handleCloseModals}
          loading={loading}
          isEdit={false}
          contractTypes={contractTypes}
        />
      </CustomModal>
      
      {/* Modal xem chi tiết hợp đồng */}
      <CustomModal 
        show={showDetailModal} 
        onClose={handleCloseModals} 
        title="Chi tiết hợp đồng"
      >
        <ContractDetails 
          contract={currentContract}
          formatDate={formatDate}
          handleDownloadFile={handleDownloadFile}
          handleCloseDetails={handleCloseModals}
          handleShowEditModal={handleShowEditModal}
        />
      </CustomModal>
      
      {/* Modal chỉnh sửa hợp đồng */}
      <CustomModal 
        show={showEditModal} 
        onClose={handleCloseModals} 
        title="Chỉnh sửa hợp đồng"
      >
        <ContractForm 
          formData={formData}
          handleInputChange={handleInputChange}
          handleFileChange={handleFileChange}
          handleSubmit={handleUpdateContract}
          handleCancel={handleCloseModals}
          loading={loading}
          isEdit={true}
          contractTypes={contractTypes}
        />
      </CustomModal>
      
      {/* Modal xác nhận xóa hợp đồng */}
      <CustomModal 
        show={showDeleteModal} 
        onClose={handleCloseModals} 
        title="Xác nhận xóa hợp đồng"
      >
        <DeleteConfirmation 
          contract={currentContract}
          formatDate={formatDate}
          handleDeleteContract={handleDeleteContract}
          handleCloseModals={handleCloseModals}
          loading={loading}
        />
      </CustomModal>
      
      {/* Overlay hiển thị khi đang tải */}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
        </div>
      )}
    </>
  );
};

export default ContractManager; 