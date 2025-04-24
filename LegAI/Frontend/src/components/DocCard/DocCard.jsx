import React, { useState } from 'react';
import { FaEye, FaDownload, FaShareAlt, FaTrashAlt, FaEllipsisV, FaChartBar } from 'react-icons/fa';
import { formatRelative } from 'date-fns';
import { vi } from 'date-fns/locale';
import styles from './DocCard.module.css';
import { getFileIcon } from '../../utils/fileIcons';

const DocCard = ({ doc, isOwner = true, onView, onDownload, onShare, onDelete, onAnalyze }) => {
  const [showActions, setShowActions] = useState(false);
  
  const toggleActions = () => {
    setShowActions(!showActions);
  };
  
  const handleAction = (action, e) => {
    e.stopPropagation();
    action();
    setShowActions(false);
  };
  
  const formatDate = (date) => {
    if (!date) return '';
    try {
      return formatRelative(new Date(date), new Date(), { locale: vi });
    } catch (error) {
      return date;
    }
  };
  
  const FileIcon = getFileIcon(doc?.fileType || doc?.file_type || 'pdf');
  
  return (
    <div className={styles.docCard} onClick={onView}>
      <div className={styles.cardHeader}>
        <div className={styles.iconContainer}>
          <FileIcon className={styles.fileIcon} />
        </div>
        <button 
          className={styles.menuButton} 
          onClick={(e) => {
            e.stopPropagation();
            toggleActions();
          }}
        >
          <FaEllipsisV />
        </button>
        {showActions && (
          <div className={styles.actionsMenu}>
            <button onClick={(e) => handleAction(onView, e)}>
              <FaEye /> Xem
            </button>
            <button onClick={(e) => handleAction(onDownload, e)}>
              <FaDownload /> Tải xuống
            </button>
            {isOwner && (
              <>
                <button onClick={(e) => handleAction(onShare, e)}>
                  <FaShareAlt /> Chia sẻ
                </button>
                <button onClick={(e) => handleAction(onAnalyze, e)}>
                  <FaChartBar /> Phân tích
                </button>
                <button className={styles.deleteButton} onClick={(e) => handleAction(onDelete, e)}>
                  <FaTrashAlt /> Xóa
                </button>
              </>
            )}
          </div>
        )}
      </div>
      
      <div className={styles.docInfo}>
        <h3 className={styles.docTitle}>{doc?.title || doc?.name || 'Tài liệu không có tiêu đề'}</h3>
        <div className={styles.docMeta}>
          <span className={styles.category}>{doc?.category || doc?.type || 'Khác'}</span>
          <span className={styles.date}>{formatDate(doc?.updatedAt || doc?.updated_at || doc?.createdAt || doc?.created_at)}</span>
        </div>
      </div>
      
      <div className={styles.footer}>
        <div className={styles.quickActions}>
          <button title="Xem" onClick={(e) => handleAction(onView, e)}>
            <FaEye />
          </button>
          <button title="Tải xuống" onClick={(e) => handleAction(onDownload, e)}>
            <FaDownload />
          </button>
          {isOwner && (
            <>
              <button title="Chia sẻ" onClick={(e) => handleAction(onShare, e)}>
                <FaShareAlt />
              </button>
              <button title="Phân tích" onClick={(e) => handleAction(onAnalyze, e)}>
                <FaChartBar />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocCard; 