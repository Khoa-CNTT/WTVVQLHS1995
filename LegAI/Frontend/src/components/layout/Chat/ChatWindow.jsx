import { useState, useEffect, useRef } from 'react';
import styles from './ChatWindow.module.css';

// Tạo một mảng chứa các cuộc trò chuyện
const ChatWindow = ({ isOpen, onClose, chatType, id = 'default', position = 0 }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  // Thêm tin nhắn chào mừng khi mở chat
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        type: 'system',
        text: chatType === 'ai' 
          ? 'Xin chào! Tôi là trợ lý AI của LegAI. Tôi có thể giúp gì cho bạn?' 
          : 'Xin chào! Đội ngũ tư vấn của LegAI đang sẵn sàng hỗ trợ bạn.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, chatType, messages.length]);

  // Lắng nghe sự kiện toggleChat từ Navbar
  useEffect(() => {
    const handleToggleChat = (event) => {
      if (id === 'default') {
        const { isOpen } = event.detail;
        if (isOpen) {
          setIsMinimized(false);
        }
      }
    };

    window.addEventListener('toggleChat', handleToggleChat);
    return () => {
      window.removeEventListener('toggleChat', handleToggleChat);
    };
  }, [id]);

  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (messagesEndRef.current && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() === '') return;

    // Thêm tin nhắn của người dùng
    const userMessage = {
      type: 'user',
      text: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, userMessage]);
    setInputValue('');

    // Giả lập phản hồi sau 1 giây
    setTimeout(() => {
      const responseMessage = {
        type: 'system',
        text: getSimulatedResponse(inputValue, chatType),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, responseMessage]);
    }, 1000);
  };

  const getSimulatedResponse = (message, type) => {
    // Giả lập phản hồi dựa trên tin nhắn của người dùng và loại chat
    if (type === 'ai') {
      if (message.toLowerCase().includes('xin chào') || message.toLowerCase().includes('hello')) {
        return 'Xin chào! Tôi có thể giúp gì cho bạn về các vấn đề pháp lý?';
      } else if (message.toLowerCase().includes('luật') || message.toLowerCase().includes('pháp luật')) {
        return 'Đây là một vấn đề pháp lý quan trọng. Bạn có thể cung cấp thêm thông tin chi tiết để tôi hỗ trợ hiệu quả hơn?';
      } else {
        return 'Cảm ơn thông tin của bạn. Đội ngũ luật sư của chúng tôi có thể hỗ trợ bạn trong vấn đề này. Bạn muốn tư vấn trực tiếp không?';
      }
    } else { // human support
      return 'Cảm ơn bạn đã liên hệ. Chúng tôi đã ghi nhận yêu cầu và sẽ phản hồi trong thời gian sớm nhất. Bạn có thể để lại số điện thoại để chúng tôi liên hệ trực tiếp.';
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleMaximize = () => {
    setIsMinimized(false);
  };

  // Tính toán vị trí cho cửa sổ chat thu nhỏ
  const miniButtonStyle = {
    bottom: `${30 + (position * 70)}px` // Mỗi nút cách nhau 70px
  };

  return (
    <>
      {/* Button chat mini luôn hiển thị khi cửa sổ chat bị thu nhỏ */}
      {isMinimized && (
        <div 
          className={styles.chatMiniButton} 
          onClick={handleMaximize}
          style={miniButtonStyle}
        >
          <i className={chatType === 'ai' ? 'fas fa-robot' : 'fas fa-user-headset'}></i>
          <span className={styles.miniButtonBadge}>{messages.length > 0 ? messages.length : ''}</span>
        </div>
      )}

      {/* Cửa sổ chat chỉ hiển thị khi được mở và không bị thu nhỏ */}
      {isOpen && !isMinimized && (
        <div className={`${styles.chatWindowContainer} ${styles.open}`}>
          <div className={styles.chatWindowHeader}>
            <div className={styles.chatInfo}>
              <div className={styles.chatTypeIcon}>
                <i className={chatType === 'ai' ? 'fas fa-robot' : 'fas fa-user-headset'}></i>
              </div>
              <div className={styles.chatTypeInfo}>
                <h3>{chatType === 'ai' ? 'Chat với AI' : 'Chat với người hỗ trợ'}</h3>
                <div className={styles.statusBadge}>
                  <span className={styles.statusDot}></span>
                  <span>Trực tuyến</span>
                </div>
              </div>
            </div>
            <div className={styles.chatControls}>
              <button className={styles.minimizeButton} onClick={handleMinimize} aria-label="Thu nhỏ">
                <i className="fas fa-minus"></i>
              </button>
              <button className={styles.closeButton} onClick={onClose} aria-label="Đóng">
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
            
          <div className={styles.chatWindowBody}>
            <div className={styles.messagesContainer}>
              {messages.map((message, index) => (
                <div key={index} className={`${styles.messageItem} ${message.type === 'user' ? styles.userMessage : styles.systemMessage}`}>
                  <div className={styles.messageAvatar}>
                    <i className={message.type === 'user' ? 'fas fa-user' : (chatType === 'ai' ? 'fas fa-robot' : 'fas fa-user-tie')}></i>
                  </div>
                  <div className={styles.messageContent}>
                    <p className={styles.messageText}>{message.text}</p>
                    <div className={styles.messageTime}>{message.time}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
              
          <div className={styles.chatWindowFooter}>
            <form onSubmit={handleSubmit} className={styles.chatForm}>
              <input
                type="text"
                className={styles.chatInput}
                placeholder="Nhập tin nhắn..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button type="submit" className={styles.sendButton}>
                <i className="fas fa-paper-plane"></i>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWindow; 