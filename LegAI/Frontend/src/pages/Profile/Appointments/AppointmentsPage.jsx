import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './AppointmentsPage.module.css';
import appointmentService from '../../../services/appointmentService';
import { DEFAULT_AVATAR } from '../../../config/constants';
import { toast } from 'react-toastify';

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
  // Trạng thái phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [appointmentsPerPage] = useState(2);

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
      setError('');

      console.log(`Đang huỷ lịch hẹn ID: ${selectedAppointment.id} với lý do: ${cancelReason || ''}`);

      const reason = cancelReason || '';
      const response = await appointmentService.cancelAppointment(selectedAppointment.id, reason);

      console.log('Phản hồi từ API khi huỷ lịch hẹn:', response);

      if (response && response.status === 'success') {
        setAppointments((prevAppointments) =>
          prevAppointments.map((app) =>
            app.id === selectedAppointment.id ? { ...app, status: 'cancelled' } : app
          )
        );

        toast.success('Lịch hẹn đã được huỷ thành công!');
        setSuccessMessage('Lịch hẹn đã được huỷ thành công.');
        setTimeout(() => setSuccessMessage(''), 5000);
        handleCancelModalClose();
      } else {
        const errorMessage =
          response && response.message
            ? response.message
            : 'Không thể huỷ lịch hẹn. Vui lòng thử lại sau.';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Lỗi khi huỷ lịch hẹn:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Không thể huỷ lịch hẹn. Vui lòng thử lại sau.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessingCancel(false);
    }
  };

  // Lọc lịch hẹn theo tab đang active
  const filteredAppointments = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.start_time);
    const now = new Date();

    if (activeTab === 'upcoming') {
      return (
        appointmentDate >= now &&
        appointment.status !== 'cancelled' &&
        appointment.status !== 'completed'
      );
    } else if (activeTab === 'past') {
      return appointment.status === 'completed'; // Chỉ hiển thị lịch hẹn đã hoàn thành
    } else if (activeTab === 'cancelled') {
      return appointment.status === 'cancelled';
    }

    return true;
  });

  // Sắp xếp lịch hẹn theo thời gian (giữ logic mặc định)
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    return activeTab === 'upcoming'
      ? new Date(a.start_time) - new Date(b.start_time)
      : new Date(b.start_time) - new Date(a.start_time);
  });

  // Phân trang
  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const currentAppointments = sortedAppointments.slice(
    indexOfFirstAppointment,
    indexOfLastAppointment
  );
  const totalPages = Math.ceil(sortedAppointments.length / appointmentsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Format date cho người dùng Việt Nam
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Ho_Chi_Minh' // Thêm múi giờ Việt Nam
    };
    return date.toLocaleDateString('vi-VN', options);
  };

  // Hiển thị trạng thái lịch hẹn bằng tiếng Việt
  const getStatusText = (status) => {
    const statusMap = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      completed: 'Đã hoàn thành',
      cancelled: 'Đã huỷ',
    };
    return statusMap[status] || status;
  };

  // Lấy class CSS tương ứng với trạng thái
  const getStatusClass = (status) => {
    const statusClassMap = {
      pending: styles.statusPending,
      confirmed: styles.statusConfirmed,
      completed: styles.statusCompleted,
      cancelled: styles.statusCancelled,
    };
    return statusClassMap[status] || '';
  };

  // Kiểm tra xem lịch hẹn có thể huỷ không
  const canCancelAppointment = (appointment) => {
    const appointmentDate = new Date(appointment.start_time);
    const now = new Date();
    return !(
      appointmentDate < now ||
      appointment.status === 'cancelled' ||
      appointment.status === 'completed'
    );
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
            onClick={() => {
              setActiveTab('upcoming');
              setCurrentPage(1);
            }}
          >
            <i className="fas fa-calendar-alt"></i> Sắp tới
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'past' ? styles.activeTab : ''}`}
            onClick={() => {
              setActiveTab('past');
              setCurrentPage(1);
            }}
          >
            <i className="fas fa-history"></i> Đã qua
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'cancelled' ? styles.activeTab : ''}`}
            onClick={() => {
              setActiveTab('cancelled');
              setCurrentPage(1);
            }}
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
        ) : currentAppointments.length > 0 ? (
          <>
            <div className={styles.appointmentsList}>
              {currentAppointments.map((appointment) => (
                <div key={appointment.id} className={styles.appointmentCard}>
                  <div className={styles.appointmentHeader}>
                    <div className={styles.lawyerInfo}>
                      <img
                        src={appointment.avatar_url || appointment.lawyer_avatar || DEFAULT_AVATAR}
                        alt={appointment.lawyer_name || 'Luật sư'}
                        className={styles.lawyerAvatar}
                        onError={(e) => {
                          e.target.src = DEFAULT_AVATAR;
                        }}
                      />
                      <div>
                        <h3>{appointment.lawyer_name || 'Luật sư'}</h3>
                        <p className={styles.specialization}>
                          {appointment.specialization || appointment.lawyer_specialization || 'Chuyên gia pháp lý'}
                        </p>
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
                          {new Date(appointment.start_time).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Asia/Ho_Chi_Minh'
                          })}{' '}
                          -{' '}
                          {new Date(appointment.end_time).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Asia/Ho_Chi_Minh'
                          })}
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

                      {appointment.location && (
                        <div className={styles.detailItem}>
                          <i className="fas fa-map-marker-alt"></i>
                          <span>Địa điểm:</span>
                          <span>{appointment.location}</span>
                        </div>
                      )}

                      {appointment.lawyer_email && (
                        <div className={styles.detailItem}>
                          <i className="fas fa-envelope"></i>
                          <span>Email:</span>
                          <span>{appointment.lawyer_email}</span>
                        </div>
                      )}

                      {appointment.lawyer_phone && (
                        <div className={styles.detailItem}>
                          <i className="fas fa-phone"></i>
                          <span>Số điện thoại:</span>
                          <span>{appointment.lawyer_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.appointmentFooter}>
                    <div className={styles.appointmentActions}>
                      {canCancelAppointment(appointment) && (
                        <button
                          className={styles.cancelButton}
                          onClick={() => handleCancelClick(appointment)}
                        >
                          <i className="fas fa-times-circle"></i> Huỷ lịch hẹn
                        </button>
                      )}
                      {appointment.lawyer_email && (
                        <a href={`mailto:${appointment.lawyer_email}`} className={styles.contactButton}>
                          <i className="fas fa-envelope"></i> Liên hệ luật sư
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, index) => (
                  <button
                    key={index + 1}
                    className={currentPage === index + 1 ? styles.activePage : ''}
                    onClick={() => handlePageChange(index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Sau
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
                {activeTab === 'upcoming'
                  ? 'Bạn chưa có lịch hẹn nào sắp tới.'
                  : activeTab === 'past'
                    ? 'Bạn chưa có lịch hẹn nào đã hoàn thành.'
                    : 'Bạn chưa huỷ lịch hẹn nào.'}
              </p>
              <Link to="/lawyers" className={styles.bookButton}>
                <i className="fas fa-search"></i> Đặt lịch hẹn
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
              <p>
                Bạn có chắc chắn muốn huỷ lịch hẹn với{' '}
                <strong>{selectedAppointment.lawyer_name || 'Luật sư'}</strong> vào lúc{' '}
                <strong>{formatDate(selectedAppointment.start_time)}</strong>?
              </p>

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