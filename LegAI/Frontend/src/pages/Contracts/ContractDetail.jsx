import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from './ContractDetail.module.css';
import * as contractService from '../../services/contractService';
import Spinner from '../../components/Common/Spinner';
import ContractDocViewer from './components/ContractDocViewer';

const ContractDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    contract_type: '',
    partner: '',
    start_date: '',
    end_date: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [isDocx, setIsDocx] = useState(false);

  // Lấy thông tin hợp đồng và kiểm tra quyền sở hữu
  useEffect(() => {
    const fetchContract = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        console.log("Bắt đầu tải thông tin hợp đồng ID:", id);
        const response = await contractService.getContractById(id);
        
        if (response.success) {
          const contractData = response.data;
          console.log("Dữ liệu hợp đồng nhận được:", contractData);
          setContract(contractData);
          
          // Kiểm tra nếu là file docx
          if (contractData.file_type && 
              (contractData.file_type.toLowerCase() === 'docx' || 
               contractData.file_type.toLowerCase() === 'doc')) {
            setIsDocx(true);
            console.log("Đã phát hiện tài liệu Word:", contractData.file_type);
          } else {
            setIsDocx(false);
          }
          
          // Lưu URL file nếu có
          if (contractData.file_url) {
            setFileUrl(contractData.file_url);
            console.log("Đã tìm thấy URL file:", contractData.file_url);
          } else {
            console.log("Không tìm thấy URL file trong dữ liệu");
          }
          
          // Kiểm tra quyền sở hữu
          const currentUser = JSON.parse(localStorage.getItem('user'));
          setIsOwner(currentUser && contractData.user_id === currentUser.id);
          
          // Khởi tạo form chỉnh sửa
          setEditForm({
            title: contractData.title || '',
            description: contractData.description || '',
            contract_type: contractData.contract_type || '',
            partner: contractData.partner || '',
            start_date: contractData.start_date ? new Date(contractData.start_date).toISOString().split('T')[0] : '',
            end_date: contractData.end_date ? new Date(contractData.end_date).toISOString().split('T')[0] : ''
          });
          
          // Tải nội dung tài liệu
          try {
            console.log("Thử tải nội dung hợp đồng");
            
            // Kiểm tra xem contractData đã có nội dung hay chưa
            if (contractData.content) {
              console.log("Sử dụng nội dung từ dữ liệu hợp đồng");
              setContent(contractData.content);
              setEditableContent(contractData.content);
            } else if (contractData.metadata && contractData.metadata.extracted_text) {
              console.log("Sử dụng extracted_text từ metadata");
              setContent(contractData.metadata.extracted_text);
              setEditableContent(contractData.metadata.extracted_text);
            } else if (contractData.file_url) {
              // Nếu là file DOCX hoặc DOC, không cần lấy nội dung vì sẽ dùng viewer
              if (contractData.file_type && 
                  (contractData.file_type.toLowerCase() === 'docx' || 
                   contractData.file_type.toLowerCase() === 'doc')) {
                console.log("Phát hiện file Word, sẽ hiển thị bằng DocViewer");
                setContent('Tài liệu Word này sẽ được hiển thị trong khung xem.');
              } else {
                // Cho các loại file khác, thử lấy nội dung từ API
                console.log("Thử lấy nội dung từ API...");
                try {
                  const contentResponse = await contractService.getContractFileContent(id);
                  console.log("Kết quả lấy nội dung:", contentResponse);
                  
                  if (contentResponse.success && contentResponse.data && contentResponse.data.content) {
                    console.log("Đã lấy được nội dung từ API");
                    setContent(contentResponse.data.content);
                    setEditableContent(contentResponse.data.content);
                  } else {
                    console.log("API không trả về nội dung, chuyển sang hiển thị qua viewer");
                    if (contractData.file_type === 'pdf') {
                      setContent('Tài liệu PDF này sẽ được hiển thị trong khung xem.');
                    } else {
                      setContent('Tài liệu này sẽ được hiển thị theo loại tệp.');
                    }
                  }
                } catch (contentError) {
                  console.error("Lỗi khi gọi API lấy nội dung:", contentError);
                  console.log("Chuyển sang hiển thị qua viewer");
                  if (contractData.file_type === 'pdf') {
                    setContent('Tài liệu PDF này sẽ được hiển thị trong khung xem.');
                  } else {
                    setContent('Tài liệu này sẽ được hiển thị theo loại tệp.');
                  }
                }
              }
            } else {
              console.log("Không có URL file, không thể tải nội dung");
              setContent('Không thể hiển thị nội dung tệp này trực tiếp trên trình duyệt. Vui lòng tải xuống để xem chi tiết.');
            }
          } catch (error) {
            console.error('Lỗi khi tải nội dung hợp đồng:', error);
            setContent('Không thể tải nội dung hợp đồng. Vui lòng tải xuống để xem chi tiết.');
            setEditableContent('');
          }
        } else {
          toast.error("Không thể tải thông tin hợp đồng: " + response.message);
          navigate('/contracts');
        }
      } catch (error) {
        console.error("Lỗi khi tải hợp đồng:", error);
        toast.error("Đã xảy ra lỗi khi tải hợp đồng: " + (error.message || "Vui lòng thử lại sau."));
        navigate('/contracts');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchContractTypes = async () => {
      try {
        const types = [
          'Hợp đồng lao động',
          'Hợp đồng thuê nhà',
          'Hợp đồng mua bán',
          'Hợp đồng xây dựng',
          'Hợp đồng cho thuê',
          'Hợp đồng hợp tác kinh doanh',
          'Hợp đồng cung cấp dịch vụ',
          'Hợp đồng khác'
        ];
        setCategories(types);
      } catch (error) {
        console.error("Lỗi khi tải loại hợp đồng:", error);
      }
    };

    fetchContract();
    fetchContractTypes();
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      title: contract.title || '',
      description: contract.description || '',
      contract_type: contract.contract_type || '',
      partner: contract.partner || '',
      start_date: contract.start_date ? new Date(contract.start_date).toISOString().split('T')[0] : '',
      end_date: contract.end_date ? new Date(contract.end_date).toISOString().split('T')[0] : ''
    });
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      
      const updateData = {
        title: editForm.title,
        description: editForm.description,
        contract_type: editForm.contract_type,
        partner: editForm.partner,
        start_date: editForm.start_date,
        end_date: editForm.end_date
      };
      
      const response = await contractService.updateContract(id, updateData);
      
      if (response.success) {
        setContract(prev => ({ ...prev, ...updateData }));
        setIsEditing(false);
        toast.success("Cập nhật hợp đồng thành công!");
      } else {
        toast.error("Không thể cập nhật hợp đồng: " + response.message);
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật hợp đồng:", error);
      toast.error("Đã xảy ra lỗi khi cập nhật: " + (error.message || "Vui lòng thử lại sau."));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownload = async () => {
    try {
      // Nếu có file_url trực tiếp, mở trong tab mới
      if (contract?.file_url) {
        let downloadUrl = contract.file_url;
        
        // Nếu URL là tương đối, thêm domain backend
        if (downloadUrl.startsWith('/uploads/')) {
          downloadUrl = `http://localhost:8000${downloadUrl}`;
        }
        
        // Nếu URL chứa localhost:3000, chuyển thành localhost:8000
        if (downloadUrl.includes('localhost:3000')) {
          downloadUrl = downloadUrl.replace('localhost:3000', 'localhost:8000');
        }
        
        window.open(downloadUrl, '_blank');
        return;
      }
      
      // Nếu không có file_url, thử sử dụng API download
      try {
        const response = await contractService.downloadContractFile(id);
        if (response.success && response.downloadUrl) {
          window.open(response.downloadUrl, '_blank');
        } else {
          toast.error("Không thể tải xuống tài liệu: " + response.message);
        }
      } catch (error) {
        console.error("Lỗi khi tải xuống tài liệu:", error);
        toast.error("Lỗi khi tải xuống tài liệu: " + (error.message || "Vui lòng thử lại sau."));
      }
    } catch (error) {
      toast.error("Lỗi khi tải xuống tài liệu: " + (error.message || "Vui lòng thử lại sau."));
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa hợp đồng này không? Hành động này không thể khôi phục.")) {
      try {
        const response = await contractService.deleteContract(id);
        
        if (response.success) {
          toast.success("Đã xóa hợp đồng thành công!");
          navigate('/contracts');
        } else {
          toast.error("Không thể xóa hợp đồng: " + response.message);
        }
      } catch (error) {
        console.error("Lỗi khi xóa hợp đồng:", error);
        toast.error("Đã xảy ra lỗi khi xóa hợp đồng: " + (error.message || "Vui lòng thử lại sau."));
      }
    }
  };

  const handleStartContentEditing = () => {
    setIsEditingContent(true);
  };

  const handleCancelContentEdit = () => {
    setIsEditingContent(false);
    setEditableContent(content);
  };

  const handleContentChange = (e) => {
    setEditableContent(e.target.value);
  };

  const handleSaveContent = async () => {
    try {
      setIsSavingContent(true);
      
      try {
        // Thử gọi API cập nhật nội dung
        const response = await contractService.updateContractContent(id, editableContent);
        
        if (response.success) {
          setContent(editableContent);
          setIsEditingContent(false);
          toast.success("Đã cập nhật nội dung hợp đồng!");
        } else {
          // Nếu API trả về lỗi, vẫn cập nhật nội dung ở phía client
          console.warn("API không thể cập nhật nội dung nhưng sẽ cập nhật ở client:", response.message);
          setContent(editableContent);
          setIsEditingContent(false);
          toast.info("Đã cập nhật nội dung hợp đồng ở phía client.");
        }
      } catch (error) {
        console.error("Lỗi khi cập nhật nội dung:", error);
        
        // Nếu lỗi 404 (API endpoint không tồn tại), vẫn cập nhật ở client
        if (error.response && error.response.status === 404) {
          console.warn("API endpoint không tồn tại, cập nhật nội dung ở client");
          setContent(editableContent);
          setIsEditingContent(false);
          toast.info("Đã cập nhật nội dung hợp đồng ở phía client.");
        } else {
          toast.error("Đã xảy ra lỗi khi cập nhật nội dung: " + (error.message || "Vui lòng thử lại sau."));
        }
      }
    } finally {
      setIsSavingContent(false);
    }
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return <i className="fas fa-file"></i>;
    
    fileType = fileType.toLowerCase();
    if (fileType === 'pdf') return <i className="fas fa-file-pdf"></i>;
    if (fileType === 'doc' || fileType === 'docx') return <i className="fas fa-file-word"></i>;
    if (fileType === 'xls' || fileType === 'xlsx') return <i className="fas fa-file-excel"></i>;
    if (fileType === 'ppt' || fileType === 'pptx') return <i className="fas fa-file-powerpoint"></i>;
    if (fileType === 'txt') return <i className="fas fa-file-alt"></i>;
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileType)) return <i className="fas fa-file-image"></i>;
    
    return <i className="fas fa-file"></i>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Lỗi khi định dạng ngày:', error);
      return dateString;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return 'N/A';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="large" />
        <p>Đang tải thông tin hợp đồng...</p>
      </div>
    );
  }

  return (
    <div className={styles.contractDetailContainer}>
      <div className={styles.contractHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.contractTitle}>{contract?.title}</h1>
          <div className={styles.contractMeta}>
            <span className={styles.contractType}>
              <i className="fas fa-tag"></i> {contract?.contract_type || 'Không có loại'}
            </span>
            <span className={styles.contractDate}>
              <i className="fas fa-calendar-alt"></i> {formatDate(contract?.created_at)}
            </span>
            {contract?.file_size && (
              <span className={styles.fileSize}>
                <i className="fas fa-weight"></i> {formatFileSize(contract?.file_size)}
              </span>
            )}
            {contract?.file_type && (
              <span className={styles.fileType}>
                {getFileIcon(contract.file_type)} {contract.file_type.toUpperCase()}
              </span>
            )}
          </div>
        </div>
        
        <div className={styles.headerActions}>
          {isOwner && !isEditing && (
            <>
              <button className={styles.editButton} onClick={handleStartEditing}>
                <i className="fas fa-edit"></i> Chỉnh sửa
              </button>
              <button className={styles.deleteButton} onClick={handleDelete}>
                <i className="fas fa-trash-alt"></i> Xóa
              </button>
            </>
          )}
          
          <button className={styles.downloadButton} onClick={handleDownload}>
            <i className="fas fa-download"></i> Tải xuống
          </button>
          
          <button className={styles.backButton} onClick={() => navigate('/contracts')}>
            <i className="fas fa-arrow-left"></i> Quay lại
          </button>
        </div>
      </div>
      
      {isEditing ? (
        <div className={styles.editFormContainer}>
          <h2 className={styles.sectionTitle}>Chỉnh sửa thông tin</h2>
          <form onSubmit={handleSaveChanges} className={styles.editForm}>
            <div className={styles.formGroup}>
              <label htmlFor="title">Tiêu đề:</label>
              <input
                type="text"
                id="title"
                name="title"
                value={editForm.title}
                onChange={handleInputChange}
                required
                className={styles.formControl}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="description">Mô tả:</label>
              <textarea
                id="description"
                name="description"
                value={editForm.description || ''}
                onChange={handleInputChange}
                className={styles.formControl}
                rows={3}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="contract_type">Loại hợp đồng:</label>
              <select
                id="contract_type"
                name="contract_type"
                value={editForm.contract_type || ''}
                onChange={handleInputChange}
                className={styles.formControl}
              >
                <option value="">-- Chọn loại hợp đồng --</option>
                {categories.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="partner">Đối tác:</label>
                <input
                  type="text"
                  id="partner"
                  name="partner"
                  value={editForm.partner || ''}
                  onChange={handleInputChange}
                  className={styles.formControl}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="start_date">Ngày bắt đầu:</label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={editForm.start_date || ''}
                  onChange={handleInputChange}
                  className={styles.formControl}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="end_date">Ngày kết thúc:</label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={editForm.end_date || ''}
                  onChange={handleInputChange}
                  className={styles.formControl}
                />
              </div>
            </div>
            
            <div className={styles.formActions}>
              <button 
                type="button" 
                className={styles.cancelButton} 
                onClick={handleCancelEdit}
              >
                Hủy
              </button>
              <button 
                type="submit" 
                className={styles.saveButton} 
                disabled={isUpdating}
              >
                {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className={styles.contractDetailsContainer}>
          <div className={styles.detailsCard}>
            <h2 className={styles.sectionTitle}>Thông tin chi tiết</h2>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Đối tác:</span>
                <span className={styles.detailValue}>{contract?.partner || 'Không có'}</span>
              </div>
              
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Ngày bắt đầu:</span>
                <span className={styles.detailValue}>{formatDate(contract?.start_date) || 'Không có'}</span>
              </div>
              
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Ngày kết thúc:</span>
                <span className={styles.detailValue}>{formatDate(contract?.end_date) || 'Không có'}</span>
              </div>
              
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Cập nhật lần cuối:</span>
                <span className={styles.detailValue}>{formatDate(contract?.updated_at)}</span>
              </div>
            </div>
            
            {contract?.description && (
              <div className={styles.descriptionContainer}>
                <h3 className={styles.descriptionTitle}>Mô tả:</h3>
                <p className={styles.description}>{contract.description}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractDetail; 