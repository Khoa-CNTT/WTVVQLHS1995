import { useState } from 'react';
import styles from './ChatOptions.module.css';
import ChatWindow from './ChatWindow';
import chatService from '../../../services/chatService';
import { toast } from 'react-toastify';
import authService from '../../../services/authService';

const ChatOptions = ({ isOpen, onClose }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };

  const handleStartChat = async () => {
    if (selectedOption) {
      // Nếu chọn chat với AI, mở chat mà không cần tạo phiên chat mới
      if (selectedOption === 'ai') {
        setIsChatOpen(true);
        onClose(); // Đóng menu tùy chọn khi mở cửa sổ chat
        return;
      }
      
      // Nếu chọn chat với người hỗ trợ (luật sư), cần tạo phiên chat mới
      try {
        setLoading(true);
        
        // Kiểm tra người dùng đã đăng nhập chưa
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
          toast.error('Vui lòng đăng nhập để sử dụng tính năng chat');
          setLoading(false);
          return;
        }
        
        // Tạo phiên chat mới
        const response = await chatService.createChat();
        
        if (response.status === 'success') {
          setChatId(response.data.id);
      setIsChatOpen(true);
      onClose(); // Đóng menu tùy chọn khi mở cửa sổ chat
        } else {
          toast.error('Không thể tạo phiên chat. Vui lòng thử lại sau.');
        }
      } catch (error) {
        console.error('Lỗi khi tạo phiên chat:', error);
        toast.error('Không thể tạo phiên chat. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setSelectedOption(null);
    setChatId(null);
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
                <i className="fas fa-user"></i>
              </div>
              <div className={styles.optionInfo}>
                <h4>Chat với người hỗ trợ</h4>
                <p>Kết nối trực tiếp với chuyên viên tư vấn</p>
              </div>
            </div>
          </div>
          
          <div className={styles.chatOptionsFooter}>
            <button 
              className={`${styles.startChatButton} ${!selectedOption || loading ? styles.disabled : ''}`}
              disabled={!selectedOption || loading}
              onClick={handleStartChat}
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Bắt đầu chat'}
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
        chatId={chatId}
      />
    </>
  );
};

export default ChatOptions; 