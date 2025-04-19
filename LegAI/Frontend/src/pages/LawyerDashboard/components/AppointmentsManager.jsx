import React, { useState, useEffect } from 'react';
import styles from './AppointmentsManager.module.css';
import appointmentService from '../../../services/appointmentService';
import { DEFAULT_AVATAR } from '../../../config/constants';
import authService from '../../../services/authService';
import { toast } from 'react-toastify';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [appointmentsPerPage] = useState(4);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactCustomer, setContactCustomer] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, [activeTab]);

  const fetchAppointments = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user || !user.id) {
        throw new Error("Không thể xác định ID luật sư");
      }

      setLoading(true);
      setError('');

      const response = await appointmentService.getAppointments(activeTab !== 'all' ? activeTab : null);
      
      if (response.status === 'success' && Array.isArray(response.data)) {
        const enhancedAppointments = response.data.map(app => ({
          ...app,
          customer_name: app.customer_name || app.client_name || app.user_name || 'Khách hàng',
          customer_email: app.customer_email || app.client_email || app.user_email || 'Không có thông tin',
          customer_phone: app.customer_phone || app.client_phone || app.user_phone || '',
          customer_avatar: app.customer_avatar || app.client_avatar || app.user_avatar || DEFAULT_AVATAR
        }));
        
        const sortedAppointments = enhancedAppointments.sort((a, b) => 
          new Date(a.start_time) - new Date(b.start_time)
        );
        
        console.log(`Đã lấy ${sortedAppointments.length} lịch hẹn cho luật sư ID ${user.id}`);
        setAppointments(sortedAppointments);
        setCurrentPage(1);
      } else {
        setError(response.message || "Không thể lấy danh sách lịch hẹn");
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
        setAppointments(prevAppointments => 
          prevAppointments.map(app => 
            app.id === selectedAppointment.id 
              ? { ...app, status: updateStatus, notes: updateNotes } 
              : app
          )
        );
        
        toast.success('Đã cập nhật trạng thái lịch hẹn thành công!');
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
        setAppointments(prevAppointments => 
          prevAppointments.map(app => 
            app.id === appointment.id 
              ? { ...app, status: 'cancelled' } 
              : app
          )
        );
        
        toast.success('Đã huỷ lịch hẹn thành công!');
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

  const totalPages = Math.ceil(appointments.length / appointmentsPerPage);

  const getCurrentAppointments = () => {
    const indexOfLastAppointment = currentPage * appointmentsPerPage;
    const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
    return appointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

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

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    let session = '';
    if (hours >= 5 && hours < 12) {
      session = 'Sáng';
    } else if (hours >= 12 && hours < 18) {
      session = 'Chiều';
    } else {
      session = 'Tối';
    }
    
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    return `${timeString} (${session})`;
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Chờ xác nhận',
      'confirmed': 'Đã xác nhận',
      'completed': 'Đã hoàn thành',
      'cancelled': 'Đã huỷ'
    };
    
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    const statusClassMap = {
      'pending': styles.statusPending,
      'confirmed': styles.statusConfirmed,
      'completed': styles.statusCompleted,
      'cancelled': styles.statusCancelled
    };
    
    return statusClassMap[status] || '';
  };

  const getAvailableStatusOptions = (currentStatus) => {
    const statusTransitions = {
      'pending': ['pending', 'confirmed', 'cancelled'],
      'confirmed': ['confirmed', 'completed', 'cancelled'],
      'completed': ['completed'],
      'cancelled': ['cancelled']
    };
    
    return statusTransitions[currentStatus] || [];
  };

  const handleContactCustomerClick = (appointment) => {
    setContactCustomer({
      name: appointment.customer_name,
      email: appointment.customer_email,
      phone: appointment.customer_phone
    });
    setShowContactModal(true);
  };

  const handleCloseContactModal = () => {
    setShowContactModal(false);
    setContactCustomer(null);
  };

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email)
      .then(() => {
        toast.success('Đã sao chép email vào clipboard');
      })
      .catch(err => {
        console.error('Không thể sao chép: ', err);
        toast.error('Không thể sao chép email');
      });
  };

  const handleCopyPhone = (phone) => {
    if (!phone) return;
    
    navigator.clipboard.writeText(phone)
      .then(() => {
        toast.success('Đã sao chép số điện thoại vào clipboard');
      })
      .catch(err => {
        console.error('Không thể sao chép: ', err);
        toast.error('Không thể sao chép số điện thoại');
      });
  };

  const currentAppointments = getCurrentAppointments();

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
          <button
            className={`${styles.tabButton} ${activeTab === 'all' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Tất cả
          </button>
        </div>
      </div>
      
      <div className={styles.appointmentsContainer}>
        {loading ? (
          <div className={styles.loading}>
            <i className="fas fa-spinner fa-spin"></i>
            <p>Đang tải lịch hẹn...</p>
          </div>
        ) : currentAppointments.length > 0 ? (
          <>
            <div className={styles.appointmentsList}>
              {currentAppointments.map((appointment) => (
                <div key={appointment.id} className={styles.appointmentCard}>
                  <div className={styles.appointmentHeader}>
                    <div className={styles.customerInfo}>
                      <img 
                        src={appointment.customer_avatar || appointment.client_avatar || appointment.avatar_url || DEFAULT_AVATAR} 
                        alt={appointment.customer_name || appointment.client_name || 'Khách hàng'} 
                        className={styles.customerAvatar}
                        onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                      />
                      <div>
                        <h3>{appointment.customer_name || appointment.client_name || 'Khách hàng'}</h3>
                        <p className={styles.customerEmail}>{appointment.customer_email || appointment.client_email || 'Chưa có email'}</p>
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
                          {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
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
                        </>
                      )}
                      
                      <button 
                        className={styles.contactButton}
                        onClick={() => handleContactCustomerClick(appointment)}
                      >
                        <i className="fas fa-envelope"></i> Liên hệ khách hàng
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button 
                  className={`${styles.pageButton} ${currentPage === 1 ? styles.disabled : ''}`}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                
                {[...Array(totalPages).keys()].map((pageNum) => (
                  <button
                    key={pageNum + 1}
                    className={`${styles.pageButton} ${currentPage === pageNum + 1 ? styles.activePage : ''}`}
                    onClick={() => handlePageChange(pageNum + 1)}
                  >
                    {pageNum + 1}
                  </button>
                ))}
                
                <button 
                  className={`${styles.pageButton} ${currentPage === totalPages ? styles.disabled : ''}`}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </>
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
              <p>Cập nhật trạng thái lịch hẹn với <strong>{selectedAppointment.customer_name || selectedAppointment.client_name || 'Khách hàng'}</strong> vào lúc <strong>{formatDate(selectedAppointment.start_time)}</strong></p>
              
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

      {showContactModal && contactCustomer && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Thông tin liên hệ khách hàng</h3>
              <button
                className={styles.closeButton}
                onClick={handleCloseContactModal}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.contactInfo}>
                <div className={styles.contactItem}>
                  <i className="fas fa-user"></i>
                  <span>Tên khách hàng:</span>
                  <span>{contactCustomer.name || 'Chưa cung cấp'}</span>
                </div>

                <div className={styles.contactItem}>
                  <i className="fas fa-envelope"></i>
                  <span>Email:</span>
                  <div className={styles.copyableField}>
                    <span>{contactCustomer.email}</span>
                    <button 
                      className={styles.copyButton}
                      onClick={() => handleCopyEmail(contactCustomer.email)}
                      title="Sao chép email"
                    >
                      <i className="fas fa-copy"></i>
                    </button>
                  </div>
                </div>

                {contactCustomer.phone && (
                  <div className={styles.contactItem}>
                    <i className="fas fa-phone"></i>
                    <span>Số điện thoại:</span>
                    <div className={styles.copyableField}>
                      <span>{contactCustomer.phone}</span>
                      <button 
                        className={styles.copyButton}
                        onClick={() => handleCopyPhone(contactCustomer.phone)}
                        title="Sao chép số điện thoại"
                      >
                        <i className="fas fa-copy"></i>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className={styles.contactActions}>
                <a 
                  href='https://mail.google.com/mail/u/0/#inbox?compose=new'
                  className={styles.emailButton}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fas fa-envelope"></i> Gửi email
                </a>
                
                {contactCustomer.phone && (
                  <a 
                    href={`tel:${contactCustomer.phone}`}
                    className={styles.phoneButton}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fas fa-phone"></i> Gọi điện
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsManager; 