import { useState, useEffect, useRef } from 'react';
import styles from './ChatWindow.module.css';
import chatService from '../../../services/chatService';
import { toast } from 'react-toastify';
import authService from '../../../services/authService';

// Component Window Chat
const ChatWindow = ({ isOpen, onClose, chatType, chatId = null, id = 'default', position = 0 }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Thêm tin nhắn chào mừng khi mở chat
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      if (chatType === 'ai') {
        // Tin nhắn chào mừng cho AI
        const welcomeMessage = {
          type: 'system',
          text: 'Xin chào! Tôi là trợ lý AI của LegAI. Tôi có thể giúp gì cho bạn?',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages([welcomeMessage]);
      } else if (chatId) {
        // Đối với chat với luật sư, lấy tin nhắn từ server
        fetchMessages();
      } else {
        // Nếu không có chatId (trường hợp không thể kết nối server)
      const welcomeMessage = {
        type: 'system',
          text: 'Xin chào! Đội ngũ tư vấn của LegAI đang sẵn sàng hỗ trợ bạn.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([welcomeMessage]);
    }
    }
  }, [isOpen, chatType, chatId, messages.length]);

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

  // Lấy tin nhắn từ server nếu là chat với luật sư
  useEffect(() => {
    if (chatType === 'human' && chatId && isOpen) {
      // Thiết lập polling để cập nhật tin nhắn
      const interval = setInterval(fetchMessages, 5000); // cập nhật mỗi 5 giây
      return () => clearInterval(interval);
    }
  }, [chatType, chatId, isOpen]);

  // Hàm để lấy tin nhắn từ server
  const fetchMessages = async () => {
    if (!chatId) return;
    
    try {
      setLoading(true);
      const response = await chatService.getMessages(chatId);
      
      if (response.status === 'success') {
        // Chuyển đổi dữ liệu từ API sang định dạng tin nhắn cho component
        const currentUser = authService.getCurrentUser();
        const formattedMessages = response.data.map(msg => {
          const isCurrentUser = msg.sender_id === currentUser?.id;
          return {
            id: msg.id,
            type: isCurrentUser ? 'user' : 'system',
            text: msg.message,
            time: chatService.formatChatTime(msg.created_at),
            sender_name: msg.sender_name,
            sender_role: msg.sender_role,
            sender_id: msg.sender_id,
            isCurrentUser: isCurrentUser
          };
        });
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Lỗi khi lấy tin nhắn:', error);
      // Không hiển thị toast để tránh làm phiền người dùng
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputValue.trim() === '') return;

    // Thêm tin nhắn của người dùng
    const userMessage = {
      type: 'user',
      text: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, userMessage]);
    const messageSent = inputValue; // Lưu lại tin nhắn đã gửi
    setInputValue('');

    if (chatType === 'ai') {
      // Giả lập phản hồi AI sau 1 giây
    setTimeout(() => {
      const responseMessage = {
        type: 'system',
          text: getSimulatedResponse(messageSent, chatType),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, responseMessage]);
    }, 1000);
    } else if (chatType === 'human' && chatId) {
      // Gửi tin nhắn đến server nếu là chat với luật sư
      try {
        setLoading(true);
        console.log('Đang gửi tin nhắn:', messageSent, 'tới chat ID:', chatId);
        
        const response = await chatService.sendMessage(chatId, messageSent);
        console.log('Phản hồi khi gửi tin nhắn:', response);
        
        // Sau khi gửi thành công, cập nhật lại danh sách tin nhắn
        await fetchMessages();
      } catch (error) {
        console.error('Lỗi khi gửi tin nhắn:', error);
        if (error.response) {
          console.error('Chi tiết lỗi:', error.response.status, error.response.data);
        }
        toast.error('Không thể gửi tin nhắn. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    }
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

  const handleEndChat = async () => {
    if (chatType === 'human' && chatId) {
      try {
        await chatService.closeChat(chatId);
        toast.success('Đã kết thúc phiên chat');
      } catch (error) {
        console.error('Lỗi khi kết thúc phiên chat:', error);
        toast.error('Không thể kết thúc phiên chat. Vui lòng thử lại sau.');
      }
    }
    
    onClose();
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
                <i className={chatType === 'ai' ? 'fas fa-robot' : 'fas fa-user'}></i>
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
              <button className={styles.closeButton} onClick={handleEndChat} aria-label="Đóng">
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
            
          <div className={styles.chatWindowBody}>
            {loading && messages.length === 0 ? (
              <div className={styles.loadingMessages}>
                <i className="fas fa-spinner fa-spin"></i>
                <p>Đang tải tin nhắn...</p>
              </div>
            ) : (
            <div className={styles.messagesContainer}>
              {messages.map((message, index) => (
                  <div key={index} className={`${styles.messageItem} ${message.isCurrentUser ? styles.userMessage : styles.systemMessage}`}>
                  <div className={styles.messageAvatar}>
                      <i className={message.isCurrentUser ? 'fas fa-user' : (chatType === 'ai' ? 'fas fa-robot' : 'fas fa-user-tie')}></i>
                  </div>
                  <div className={styles.messageContent}>
                      {!message.isCurrentUser && (
                        <div className={styles.senderName}>{message.sender_name}</div>
                      )}
                    <p className={styles.messageText}>{message.text}</p>
                    <div className={styles.messageTime}>{message.time}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            )}
          </div>
              
          <div className={styles.chatWindowFooter}>
            <form className={styles.chatForm} onSubmit={handleSubmit}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className={styles.chatInput}
                disabled={loading}
              />
              <button 
                type="submit" 
                className={styles.sendButton}
                disabled={!inputValue.trim() || loading}
              >
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWindow; 