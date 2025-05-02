import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Button, Tabs, Descriptions, Tag, Spin, Space, message, Divider, List, Modal, Select, InputNumber, Avatar, Rate, Layout, Row, Col, Empty, Input, Alert } from 'antd';
import { DownloadOutlined, DeleteOutlined, EditOutlined, FileOutlined, FilePdfOutlined, FileWordOutlined, FileImageOutlined, UserOutlined, DollarOutlined, SendOutlined, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import legalCaseService from '../../services/legalCaseService';
import userService from '../../services/userService';
import styles from './LegalCase.module.css';
import moment from 'moment';
import Navbar from '../../components/layout/Nav/Navbar';
import authService from '../../services/authService';
import appointmentService from '../../services/appointmentService';
import transactionService from '../../services/transactionService';
import axios from 'axios';
import { API_URL } from '../../config/constants';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { confirm } = Modal;
const { Content } = Layout;

// Hàm helper để lấy headers đã có token
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

const LegalCaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState({});
  const [lawyerDetails, setLawyerDetails] = useState(null);
  const [lawyers, setLawyers] = useState([]);
  const [lawyersLoading, setLawyersLoading] = useState(false);
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [disputeValue, setDisputeValue] = useState(0);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [assigningLawyer, setAssigningLawyer] = useState(false);
  const [isAssignedLawyer, setIsAssignedLawyer] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [notes, setNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  // Lấy thông tin vụ án
  useEffect(() => {
    const fetchCaseData = async () => {
      try {
        setLoading(true);
        const response = await legalCaseService.getLegalCaseById(id);

        if (response && response.success && response.data) {
          console.log('Dữ liệu vụ án nhận từ server:', response.data);
          
          // Đảm bảo các trường dữ liệu luôn tồn tại
          const caseWithDefaults = {
            ...response.data,
            lawyer: response.data.lawyer || null,
          };
          
          setCaseData(caseWithDefaults);
          
          // Kiểm tra quyền và vai trò
          const userData = authService.getCurrentUser() || {};
          const isAssigned = caseWithDefaults.lawyer && 
                             userData.id && 
                             caseWithDefaults.lawyer.id === userData.id;
          
          // Kiểm tra role không phân biệt hoa thường
          const userRole = userData.role ? userData.role.toLowerCase() : '';
          const isAdminUser = userRole === 'admin';
          const isLawyer = userRole === 'lawyer' || userRole === 'luật sư';
          const isOwner = caseWithDefaults.user_id === userData.id;
          
          console.log('Thông tin vai trò người dùng:', {
            userId: userData.id,
            role: userRole,
            lawyerId: caseWithDefaults.lawyer?.id,
            isAssigned,
            isLawyer,
            isAdmin: isAdminUser,
            isOwner,
            case_id: caseWithDefaults.id,
            payment_status: caseWithDefaults.payment_status,
            case_status: caseWithDefaults.status
          });
          
          setIsAssignedLawyer(isAssigned || (isLawyer && isAssigned));
          setIsAdmin(isAdminUser);
          setIsOwner(isOwner);
          
          // Nếu có luật sư, lấy thông tin chi tiết (hoặc dùng từ dữ liệu có sẵn)
          if (caseWithDefaults.lawyer && caseWithDefaults.lawyer.id) {
            fetchLawyerDetails(caseWithDefaults.lawyer.id);
          }
        } else {
          message.error(response?.message || 'Không thể tải thông tin vụ án');
          navigate('/legal-cases');
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin vụ án:', error);
        message.error('Không thể tải thông tin vụ án. Vui lòng thử lại sau.');
        navigate('/legal-cases');
      } finally {
        setLoading(false);
      }
    };

    fetchCaseData();
  }, [id, navigate]);

  // Lấy thông tin chi tiết luật sư
  const fetchLawyerDetails = async (lawyerId) => {
    try {
      const response = await userService.getLawyerById(lawyerId);
      
      if (response && response.data) {
        console.log('Thông tin luật sư từ API:', response.data);
        setLawyerDetails(response.data);
        
        // Cập nhật lại caseData.lawyer với thông tin chi tiết
        setCaseData(prevData => {
          const updatedLawyer = {
            ...(prevData.lawyer || {}),
            specialization: response.data.specialization || prevData.lawyer?.specialization,
            experience_years: response.data.experience_years || response.data.experienceYears || prevData.lawyer?.experience_years || prevData.lawyer?.experienceYears || 0,
            rating: response.data.rating || prevData.lawyer?.rating || 0
          };
          
          return {
            ...prevData,
            lawyer: updatedLawyer
          };
        });
      } else if (response) {
        console.log('Thông tin luật sư từ API:', response);
        setLawyerDetails(response);
        
        // Cập nhật lại caseData.lawyer với thông tin chi tiết
        setCaseData(prevData => {
          const updatedLawyer = {
            ...(prevData.lawyer || {}),
            specialization: response.specialization || prevData.lawyer?.specialization,
            experience_years: response.experience_years || response.experienceYears || prevData.lawyer?.experience_years || prevData.lawyer?.experienceYears || 0,
            rating: response.rating || prevData.lawyer?.rating || 0
          };
          
          return {
            ...prevData,
            lawyer: updatedLawyer
          };
        });
      } else {
        console.log('Không nhận được thông tin luật sư từ API hoặc dữ liệu không hợp lệ');
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin chi tiết luật sư:', error);
      // Không hiện thông báo lỗi cho người dùng, chỉ ghi log
    }
  };

  // Xử lý tải xuống tài liệu
  const handleDownloadDocument = async () => {
    try {
      const blob = await legalCaseService.downloadDocument(id);

      // Tạo tên file từ tiêu đề vụ án
      let fileName = `document-${id}.pdf`;
      if (caseData && caseData.title) {
        // Xử lý tên file hợp lệ từ tiêu đề
        fileName = `${caseData.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      }

      // Tạo URL tạm thời và tải xuống
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success('Đã tải xuống tài liệu');
    } catch (error) {
      console.error('Lỗi khi tải xuống tài liệu:', error);
      message.error('Không thể tải xuống tài liệu. Vui lòng thử lại sau.');
    }
  };

  // Xử lý xóa vụ án
  const handleDeleteCase = () => {
    confirm({
      title: 'Xác nhận xóa vụ án',
      content: 'Bạn có chắc chắn muốn xóa vụ án này? Hành động này không thể khôi phục.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const response = await legalCaseService.deleteLegalCase(id);

          if (response.success) {
            message.success('Đã xóa vụ án thành công');
            navigate('/legal-cases');
          } else {
            message.error(response.message || 'Không thể xóa vụ án');
          }
        } catch (error) {
          console.error('Lỗi khi xóa vụ án:', error);
          message.error('Không thể xóa vụ án. Vui lòng thử lại sau.');
        }
      },
    });
  };

  // Lấy danh sách luật sư
  const fetchLawyers = async () => {
    try {
      setLawyersLoading(true);
      
      // Sử dụng API appointments thay vì user appointments
      const appointmentResponse = await appointmentService.getAppointments('confirmed');
      
      if (appointmentResponse && appointmentResponse.status === 'success' && Array.isArray(appointmentResponse.data)) {
        // Lấy danh sách các lịch hẹn đã xác nhận
        const confirmedAppointments = appointmentResponse.data.filter(
          app => app.status === 'confirmed' || app.status === 'completed'
        );
        
        if (confirmedAppointments.length > 0) {
          // Tạo danh sách luật sư từ các lịch hẹn đã xác nhận
          const lawyersList = confirmedAppointments.map(app => {
            // Đảm bảo các trường thông tin luật sư là đúng
            const lawyerId = app.lawyer_id || 0;
            // Kiểm tra xem có thông tin luật sư hợp lệ không
            if (!lawyerId || lawyerId <= 0) {
              return null; // Bỏ qua nếu không có ID hợp lệ
            }
            
            return {
              id: lawyerId,
              fullName: app.lawyer_name || 'Luật sư',
              rating: app.rating || 0,
              specialization: app.specialization || 'Luật sư đa lĩnh vực',
              avatar: app.avatar_url || app.lawyer_avatar || null
            };
          }).filter(lawyer => lawyer !== null); // Loại bỏ các mục null
          
          // Loại bỏ luật sư trùng lặp
          const uniqueLawyers = [];
          const uniqueIds = new Set();
          
          lawyersList.forEach(lawyer => {
            if (lawyer && lawyer.id && !uniqueIds.has(lawyer.id)) {
              uniqueIds.add(lawyer.id);
              uniqueLawyers.push(lawyer);
            }
          });
          
          setLawyers(uniqueLawyers);
        } else {
          setLawyers([]);
          message.info('Bạn chưa có lịch hẹn nào được xác nhận với luật sư. Vui lòng đặt lịch hẹn trước.');
        }
      } else {
        message.error('Không thể tải danh sách luật sư từ lịch hẹn');
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách luật sư từ lịch hẹn:', error);
      message.error('Không thể tải danh sách luật sư. Vui lòng thử lại sau.');
    } finally {
      setLawyersLoading(false);
    }
  };

  // Xử lý khi chọn luật sư cho vụ án
  const handleAssignLawyer = async (lawyerId) => {
    try {
      setAssigningLawyer(true);

      // Kiểm tra lawyerId có hợp lệ không
      if (!lawyerId) {
        message.error('ID luật sư không hợp lệ');
        setAssigningLawyer(false);
        return;
      }

      // Hiển thị xác nhận
      confirm({
        title: 'Xác nhận chọn luật sư',
        content: 'Khi bạn chọn luật sư, vụ án sẽ được gửi đến luật sư để được tư vấn. Bạn có chắc chắn muốn tiếp tục?',
        okText: 'Xác nhận',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            const response = await legalCaseService.assignLawyer(id, lawyerId);

            if (response.success) {
              message.success('Đã gán luật sư thành công');
              
              // Lấy thông tin vụ án mới nhất sau khi gán luật sư
              const updatedCase = await legalCaseService.getLegalCaseById(id);
              
              if (updatedCase.success && updatedCase.data) {
                // Cập nhật dữ liệu với thông tin mới
                console.log('Dữ liệu vụ án sau khi gán luật sư:', updatedCase.data);
                
                // Cập nhật state với thông tin mới
                setCaseData(updatedCase.data);
                
                // Nếu có thông tin luật sư, lấy thêm thông tin chi tiết
                if (updatedCase.data.lawyer && updatedCase.data.lawyer.id) {
                  fetchLawyerDetails(updatedCase.data.lawyer.id);
                }
                
                // Đóng danh sách luật sư sau khi chọn thành công
                setLawyers([]);
              }
            } else {
              message.error(response.message || 'Không thể gán luật sư');
            }
          } catch (error) {
            console.error('Lỗi khi gán luật sư:', error);
            message.error('Không thể gán luật sư. Vui lòng thử lại sau.');
          } finally {
            setAssigningLawyer(false);
          }
        },
        onCancel() {
          setAssigningLawyer(false);
        },
      });
    } catch (error) {
      console.error('Lỗi khi xử lý chọn luật sư:', error);
      message.error('Không thể xử lý yêu cầu. Vui lòng thử lại sau.');
      setAssigningLawyer(false);
    }
  };

  // Xử lý tính phí vụ án
  const handleCalculateFee = async () => {
    console.log('BẮT ĐẦU TÍNH PHÍ');
    
    try {
      // Kiểm tra xem người dùng đã nhập giá trị tranh chấp chưa
      const disputeValueToUse = disputeValue || 0; // Dùng giá trị mặc định nếu không có
      
      // Hiển thị loading
      setCalculatingFee(true);
      message.loading('Đang tính phí...', 0);
      
      // Tham số cho tính phí
      const parameters = {
        dispute_value: disputeValueToUse
      };
      
      console.log('Gửi yêu cầu tính phí với giá trị tranh chấp:', disputeValueToUse);
      
      // Gọi API tính phí
      const response = await legalCaseService.calculateFee(id, parameters);
      
      message.destroy(); // Xóa thông báo loading
      
      if (response && response.success) {
        message.success('Đã tính phí thành công');
        
        // Cập nhật lại thông tin vụ án
        await fetchCaseDetails();
      } else {
        message.error(response?.message || 'Không thể tính phí');
      }
    } catch (error) {
      console.error('Lỗi khi tính phí vụ án:', error);
      message.destroy(); // Xóa thông báo loading
      
      if (error.response && error.response.status === 403) {
        message.error('Chỉ luật sư được gán cho vụ án này mới có quyền tính phí');
      } else {
        message.error('Không thể tính phí vụ án. Vui lòng thử lại sau.');
      }
    } finally {
      setCalculatingFee(false);
    }
  };

  // Thêm hàm refreshPaymentStatus
  const refreshPaymentStatus = async () => {
    try {
      message.loading('Đang kiểm tra trạng thái thanh toán...', 0);
      
      // Kiểm tra trạng thái thanh toán hiện tại
      const response = await legalCaseService.checkPaymentStatus(id);
      
      message.destroy();
      
      if (response && response.success && response.data) {
        // Cập nhật trạng thái trong state
        setCaseData(prevData => ({
          ...prevData,
          payment_status: response.data.payment_status,
          status: response.data.status,
          has_transactions: response.data.has_transactions,
          transactions: response.data.transactions || []
        }));
        console.log('Đã cập nhật trạng thái thanh toán:', response.data);
        message.success('Đã cập nhật trạng thái thanh toán mới nhất');
      } else {
        console.error('Không nhận được dữ liệu thanh toán hợp lệ:', response);
        message.error(response?.message || 'Không thể kiểm tra trạng thái thanh toán');
      }
    } catch (error) {
      console.error('Lỗi khi làm mới trạng thái thanh toán:', error);
      message.destroy();
      message.error('Không thể kiểm tra trạng thái thanh toán. Vui lòng thử lại sau.');
    }
  };

  // Thêm useEffect để tự động làm mới trạng thái thanh toán mỗi 10 giây
  useEffect(() => {
    // Nếu đã có dữ liệu vụ án, kiểm tra trạng thái thanh toán định kỳ
    if (caseData && caseData.id) {
      const intervalId = setInterval(() => {
        // Chỉ tự động làm mới nếu đang ở trạng thái chờ xác nhận
        if (caseData.payment_status === 'pending' || caseData.status === 'pending') {
          refreshPaymentStatus();
        }
      }, 10000); // 10 giây
      
      return () => clearInterval(intervalId);
    }
  }, [caseData?.id, caseData?.payment_status, caseData?.status]);

  // Thêm useEffect kiểm tra tình trạng giao dịch
  useEffect(() => {
    const checkExistingTransactions = async () => {
      if (caseData && caseData.id) {
        try {
          console.log('Kiểm tra giao dịch cho vụ án ID:', caseData.id);
          
          // Gọi API lấy tất cả giao dịch liên quan đến vụ án này
          const transactionsResponse = await axios.get(
            `${API_URL}/transactions/case/${caseData.id}`,
            getHeaders()
          );
          
          if (transactionsResponse.data.success && 
              transactionsResponse.data.data && 
              transactionsResponse.data.data.length > 0) {
            
            console.log('Tìm thấy các giao dịch:', transactionsResponse.data.data);
            
            // Đã có giao dịch, cập nhật trạng thái vụ án trong state
            setCaseData(prevData => ({
              ...prevData,
              has_transactions: true,
              transactions: transactionsResponse.data.data,
              // Nếu có giao dịch, đặt payment_status là pending nếu chưa có giá trị
              payment_status: prevData.payment_status || 'pending'
            }));
          }
        } catch (error) {
          console.error('Lỗi khi kiểm tra giao dịch hiện có:', error);
        }
      }
    };
    
    checkExistingTransactions();
  }, [caseData?.id]);

  // Cập nhật hàm handlePayment
  const handlePayment = async () => {
    try {
      setLoadingPayment(true);
      message.loading('Đang xử lý yêu cầu thanh toán...', 0);
      
      // Kiểm tra xem vụ án đã có thông tin phí chưa
      if (!caseData.fee_amount || caseData.fee_amount <= 0) {
        // Nếu chưa có phí, thực hiện tính phí tự động
        const feeResponse = await legalCaseService.calculateLegalFeeAutomatic(caseData);
        
        if (!feeResponse || !feeResponse.success) {
          message.error('Không thể tính phí vụ án. Vui lòng thử lại sau.');
          setLoadingPayment(false);
          message.destroy();
          return;
        }
        
        console.log('Phí tự động được tính:', feeResponse.data);
      } else {
        console.log('Vụ án đã có thông tin phí:', caseData.fee_amount);
      }
      
      // Tạo giao dịch thanh toán
      const paymentResponse = await legalCaseService.createPayment(id, 'bank_transfer');
      
      if (paymentResponse && paymentResponse.success && paymentResponse.data && paymentResponse.data.transaction_id) {
        message.success('Tạo giao dịch thanh toán thành công');
        
        // Làm mới dữ liệu vụ án để cập nhật trạng thái
        const updatedCase = await legalCaseService.getLegalCaseById(id);
        if (updatedCase && updatedCase.success) {
          setCaseData(updatedCase.data);
        }
        
        // Chuyển hướng đến trang thanh toán với ID giao dịch và số tiền
        navigate(`/payment?transaction_id=${paymentResponse.data.transaction_id}&amount=${paymentResponse.data.amount}`);
      } else {
        // Xử lý trường hợp không nhận được ID giao dịch
        console.error('Không nhận được ID giao dịch hợp lệ:', paymentResponse);
        message.error(paymentResponse?.message || 'Không thể tạo giao dịch thanh toán. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Lỗi khi xử lý thanh toán:', error);
      message.error('Có lỗi xảy ra khi xử lý thanh toán. Vui lòng thử lại sau.');
    } finally {
      setLoadingPayment(false);
      message.destroy();
    }
  };

  // Thêm hàm để lưu ghi chú luật sư
  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      
      // Kiểm tra quyền chỉnh sửa
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const assignedLawyerId = caseData.lawyer?.id;
      const isExactAssignedLawyer = 
          assignedLawyerId && 
          userData.id && 
          String(assignedLawyerId) === String(userData.id);
      
      if (!isExactAssignedLawyer && !isAdmin) {
        message.error('Chỉ luật sư được gán cho vụ án này mới có quyền chỉnh sửa ghi chú');
        return;
      }
      
      // Gọi API để cập nhật ghi chú
      const response = await legalCaseService.updateCaseStatus(
        id, 
        caseData.status || 'pending', // Giữ nguyên status hiện tại
        notes
      );
      
      if (response && response.success) {
        message.success('Đã cập nhật ghi chú thành công');
        
        // Cập nhật lại thông tin vụ án
        const updatedCase = await legalCaseService.getLegalCaseById(id);
        if (updatedCase.success) {
          setCaseData(updatedCase.data);
        }
        
        // Tắt trạng thái chỉnh sửa
        setEditingNotes(false);
      } else {
        message.error('Không thể cập nhật ghi chú. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật ghi chú:', error);
      message.error('Không thể cập nhật ghi chú. Vui lòng thử lại sau.');
    } finally {
      setSavingNotes(false);
    }
  };

  // Hiển thị ghi chú luật sư nếu có
  const renderLawyerNotes = () => {
    if (!caseData) {
      return <Empty description="Chưa có ghi chú" />;
    }
    
    // Cập nhật notes từ caseData khi bắt đầu chỉnh sửa
    const startEditing = () => {
      setNotes(caseData.notes || '');
      setEditingNotes(true);
    };
    
    // Hủy chỉnh sửa
    const cancelEditing = () => {
      setEditingNotes(false);
      setNotes(caseData.notes || '');
    };
    
    // Kiểm tra quyền chỉnh sửa - chỉ cho luật sư được phân công
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const assignedLawyerId = caseData.lawyer?.id;
    const canEditNotes = 
        (assignedLawyerId && 
        userData.id && 
        String(assignedLawyerId) === String(userData.id));
    
    return (
      <div className={styles.lawyerNotes}>
        {editingNotes ? (
          <Card className={styles.notesCard}>
            <div className={styles.notesEditContainer}>
              <Input.TextArea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                autoSize={{ minRows: 4, maxRows: 8 }}
                placeholder="Nhập ghi chú về vụ án..."
              />
              <div className={styles.notesEditActions}>
                <Button
                  type="primary"
                  onClick={handleSaveNotes}
                  loading={savingNotes}
                >
                  Lưu
                </Button>
                <Button onClick={cancelEditing}>
                  Hủy
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card 
            className={styles.notesCard}
            title={canEditNotes && (
              <Button 
                type="link" 
                icon={<EditOutlined />} 
                onClick={startEditing}
              >
                Chỉnh sửa
              </Button>
            )}
          >
            {caseData.notes ? (
              <div className={styles.notesContent}>
                {caseData.notes.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            ) : (
              <Empty description="Chưa có ghi chú" />
            )}
          </Card>
        )}
      </div>
    );
  };

  // Hiển thị icon tương ứng với loại file
  const renderFileIcon = (mimeType) => {
    if (mimeType && mimeType.includes('pdf')) {
      return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
    } else if (mimeType && (mimeType.includes('word') || mimeType.includes('document'))) {
      return <FileWordOutlined style={{ color: '#1890ff' }} />;
    } else if (mimeType && mimeType.includes('image')) {
      return <FileImageOutlined style={{ color: '#52c41a' }} />;
    } else {
      return <FileOutlined />;
    }
  };

  // Định dạng trạng thái vụ án
  const renderStatus = (status) => {
    switch (status) {
      case 'draft':
        return <Tag color="blue">Nháp</Tag>;
      case 'pending':
        return <Tag color="orange">Đang chờ thanh toán</Tag>;
      case 'in_progress':
        return <Tag color="processing">Đang xử lý</Tag>;
      case 'paid':
        return <Tag color="green">Đã thanh toán</Tag>;
      case 'completed':
        return <Tag color="success">Hoàn thành</Tag>;
      case 'cancelled':
        return <Tag color="red">Đã hủy</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  // Định dạng tiền tệ
  const formatCurrency = (amount) => {
    if (!amount) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Cập nhật hàm renderPaymentStatus
  const renderPaymentStatus = () => {
    if (!caseData) return null;
    
    // Xác định trạng thái thanh toán dựa trên dữ liệu từ caseData và transactions
    // Kiểm tra cả hai trường payment_status và status để đảm bảo tính chính xác
    const isPaid = caseData.payment_status === 'completed' || 
                   caseData.status === 'paid' || 
                   caseData.status === 'completed';
                   
    // Kiểm tra xem có giao dịch đang chờ xác nhận không
    let hasPendingTransaction = false;
    let pendingTransactionId = null;
    if (caseData.transactions && caseData.transactions.length > 0) {
      const pendingTransaction = caseData.transactions.find(transaction => transaction.status === 'pending');
      if (pendingTransaction) {
        hasPendingTransaction = true;
        pendingTransactionId = pendingTransaction.id;
      }
    }
                   
    // Nếu có giao dịch hiện có hoặc payment_status là pending, và không phải đã thanh toán, coi là đang chờ
    const isPending = !isPaid && (
                     caseData.payment_status === 'pending' || 
                     hasPendingTransaction ||
                     (caseData.status === 'pending' && caseData.fee_amount && caseData.fee_amount > 0)
                    );
                     
    const isUnpaid = !isPaid && !isPending;
    
    // Xác định vai trò người dùng
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = userData.role ? userData.role.toLowerCase() : '';
    const isLawyerRole = userRole === 'lawyer' || userRole === 'luật sư';
    
    // Kiểm tra xem có phải luật sư được gán cho vụ án này không
    const assignedLawyerId = caseData.lawyer_id || (caseData.lawyer && caseData.lawyer.id);
    const isCurrentUserAssignedLawyer = 
        assignedLawyerId && 
        userData.id && 
        String(assignedLawyerId) === String(userData.id);
    
    console.log('Chi tiết trạng thái thanh toán:', {
      isPaid,
      isPending,
      isUnpaid,
      hasPendingTransaction,
      pendingTransactionId,
      payment_status: caseData.payment_status,
      case_status: caseData.status,
      has_transactions: caseData.has_transactions,
      transaction_count: caseData.transactions?.length,
      transactions: caseData.transactions,
      userRole,
      isLawyerRole,
      assignedLawyerId,
      currentUserId: userData.id,
      isCurrentUserAssignedLawyer,
      isOwner,
      fee_amount: caseData.fee_amount,
      fee_details: caseData.fee_details
    });
    
    // Kiểm tra xem nút xác nhận thanh toán có nên hiển thị không
    const shouldShowConfirmButton = 
      !isPaid && // Chưa thanh toán
      isCurrentUserAssignedLawyer && // Là luật sư được gán cho vụ án
      hasPendingTransaction && // Có giao dịch đang chờ xác nhận
      pendingTransactionId; // Có ID giao dịch hợp lệ
    
    // ĐIỀU KIỆN MỚI: Hiển thị nút tính phí nếu cả fee_amount và fee_details đều là null
    // và người dùng hiện tại là luật sư được gán cho vụ án
    const shouldShowCalculateFeeButton = 
      isCurrentUserAssignedLawyer && // Là luật sư được gán cho vụ án
      (caseData.fee_amount === null || caseData.fee_amount === undefined) && // fee_amount là null hoặc undefined
      (caseData.fee_details === null || caseData.fee_details === undefined); // fee_details là null hoặc undefined
      
    return (
      <Card className={styles.paymentStatusCard} title="Trạng thái thanh toán">
        <Row gutter={[16, 16]}>
          <Col span={24}>
            {isPaid && (
              <Alert
                message="Đã thanh toán"
                description="Phí pháp lý đã được thanh toán và xác nhận bởi luật sư."
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
              />
            )}
            
            {/* Alert thông báo "Đang chờ xác nhận" - Chỉ hiển thị khi:
                1. Trạng thái thanh toán là 'pending'
                2. Không phải là đã thanh toán (isPaid = false)
                3. Có giao dịch nhưng giao dịch chưa được xác nhận */}
            {isPending && !isPaid && (
              <Alert
                message="Đang chờ luật sư xác nhận thanh toán"
                description="Bạn đã ghi nhận thanh toán, đang chờ luật sư xác nhận đã nhận được khoản thanh toán vào tài khoản ngân hàng."
                type="warning"
                showIcon
                action={
                  !isLawyerRole && (
                    <Button type="link" onClick={refreshPaymentStatus}>
                      Kiểm tra trạng thái
                    </Button>
                  )
                }
              />
            )}
            
            {/* NÚT TÍNH PHÍ MỚI: Hiển thị khi fee_amount và fee_details đều là null và là luật sư được gán */}
            {shouldShowCalculateFeeButton && (
              <>
                <Card bordered={false} style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 16 }}>
                    <span>Giá trị tranh chấp (VNĐ):</span>
                    <InputNumber 
                      style={{ width: '100%', marginTop: 8 }}
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                      min={0}
                      placeholder="Nhập giá trị tranh chấp (VNĐ)"
                      value={disputeValue} 
                      onChange={value => setDisputeValue(value)}
                    />
                  </div>
                  <Button
                    type="primary"
                    icon={<DollarOutlined />}
                    onClick={handleCalculateFee}
                    loading={calculatingFee}
                    block
                  >
                    Tính phí vụ án
                  </Button>
                </Card>
              </>
            )}
            
            {isUnpaid && !isPending && !isLawyerRole && isOwner && caseData.fee_amount > 0 && !caseData.has_transactions && (
              <Button
                type="primary"
                icon={<DollarOutlined />}
                onClick={handlePayment}
                loading={loadingPayment}
                block
              >
                Thanh toán ngay
              </Button>
            )}
          </Col>
          
          <Col span={24}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Phí pháp lý">
                {formatCurrency(caseData.fee_amount || 0)}
              </Descriptions.Item>
              
              {caseData.payment_date && (
                <Descriptions.Item label="Ngày thanh toán">
                  {new Date(caseData.payment_date).toLocaleDateString('vi-VN')}
                </Descriptions.Item>
              )}
              
              {caseData.payment_method && (
                <Descriptions.Item label="Phương thức thanh toán">
                  {caseData.payment_method === 'bank_transfer' ? 'Chuyển khoản ngân hàng' : caseData.payment_method}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Col>
          
          <Col span={24}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {/* XÁC NHẬN THANH TOÁN: Chỉ hiển thị khi đáp ứng đủ điều kiện */}
              {shouldShowConfirmButton && (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => {
                    // Mở modal xác nhận thanh toán
                    Modal.confirm({
                      title: 'Xác nhận thanh toán',
                      content: 'Bạn có chắc chắn đã nhận được thanh toán cho vụ án này?',
                      onOk: async () => {
                        try {
                          setConfirmingPayment(true);
                          
                          // Sử dụng ID giao dịch đang chờ xác nhận đã tìm thấy
                          if (pendingTransactionId) {
                            // Gọi API xác nhận thanh toán
                            const confirmResult = await transactionService.confirmPaymentByLawyer(
                              pendingTransactionId,
                              {
                                notes: "Xác nhận từ trang chi tiết vụ án",
                                update_case_status: true,
                                case_id: caseData.id
                              }
                            );
                            
                            if (confirmResult && confirmResult.success) {
                              message.success('Đã xác nhận thanh toán thành công');
                              
                              // Làm mới trạng thái thanh toán của vụ án
                              refreshPaymentStatus();
                              
                              // Làm mới dữ liệu vụ án
                              await fetchCaseDetails();
                            } else {
                              message.error(confirmResult?.message || 'Không thể xác nhận thanh toán. Vui lòng thử lại.');
                            }
                          } else {
                            message.error('Không tìm thấy giao dịch thanh toán cho vụ án này.');
                          }
                        } catch (error) {
                          console.error('Lỗi khi xác nhận thanh toán:', error);
                          message.error('Có lỗi xảy ra khi xác nhận thanh toán.');
                        } finally {
                          setConfirmingPayment(false);
                        }
                      }
                    });
                  }}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                  block
                >
                  Xác nhận đã nhận thanh toán
                </Button>
              )}
              
              {isPending && (
                <div>
                  <Divider plain>Thông tin thanh toán</Divider>
                  <p>Luật sư sẽ xem xét và xác nhận thanh toán của bạn trong thời gian sớm nhất. Sau khi được xác nhận, trạng thái vụ án sẽ được cập nhật tự động.</p>
                </div>
              )}
            </Space>
          </Col>
        </Row>
      </Card>
    );
  };

  // Thêm hàm fetchCaseDetails để làm mới dữ liệu vụ án
  const fetchCaseDetails = async () => {
    try {
      // Lấy lại thông tin vụ án từ API
      const response = await legalCaseService.getLegalCaseById(id);
      
      if (response && response.success && response.data) {
        console.log('Đã cập nhật dữ liệu vụ án:', response.data);
        
        // Cập nhật state với dữ liệu mới
        setCaseData(response.data);
        
        // Nếu có luật sư, cập nhật thông tin luật sư
        if (response.data.lawyer && response.data.lawyer.id) {
          fetchLawyerDetails(response.data.lawyer.id);
        }
        
        // Kiểm tra lại giao dịch
        refreshPaymentStatus();
        
        return response.data;
      } else {
        console.error('Không thể lấy dữ liệu vụ án mới:', response);
        return null;
      }
    } catch (error) {
      console.error('Lỗi khi làm mới dữ liệu vụ án:', error);
      return null;
    }
  };

  if (loading) {
    return (
      <Layout className={styles.legalCaseLayout}>
        <Navbar />
        <Content className={styles.legalCaseContent}>
          <div className={styles.loadingContainer}>
            <Spin size="large" tip="Đang tải thông tin vụ án..." />
          </div>
        </Content>
      </Layout>
    );
  }

  if (!caseData) {
    return (
      <Layout className={styles.legalCaseLayout}>
        <Navbar />
        <Content className={styles.legalCaseContent}>
          <div className={styles.errorContainer}>
            <Title level={3}>Không tìm thấy thông tin vụ án</Title>
            <Button type="primary" onClick={() => navigate('/legal-cases')} size="large">
              Quay lại danh sách
            </Button>
          </div>
        </Content>
      </Layout>
    );
  }

  return (
    <>
      <Navbar />
      <Layout className={styles.legalCaseLayout}>
        <Content className={styles.legalCaseContent}>
          <div className={styles.legalCaseDetail}>
            <div className={styles.pageHeader}>
              <Button
                type="link"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/legal-cases')}
                className={styles.backButton}
              >
                Quay lại danh sách
              </Button>
              <Title level={2}>Chi tiết vụ án</Title>
            </div>

            <Card className={styles.detailCard} bordered={false}>
              <div className={styles.caseHeader}>
                <div>
                  <Title level={3}>{caseData.title}</Title>
                  <Space size={12} className={styles.caseHeaderTags}>
                    {renderStatus(caseData.status)}
                    <Tag color="#3d5a80">{caseData.case_type}</Tag>
                    {caseData.ai_content && (
                      caseData.is_ai_generated 
                        ? <Tag color="purple">AI</Tag>
                        : <Tag color="blue">Nội dung</Tag>
                    )}
                  </Space>
                </div>
                {isOwner && (
                  <Space className={styles.headerButtons}>
                    <Button
                      type="primary"
                      icon={<EditOutlined />}
                      onClick={() => navigate(`/legal-cases/${id}/edit`)}
                      className={styles.editButton}
                    >
                      Chỉnh sửa
                    </Button>

                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={handleDeleteCase}
                      className={styles.deleteButton}
                    >
                      Xóa
                    </Button>
                  </Space>
                )}
              </div>

              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Loại vụ án</span>
                  <span className={styles.infoValue}>{caseData.case_type}</span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Ngày tạo</span>
                  <span className={styles.infoValue}>{moment(caseData.created_at).format('DD/MM/YYYY HH:mm')}</span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Trạng thái</span>
                  <span className={styles.infoValue}>{renderStatus(caseData.status)}</span>
                </div>

                {caseData.lawyer && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Luật sư phụ trách</span>
                    <span className={styles.infoValue}>{caseData.lawyer.full_name}</span>
                  </div>
                )}

                {caseData.fee_amount && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Phí dịch vụ</span>
                    <span className={styles.infoValue}>{formatCurrency(caseData.fee_amount)}</span>
                  </div>
                )}
              </div>

              <Tabs
                className={styles.detailTabs}
                defaultActiveKey="details"
                items={[
                  {
                    key: 'details',
                    label: 'Chi tiết',
                    children: (
                      <div className={styles.tabContent}>
                        <Paragraph className={styles.caseDescription}>{caseData.description}</Paragraph>

                        {/* Hiển thị nội dung AI nếu có */}
                        {caseData.ai_content && (
                          <div className={styles.aiContentSection}>
                            <Divider orientation="left">
                              <span className={styles.dividerTitle}>
                                {caseData.is_ai_generated ? 'Nội dung do AI soạn thảo' : 'Nội dung vụ án'}
                              </span>
                            </Divider>
                            <div className={styles.aiContent}>
                              {caseData.ai_content.split('\n').map((line, i) => (
                                <p key={i}>{line}</p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Hiển thị tài liệu */}
                        {caseData.file_url && (
                          <div className={styles.documentSection}>
                            <Divider orientation="left">
                              <span className={styles.dividerTitle}>Tài liệu</span>
                            </Divider>
                            <div className={styles.documentItem}>
                              <div className={styles.documentIcon}>
                                {renderFileIcon(caseData.file_url.split('.').pop())}
                              </div>
                              <div className={styles.documentInfo}>
                                <div className={styles.documentName}>
                                  {`${caseData.title}.${caseData.file_url.split('.').pop()}`}
                                </div>
                              </div>
                              <div className={styles.documentAction}>
                                <Button
                                  type="primary"
                                  icon={<DownloadOutlined />}
                                  size="middle"
                                  onClick={() => handleDownloadDocument()}
                                  className={styles.downloadButton}
                                >
                                  Tải xuống
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  },
                  {
                    key: 'lawyer',
                    label: 'Luật sư',
                    children: (
                      <div className={styles.tabContent}>
                        {caseData.lawyer ? (
                          <>
                            <Card bordered={false} className={styles.lawyerCard}>
                              <div className={styles.lawyerProfile}>
                                <Avatar 
                                  size={80} 
                                  icon={<UserOutlined />} 
                                  className={styles.lawyerAvatar} 
                                />
                                <div className={styles.lawyerInfo}>
                                  <Title level={4}>{caseData.lawyer.full_name || 'Luật sư'}</Title>
                                  <Text type="secondary">{caseData.lawyer.email || 'Không có thông tin email'}</Text><br></br>
                                  <Text type="secondary">Điện thoại: {caseData.lawyer.phone || 'Không có thông tin'}</Text>
                                </div>
                              </div>

                              <Descriptions title="Thông tin luật sư" column={1} className={styles.lawyerDetails}>
                                <Descriptions.Item label="Chuyên môn">
                                  {caseData.lawyer.specialization ?
                                    (Array.isArray(caseData.lawyer.specialization) ?
                                      caseData.lawyer.specialization.join(', ') :
                                      caseData.lawyer.specialization) :
                                    'Chưa cập nhật'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Kinh nghiệm">
                                  {caseData.lawyer.experience_years || caseData.lawyer.experienceYears || '0'} năm
                                </Descriptions.Item>
                                <Descriptions.Item label="Đánh giá">
                                  <Rate disabled defaultValue={parseFloat(caseData.lawyer.rating || 0) || 0} allowHalf />
                                  <span style={{ marginLeft: 8 }}>
                                    {parseFloat(caseData.lawyer.rating || 0).toFixed(1)}/5
                                  </span>
                                </Descriptions.Item>
                              </Descriptions>
                            </Card>
                          </>
                        ) : (
                          <div className={styles.assignLawyerSection}>
                            <Empty 
                              description="Chưa có luật sư được gán cho vụ án này" 
                              image={Empty.PRESENTED_IMAGE_SIMPLE} 
                              style={{ marginBottom: 20 }}
                            />
                            
                            {isOwner && (
                              <>
                                <Title level={4}>Chọn luật sư cho vụ án</Title>
                                <Paragraph className={styles.sectionDescription}>
                                  Chọn một luật sư để được tư vấn và xử lý vụ án của bạn. Luật sư bạn đã đặt lịch hẹn thành công và đã được luật sư xác nhận mới có thể xử lý vụ án
                                </Paragraph>

                                <Button
                                  type="primary"
                                  onClick={fetchLawyers}
                                  loading={lawyersLoading}
                                  size="large"
                                  className={styles.primaryButton}
                                >
                                  Xem danh sách luật sư
                                </Button>

                                {lawyers.length > 0 && (
                                  <List
                                    itemLayout="horizontal"
                                    dataSource={lawyers}
                                    className={styles.lawyerList}
                                    renderItem={lawyer => (
                                      <div className={styles.lawyerItem}>
                                        <div className={styles.lawyerAvatar}>
                                          <Avatar size={64} icon={<UserOutlined />} src={lawyer.avatar} />
                                        </div>
                                        <div className={styles.lawyerInfo}>
                                          <div className={styles.lawyerName}>{lawyer.fullName || lawyer.full_name || lawyer.username || 'Luật sư'}</div>
                                          <div className={styles.lawyerMeta}>
                                            {lawyer.specialization ? (Array.isArray(lawyer.specialization) ? lawyer.specialization.join(', ') : lawyer.specialization) : 'Luật sư đa lĩnh vực'}
                                          </div>
                                        </div>
                                        <div className={styles.lawyerAction}>
                                          <Button
                                            type="primary"
                                            onClick={() => handleAssignLawyer(lawyer.id)}
                                            loading={assigningLawyer}
                                            className={styles.assignButton}
                                          >
                                            Chọn
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  />
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  },
                  {
                    key: 'payment',
                    label: 'Phí và thanh toán',
                    children: (
                      <div className={styles.tabContent}>
                        {renderPaymentStatus()}
                      </div>
                    )
                  },
                  {
                    key: 'notes',
                    label: 'Ghi chú luật sư',
                    children: (
                      <div className={styles.tabContent}>
                        {renderLawyerNotes()}
                      </div>
                    ),
                    // Chỉ hiển thị tab này cho luật sư được gán và admin
                    disabled: !(isAssignedLawyer || isAdmin)
                  }
                ]}
              />
            </Card>
          </div>
        </Content>
      </Layout>
    </>
  );
};

export default LegalCaseDetail; 