import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Typography, Paper, Avatar, IconButton, Badge, CircularProgress } from '@mui/material';
import { Send as SendIcon, Close as CloseIcon, Chat as ChatIcon } from '@mui/icons-material';
import chatbotService from '../../services/chatbotService';
import authService from '../../services/authService';
import { styled } from '@mui/material/styles';
import { useLocation } from 'react-router-dom';

// Style cho khung chat
const ChatWindow = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: 80,
  right: 20,
  width: 340,
  height: 450,
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
  borderRadius: '10px',
  overflow: 'hidden',
  zIndex: 1000,
  [theme.breakpoints.down('sm')]: {
    width: '90%',
    height: '70vh',
    bottom: 70,
    right: '5%',
  },
}));

// Style cho header của khung chat
const ChatHeader = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  padding: '10px 15px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

// Style cho area hiển thị tin nhắn
const MessagesArea = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: '10px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  backgroundColor: theme.palette.grey[50],
}));

// Style cho form nhập tin nhắn
const MessageForm = styled(Box)(({ theme }) => ({
  padding: '10px',
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'white',
  borderTop: `1px solid ${theme.palette.grey[200]}`,
}));

// Style cho tin nhắn của user
const UserMessage = styled(Box)(({ theme }) => ({
  alignSelf: 'flex-end',
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  padding: '8px 15px',
  borderRadius: '18px 18px 0 18px',
  maxWidth: '80%',
  wordBreak: 'break-word',
}));

// Style cho tin nhắn của bot
const BotMessage = styled(Box)(({ theme }) => ({
  alignSelf: 'flex-start',
  backgroundColor: 'white',
  padding: '8px 15px',
  borderRadius: '18px 18px 18px 0',
  border: `1px solid ${theme.palette.grey[200]}`,
  maxWidth: '80%',
  wordBreak: 'break-word',
}));

// Style cho nút chat icon
const ChatButton = styled(Badge)(({ theme }) => ({
  position: 'fixed',
  bottom: 20,
  right: 20,
  zIndex: 1000,
}));

