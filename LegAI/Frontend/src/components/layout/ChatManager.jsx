import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ChatOptions from './ChatOptions';

const ChatManager = () => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const location = useLocation();

  // Đóng chat khi thay đổi route
  useEffect(() => {
    setIsOptionsOpen(false);
  }, [location]);

  // Xử lý sự kiện từ Navbar
  useEffect(() => {
    const handleToggleChat = (event) => {
      const { action } = event.detail;
      if (action === 'open') {
        setIsOptionsOpen(true);
      } else if (action === 'close') {
        setIsOptionsOpen(false);
      }
    };

    window.addEventListener('toggleChat', handleToggleChat);
    return () => {
      window.removeEventListener('toggleChat', handleToggleChat);
    };
  }, []);

  const handleClose = () => {
    setIsOptionsOpen(false);
  };

  return (
    <AnimatePresence>
      <ChatOptions isOpen={isOptionsOpen} onClose={handleClose} />
    </AnimatePresence>
  );
};

export default ChatManager;