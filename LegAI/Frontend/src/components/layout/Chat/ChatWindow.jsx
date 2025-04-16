import { useState, useEffect, useRef } from 'react';
import styles from './ChatWindow.module.css';
import chatService from '../../../services/chatService';
import aiService from '../../../services/aiService';
import { toast } from 'react-toastify';
import authService from '../../../services/authService';
import AIPrompt from './AIPrompt';

// Component Window Chat
const ChatWindow = ({ isOpen, onClose, chatType, chatId = null, id = 'default', position = 0 }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(chatId);
  const [aiChatHistory, setAiChatHistory] = useState([]);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const messagesEndRef = useRef(null);
  const chatSessionKey = `ai_chat_${id}`;
  const [isTyping, setIsTyping] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSlideMenuOpen, setIsSlideMenuOpen] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [fullText, setFullText] = useState('');
  const [typingIndex, setTypingIndex] = useState(0);
  const typingSpeed = 20; // Tốc độ hiển thị từng ký tự (ms)
  const [fontSize, setFontSize] = useState('medium'); // small, medium, large
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const messagesContainerRef = useRef(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  // Khôi phục lịch sử trò chuyện AI từ localStorage nếu có
  useEffect(() => {
    if (chatType === 'ai' && isOpen) {
      try {
        const savedChat = localStorage.getItem(chatSessionKey);
        if (savedChat) {
          const { messages: savedMessages, history: savedHistory } = JSON.parse(savedChat);
          if (savedMessages && savedMessages.length > 0 && savedHistory && savedHistory.length > 0) {
            setMessages(savedMessages);
            setAiChatHistory(savedHistory);
            // Không hiển thị prompt nếu đã có lịch sử trò chuyện
            setShowAIPrompt(false);
            return;
          }
        }
      } catch (error) {
        console.error('Lỗi khi khôi phục lịch sử chat:', error);
      }
    }
  }, [chatType, isOpen, chatSessionKey]);
  
  // Lưu lịch sử trò chuyện AI vào localStorage
  useEffect(() => {
    if (chatType === 'ai' && messages.length > 0 && aiChatHistory.length > 0) {
      try {
        localStorage.setItem(chatSessionKey, JSON.stringify({
          messages: messages,
          history: aiChatHistory
        }));
      } catch (error) {
        console.error('Lỗi khi lưu lịch sử chat:', error);
      }
    }
  }, [messages, aiChatHistory, chatType, chatSessionKey]);

  // Thêm useEffect mới để theo dõi sự thay đổi của chatId
  useEffect(() => {
    // Khi chatId thay đổi, đặt lại state tin nhắn và gọi lại API lấy tin nhắn
    if (chatType === 'human' && chatId) {
      // Đặt lại các state liên quan đến tin nhắn
      setMessages([]);
      setLoading(true);
      
      // Cập nhật chatId hiện tại
      setCurrentChatId(chatId);
      
      // Lấy tin nhắn mới cho chatId mới
      fetchMessages(chatId, true)
        .finally(() => {
          setLoading(false);
        });
    }
  }, [chatId, chatType]);

  // Kiểm tra phiên chat hiện có và lấy tin nhắn
  useEffect(() => {
    const checkExistingChat = async () => {
      // Kiểm tra xem đã có lịch sử chat AI được khôi phục chưa
      if (chatType === 'ai' && messages.length > 0) {
        return; // Nếu đã có, không cần khởi tạo lại
      }
      
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
          text: 'Xin chào! Tôi là trợ lý AI pháp lý của LegAI. Tôi có thể giúp trả lời các câu hỏi cơ bản về pháp luật hoặc hướng dẫn bạn đến các dịch vụ tư vấn chuyên sâu. Bạn cần hỗ trợ gì?',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages([welcomeMessage]);
        
        // Khởi tạo lịch sử chat AI với tin nhắn chào mừng
        setAiChatHistory([
          { 
            role: "model", 
            parts: [{ 
              text: 'Xin chào! Tôi là trợ lý AI pháp lý của LegAI. Tôi có thể giúp trả lời các câu hỏi cơ bản về pháp luật hoặc hướng dẫn bạn đến các dịch vụ tư vấn chuyên sâu. Bạn cần hỗ trợ gì?' 
            }] 
          }
        ]);
        
        // Hiển thị hướng dẫn sử dụng AI
        setShowAIPrompt(true);
      }
    };

    if (isOpen) {
      checkExistingChat();
    }
  }, [isOpen, chatType, messages.length]);

  // Thiết lập polling để cập nhật tin nhắn
  useEffect(() => {
    if (isOpen && chatType === 'human' && currentChatId) {
      // Tăng thời gian polling lên 15s
      const interval = setInterval(() => fetchMessages(currentChatId), 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen, chatType, currentChatId, messages.length]);

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

  // Xử lý sự kiện scroll
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isScrolledNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    // Hiển thị nút cuộn xuống khi không ở cuối
    setCanScrollDown(!isScrolledNearBottom);
    
    // Chỉ tự động cuộn khi người dùng đã cuộn gần đến cuối
    setShouldAutoScroll(isScrolledNearBottom);
  };

  // Thêm hàm để xử lý scroll xuống
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShouldAutoScroll(true);
  };

  // Thay đổi cách xử lý cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized, typingText, shouldAutoScroll]);

  // Hiệu ứng typing text
  useEffect(() => {
    if (!fullText || typingIndex >= fullText.length) {
      if (typingIndex >= fullText.length && isTyping) {
        setIsTyping(false);
      }
      return;
    }
    
    const timer = setTimeout(() => {
      setTypingText(prev => prev + fullText.charAt(typingIndex));
      setTypingIndex(prev => prev + 1);
    }, typingSpeed);
    
    return () => clearTimeout(timer);
  }, [fullText, typingIndex, typingSpeed, isTyping]);

  // Thêm hiệu ứng typing trước khi hiển thị tin nhắn AI
  const simulateTyping = (text) => {
    // Reset typing states
    setIsTyping(true);
    setTypingText('');
    setFullText(text);
    setTypingIndex(0);
    
    return new Promise((resolve) => {
      // Tạo timer để tự động kết thúc typing sau một khoảng thời gian nhất định
      const maxTypingTime = text.length * typingSpeed + 500; // Thời gian tối đa, tính bằng chiều dài text * tốc độ + 500ms
      
      const typingTimeout = setTimeout(() => {
        setIsTyping(false);
        setTypingText(text); // Hiển thị toàn bộ text nếu typing không hoàn thành đúng cách
        resolve();
      }, maxTypingTime);
      
      // Giám sát việc typing kết thúc thông qua useEffect
      const checkTypingInterval = setInterval(() => {
        if (!isTyping || typingIndex >= text.length) {
          clearInterval(checkTypingInterval);
          clearTimeout(typingTimeout);
          setIsTyping(false);
          resolve();
        }
      }, 100);
    });
  };

  // Xử lý sự kiện khi AI đã hoàn tất typing
  useEffect(() => {
    if (fullText && typingIndex >= fullText.length) {
      setIsTyping(false);
    }
  }, [fullText, typingIndex]);

  // Xử lý hiển thị thông báo lỗi
  const showError = (message) => {
    setErrorMessage(message);
    setTimeout(() => {
      setErrorMessage(null);
    }, 5000); // Tự động ẩn sau 5 giây
  };

  // Xử lý hiển thị menu slide
  const toggleSlideMenu = () => {
    setIsSlideMenuOpen(!isSlideMenuOpen);
  };

  // Sửa lại hàm fetchMessages để giảm số lần reload và trạng thái loading
  const fetchMessages = async (chatId, forceLoading = false) => {
    if (!chatId) return;

    try {
      // Chỉ hiển thị loading indicator khi yêu cầu
      if (forceLoading) {
        setLoading(true);
      }
      
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

        // Kiểm tra xem có tin nhắn mới không
        const hasNewMessages = formattedMessages.length > messages.length || 
          (formattedMessages.length > 0 && messages.length > 0 && 
          formattedMessages[formattedMessages.length - 1].id !== messages[messages.length - 1].id);

        // Chỉ cập nhật nếu có tin nhắn mới
        if (hasNewMessages) {
          setMessages(formattedMessages);
          
          // Đặt lại auto-scroll khi có tin nhắn mới
          setShouldAutoScroll(true);
        }
        
        // Tắt loading
        setLoading(false);
      }
    } catch (error) {
      console.error('Lỗi khi lấy tin nhắn:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Hiển thị tin nhắn người dùng ngay lập tức với thời gian hiện tại
    const userMessage = {
      type: 'user',
      text: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isCurrentUser: true
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    
    // Đặt lại auto-scroll khi gửi tin nhắn mới
    setShouldAutoScroll(true);
    
    try {
      setLoading(true);
      
      if (chatType === 'ai') {
        // Scroll xuống để hiển thị hiệu ứng typing
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        
        // Cập nhật lịch sử chat AI
        const updatedHistory = [...aiChatHistory];
        updatedHistory.push({ role: "user", parts: [{ text: currentInput }] });
        setAiChatHistory(updatedHistory);
        
        // Gọi API Gemini
        const aiResponseText = await aiService.sendMessageToAI(currentInput, updatedHistory);
        
        // Cập nhật lịch sử chat với phản hồi của AI
        updatedHistory.push({ role: "model", parts: [{ text: aiResponseText }] });
        setAiChatHistory(updatedHistory);
        
        // Hiển thị hiệu ứng typing trước khi hiển thị tin nhắn
        await simulateTyping(aiResponseText);
        
        // Hiển thị phản hồi từ AI sau khi hoàn tất hiệu ứng typing
        const aiResponseMsg = {
          type: 'system',
          text: aiResponseText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setMessages(prev => [...prev, aiResponseMsg]);
        setLoading(false);
      } else {
        // Gửi tin nhắn đến server nếu là chat với người hỗ trợ
        if (currentChatId) {
          await chatService.sendMessage(currentChatId, currentInput);
          await fetchMessages(currentChatId, true); // Force loading khi người dùng gửi tin
        } else {
          // Nếu chưa có chatId, tạo phiên chat mới
          const response = await chatService.createChat();
          if (response.status === 'success') {
            const newChatId = response.data.id;
            setCurrentChatId(newChatId);
            await chatService.sendMessage(newChatId, currentInput);
            await fetchMessages(newChatId, true);
          }
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      showError('Không thể gửi tin nhắn. Vui lòng thử lại sau.');
      toast.error('Không thể gửi tin nhắn. Vui lòng thử lại sau.');
      setLoading(false);
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
    } else if (chatType === 'ai') {
      // Xóa lịch sử chat AI khi đóng chat
      try {
        localStorage.removeItem(chatSessionKey);
      } catch (error) {
        console.error('Lỗi khi xóa lịch sử chat:', error);
      }
    }

    onClose();
  };

  // Tính toán vị trí cho cửa sổ chat thu nhỏ
  const miniButtonStyle = {
    bottom: `${30 + (position * 70)}px` // Mỗi nút cách nhau 70px
  };

  // Hàm tải xuống lịch sử trò chuyện
  const handleDownloadHistory = () => {
    if (messages.length === 0) {
      toast.info('Không có tin nhắn để tải xuống');
      return;
    }
    
    // Định dạng lại nội dung trò chuyện
    const chatTitle = chatType === 'ai' ? 'Trò chuyện với AI LegAI' : 'Trò chuyện với tư vấn viên';
    const timestamp = new Date().toLocaleString('vi-VN');
    
    let content = `${chatTitle}\nNgày tải xuống: ${timestamp}\n\n`;
    
    messages.forEach(msg => {
      const sender = msg.isCurrentUser ? 'Bạn' : (chatType === 'ai' ? 'AI LegAI' : (msg.sender_name || 'Tư vấn viên'));
      content += `${sender} (${msg.time}):\n${msg.text}\n\n`;
    });
    
    // Tạo file và tải xuống
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legai-chat-history-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toggleSlideMenu();
    toast.success('Đã tải xuống lịch sử trò chuyện');
  };

  // Hàm thay đổi kích thước chữ
  const handleFontSizeChange = (size) => {
    setFontSize(size);
    toggleSlideMenu();
    toast.success(`Đã thay đổi kích thước chữ thành ${size === 'small' ? 'nhỏ' : size === 'medium' ? 'vừa' : 'lớn'}`);
  };

  // Thêm style vào container để áp dụng kích thước chữ
  const containerStyle = {
    fontSize: fontSize === 'small' ? '0.85rem' : fontSize === 'large' ? '1.1rem' : '0.95rem'
  };

  // Xử lý xóa lịch sử trò chuyện
  const handleClearHistory = () => {
    if (chatType === 'ai') {
      // Xóa lịch sử từ localStorage
      localStorage.removeItem(chatSessionKey);
      
      // Reset các state liên quan
      setMessages([]);
      setAiChatHistory([]);
      
      // Thêm tin nhắn chào mừng mới
      const welcomeMessage = {
        type: 'system',
        text: 'Xin chào! Tôi là trợ lý AI pháp lý của LegAI. Tôi có thể giúp trả lời các câu hỏi cơ bản về pháp luật hoặc hướng dẫn bạn đến các dịch vụ tư vấn chuyên sâu. Bạn cần hỗ trợ gì?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages([welcomeMessage]);
      setAiChatHistory([
        { 
          role: "model", 
          parts: [{ 
            text: welcomeMessage.text
          }] 
        }
      ]);
      
      // Đóng menu slide
      toggleSlideMenu();
      toast.success('Đã xóa lịch sử trò chuyện');
    } else if (chatType === 'human' && currentChatId) {
      // Thực hiện xóa phía backend nếu cần
      // Tạm thời chỉ xóa phía frontend
      setMessages([]);
      toggleSlideMenu();
      toast.success('Đã xóa lịch sử trò chuyện');
    }
  };

  // Vô hiệu hóa input khi loading hoặc typing
  const isInputDisabled = () => {
    // Chỉ vô hiệu khi đang loading, KHÔNG vô hiệu khi đang typing
    return loading;
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

      {/* AI Prompt hướng dẫn */}
      <AIPrompt 
        isVisible={showAIPrompt} 
        onClose={() => setShowAIPrompt(false)} 
      />

      {/* Cửa sổ chat chỉ hiển thị khi được mở và không bị thu nhỏ */}
      {isOpen && !isMinimized && (
        <div 
          className={`${styles.chatWindowContainer} ${styles.open} ${chatType === 'ai' ? styles.aiChatWindow : ''}`}
          style={containerStyle}
        >
          <div className={`${styles.chatWindowHeader} ${chatType === 'ai' ? styles.aiHeader : ''}`}>
            <div className={styles.chatInfo}>
              <div className={styles.chatTypeIcon}>
                <i className={chatType === 'ai' ? 'fas fa-robot' : 'fas fa-user'}></i>
              </div>
              <div className={styles.chatTypeInfo}>
                <h3>{chatType === 'ai' ? 'Trợ lý AI' : 'Tư vấn viên'}</h3>
                <div className={styles.statusBadge}>
                  <span className={styles.statusDot}></span>
                  <span>{chatType === 'ai' ? 'AI Tư vấn pháp lý' : 'Trực tuyến'}</span>
                </div>
              </div>
            </div>
            <div className={styles.chatControls}>
              {chatType === 'ai' && (
                <button 
                  className={`${styles.helpButton} ${chatType === 'ai' ? styles.aiButton : ''}`} 
                  onClick={() => setShowAIPrompt(true)} 
                  title="Hướng dẫn"
                  aria-label="Hướng dẫn"
                >
                  <i className="fas fa-question-circle"></i>
                </button>
              )}
              <button 
                className={`${styles.menuButton} ${chatType === 'ai' ? styles.aiButton : ''}`} 
                onClick={toggleSlideMenu} 
                title="Menu"
                aria-label="Menu"
              >
                <i className="fas fa-ellipsis-v"></i>
              </button>
              <button 
                className={`${styles.minimizeButton} ${chatType === 'ai' ? styles.aiButton : ''}`} 
                onClick={handleMinimize} 
                aria-label="Thu nhỏ"
              >
                <i className="fas fa-minus"></i>
              </button>
              <button 
                className={`${styles.closeButton} ${chatType === 'ai' ? styles.aiButton : ''}`} 
                onClick={handleEndChat} 
                aria-label="Đóng"
              >
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
              <div 
                className={styles.messagesContainer}
                ref={messagesContainerRef}
                onScroll={handleScroll}
              >
                {messages.length === 0 && (
                  <p className={styles.systemText}>Xin chào tôi có thể giúp gì cho bạn?</p>
                )}
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`${styles.messageItem} ${
                      message.isCurrentUser 
                        ? styles.userMessage 
                        : `${styles.systemMessage} ${chatType === 'ai' ? styles.aiMessage : ''}`
                    }`}
                  >
                    <div className={styles.messageAvatar}>
                      <i className={
                        message.isCurrentUser 
                          ? 'fas fa-user' 
                          : (chatType === 'ai' ? 'fas fa-robot' : 'fas fa-user')
                      }></i>
                    </div>
                    <div className={styles.messageContent}>
                      {!message.isCurrentUser && (
                        <div className={styles.senderName}>
                          {chatType === 'ai' ? (
                            <>
                              <span>AI LegAI</span>
                            </>
                          ) : (
                            message.sender_name || 'Tư vấn viên'
                          )}
                        </div>
                      )}
                      <p className={styles.messageText}>
                        {/* Xử lý hiển thị tin nhắn có thể chứa xuống dòng */}
                        {message.text.split('\n').map((line, i) => (
                          <span key={i}>
                            {line}
                            {i < message.text.split('\n').length - 1 && <br />}
                          </span>
                        ))}
                      </p>
                      <div className={styles.messageTime}>{message.time}</div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className={`${styles.messageItem} ${styles.systemMessage} ${chatType === 'ai' ? styles.aiMessage : ''}`}>
                    <div className={styles.messageAvatar}>
                      <i className={chatType === 'ai' ? 'fas fa-robot' : 'fas fa-user-tie'}></i>
                    </div>
                    <div className={styles.botTyping}>
                      <div className={styles.typingIndicator}>
                        <div className={styles.typingDot}></div>
                        <div className={styles.typingDot}></div>
                        <div className={styles.typingDot}></div>
                      </div>
                    </div>
                  </div>
                )}
                {isTyping && (
                  <div className={`${styles.messageItem} ${styles.systemMessage} ${chatType === 'ai' ? styles.aiMessage : ''}`}>
                    <div className={styles.messageAvatar}>
                      <i className={chatType === 'ai' ? 'fas fa-robot' : 'fas fa-user-tie'}></i>
                    </div>
                    <div className={styles.messageContent}>
                      {chatType === 'ai' && (
                        <div className={styles.senderName}>
                          <span>AI LegAI</span>
                        </div>
                      )}
                      <p className={styles.messageText}>
                        {typingText}
                        <span className={styles.blinkingCursor}>|</span>
                      </p>
                      <div className={styles.messageTime}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
                
                {canScrollDown && (
                  <div className={styles.scrollIndicator} onClick={scrollToBottom}>
                    <i className="fas fa-chevron-down"></i>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.chatWindowFooter}>
            <form className={styles.chatForm} onSubmit={handleSubmit}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={chatType === 'ai' ? 'Hỏi AI về vấn đề pháp lý...' : 'Nhập tin nhắn...'}
                className={styles.chatInput}
                disabled={isInputDisabled()}
              />
              <button
                type="submit"
                className={styles.sendButton}
                disabled={!inputValue.trim() || loading} // Chỉ vô hiệu khi không có text hoặc đang loading
              >
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Hiển thị thông báo lỗi */}
      {errorMessage && (
        <div className={styles.errorMessage}>
          <i className={`fas fa-exclamation-triangle ${styles.errorIcon}`}></i>
          {errorMessage}
          <button className={styles.errorCloseButton} onClick={() => setErrorMessage(null)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
      
      {/* Slide Menu */}
      <div className={`${styles.slideMenu} ${isSlideMenuOpen ? styles.slideMenuOpen : ''}`}>
        <div className={styles.slideMenuHeader}>
          <h3>Tùy chọn cuộc trò chuyện</h3>
          <button onClick={toggleSlideMenu} className={styles.closeButton}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className={styles.slideMenuContent}>
          <div className={styles.slideMenuItem} onClick={handleClearHistory}>
            <i className="fas fa-trash"></i>
            <span>Xóa cuộc trò chuyện</span>
          </div>
          
          <div className={styles.slideMenuItem} onClick={handleDownloadHistory}>
            <i className="fas fa-download"></i>
            <span>Tải xuống lịch sử</span>
          </div>
          
          <div className={styles.slideMenuNestedItem}>
            <div className={styles.slideMenuHeader}>
              <i className="fas fa-font"></i>
              <span>Kích thước chữ</span>
            </div>
            <div className={styles.fontSizeOptions}>
              <button 
                className={`${styles.fontSizeButton} ${fontSize === 'small' ? styles.active : ''}`} 
                onClick={() => handleFontSizeChange('small')}
              >
                Nhỏ
              </button>
              <button 
                className={`${styles.fontSizeButton} ${fontSize === 'medium' ? styles.active : ''}`} 
                onClick={() => handleFontSizeChange('medium')}
              >
                Vừa
              </button>
              <button 
                className={`${styles.fontSizeButton} ${fontSize === 'large' ? styles.active : ''}`} 
                onClick={() => handleFontSizeChange('large')}
              >
                Lớn
              </button>
            </div>
          </div>
        </div>
        <div className={styles.slideMenuActions}>
          <button className={`${styles.slideMenuButton} ${styles.cancel}`} onClick={toggleSlideMenu}>
            Đóng
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatWindow; 