// Style cho nút actions trong tin nhắn bot
const ActionButton = styled(Button)(({ theme }) => ({
  margin: '5px 5px 0 0',
  fontSize: '0.75rem',
  padding: '2px 8px',
}));

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const location = useLocation();

  // Cuộn xuống cuối danh sách tin nhắn
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Khởi tạo cuộc trò chuyện mới khi component mount
  useEffect(() => {
    const initConversation = async () => {
      try {
        const id = await chatbotService.startNewConversation();
        setConversationId(id);
        
        // Thêm tin nhắn chào mừng
        setMessages([
          {
            type: 'bot',
            text: 'Xin chào! Tôi là trợ lý pháp lý LegAI, tôi có thể giúp gì cho bạn?',
            timestamp: new Date().toISOString()
          }
        ]);
      } catch (error) {
        console.error('Lỗi khởi tạo cuộc trò chuyện:', error);
      }
    };
    
    initConversation();
  }, []);

  // Lắng nghe thay đổi route để cập nhật context cho chatbot
  useEffect(() => {
    if (conversationId) {
      const updateContext = async () => {
        try {
          await chatbotService.setConversationContext(conversationId, {
            current_path: location.pathname,
            current_page: location.pathname.split('/').pop() || 'home'
          });
        } catch (error) {
          console.error('Lỗi cập nhật context:', error);
        }
      };
      
      updateContext();
    }
  }, [location, conversationId]);

  // Cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    scrollToBottom();
    
    // Cập nhật số tin nhắn chưa đọc nếu khung chat đóng
    if (!open && messages.length > 0 && messages[messages.length - 1].type === 'bot') {
      setUnreadCount(prev => prev + 1);
    }
  }, [messages, open]);

  // Xử lý gửi tin nhắn
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // Thêm tin nhắn người dùng vào danh sách
    const userMsg = {
      type: 'user',
      text: message,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setMessage('');
    setLoading(true);
    
    try {
      // Gửi tin nhắn đến chatbot
      const response = await chatbotService.sendMessage(message, conversationId);
      
      // Xử lý phản hồi từ chatbot
      if (response.responses && response.responses.length > 0) {
        response.responses.forEach(botResponse => {
          const botMsg = {
            type: 'bot',
            text: botResponse.text,
            buttons: botResponse.buttons || [],
            image: botResponse.image,
            custom: botResponse.custom,
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => [...prev, botMsg]);
        });
      }
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      
      // Thêm tin nhắn lỗi
      setMessages(prev => [
        ...prev, 
        {
          type: 'bot',
          text: 'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.',
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi nhấn nút action trong tin nhắn bot
  const handleActionButton = async (actionData) => {
    if (!actionData || !actionData.payload) return;
    
    try {
      const { action, params } = actionData.payload;
      
      // Thực hiện action
      const result = await chatbotService.executeAction(action, params);
      
      // Nếu có redirect, chuyển hướng người dùng
      if (result.redirect) {
        window.location.href = result.redirect;
        return;
      }
      
      // Nếu không có redirect, hiển thị kết quả như một tin nhắn bot
      setMessages(prev => [
        ...prev, 
        {
          type: 'bot',
          text: result.message || 'Đã thực hiện hành động thành công!',
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Lỗi khi thực hiện hành động:', error);
      
      setMessages(prev => [
        ...prev, 
        {
          type: 'bot',
          text: 'Không thể thực hiện hành động này. Vui lòng thử lại hoặc liên hệ hỗ trợ.',
          timestamp: new Date().toISOString()
        }
      ]);
    }
  };

  // Xử lý mở/đóng khung chat
  const toggleChat = () => {
    setOpen(prev => !prev);
    if (!open) {
      setUnreadCount(0); // Reset số tin nhắn chưa đọc khi mở khung chat
    }
  };

  // Format thời gian tin nhắn
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Nút chat icon */}
      <ChatButton 
        color="primary"
        badgeContent={unreadCount}
        onClick={toggleChat}
      >
        <Avatar 
          sx={{ 
            width: 56, 
            height: 56,
            bgcolor: 'primary.main',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}
        >
          <ChatIcon />
        </Avatar>
      </ChatButton>

      {/* Khung chat */}
      {open && (
        <ChatWindow>
          <ChatHeader>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                <ChatIcon fontSize="small" />
              </Avatar>
              <Typography variant="subtitle1" fontWeight="bold">
                Trợ lý pháp lý LegAI
              </Typography>
            </Box>
            <IconButton size="small" onClick={toggleChat} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </ChatHeader>

          <MessagesArea>
            {messages.map((msg, index) => (
              <Box key={index} sx={{ display: 'flex', flexDirection: 'column' }}>
                {msg.type === 'user' ? (
                  <UserMessage>
                    <Typography variant="body2">{msg.text}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7, textAlign: 'right', display: 'block' }}>
                      {formatTime(msg.timestamp)}
                    </Typography>
                  </UserMessage>
                ) : (
                  <BotMessage>
                    <Typography variant="body2">{msg.text}</Typography>
                    
                    {/* Hiển thị buttons nếu có */}
                    {msg.buttons && msg.buttons.length > 0 && (
                      <Box mt={1}>
                        {msg.buttons.map((button, btnIdx) => (
                          <ActionButton 
                            key={btnIdx} 
                            variant="outlined" 
                            size="small"
                            onClick={() => handleActionButton(button)}
                          >
                            {button.title}
                          </ActionButton>
                        ))}
                      </Box>
                    )}
                    
                    {/* Hiển thị hình ảnh nếu có */}
                    {msg.image && (
                      <Box mt={1}>
                        <img 
                          src={msg.image} 
                          alt="Chatbot response" 
                          style={{ maxWidth: '100%', borderRadius: '8px' }}
                        />
                      </Box>
                    )}
                    
                    <Typography variant="caption" sx={{ opacity: 0.7, display: 'block' }}>
                      {formatTime(msg.timestamp)}
                    </Typography>
                  </BotMessage>
                )}
              </Box>
            ))}
            
            {/* Loading indicator */}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
            
            <div ref={messagesEndRef} />
          </MessagesArea>

          <MessageForm component="form" onSubmit={handleSendMessage}>
            <TextField
              fullWidth
              placeholder="Nhập tin nhắn..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              variant="outlined"
              size="small"
              disabled={loading}
              sx={{ mr: 1 }}
            />
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              disabled={loading || !message.trim()}
              sx={{ minWidth: 'auto', p: '8px' }}
            >
              <SendIcon />
            </Button>
          </MessageForm>
        </ChatWindow>
      )}
    </>
  );
};

export default Chatbot; 