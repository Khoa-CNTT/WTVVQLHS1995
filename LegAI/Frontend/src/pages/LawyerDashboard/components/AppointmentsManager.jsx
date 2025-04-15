import React, { useState, useEffect } from 'react';
import styles from './AppointmentsManager.module.css';
import appointmentService from '../../../services/appointmentService';
import { DEFAULT_AVATAR } from '../../../config/constants';

const AppointmentsManager = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [processing, setProcessing] = useState(false);
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

  const handleUpdateClick = (appointment) => {
    setSelectedAppointment(appointment);
    setUpdateStatus(appointment.status);
    setUpdateNotes(appointment.notes || '');
    setShowUpdateModal(true);
  };

  const handleUpdateModalClose = () => {
    setShowUpdateModal(false);
    setSelectedAppointment(null);
    setUpdateStatus('');
    setUpdateNotes('');
  };

  const handleUpdateAppointment = async () => {
    if (!selectedAppointment) return;
    
    try {
      setProcessing(true);
      
      const response = await appointmentService.updateAppointmentStatus(
        selectedAppointment.id,
        updateStatus,
        updateNotes
      );
      
      if (response.status === 'success') {
        // Cập nhật danh sách lịch hẹn
        setAppointments(prevAppointments => 
          prevAppointments.map(app => 
            app.id === selectedAppointment.id 
              ? { ...app, status: updateStatus, notes: updateNotes } 
              : app
          )
        );
        
        setSuccessMessage('Đã cập nhật trạng thái lịch hẹn thành công!');
        setTimeout(() => setSuccessMessage(''), 5000);
      }
      
      setProcessing(false);
      handleUpdateModalClose();
    } catch (error) {
      console.error('Lỗi khi cập nhật lịch hẹn:', error);
      setError('Không thể cập nhật lịch hẹn. Vui lòng thử lại sau.');
      setProcessing(false);
    }
  };

  const handleCancelAppointment = async (appointment) => {
    if (!window.confirm('Bạn có chắc chắn muốn huỷ lịch hẹn này không?')) {
      return;
    }
    
    try {
      setProcessing(true);
      
      const response = await appointmentService.cancelAppointment(
        appointment.id,
        'Đã huỷ bởi luật sư'
      );
      
      if (response.status === 'success') {
        // Cập nhật danh sách lịch hẹn
        setAppointments(prevAppointments => 
          prevAppointments.map(app => 
            app.id === appointment.id 
              ? { ...app, status: 'cancelled' } 
              : app
          )
        );
        
        setSuccessMessage('Đã huỷ lịch hẹn thành công!');
        setTimeout(() => setSuccessMessage(''), 5000);
      }
      
      setProcessing(false);
    } catch (error) {
      console.error('Lỗi khi huỷ lịch hẹn:', error);
      setError('Không thể huỷ lịch hẹn. Vui lòng thử lại sau.');
      setProcessing(false);
    }
  };

  // Lọc lịch hẹn theo tab đang active
  const filteredAppointments = appointments.filter(appointment => {
    if (activeTab === 'pending') {
      return appointment.status === 'pending';
    } else if (activeTab === 'confirmed') {
      return appointment.status === 'confirmed';
    } else if (activeTab === 'completed') {
      return appointment.status === 'completed';
    } else if (activeTab === 'cancelled') {
      return appointment.status === 'cancelled';
    }
    
    return true;
  });

  // Sắp xếp lịch hẹn theo thời gian
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    return new Date(a.start_time) - new Date(b.start_time);
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

  // Lấy danh sách các trạng thái cho dropdown
  const getAvailableStatusOptions = (currentStatus) => {
    // Định nghĩa sự chuyển đổi trạng thái hợp lệ
    const statusTransitions = {
      'pending': ['pending', 'confirmed', 'cancelled'],
      'confirmed': ['confirmed', 'completed', 'cancelled'],
      'completed': ['completed'],
      'cancelled': ['cancelled']
    };
    
    return statusTransitions[currentStatus] || [];
  };

  return (
    <div className={styles.appointmentsManager}>
      
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
            className={`${styles.tabButton} ${activeTab === 'pending' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <i className="fas fa-clock"></i> Chờ xác nhận
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'confirmed' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('confirmed')}
          >
            <i className="fas fa-check-circle"></i> Đã xác nhận
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'completed' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            <i className="fas fa-calendar-check"></i> Đã hoàn thành
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'cancelled' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('cancelled')}
          >
            <i className="fas fa-ban"></i> Đã huỷ
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
                  <div className={styles.customerInfo}>
                    <img 
                      src={appointment.avatar_url || DEFAULT_AVATAR} 
                      alt={appointment.customer_name} 
                      className={styles.customerAvatar}
                    />
                    <div>
                      <h3>{appointment.customer_name}</h3>
                      <p className={styles.customerEmail}>{appointment.customer_email}</p>
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
                    {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                      <>
                        <button 
                          className={styles.updateButton}
                          onClick={() => handleUpdateClick(appointment)}
                          disabled={processing}
                        >
                          <i className="fas fa-edit"></i> Cập nhật trạng thái
                        </button>
                        
                        <button 
                          className={styles.cancelButton}
                          onClick={() => handleCancelAppointment(appointment)}
                          disabled={processing}
                        >
                          <i className="fas fa-times-circle"></i> Huỷ lịch hẹn
                        </button>
                      </>
                    )}
                    
                    <a 
                      href={`mailto:${appointment.customer_email}`} 
                      className={styles.contactButton}
                    >
                      <i className="fas fa-envelope"></i> Liên hệ khách hàng
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
                {activeTab === 'pending' 
                  ? 'Bạn không có lịch hẹn nào đang chờ xác nhận.' 
                  : activeTab === 'confirmed' 
                    ? 'Bạn không có lịch hẹn nào đã xác nhận.' 
                    : activeTab === 'completed'
                      ? 'Bạn không có lịch hẹn nào đã hoàn thành.'
                      : 'Bạn không có lịch hẹn nào đã huỷ.'}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal cập nhật trạng thái lịch hẹn */}
      {showUpdateModal && selectedAppointment && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Cập nhật trạng thái lịch hẹn</h3>
              <button 
                className={styles.closeButton} 
                onClick={handleUpdateModalClose}
                disabled={processing}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Cập nhật trạng thái lịch hẹn với <strong>{selectedAppointment.customer_name}</strong> vào lúc <strong>{formatDate(selectedAppointment.start_time)}</strong></p>
              
              <div className={styles.formGroup}>
                <label htmlFor="updateStatus">Trạng thái:</label>
                <select
                  id="updateStatus"
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  disabled={processing}
                >
                  {getAvailableStatusOptions(selectedAppointment.status).map(status => (
                    <option key={status} value={status}>
                      {getStatusText(status)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="updateNotes">Ghi chú:</label>
                <textarea
                  id="updateNotes"
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="Thêm ghi chú về lịch hẹn này..."
                  rows="4"
                  disabled={processing}
                ></textarea>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelModalButton}
                onClick={handleUpdateModalClose}
                disabled={processing}
              >
                Huỷ
              </button>
              <button 
                className={styles.updateStatusButton}
                onClick={handleUpdateAppointment}
                disabled={processing || updateStatus === selectedAppointment.status}
              >
                {processing ? 'Đang xử lý...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsManager; 