import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './DocCard.module.css';
import PropTypes from 'prop-types';

const DocCard = ({ 
  doc, 
  isOwner = true, 
  onView, 
  onDownload, 
  onShare, 
  onDelete, 
  onAnalyze 
}) => {
  const [showActions, setShowActions] = useState(false);
  const navigate = useNavigate();
  
  // Xác định icon dựa trên loại file
  const getFileIcon = (fileType) => {
    const type = fileType ? fileType.toLowerCase() : '';
    
    switch (type) {
      case 'pdf':
        return 'fa-file-pdf';
      case 'docx':
      case 'doc':
        return 'fa-file-word';
      case 'xlsx':
      case 'xls':
        return 'fa-file-excel';
      case 'pptx':
      case 'ppt':
        return 'fa-file-powerpoint';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'fa-file-image';
      case 'txt':
        return 'fa-file-alt';
      default:
        return 'fa-file';
    }
  };

  // Kiểm tra xem file có phải là hình ảnh không
  const isImageFile = (fileType) => {
    const type = fileType ? fileType.toLowerCase() : '';
    return ['jpg', 'jpeg', 'png', 'gif'].includes(type);
  };
  
  // Format thời gian
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Xử lý click vào các action
  const handleViewClick = (e) => {
    e.stopPropagation();
    navigate(`/legal-docs/${doc.id}`);
  };
  
  const handleDownloadClick = (e) => {
    e.stopPropagation();
    onDownload();
  };
  
  const handleShareClick = (e) => {
    e.stopPropagation();
    onShare();
  };
  
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete();
  };
  
  const handleAnalyzeClick = (e) => {
    e.stopPropagation();
    onAnalyze();
  };
  
  // Kiểm tra xem tài liệu đã được phân tích chưa
  const isAnalyzed = doc.metadata && doc.metadata.analyzed;
  
  // Kiểm tra xem tài liệu có thể phân tích được không (không phải file hình ảnh)
  const canAnalyze = !isImageFile(doc.file_type);
  
  return (
    <div 
      className={styles.card}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={handleViewClick}
    >
      <div className={styles.cardHeader}>
        <div className={styles.fileIcon}>
          <i className={`fas ${getFileIcon(doc.file_type)}`}></i>
        </div>
        
        {isOwner && doc.access_level !== 'private' && (
          <div className={styles.shareIndicator} title="Đã chia sẻ">
            <i className="fas fa-share-alt"></i>
          </div>
        )}
        
        {!isOwner && (
          <div className={styles.ownerInfo} title={`Chủ sở hữu: ${doc.owner_name || 'N/A'}`}>
            <i className="fas fa-user"></i>
          </div>
        )}
      </div>
      
      <div className={styles.cardBody}>
        <h3 className={styles.title} title={doc.title}>{doc.title}</h3>
        <p className={styles.description} title={doc.description}>
          {doc.description || 'Không có mô tả'}
        </p>
        
        <div className={styles.metadata}>
          <div className={styles.category}>
            <span>{doc.category}</span>
          </div>
          
          <div className={styles.date}>
            <i className="far fa-clock"></i>
            <span>{formatDate(doc.created_at)}</span>
          </div>
        </div>
        
        {doc.tags && doc.tags.length > 0 && (
          <div className={styles.tags}>
            {doc.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className={styles.tag}>{tag}</span>
            ))}
            {doc.tags.length > 3 && <span className={styles.tag}>+{doc.tags.length - 3}</span>}
          </div>
        )}
      </div>
      
      <div className={`${styles.cardActions} ${showActions ? styles.showActions : ''}`}>
        <button 
          className={styles.actionButton} 
          onClick={handleViewClick}
          title="Xem chi tiết"
        >
          <i className="fas fa-eye"></i>
        </button>
        
        <button 
          className={styles.actionButton} 
          onClick={handleDownloadClick}
          title="Tải xuống"
        >
          <i className="fas fa-download"></i>
        </button>
        
        {isOwner && (
          <>
            <button 
              className={styles.actionButton} 
              onClick={handleShareClick}
              title="Chia sẻ"
            >
              <i className="fas fa-share-alt"></i>
            </button>
            
            <button 
              className={styles.actionButton} 
              onClick={handleDeleteClick}
              title="Xóa"
            >
              <i className="fas fa-trash-alt"></i>
            </button>
          </>
        )}
        
        {canAnalyze && (
          <button 
            className={`${styles.actionButton} ${isAnalyzed ? styles.analyzedButton : ''}`}
            onClick={handleAnalyzeClick}
            title={isAnalyzed ? "Xem phân tích AI" : "Phân tích với AI"}
          >
            <i className={`fas ${isAnalyzed ? 'fa-robot' : 'fa-magic'}`}></i>
          </button>
        )}
      </div>
    </div>
  );
};

DocCard.propTypes = {
  doc: PropTypes.object.isRequired,
  isOwner: PropTypes.bool,
  onView: PropTypes.func,
  onDownload: PropTypes.func.isRequired,
  onShare: PropTypes.func,
  onDelete: PropTypes.func,
  onAnalyze: PropTypes.func
};

export default DocCard; 