import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ChatWindow from './ChatWindow';
import styles from './ChatManager.module.css';

const ChatManager = () => {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isHumanChatOpen, setIsHumanChatOpen] = useState(false);
  const [chatId, setChatId] = useState(null);
  const location = useLocation();

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
    setIsAIChatOpen(true);
    setIsHumanChatOpen(false);
  };

  const handleOpenHumanChat = () => {
    setIsHumanChatOpen(true);
    setIsAIChatOpen(false);
  };

  return (
    <>
      {/* Hiển thị 2 nút chat riêng biệt */}
      {isButtonsVisible && !isAIChatOpen && !isHumanChatOpen && (
        <div className={styles.chatButtonsContainer}>
          <button 
            className={`${styles.chatButton} ${styles.aiButton}`}
            onClick={handleOpenAIChat}
            title="Chat với AI"
          >
            <i className="fas fa-robot"></i>
          </button>
          <button 
            className={`${styles.chatButton} ${styles.humanButton}`}
            onClick={handleOpenHumanChat}
            title="Chat với người hỗ trợ"
          >
            <i className="fas fa-user"></i>
          </button>
        </div>
      )}
      
      {/* Cửa sổ chat AI */}
      <AnimatePresence>
        <ChatWindow 
          isOpen={isAIChatOpen} 
          onClose={handleCloseAIChat} 
          chatType="ai" 
          id="ai-chat" 
          position={0}
        />
      </AnimatePresence>
      
      {/* Cửa sổ chat với người hỗ trợ */}
      <AnimatePresence>
        <ChatWindow 
          isOpen={isHumanChatOpen} 
          onClose={handleCloseHumanChat} 
          chatType="human" 
          chatId={chatId}
          id="human-chat"
          position={1}
        />
      </AnimatePresence>
    </>
  );
};

export default ChatManager;