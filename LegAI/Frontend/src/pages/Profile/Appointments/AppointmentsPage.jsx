import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './AppointmentsPage.module.css';
import appointmentService from '../../../services/appointmentService';
import { DEFAULT_AVATAR } from '../../../config/constants';

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [processingCancel, setProcessingCancel] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getAppointments();
      
      if (response.status === 'success') {
        setAppointments(response.data);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách lịch hẹn:', error);
      setError('Không thể lấy danh sách lịch hẹn. Vui lòng thử lại sau.');
      setLoading(false);
    }
  };

  const handleCancelClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const handleCancelModalClose = () => {
    setShowCancelModal(false);
    setSelectedAppointment(null);
    setCancelReason('');
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    
    try {
      setProcessingCancel(true);
      
      const response = await appointmentService.cancelAppointment(
        selectedAppointment.id,
        cancelReason
      );
      
      if (response.status === 'success') {
        // Cập nhật danh sách lịch hẹn
        setAppointments(prevAppointments => 
          prevAppointments.map(app => 
            app.id === selectedAppointment.id 
              ? { ...app, status: 'cancelled' } 
              : app
          )
        );
        
        setSuccessMessage('Lịch hẹn đã được huỷ thành công.');
        setTimeout(() => setSuccessMessage(''), 5000);
      }
      
      setProcessingCancel(false);
      handleCancelModalClose();
    } catch (error) {
      console.error('Lỗi khi huỷ lịch hẹn:', error);
      setError('Không thể huỷ lịch hẹn. Vui lòng thử lại sau.');
      setProcessingCancel(false);
    }
  };

  // Lọc lịch hẹn theo tab đang active
  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.start_time);
    const now = new Date();
    
    if (activeTab === 'upcoming') {
      return appointmentDate >= now && appointment.status !== 'cancelled';
    } else if (activeTab === 'past') {
      return appointmentDate < now || appointment.status === 'completed';
    } else if (activeTab === 'cancelled') {
      return appointment.status === 'cancelled';
    }
    
    return true;
  });

  // Sắp xếp lịch hẹn theo thời gian
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    return activeTab === 'upcoming' 
      ? new Date(a.start_time) - new Date(b.start_time)
      : new Date(b.start_time) - new Date(a.start_time);
  });

  // Format date cho người dùng Việt Nam
  const formatDate = (dateString) => {
    const options = { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  // Hiển thị trạng thái lịch hẹn bằng tiếng Việt
  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Chờ xác nhận',
      'confirmed': 'Đã xác nhận',
      'completed': 'Đã hoàn thành',
      'cancelled': 'Đã huỷ'
    };
    
    return statusMap[status] || status;
  };

  // Lấy class CSS tương ứng với trạng thái
  const getStatusClass = (status) => {
    const statusClassMap = {
      'pending': styles.statusPending,
      'confirmed': styles.statusConfirmed,
      'completed': styles.statusCompleted,
      'cancelled': styles.statusCancelled
    };
    
    return statusClassMap[status] || '';
  };

  return (
    <div className={styles.appointmentsPage}>
      <div className={styles.header}>
        <h1>Quản lý lịch hẹn</h1>
        <p>Xem và quản lý tất cả các lịch hẹn của bạn với luật sư</p>
      </div>
      
      {successMessage && (
        <div className={styles.successMessage}>
          <i className="fas fa-check-circle"></i> {successMessage}
        </div>
      )}
      
      {error && (
        <div className={styles.errorMessage}>
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}
      
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'upcoming' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Sắp tới
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'past' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('past')}
          >
            Đã qua
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'cancelled' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('cancelled')}
          >
            Đã huỷ
          </button>
        </div>
      </div>
      
      <div className={styles.appointmentsContainer}>
        {loading ? (
          <div className={styles.loading}>
            <i className="fas fa-spinner fa-spin"></i>
            <p>Đang tải lịch hẹn...</p>
          </div>
        ) : sortedAppointments.length > 0 ? (
          <div className={styles.appointmentsList}>
            {sortedAppointments.map((appointment) => (
              <div key={appointment.id} className={styles.appointmentCard}>
                <div className={styles.appointmentHeader}>
                  <div className={styles.lawyerInfo}>
                    <img 
                      src={appointment.avatar_url || DEFAULT_AVATAR} 
                      alt={appointment.lawyer_name} 
                      className={styles.lawyerAvatar}
                    />
                    <div>
                      <h3>{appointment.lawyer_name}</h3>
                      <p className={styles.specialization}>{appointment.specialization}</p>
                    </div>
                  </div>
                  <div className={`${styles.status} ${getStatusClass(appointment.status)}`}>
                    {getStatusText(appointment.status)}
                  </div>
                </div>
                
                <div className={styles.appointmentBody}>
                  <div className={styles.appointmentDetail}>
                    <div className={styles.detailItem}>
                      <i className="far fa-calendar-alt"></i>
                      <span>Ngày hẹn:</span>
                      <span>{formatDate(appointment.start_time)}</span>
                    </div>
                    
                    <div className={styles.detailItem}>
                      <i className="far fa-clock"></i>
                      <span>Thời gian:</span>
                      <span>
                        {new Date(appointment.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - 
                        {new Date(appointment.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div className={styles.detailItem}>
                      <i className="fas fa-tag"></i>
                      <span>Mục đích:</span>
                      <span>{appointment.purpose || 'Chưa xác định'}</span>
                    </div>
                    
                    {appointment.notes && (
                      <div className={styles.detailItem}>
                        <i className="far fa-sticky-note"></i>
                        <span>Ghi chú:</span>
                        <span>{appointment.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className={styles.appointmentFooter}>
                  <div className={styles.appointmentActions}>
                    {/* Chỉ hiển thị nút huỷ lịch hẹn nếu lịch hẹn chưa bị huỷ và chưa hoàn thành */}
                    {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                      <button 
                        className={styles.cancelButton}
                        onClick={() => handleCancelClick(appointment)}
                      >
                        <i className="fas fa-times-circle"></i> Huỷ lịch hẹn
                      </button>
                    )}
                    
                    {/* Thêm nút liên hệ với luật sư */}
                    <a 
                      href={`mailto:${appointment.lawyer_email}`} 
                      className={styles.contactButton}
                    >
                      <i className="fas fa-envelope"></i> Liên hệ luật sư
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noAppointments}>
            <div className={styles.emptyState}>
              <i className="far fa-calendar-times"></i>
              <h3>Không có lịch hẹn</h3>
              <p>
                {activeTab === 'upcoming' 
                  ? 'Bạn chưa có lịch hẹn nào sắp tới.' 
                  : activeTab === 'past' 
                    ? 'Bạn chưa có lịch hẹn nào đã qua.' 
                    : 'Bạn chưa huỷ lịch hẹn nào.'}
              </p>
              <Link to="/lawyers" className={styles.bookButton}>
                <i className="fas fa-search"></i> Tìm luật sư và đặt lịch hẹn
              </Link>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal xác nhận huỷ lịch hẹn */}
      {showCancelModal && selectedAppointment && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Xác nhận huỷ lịch hẹn</h3>
              <button 
                className={styles.closeButton} 
                onClick={handleCancelModalClose}
                disabled={processingCancel}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Bạn có chắc chắn muốn huỷ lịch hẹn với <strong>{selectedAppointment.lawyer_name}</strong> vào lúc <strong>{formatDate(selectedAppointment.start_time)}</strong>?</p>
              
              <div className={styles.formGroup}>
                <label htmlFor="cancelReason">Lý do huỷ lịch hẹn:</label>
                <textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Vui lòng cho biết lý do huỷ lịch hẹn..."
                  rows="4"
                  disabled={processingCancel}
                ></textarea>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelModalButton}
                onClick={handleCancelModalClose}
                disabled={processingCancel}
              >
                Không huỷ
              </button>
              <button 
                className={styles.confirmCancelButton}
                onClick={handleCancelAppointment}
                disabled={processingCancel}
              >
                {processingCancel ? 'Đang xử lý...' : 'Xác nhận huỷ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage; 