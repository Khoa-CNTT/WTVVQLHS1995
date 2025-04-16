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
  const [currentChatId, setCurrentChatId] = useState(chatId);
  const messagesEndRef = useRef(null);

  // Kiểm tra phiên chat hiện có và lấy tin nhắn
  useEffect(() => {
    const checkExistingChat = async () => {
      if (isOpen && chatType === 'human') {
        setLoading(true);
        try {
          // Nếu đã có chatId được truyền vào, sử dụng nó
          if (chatId) {
            setCurrentChatId(chatId);
            await fetchMessages(chatId);
          } else {
            // Nếu không có chatId, kiểm tra xem có phiên chat nào đang hoạt động không
            const response = await chatService.getChats();
            const activeChats = response.data.filter(chat => 
              chat.status !== 'closed' && chat.customer_id === authService.getCurrentUser()?.id
            );
            
            if (activeChats.length > 0) {
              // Sử dụng phiên chat đang hoạt động gần nhất
              const mostRecentChat = activeChats[0];
              setCurrentChatId(mostRecentChat.id);
              await fetchMessages(mostRecentChat.id);
            } else if (chatId) {
              // Nếu không có phiên chat đang hoạt động nhưng có chatId
              setCurrentChatId(chatId);
              await fetchMessages(chatId);
            } else {
              // Hiển thị tin nhắn chào mừng mặc định nếu không có phiên chat nào
              const welcomeMessage = {
                type: 'system',
                text: 'Xin chào! Đội ngũ tư vấn của LegAI đang sẵn sàng hỗ trợ bạn.',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };
              setMessages([welcomeMessage]);
            }
          }
        } catch (error) {
          console.error('Lỗi khi kiểm tra phiên chat hiện có:', error);
          // Hiển thị tin nhắn chào mừng mặc định nếu có lỗi
          const welcomeMessage = {
            type: 'system',
            text: 'Xin chào! Đội ngũ tư vấn của LegAI đang sẵn sàng hỗ trợ bạn.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages([welcomeMessage]);
        } finally {
          setLoading(false);
        }
      } else if (isOpen && chatType === 'ai' && messages.length === 0) {
        // Tin nhắn chào mừng cho AI
        const welcomeMessage = {
          type: 'system',
          text: 'Xin chào! Tôi là trợ lý AI của LegAI. Tôi có thể giúp gì cho bạn?',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages([welcomeMessage]);
      }
    };

    if (isOpen) {
      checkExistingChat();
    }
  }, [isOpen, chatType]);

  // Thiết lập polling để cập nhật tin nhắn
  useEffect(() => {
    if (isOpen && chatType === 'human' && currentChatId) {
      // Thiết lập polling để cập nhật tin nhắn
      const interval = setInterval(() => fetchMessages(currentChatId), 5000); // cập nhật mỗi 5 giây
      return () => clearInterval(interval);
    }
  }, [isOpen, chatType, currentChatId]);

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

  // Hàm để lấy tin nhắn từ server
  const fetchMessages = async (chatId) => {
    if (!chatId) return;

    try {
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
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Hiển thị tin nhắn ngay lập tức với thời gian hiện tại
    const newMessage = {
      type: 'user',
      text: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isCurrentUser: true
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    
    try {
      setLoading(true);
      
      if (chatType === 'ai') {
        // Giả lập phản hồi AI sau 1 giây
        setTimeout(() => {
          const aiResponse = {
            type: 'system',
            text: getSimulatedResponse(inputValue, 'ai'),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, aiResponse]);
          setLoading(false);
        }, 1000);
      } else {
        // Gửi tin nhắn đến server nếu là chat với người hỗ trợ
        if (currentChatId) {
          await chatService.sendMessage(currentChatId, inputValue);
          await fetchMessages(currentChatId);
        } else {
          // Nếu chưa có chatId, tạo phiên chat mới
          const response = await chatService.createChat();
          if (response.status === 'success') {
            const newChatId = response.data.id;
            setCurrentChatId(newChatId);
            await chatService.sendMessage(newChatId, inputValue);
            await fetchMessages(newChatId);
          }
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      toast.error('Không thể gửi tin nhắn. Vui lòng thử lại sau.');
      setLoading(false);
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
    if (chatType === 'human' && currentChatId) {
      try {
        await chatService.closeChat(currentChatId);
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
          <i className={chatType === 'ai' ? 'fas fa-robot' : 'fas fa-user'}></i>
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
                {messages.length === 0 && (
                  <p className={styles.systemText}>Xin chào tôi có thể giúp gì cho bạn?</p>
                )}
                {messages.map((message, index) => (
                  <div key={index} className={`${styles.messageItem} ${message.isCurrentUser ? styles.userMessage : styles.systemMessage}`}>
                    <div className={styles.messageAvatar}>
                      <i className={message.isCurrentUser ? 'fas fa-user' : (chatType === 'ai' ? 'fas fa-robot' : 'fas fa-user')}></i>
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