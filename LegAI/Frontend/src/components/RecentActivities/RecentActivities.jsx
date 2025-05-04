import React, { useState, useEffect } from 'react';
import { 
  FaFileAlt, FaGavel, FaCalendarCheck, FaMoneyBillWave, 
  FaComment, FaUserCircle, FaSearch, FaHourglassHalf 
} from 'react-icons/fa';
import styles from './RecentActivities.module.css';
import authService from '../../services/authService';
import legalCaseService from '../../services/legalCaseService';
import appointmentService from '../../services/appointmentService';
import { getLawyerTransactions } from '../../services/transactionService';
import aiService from '../../services/aiService';

const RecentActivities = () => {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({
    documents: 0,
    cases: 0,
    appointments: 0,
    consultations: 0
  });
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      fetchAllActivities(currentUser);
    }
  }, []);
  
  const fetchAllActivities = async (currentUser) => {
    setLoading(true);
    try {
      // Get all activities from different sources
      const activitiesPromises = [
        fetchLegalCases(currentUser),
        fetchAppointments(currentUser),
        fetchTransactions(currentUser),
        fetchAIConsultations(currentUser)
      ];
      
      const [cases, appointments, transactions, consultations] = await Promise.all(activitiesPromises);
      
      // Combine all activities
      const allActivities = [
        ...cases.map(item => ({ ...item, type: 'case' })),
        ...appointments.map(item => ({ ...item, type: 'appointment' })),
        ...transactions.map(item => ({ ...item, type: 'transaction' })),
        ...consultations.map(item => ({ ...item, type: 'consultation' }))
      ];
      
      // Sort by date, newest first
      allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Update state
      setActivities(allActivities.slice(0, 10)); // Show only the 10 most recent activities
      setStats({
        documents: 0, // We can add this if there's a document service
        cases: cases.length,
        appointments: appointments.length,
        consultations: consultations.length
      });
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchLegalCases = async (currentUser) => {
    try {
      const isLawyer = currentUser.role?.toLowerCase() === 'lawyer';
      let response;
      
      if (isLawyer) {
        response = await legalCaseService.getLawyerCases();
      } else {
        response = await legalCaseService.getLegalCases();
      }
      
      if (response && response.success && response.data) {
        return response.data.map(caseItem => ({
          id: caseItem.id,
          title: caseItem.title || 'Vụ án không tiêu đề',
          description: `Trạng thái: ${getStatusText(caseItem.status)}`,
          timestamp: caseItem.updated_at || caseItem.created_at,
          status: caseItem.status,
          url: `/legal-cases/${caseItem.id}`
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching legal cases:', error);
      return [];
    }
  };
  
  const fetchAppointments = async (currentUser) => {
    try {
      const response = await appointmentService.getAppointments();
      
      if (response && response.status === 'success' && response.data) {
        return response.data.map(appointment => ({
          id: appointment.id,
          title: appointment.purpose || 'Cuộc hẹn với luật sư',
          description: `${appointment.lawyer_name || 'Luật sư'} - ${formatDate(appointment.start_time)}`,
          timestamp: appointment.created_at,
          status: appointment.status,
          url: `/profile?tab=appointments`
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }
  };
  
  const fetchTransactions = async (currentUser) => {
    try {
      const isLawyer = currentUser.role?.toLowerCase() === 'lawyer';
      let transactions = [];
      
      if (isLawyer) {
        const response = await getLawyerTransactions();
        if (response && response.success && response.data && response.data.transactions) {
          transactions = response.data.transactions;
        }
      }
      // For non-lawyers, we could add code to fetch client-side transactions if available
      
      return transactions.map(transaction => ({
        id: transaction.id,
        title: `Giao dịch ${formatMoney(transaction.amount)} VND`,
        description: transaction.description || (transaction.case_title ? `Vụ án: ${transaction.case_title}` : 'Thanh toán'),
        timestamp: transaction.created_at,
        status: transaction.status,
        url: isLawyer ? `/lawyer-dashboard/transactions` : `/profile?tab=history`
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  };
  
  const fetchAIConsultations = async (currentUser) => {
    try {
      const response = await aiService.getMyAIChatHistory();
      
      if (response && response.success && response.data) {
        return response.data.map(consultation => ({
          id: consultation.id,
          title: 'Tư vấn AI',
          description: consultation.question?.substring(0, 50) + (consultation.question?.length > 50 ? '...' : ''),
          timestamp: consultation.created_at,
          status: 'completed',
          url: `/profile?tab=activity`
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching AI consultations:', error);
      return [];
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Không có ngày';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Ngày không hợp lệ';
    }
  };
  
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };
  
  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Đang xử lý',
      'assigned': 'Đã phân công',
      'in_progress': 'Đang tiến hành',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy',
      'paid': 'Đã thanh toán',
      'waiting': 'Đang chờ',
      'accepted': 'Đã chấp nhận',
      'rejected': 'Đã từ chối'
    };
    
    return statusMap[status] || status;
  };
  
  const getStatusColor = (status) => {
    const statusColorMap = {
      'pending': '#f39c12', // Amber
      'assigned': '#3498db', // Blue
      'in_progress': '#3498db', // Blue
      'completed': '#2ecc71', // Green
      'cancelled': '#e74c3c', // Red
      'paid': '#2ecc71', // Green
      'waiting': '#f39c12', // Amber
      'accepted': '#2ecc71', // Green
      'rejected': '#e74c3c' // Red
    };
    
    return statusColorMap[status] || '#7f8c8d'; // Default gray
  };
  
  const getActivityIcon = (type, status) => {
    switch(type) {
      case 'case':
        return <FaGavel className={styles.activityIcon} />;
      case 'appointment':
        return <FaCalendarCheck className={styles.activityIcon} />;
      case 'transaction':
        return <FaMoneyBillWave className={styles.activityIcon} />;
      case 'consultation':
        return <FaComment className={styles.activityIcon} />;
      default:
        return <FaFileAlt className={styles.activityIcon} />;
    }
  };
  
  const navigateToActivity = (url, event) => {
    if (event) {
      event.preventDefault();
    }
    
    // Thêm console.log để debug
    console.log('Cố gắng điều hướng đến:', url);
    
    // Kiểm tra URL hợp lệ
    if (!url) {
      console.error('URL không hợp lệ:', url);
      return;
    }
    
    // Danh sách các đường dẫn có sẵn trong hệ thống
    const validRoutes = [
      '/legal-cases',
      '/profile',
      '/payment',
      '/contracts',
      '/legal-docs'
    ];
    
    // Kiểm tra xem URL có nằm trong danh sách các đường dẫn hợp lệ không
    const isValidRoute = validRoutes.some(route => url.startsWith(route));
    
    // Nếu là đường dẫn không tồn tại, hiển thị thông báo
    if (!isValidRoute) {
      console.error('Đường dẫn không tồn tại trong hệ thống:', url);
      alert('Chức năng này chưa được triển khai!');
      return;
    }
    
    try {
      // Sử dụng chuyển hướng window.location trực tiếp
      console.log('Điều hướng bằng window.location.href đến:', url);
      window.location.href = url;
    } catch (error) {
      console.error('Lỗi khi điều hướng:', error);
    }
  };
  
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <FaHourglassHalf className={styles.loadingIcon} />
        <p>Đang tải hoạt động gần đây...</p>
      </div>
    );
  }
  
  return (
    <div className={styles.recentActivitiesContainer}>
      <div className={styles.statsCards}>
        <div className={styles.statCard} onClick={() => navigateToActivity('/legal-cases')}>
          <div className={styles.statIcon}>
            <FaGavel />
          </div>
          <div className={styles.statValue}>{stats.cases}</div>
          <div className={styles.statLabel}>Vụ án</div>
        </div>
        
        <div className={styles.statCard} onClick={() => navigateToActivity('/profile?tab=appointments')}>
          <div className={styles.statIcon}>
            <FaCalendarCheck />
          </div>
          <div className={styles.statValue}>{stats.appointments}</div>
          <div className={styles.statLabel}>Cuộc hẹn</div>
        </div>
        
        <div className={styles.statCard} onClick={() => navigateToActivity('/profile?tab=activity')}>
          <div className={styles.statIcon}>
            <FaUserCircle />
          </div>
          <div className={styles.statValue}>{stats.consultations}</div>
          <div className={styles.statLabel}>Tư vấn</div>
        </div>
      </div>
      
      <div className={styles.activitiesList}>
        <h3 className={styles.activitiesTitle}>Hoạt động gần đây</h3>
        
        {activities.length === 0 ? (
          <div className={styles.emptyState}>
            <FaSearch className={styles.emptyStateIcon} />
            <p>Chưa có hoạt động nào gần đây</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <div 
              key={`${activity.type}-${activity.id}-${index}`} 
              className={styles.activityItem}
              onClick={(e) => navigateToActivity(activity.url, e)}
            >
              <div className={styles.activityIconContainer}>
                {getActivityIcon(activity.type)}
              </div>
              
              <div className={styles.activityContent}>
                <div className={styles.activityHeader}>
                  <h4 className={styles.activityTitle}>{activity.title}</h4>
                  <span 
                    className={styles.activityStatus}
                    style={{ backgroundColor: getStatusColor(activity.status) }}
                  >
                    {getStatusText(activity.status)}
                  </span>
                </div>
                
                <p className={styles.activityDescription}>
                  {activity.description}
                </p>
                
                <div className={styles.activityTimestamp}>
                  {formatDate(activity.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className={styles.activityLinks}>
        <a 
          href="#" 
          className={styles.activityLink}
          onClick={(e) => navigateToActivity('/legal-cases', e)}
        >
          <FaGavel /> Xem vụ án của tôi
        </a>
        <a 
          href="#" 
          className={styles.activityLink}
          onClick={(e) => navigateToActivity('/profile?tab=appointments', e)}
        >
          <FaCalendarCheck /> Quản lý cuộc hẹn
        </a>
        <a 
          href="#" 
          className={styles.activityLink}
          onClick={(e) => navigateToActivity('/profile?tab=activity', e)}
        >
          <FaComment /> Lịch sử tư vấn
        </a>
      </div>
    </div>
  );
};

export default RecentActivities; 