import { useState, useEffect } from 'react';
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
  const [existingChats, setExistingChats] = useState([]);

  useEffect(() => {
    // Kiểm tra xem có phiên chat nào đang hoạt động không khi mở menu
    const checkExistingChats = async () => {
      if (!isOpen) return;
      
      try {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) return;
        
        const response = await chatService.getChats();
        // Lọc ra các phiên chat chưa đóng
        const activeChats = response.data.filter(chat => 
          chat.status !== 'closed' && chat.customer_id === currentUser.id
        );
        
        setExistingChats(activeChats);
      } catch (error) {
        console.error('Lỗi khi kiểm tra phiên chat hiện có:', error);
      }
    };
    
    if (isOpen) {
      checkExistingChats();
    }
  }, [isOpen]);

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
      
      // Nếu chọn chat với người hỗ trợ (luật sư)
      try {
        setLoading(true);
        
        // Kiểm tra người dùng đã đăng nhập chưa
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
          toast.error('Vui lòng đăng nhập để sử dụng tính năng chat');
          setLoading(false);
          return;
        }
        
        // Đóng phiên chat hiện tại trước khi mở phiên mới hoặc phiên có sẵn
        // Điều này sẽ làm sạch tin nhắn cũ
        if (isChatOpen) {
          setIsChatOpen(false);
          await new Promise(resolve => setTimeout(resolve, 100)); // Đợi một chút để component được cập nhật
        }
        
        // Kiểm tra xem có phiên chat đang hoạt động không
        if (existingChats.length > 0) {
          // Sử dụng phiên chat đang hoạt động gần nhất
          const mostRecentChat = existingChats[0];
          setChatId(mostRecentChat.id);
          setIsChatOpen(true);
          onClose();
          setLoading(false);
          return;
        }
        
        // Nếu không có phiên chat đang hoạt động, tạo phiên mới
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