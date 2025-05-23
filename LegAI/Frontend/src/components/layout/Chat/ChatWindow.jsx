import { useState, useEffect, useRef, useMemo } from 'react';
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
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const messagesEndRef = useRef(null);
  const chatSessionKey = useMemo(() => {
    // Tạo key nhất quán cho localStorage
    const key = `legai-chat-history-${chatType === 'ai' ? 'ai' : currentChatId}`;
    console.log('Tạo chat session key:', key);
    return key;
  }, [chatType, currentChatId]);
  const [isTyping, setIsTyping] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSlideMenuOpen, setIsSlideMenuOpen] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [fullText, setFullText] = useState('');
  const [typingIndex, setTypingIndex] = useState(0);
  const typingSpeed = 15; // ms giữa các ký tự
  const [fontSize, setFontSize] = useState('medium'); // small, medium, large
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const messagesContainerRef = useRef(null);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const inputRef = useRef(null);

  // Thêm CSS inline cho hiệu ứng con trỏ nhấp nháy
  const blinkingCursorStyle = {
    display: 'inline-block',
    width: '2px',
    height: '1.2em',
    backgroundColor: '#333',
    marginLeft: '2px',
    verticalAlign: 'middle',
    animation: 'blink 1s step-end infinite'
  };

  // Thêm hàm cleanHtmlContent để loại bỏ HTML từ tin nhắn
  const cleanHtmlContent = (content) => {
    if (!content) return '';
    
    // Xử lý các link bị lặp lại thuộc tính và các trường hợp đặc biệt
    let processedContent = content
      // Loại bỏ các thuộc tính target, rel, class bị lặp lại
      .replace(/"" target="_blank" rel="noopener noreferrer" class="chat-link"/g, '')
      .replace(/" target="_blank" rel="noopener noreferrer" class="chat-link">"/g, '">')
      // Xử lý trường hợp link bị lồng nhau
      .replace(/<a href="(http[^"]+)" target="_blank" rel="noopener noreferrer" class="chat-link">(http[^<]+)<\/a>" target="_blank" rel="noopener noreferrer" class="chat-link">/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="chat-link">$2</a>')
      // Xử lý trường hợp "XEM CHI TIẾT" bị lỗi format
      .replace(/(http[^"]+)" target="_blank" rel="noopener noreferrer" class="chat-link">XEM CHI TIẾT/g, '$1">XEM CHI TIẾT')
      // Đảm bảo các thẻ strong trong link được giữ nguyên
      .replace(/\*\*\[(.*?)\]\((.*?)\)\*\*/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="chat-link"><strong>$1</strong></a>');
      
    // Xử lý đường link để hiển thị dưới dạng thẻ a có thể nhấp được
    processedContent = processedContent
      // Chuyển đổi Markdown links [text](url) thành HTML links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="chat-link">$1</a>')
      // Chuyển đổi URL thông thường thành links (chỉ khi chưa nằm trong thẻ a)
      .replace(/(https?:\/\/[^\s<>"]+)(?![^<>]*>|[^<>]*<\/a>)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="chat-link">$1</a>')
      // Xử lý đường dẫn localhost (chỉ khi chưa nằm trong thẻ a)
      .replace(/(http:\/\/localhost:[0-9]+\/[^\s<>"]+)(?![^<>]*>|[^<>]*<\/a>)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="chat-link">$1</a>')
      // Thay thế các ký tự đặc biệt
      .replace(/&nbsp;/g, ' ') 
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
    
    // Giữ lại các thẻ a, strong và định dạng cơ bản, loại bỏ các thẻ HTML khác
    processedContent = processedContent
      .replace(/<(?!\/?(a|b|strong|i|em|br)[^>]*>)[^>]*>/g, '');
    
    return processedContent;
  };

  // Khôi phục lịch sử trò chuyện AI từ localStorage nếu có
  useEffect(() => {
    if (chatType === 'ai' && isOpen) {
      try {
        const savedData = localStorage.getItem(chatSessionKey);
        console.log('Đang tìm lịch sử chat từ localStorage với key:', chatSessionKey);
        if (savedData) {
          console.log('Đã tìm thấy dữ liệu, kích thước:', savedData.length);
          // Định dạng mới chỉ lưu messages
          try {
            const parsedData = JSON.parse(savedData);
            console.log('Phân tích thành công JSON, số tin nhắn:', parsedData.length);
            if (Array.isArray(parsedData) && parsedData.length > 0) {
              console.log('Đặt lịch sử chat từ localStorage');
              setMessages(parsedData);
            } else {
              console.log('Dữ liệu phân tích được nhưng mảng rỗng hoặc không phải mảng');
            }
          } catch (error) {
            console.error('Lỗi khi phân tích dữ liệu chat đã lưu:', error);
            localStorage.removeItem(chatSessionKey);
          }
        } else {
          console.log('Không tìm thấy dữ liệu chat trong localStorage');
        }
      } catch (error) {
        console.error('Lỗi khi truy cập bộ nhớ cục bộ:', error);
      }
    }
  }, [chatType, isOpen, chatSessionKey]);
  
  // Lưu lịch sử trò chuyện AI vào localStorage
  useEffect(() => {
    if (chatType === 'ai' && messages.length > 0) {
      try {
        console.log('Tự động lưu', messages.length, 'tin nhắn vào localStorage');
        localStorage.setItem(chatSessionKey, JSON.stringify(messages));
        
        // Lưu vào sessionStorage để đảm bảo tin nhắn được giữ nguyên khi chuyển trang
        sessionStorage.setItem('legai-current-chat', chatSessionKey);
        sessionStorage.setItem(chatSessionKey, JSON.stringify(messages));
        
        // Kiểm tra xem đã lưu thành công chưa
        const savedData = localStorage.getItem(chatSessionKey);
        if (savedData) {
          console.log('Tự động lưu thành công, kích thước:', savedData.length);
        } else {
          console.error('Tự động lưu thất bại: không tìm thấy dữ liệu sau khi lưu');
        }
      } catch (error) {
        console.error('Lỗi khi lưu lịch sử chat:', error);
      }
    }
  }, [messages, chatType, chatSessionKey]);

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
      try {
        if (isOpen && chatType === 'ai') {
          // Tin nhắn chào mừng cho AI nếu không có tin nhắn
          if (messages.length === 0) {
            const welcomeMessage = {
              type: 'system',
              text: 'Xin chào! Tôi là trợ lý AI pháp lý của LegAI. Bạn cần hỗ trợ gì?',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages([welcomeMessage]);
            
            // Hiển thị hướng dẫn sử dụng AI
            setShowAIPrompt(true);
          }
          
          // Không tải lịch sử chat từ database khi mở chat AI
          // Chỉ hiển thị lịch sử từ localStorage
        } else if (isOpen && chatType === 'human') {
          setLoading(true);
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
          setLoading(false);
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra phiên chat hiện có:', error);
        // Hiển thị tin nhắn chào mừng mặc định nếu có lỗi
        const welcomeMessage = {
          type: 'system',
          text: chatType === 'ai' 
            ? 'Xin chào! Tôi là trợ lý AI pháp lý của LegAI. Bạn cần hỗ trợ gì?' 
            : 'Xin chào! Đội ngũ tư vấn của LegAI đang sẵn sàng hỗ trợ bạn.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages([welcomeMessage]);
        setLoading(false);
      }
    };

    if (isOpen) {
      checkExistingChat();
    }
  }, [isOpen, chatType]);

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
    
    // Tốc độ hiển thị chữ thay đổi theo loại ký tự
    let currentSpeed = typingSpeed;
    const currentChar = fullText.charAt(typingIndex);
    
    // Tạm dừng lâu hơn ở dấu chấm, dấu phẩy, xuống dòng
    if (['.', '!', '?'].includes(currentChar)) {
      currentSpeed = typingSpeed * 5; // Dừng lâu hơn ở cuối câu
    } else if ([',', ';', ':'].includes(currentChar)) {
      currentSpeed = typingSpeed * 3; // Dừng lâu hơn ở dấu phẩy
    } else if (currentChar === '\n') {
      currentSpeed = typingSpeed * 2; // Dừng lâu hơn ở xuống dòng
    }
    
    const timer = setTimeout(() => {
      setTypingText(prev => prev + currentChar);
      setTypingIndex(prev => prev + 1);
    }, currentSpeed);
    
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
      // Tính toán thời gian tối đa dựa trên độ dài văn bản
      // Với văn bản dài, tốc độ sẽ nhanh hơn để tránh chờ đợi quá lâu
      const estimatedTime = Math.min(text.length * typingSpeed * 1.2, 15000); // Tối đa 15 giây
      const maxTypingTime = Math.max(estimatedTime, 2000); // Tối thiểu 2 giây
      
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
        
        // Gọi API Gemini với lịch sử chat và tự động lưu vào database nếu có token
        console.log('Gửi tin nhắn đến AI:', currentInput);
        
        // Thêm kiểm tra token để cảnh báo trước
        const hasToken = localStorage.getItem('user') !== null;
        if (!hasToken) {
          console.warn('Không tìm thấy token đăng nhập - tin nhắn sẽ không được lưu vào database!');
        }
        
        try {
          const aiResponseData = await aiService.sendMessageToAI(currentInput);
          console.log('Phản hồi từ API AI:', aiResponseData);
          
          // Xác định response text từ dữ liệu nhận được
          let responseText = '';
          let dbStatus = false;
          
          if (typeof aiResponseData === 'string') {
            // Trường hợp API trả về chuỗi trực tiếp
            responseText = aiResponseData;
          } else if (aiResponseData && typeof aiResponseData === 'object') {
            // Trường hợp API trả về object có chứa text
            responseText = aiResponseData.text || '';
            
            // Kiểm tra trạng thái lưu database
            dbStatus = aiResponseData.saved_to_db === true;
            console.log('Trạng thái lưu vào DB:', dbStatus ? 'Thành công' : 'Thất bại');
            
            if (!dbStatus && aiResponseData.db_error) {
              console.error('Lỗi khi lưu vào DB:', aiResponseData.db_error);
            }
          }
          
          if (!responseText) {
            throw new Error('Không nhận được phản hồi hợp lệ từ AI');
          }
          
          // Tắt trạng thái loading sau khi nhận được phản hồi
          setLoading(false);
          
          // Hiển thị hiệu ứng typing
          const cleanedResponse = cleanHtmlContent(responseText);
          
          // Bắt đầu hiệu ứng typing và đợi nó hoàn thành
          await simulateTyping(cleanedResponse);
          
          // Hiển thị phản hồi từ AI sau khi hiệu ứng typing hoàn thành
          const aiResponseMsg = {
            type: 'system',
            text: responseText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            saved_to_db: dbStatus
          };
          
          // Cập nhật messages state
          setMessages(prev => [...prev, aiResponseMsg]);
          
          // Lưu lịch sử chat vào localStorage
          try {
            const historyToSave = [...messages, userMessage, aiResponseMsg];
            
            // Đảm bảo chỉ lưu 50 tin nhắn gần nhất
            const trimmedHistory = historyToSave.slice(-50);
            localStorage.setItem(chatSessionKey, JSON.stringify(trimmedHistory));
            
            // Kiểm tra xem đã lưu thành công chưa
            const savedData = localStorage.getItem(chatSessionKey);
            if (savedData) {
              console.log('Đã lưu thành công lịch sử chat vào localStorage, kích thước:', savedData.length);
            } else {
              console.error('Lưu lịch sử chat thất bại: không tìm thấy dữ liệu sau khi lưu');
            }
          } catch (storageError) {
            console.error('Lỗi khi lưu lịch sử chat:', storageError);
          }
        } catch (aiError) {
          console.error('Lỗi khi nhận phản hồi từ AI:', aiError);
          toast.error('Không thể nhận phản hồi từ AI. Vui lòng thử lại sau.');
          
          // Hiển thị thông báo lỗi cho người dùng
          const errorMsg = {
            type: 'system',
            text: 'Xin lỗi, tôi không thể trả lời câu hỏi của bạn lúc này. Vui lòng thử lại sau.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isError: true
          };
          setMessages(prev => [...prev, errorMsg]);
          setLoading(false);
        }
      } else {
        // Phần code xử lý chat người hỗ trợ giữ nguyên
        if (currentChatId) {
          await chatService.sendMessage(currentChatId, currentInput);
          await fetchMessages(currentChatId, true);
        } else {
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
      // Không xóa lịch sử chat AI khi đóng chat
      // Giữ lịch sử trong localStorage để có thể xem lại sau
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
      
      // Thêm tin nhắn chào mừng mới
      const welcomeMessage = {
        type: 'system',
        text: 'Xin chào! Tôi là trợ lý AI pháp lý của LegAI. Tôi có thể giúp trả lời các câu hỏi cơ bản về pháp luật hoặc hướng dẫn bạn đến các dịch vụ tư vấn chuyên sâu.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages([welcomeMessage]);
      
      // Đóng menu slide
      toggleSlideMenu();
      
      // Xóa lịch sử chat cục bộ thông qua aiService
      aiService.clearChatHistory();
      
      toast.success('Đã xóa lịch sử trò chuyện trên thiết bị này.');
    } else if (chatType === 'human' && currentChatId) {
      // Chỉ xóa hiển thị phía client mà không xóa trên server
      setMessages([]);
      toggleSlideMenu();
      toast.success('Đã xóa lịch sử hiển thị trò chuyện. Lịch sử vẫn được lưu trên hệ thống.');
    }
  };

  // Vô hiệu hóa input khi loading hoặc typing
  const isInputDisabled = () => {
    // Chỉ vô hiệu khi đang loading, KHÔNG vô hiệu khi đang typing
    return loading;
  };

  // Tải lịch sử chat từ database khi không có lịch sử cục bộ
  const loadChatHistoryFromDatabase = async () => {
    // Chỉ thực hiện khi đã đăng nhập
    if (!authService.isAuthenticated()) {
      console.log('Người dùng chưa đăng nhập, không thể tải lịch sử chat từ database');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Bắt đầu tải lịch sử chat từ database...');
      
      // Gọi API lấy lịch sử chat của người dùng
      const response = await aiService.getMyAIChatHistory();
      
      console.log('Kết quả lấy lịch sử chat từ database:', {
        success: response.success,
        records: response.data?.length || 0,
        timestamp: new Date().toISOString()
      });
      
      if (response.success && response.data && response.data.length > 0) {
        console.log('Tìm thấy', response.data.length, 'bản ghi lịch sử chat trong database');
        
        // Chỉ tải lịch sử từ server nếu không có lịch sử cục bộ
        if (messages.length <= 1) { // Chỉ có tin nhắn chào mừng
          console.log('Không có lịch sử cục bộ, tải từ database...');
          
          // Chuyển đổi lịch sử từ server sang định dạng hiển thị
          const formattedHistory = response.data.slice(0, 20).map(chat => [
            {
              type: 'user',
              text: chat.question,
              time: new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isCurrentUser: true
            },
            {
              type: 'system',
              text: chat.answer,
              time: new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          ]).flat();
          
          // Thêm tin nhắn chào mừng ở đầu
          const welcomeMessage = {
            type: 'system',
            text: 'Xin chào! Tôi là trợ lý AI pháp lý của LegAI. Dưới đây là lịch sử chat của bạn:',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          
          // Cập nhật giao diện với lịch sử chat từ server
          const newMessages = [welcomeMessage, ...formattedHistory];
          setMessages(newMessages);
          console.log('Đã cập nhật UI với', newMessages.length, 'tin nhắn từ database');
          
          // Lưu vào localStorage và sessionStorage
          try {
            localStorage.setItem(chatSessionKey, JSON.stringify(newMessages));
            sessionStorage.setItem('legai-current-chat', chatSessionKey);
            sessionStorage.setItem(chatSessionKey, JSON.stringify(newMessages));
            console.log('Đã lưu lịch sử chat từ database vào localStorage và sessionStorage');
            
            // Kiểm tra dữ liệu đã lưu
            const savedData = localStorage.getItem(chatSessionKey);
            if (savedData) {
              const parsedData = JSON.parse(savedData);
              console.log('Xác nhận dữ liệu đã lưu vào localStorage:', parsedData.length, 'tin nhắn');
            }
          } catch (storageError) {
            console.error('Lỗi khi lưu lịch sử chat vào localStorage:', storageError);
          }
        } else {
          console.log('Đã có lịch sử cục bộ', messages.length, 'tin nhắn, không tải từ database');
        }
      } else {
        if (!response.success) {
          console.warn('Không thể tải lịch sử chat từ database:', response.message || 'Lỗi không xác định');
        } else {
          console.log('Không tìm thấy lịch sử chat trong database');
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải lịch sử chat từ server:', error);
    } finally {
      setLoading(false);
    }
  };

  // Khôi phục phiên chat từ sessionStorage khi người dùng quay lại trang
  useEffect(() => {
    if (isOpen && chatType === 'ai') {
      try {
        // Kiểm tra xem có phiên chat nào được lưu trong sessionStorage không
        const lastChatKey = sessionStorage.getItem('legai-current-chat');
        if (lastChatKey && lastChatKey === chatSessionKey) {
          const sessionData = sessionStorage.getItem(lastChatKey);
          if (sessionData) {
            try {
              const parsedData = JSON.parse(sessionData);
              if (Array.isArray(parsedData) && parsedData.length > 0) {
                console.log('Khôi phục phiên chat từ sessionStorage, số tin nhắn:', parsedData.length);
                setMessages(parsedData);
                
                // Đặt lại auto-scroll khi khôi phục phiên chat
                setShouldAutoScroll(true);
              }
            } catch (parseError) {
              console.error('Lỗi khi phân tích dữ liệu từ sessionStorage:', parseError);
            }
          }
        }
      } catch (error) {
        console.error('Lỗi khi truy cập sessionStorage:', error);
      }
    }
  }, [isOpen, chatType, chatSessionKey]);

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
                      {chatType === 'ai' && !message.isCurrentUser ? (
                        <div className={`${styles.messageText} ${styles.messageHtmlContent}`} dangerouslySetInnerHTML={{ __html: cleanHtmlContent(message.text) }} />
                      ) : (
                      <p className={styles.messageText}>
                          {message.text.split('\n').map((line, i) => (
                              <span key={i}>
                                {line}
                                {i < message.text.split('\n').length - 1 && <br />}
                              </span>
                          ))}
                      </p>
                      )}
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
                      <div className={`${styles.messageText} ${styles.messageHtmlContent}`}>
                        <div dangerouslySetInnerHTML={{ __html: cleanHtmlContent(typingText) }} />
                        <span className={styles.blinkingCursor} style={blinkingCursorStyle}></span>
                      </div>
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