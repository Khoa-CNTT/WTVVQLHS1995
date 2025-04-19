import React, { useState, useEffect, useRef } from 'react';
import styles from './ChatManager.module.css';
import chatService from '../../../services/chatService';
import { toast } from 'react-toastify';
import authService from '../../../services/authService';

const ChatManager = () => {
  const [chatList, setChatList] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('waiting'); // 'waiting', 'active', 'closed'
  const messagesEndRef = useRef(null);

  // Lấy danh sách phiên chat khi component mount và khi activeTab thay đổi
  useEffect(() => {
    fetchChats();
    // Thiết lập polling để cập nhật danh sách chat mỗi 10 giây
    const interval = setInterval(() => {
      fetchChats(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [activeTab]);

  // Tự động scroll đến tin nhắn mới nhất
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Nếu đang xem một phiên chat, cập nhật tin nhắn liên tục
  useEffect(() => {
    if (activeChat) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000); // cập nhật mỗi 5 giây
      return () => clearInterval(interval);
    }
  }, [activeChat]);

  const fetchChats = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      console.log('Đang tải danh sách chat với trạng thái:', activeTab);
      let response;
      
      // Sử dụng activeTab để xác định API call phù hợp
      if (activeTab === 'waiting') {
        // Lấy các chat đang chờ
        response = await chatService.getChatsByStatus('waiting');
      } else if (activeTab === 'active') {
        // Lấy các chat của luật sư đang hoạt động
        response = await chatService.getChats('active');
      } else if (activeTab === 'closed') {
        // Lấy các chat đã đóng
        response = await chatService.getChats('closed');
      } else {
        // Mặc định lấy tất cả
        response = await chatService.getChats();
      }

      console.log('Kết quả nhận được:', response.data);
      
      if (response && response.data && Array.isArray(response.data)) {
        setChatList(response.data);
        if (response.data.length > 0 && !activeChat) {
          // Tự động chọn chat đầu tiên nếu chưa có chat nào được chọn
          handleChatSelect(response.data[0]);
        }
      } else {
        console.log('Không có dữ liệu hợp lệ từ API:', response);
        setChatList([]);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách chat:', err);
      if (err.response) {
        console.error('Chi tiết lỗi:', err.response.status, err.response.data);
        setError(`Không thể tải danh sách chat: ${err.response.data.message || 'Lỗi từ server'}`);
      } else if (err.request) {
        setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        setError('Không thể tải danh sách chat. Vui lòng thử lại sau.');
      }
      setChatList([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!activeChat) return;
    
    try {
      const response = await chatService.getMessages(activeChat.id);
      setMessages(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy tin nhắn:', error);
      toast.error('Không thể tải tin nhắn');
    }
  };

  const handleAcceptChat = async (chatId) => {
    try {
      await chatService.assignLawyerToChat(chatId);
      toast.success('Đã nhận phiên chat thành công');
      fetchChats();
      // Chuyển sang tab active
      setActiveTab('active');
    } catch (error) {
      console.error('Lỗi khi nhận phiên chat:', error);
      toast.error('Không thể nhận phiên chat');
    }
  };

  const handleCloseChat = async () => {
    if (!activeChat) return;
    
    try {
      await chatService.closeChat(activeChat.id);
      toast.success('Đã đóng phiên chat thành công');
      setActiveChat(null);
      setMessages([]);
      fetchChats();
    } catch (error) {
      console.error('Lỗi khi đóng phiên chat:', error);
      toast.error('Không thể đóng phiên chat');
    }
  };

  const handleChatSelect = async (chat) => {
    setActiveChat(chat);
    
    try {
      const response = await chatService.getMessages(chat.id);
      setMessages(response.data);
      scrollToBottom();
    } catch (error) {
      console.error('Lỗi khi lấy tin nhắn:', error);
      toast.error('Không thể tải tin nhắn');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !activeChat) return;
    
    try {
      console.log('Đang gửi tin nhắn với thông tin:', {
        chatId: activeChat.id,
        message: messageInput,
        chatInfo: activeChat
      });
      
      const response = await chatService.sendMessage(activeChat.id, messageInput);
      console.log('Phản hồi từ server khi gửi tin nhắn:', response);
      
      if (response.status === 'success' && response.data) {
        setMessages([...messages, response.data]);
        setMessageInput('');
        scrollToBottom();
      } else {
        toast.error('Gửi tin nhắn không thành công');
      }
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      if (error.response) {
        console.error('Chi tiết lỗi:', error.response.status, error.response.data);
        if (error.response.status === 403) {
          toast.error('Không có quyền gửi tin nhắn trong phiên chat này');
        } else {
          toast.error('Không thể gửi tin nhắn: ' + (error.response.data.message || 'Lỗi không xác định'));
        }
      } else {
        toast.error('Không thể gửi tin nhắn. Vui lòng thử lại sau.');
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTimestamp = (timestamp) => {
    return chatService.formatChatTime(timestamp);
  };

  const renderChatList = () => {
    if (loading) {
      return (
        <div className={styles.loadingContainer}>
          <i className="fas fa-spinner fa-spin"></i>
          <p>Đang tải danh sách phiên chat...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.errorContainer}>
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
        </div>
      );
    }

    if (chatList.length === 0) {
      return (
        <div className={styles.emptyChatList}>
          <i className="fas fa-comments"></i>
          <p>Không có phiên chat nào{activeTab === 'waiting' ? ' đang chờ' : activeTab === 'active' ? ' đang diễn ra' : ' đã kết thúc'}</p>
        </div>
      );
    }

    return (
      <div className={styles.chatListContainer}>
        {chatList.map((chat) => (
          <div 
            key={chat.id} 
            className={`${styles.chatItem} ${activeChat && activeChat.id === chat.id ? styles.activeItem : ''}`}
            onClick={() => handleChatSelect(chat)}
          >
            <div className={styles.chatIcon}>
              <i className="fas fa-user"></i>
            </div>
            <div className={styles.chatInfo}>
              <h4>{chat.customer_name || 'Khách hàng'}</h4>
              <p className={styles.chatTime}>
                <i className="far fa-clock"></i> {formatTimestamp(chat.created_at)}
              </p>
            </div>
            {activeTab === 'waiting' && (
              <button 
                className={styles.acceptButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAcceptChat(chat.id);
                }}
              >
                <i className="fas fa-check"></i>
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderChatContent = () => {
    if (!activeChat) {
      return (
        <div className={styles.noChatSelected}>
          <i className="fas fa-comments"></i>
          <h3>Hãy chọn một phiên chat</h3>
          <p>Chọn một phiên chat từ danh sách để bắt đầu trò chuyện</p>
        </div>
      );
    }

    return (
      <>
        <div className={styles.chatHeader}>
          <div className={styles.chatCustomerInfo}>
            <div className={styles.customerAvatar}>
              <i className="fas fa-user"></i>
            </div>
            <div>
              <h3>{activeChat.customer_name || 'Khách hàng'}</h3>
              <p>{activeChat.customer_email || ''}</p>
            </div>
          </div>
          <div className={styles.chatActions}>
            {activeChat.status !== 'closed' && (
              <button className={styles.closeButton} onClick={handleCloseChat}>
                <i className="fas fa-times"></i> Kết thúc
              </button>
            )}
          </div>
        </div>
        
        <div className={styles.chatMessages}>
          {messages.length === 0 ? (
            <div className={styles.noMessages}>
              <i className="fas fa-comment-dots"></i>
              <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isCurrentUser = msg.sender_id === authService.getCurrentUser()?.id;
              return (
                <div key={msg.id} className={`${styles.messageItem} ${isCurrentUser ? styles.sentMessage : styles.receivedMessage}`}>
                  <div className={styles.messageContent}>
                    {!isCurrentUser && (
                      <div className={styles.senderInfo}>
                        <span className={styles.senderName}>{msg.sender_name}</span>
                      </div>
                    )}
                    <p>{msg.message}</p>
                    <span className={styles.messageTime}>{formatTimestamp(msg.created_at)}</span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form className={styles.chatInputForm} onSubmit={handleSendMessage}>
          <input
            type="text"
            className={styles.chatInputField}
            placeholder="Nhập tin nhắn..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            disabled={activeChat.status === 'closed'}
          />
          <button
            type="submit"
            className={styles.sendButton}
            disabled={!messageInput.trim() || activeChat.status === 'closed'}
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </form>
      </>
    );
  };

  return (
    <div className={styles.chatManagerContainer}>
      
      <div className={styles.chatTabs}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'waiting' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('waiting')}
        >
          <i className="fas fa-hourglass-half"></i> Đang chờ
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'active' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <i className="fas fa-comments"></i> Đang diễn ra
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'closed' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('closed')}
        >
          <i className="fas fa-check-circle"></i> Đã kết thúc
        </button>
      </div>
      
      <div className={styles.chatInterface}>
        <div className={styles.chatSidebar}>
          <div className={styles.chatSidebarHeader}>
            <h3>Danh sách phiên chat</h3>
            <button className={styles.refreshButton} onClick={() => fetchChats()}>
              <i className="fas fa-sync-alt"></i>
            </button>
          </div>
          {renderChatList()}
        </div>
        <div className={styles.chatMainContent}>
          {renderChatContent()}
        </div>
      </div>
    </div>
  );
};

export default ChatManager; 