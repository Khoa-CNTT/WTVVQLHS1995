import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import ChatWindow from './ChatWindow';
import styles from './ChatManager.module.css';

const ChatManager = () => {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isHumanChatOpen, setIsHumanChatOpen] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();

  // Kiểm tra trạng thái đăng nhập
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    };

    // Kiểm tra khi component được mount
    checkLoginStatus();

    // Kiểm tra thường xuyên để bắt trạng thái đăng nhập
    const loginCheckInterval = setInterval(checkLoginStatus, 1000);

    // Thiết lập event listener để cập nhật khi trạng thái đăng nhập thay đổi
    window.addEventListener('storage', checkLoginStatus);

    // Lắng nghe sự kiện đăng nhập tùy chỉnh
    const handleLoginEvent = () => {
      checkLoginStatus();
    };
    
    window.addEventListener('login', handleLoginEvent);
    window.addEventListener('logout', handleLoginEvent);
    window.addEventListener('loginStatusChanged', handleLoginEvent);

    return () => {
      clearInterval(loginCheckInterval);
      window.removeEventListener('storage', checkLoginStatus);
      window.removeEventListener('login', handleLoginEvent);
      window.removeEventListener('logout', handleLoginEvent);
      window.removeEventListener('loginStatusChanged', handleLoginEvent);
    };
  }, []);

  // Đóng chat khi thay đổi route
  useEffect(() => {
    setIsAIChatOpen(false);
    setIsHumanChatOpen(false);
  }, [location]);

  // Xử lý sự kiện từ Navbar
  useEffect(() => {
    const handleToggleChat = (event) => {
      const { action, chatType } = event.detail;
      
      if (action === 'open') {
        if (chatType === 'ai') {
          setIsAIChatOpen(true);
          setIsHumanChatOpen(false);
        } else if (chatType === 'human') {
          setIsHumanChatOpen(true);
          setIsAIChatOpen(false);
        } else {
          // Nếu không chỉ định loại, mở cả hai nút chat
          setIsAIChatOpen(false);
          setIsHumanChatOpen(false);
          setIsButtonsVisible(true);
        }
      } else if (action === 'close') {
        setIsAIChatOpen(false);
        setIsHumanChatOpen(false);
      }
    };

    window.addEventListener('toggleChat', handleToggleChat);
    return () => {
      window.removeEventListener('toggleChat', handleToggleChat);
    };
  }, []);

  const [isButtonsVisible, setIsButtonsVisible] = useState(true);

  const handleCloseAIChat = () => {
    setIsAIChatOpen(false);
  };

  const handleCloseHumanChat = () => {
    setIsHumanChatOpen(false);
    setChatId(null); // Reset chat ID khi đóng chat
  };

  const handleOpenAIChat = () => {
    // Kiểm tra lại trạng thái đăng nhập trước khi mở chat
    const isUserLoggedIn = !!localStorage.getItem('token');
    
    if (!isUserLoggedIn) {
      toast.error('Vui lòng đăng nhập để sử dụng tính năng chat');
      return;
    }
    
    setIsAIChatOpen(true);
    setIsHumanChatOpen(false);
  };

  const handleOpenHumanChat = () => {
    // Kiểm tra lại trạng thái đăng nhập trước khi mở chat
    const isUserLoggedIn = !!localStorage.getItem('token');
    
    if (!isUserLoggedIn) {
      toast.error('Vui lòng đăng nhập để sử dụng tính năng chat');
      return;
    }
    
    setIsHumanChatOpen(true);
    setIsAIChatOpen(false);
  };

  return (
    <>
      {/* Hiển thị 2 nút chat riêng biệt */}
      {isButtonsVisible && !isAIChatOpen && !isHumanChatOpen && (
        <div className={styles.chatButtonsContainer}>
          <button 
            className={`${styles.chatButton} ${styles.aiButton} ${!isLoggedIn ? styles.disabledButton : ''}`}
            onClick={handleOpenAIChat}
            title={isLoggedIn ? "Chat với AI" : "Đăng nhập để chat với AI"}
          >
            <i className="fas fa-robot"></i>
          </button>
          
          <button 
            className={`${styles.chatButton} ${styles.humanButton} ${!isLoggedIn ? styles.disabledButton : ''}`}
            onClick={handleOpenHumanChat}
            title={isLoggedIn ? "Chat với người hỗ trợ" : "Đăng nhập để chat với tư vấn viên"}
          >
            <i className="fas fa-user"></i>
          </button>
        </div>
      )}
      
      {/* Cửa sổ chat AI */}
      <AnimatePresence>
        {isAIChatOpen && (
          <ChatWindow 
            isOpen={isAIChatOpen} 
            onClose={handleCloseAIChat} 
            chatType="ai" 
            id="ai-chat" 
            position={0}
          />
        )}
      </AnimatePresence>
      
      {/* Cửa sổ chat với người hỗ trợ */}
      <AnimatePresence>
        {isHumanChatOpen && (
          <ChatWindow 
            isOpen={isHumanChatOpen} 
            onClose={handleCloseHumanChat} 
            chatType="human" 
            chatId={chatId}
            id="human-chat"
            position={1}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatManager;