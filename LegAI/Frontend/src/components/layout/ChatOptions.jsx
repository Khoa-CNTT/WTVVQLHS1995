import { useState } from 'react';
import styles from './ChatOptions.module.css';
import ChatWindow from './ChatWindow';

const ChatOptions = ({ isOpen, onClose }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };

  const handleStartChat = () => {
    if (selectedOption) {
      setIsChatOpen(true);
      onClose(); // Đóng menu tùy chọn khi mở cửa sổ chat
    }
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setSelectedOption(null);
  };

  const handleOpenChatDirectly = () => {
    setSelectedOption('ai'); // Mặc định chọn AI
    setIsChatOpen(true);
  };

  return (
    <>
      {isOpen && (
        <div className={styles.chatOptionsContainer}>
          <div className={styles.chatOptionsHeader}>
            <h3>Chọn chế độ chat</h3>
            <button className={styles.closeButton} onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className={styles.chatOptionsList}>
            <div 
              className={`${styles.chatOption} ${selectedOption === 'ai' ? styles.selected : ''}`}
              onClick={() => handleOptionSelect('ai')}
            >
              <div className={styles.optionIcon}>
                <i className="fas fa-robot"></i>
              </div>
              <div className={styles.optionInfo}>
                <h4>Chat với AI</h4>
                <p>Trả lời nhanh 24/7 với trợ lý ảo thông minh</p>
              </div>
            </div>
            
            <div 
              className={`${styles.chatOption} ${selectedOption === 'human' ? styles.selected : ''}`}
              onClick={() => handleOptionSelect('human')}
            >
              <div className={styles.optionIcon}>
                <i className="fas fa-user-headset"></i>
              </div>
              <div className={styles.optionInfo}>
                <h4>Chat với người hỗ trợ</h4>
                <p>Kết nối trực tiếp với chuyên viên tư vấn</p>
              </div>
            </div>
          </div>
          
          <div className={styles.chatOptionsFooter}>
            <button 
              className={`${styles.startChatButton} ${!selectedOption ? styles.disabled : ''}`}
              disabled={!selectedOption}
              onClick={handleStartChat}
            >
              Bắt đầu chat
            </button>
          </div>
        </div>
      )}
      
      {isOpen && <div className={styles.overlay} onClick={onClose}></div>}
      
      {/* Cửa sổ chat */}
      <ChatWindow 
        isOpen={isChatOpen} 
        onClose={handleCloseChat} 
        chatType={selectedOption || 'ai'} 
      />
    </>
  );
};

export default ChatOptions; 