import { useState, useEffect } from 'react';
import styles from './AIPrompt.module.css';

const AIPrompt = ({ isVisible, onClose }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!isVisible) return;
    
    // Tự động ẩn hướng dẫn sau 10 giây
    const timer = setTimeout(() => {
      handleClose();
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [isVisible]);

  const handleClose = () => {
    setFadeOut(true);
    setTimeout(() => {
      onClose();
      setFadeOut(false);
    }, 500);
  };

  if (!isVisible) return null;

  return (
    <div className={`${styles.promptContainer} ${fadeOut ? styles.fadeOut : ''}`}>
      <div className={styles.promptHeader}>
        <h4>Hướng dẫn sử dụng Chat AI</h4>
        <button className={styles.closeButton} onClick={handleClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className={styles.promptContent}>
        <div className={styles.promptItem}>
          <div className={styles.promptIcon}>
            <i className="fas fa-lightbulb"></i>
          </div>
          <p>Hỏi các vấn đề pháp lý cơ bản</p>
        </div>
        
        <div className={styles.promptItem}>
          <div className={styles.promptIcon}>
            <i className="fas fa-search"></i>
          </div>
          <p>Tìm hiểu về dịch vụ luật sư</p>
        </div>
        
        <div className={styles.promptItem}>
          <div className={styles.promptIcon}>
            <i className="fas fa-file-alt"></i>
          </div>
          <p>Xin thông tin về thủ tục pháp lý</p>
        </div>
      </div>
      
      <div className={styles.promptFooter}>
        <p>AI hỗ trợ 24/7, tuy nhiên chỉ mang tính chất tham khảo.</p>
      </div>
    </div>
  );
};

export default AIPrompt; 