import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Button, Tabs, Descriptions, Tag, Spin, Space, message, Divider, List, Modal, Select, InputNumber, Avatar, Rate, Layout, Row, Col, Empty, Input } from 'antd';
import { DownloadOutlined, DeleteOutlined, EditOutlined, FileOutlined, FilePdfOutlined, FileWordOutlined, FileImageOutlined, UserOutlined, DollarOutlined, SendOutlined, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import legalCaseService from '../../services/legalCaseService';
import userService from '../../services/userService';
import styles from './LegalCase.module.css';
import moment from 'moment';
import Navbar from '../../components/layout/Nav/Navbar';
import authService from '../../services/authService';
import appointmentService from '../../services/appointmentService';
import transactionService from '../../services/transactionService';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { confirm } = Modal;
const { Content } = Layout;

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
            role: userRole,
            isAssigned,
            isLawyer,
            isAdmin: isAdminUser,
            isOwner
          });
          
          setIsAssignedLawyer(isAssigned || isLawyer);
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
      // Kiểm tra xem người dùng đã đăng nhập chưa
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Bạn cần đăng nhập để sử dụng tính năng này');
        setTimeout(() => {
          navigate('/login', { state: { from: `/legal-cases/${id}` } });
        }, 1500);
        return;
      }

      // Kiểm tra vai trò người dùng
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (!userData || !userData.id) {
        message.error('Không thể xác định quyền hạn của bạn');
        return;
      }

      console.log('Thông tin người dùng:', userData);
      console.log('Thông tin vụ án:', caseData);

      // Kiểm tra xem người dùng có phải là luật sư được gán không
      const isLawyerRole = userData.role && (userData.role.toLowerCase() === 'lawyer' || userData.role.toLowerCase() === 'luật sư');
      
      // Lấy ID luật sư từ cả hai nguồn có thể có
      const assignedLawyerId = caseData.lawyer_id || (caseData.lawyer && caseData.lawyer.id);
      
      console.log('Dữ liệu kiểm tra quyền tính phí:', {
        caseData,
        userRole: userData.role,
        isLawyerRole,
        userId: userData.id,
        lawyerId: caseData.lawyer_id,
        lawyerObjectId: caseData.lawyer?.id,
        assignedLawyerId,
        areIdsEqual: assignedLawyerId && String(userData.id) === String(assignedLawyerId)
      });
      
      // QUAN TRỌNG: Kiểm tra xem người dùng có phải là luật sư được gán không
      const canCalculateFee = isLawyerRole && assignedLawyerId && String(userData.id) === String(assignedLawyerId);
      
      if (canCalculateFee) {
        setCalculatingFee(true);

        const parameters = {
          dispute_value: disputeValue
        };

        // Gửi ID luật sư và case ID để xác thực
        const response = await legalCaseService.calculateFee(id, parameters);

        if (response.success) {
          message.success('Đã tính phí thành công');

          // Cập nhật lại thông tin vụ án
          const updatedCase = await legalCaseService.getLegalCaseById(id);
          if (updatedCase.success) {
            setCaseData(updatedCase.data);
          }
        } else {
          // Nếu lỗi liên quan đến quyền truy cập
          if (response.permissionError) {
            message.error('Chỉ luật sư được gán cho vụ án này mới có quyền tính phí');
            return;
          }
          
          if (response.message && (
              response.message.includes('unauthorized') || 
              response.message.includes('unauthenticated') || 
              response.message.includes('token') ||
              response.message.includes('đăng nhập')
          )) {
            message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            setTimeout(() => {
              navigate('/login', { state: { from: `/legal-cases/${id}` } });
            }, 1500);
          } else {
            message.error(response.message || 'Không thể tính phí');
          }
        }
      } else {
        message.error('Chỉ luật sư được gán cho vụ án này mới có quyền tính phí');
      }
    } catch (error) {
      console.error('Lỗi khi tính phí vụ án:', error);
      
      if (error.response) {
        console.error('Chi tiết lỗi từ API:', error.response.status, error.response.data);
      }
      
      // Kiểm tra lỗi xác thực
      if (error.response && error.response.status === 401) {
        message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        setTimeout(() => {
          navigate('/login', { state: { from: `/legal-cases/${id}` } });
        }, 1500);
      } else {
        message.error('Không thể tính phí vụ án. Vui lòng thử lại sau.');
      }
    } finally {
      setCalculatingFee(false);
    }
  };

  // Xử lý thanh toán
  const handlePayment = async () => {
    try {
      if (!caseData || !caseData.id) {
        message.error('Không thể thanh toán vì thiếu thông tin vụ án');
        return;
      }

      const lawyer = caseData.lawyer || {};
      const amount = caseData.fee_amount || lawyer.hourly_rate || 500000;
      
      // Đảm bảo có lawyer_id
      if (!lawyer.id) {
        message.error('Không thể thanh toán vì thiếu thông tin luật sư');
        return;
      }
      
      // Tạo giao dịch mới
      const transactionData = {
        case_id: caseData.id,
        lawyer_id: lawyer.id,
        amount: amount,
        payment_method: 'bank_transfer', // Đặt giá trị mặc định cho payment_method
        description: `Thanh toán cho vụ án: ${caseData.title || 'Không có tiêu đề'}`
      };
      
      // Chuyển fee_details thành JSON string nếu nó là object
      if (caseData.fee_details) {
        try {
          if (typeof caseData.fee_details === 'object') {
            transactionData.fee_details = JSON.stringify(caseData.fee_details);
          } else {
            transactionData.fee_details = caseData.fee_details;
          }
        } catch (error) {
          console.error('Lỗi khi xử lý fee_details:', error);
        }
      }
      
      console.log('Đang tạo giao dịch với dữ liệu:', transactionData);
      
      const response = await transactionService.createTransaction(transactionData);
      
      if (response && response.success) {
        // Chuyển đến trang thanh toán với ID giao dịch
        navigate(`/payment?transaction_id=${response.data.id}`);
      } else {
        message.error(response.message || 'Không thể tạo giao dịch thanh toán');
      }
    } catch (error) {
      console.error('Lỗi khi xử lý thanh toán:', error);
      console.error('Chi tiết lỗi:', error.response ? error.response.data : error.message);
      message.error('Không thể xử lý thanh toán. Vui lòng thử lại sau.');
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
        return <Tag color="orange">Đang chờ xử lý</Tag>;
      case 'in_progress':
        return <Tag color="processing">Đang xử lý</Tag>;
      case 'paid':
        return <Tag color="green">Đã thanh toán</Tag>;
      case 'completed':
        return <Tag color="green">Hoàn thành</Tag>;
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
                                          <div className={styles.lawyerRating}>
                                            <Rate disabled defaultValue={parseFloat(lawyer.rating || 0) || 4} allowHalf />
                                            <span className={styles.ratingCount}>
                                              {parseFloat(lawyer.rating || 0) || 4}/5 ({lawyer.review_count || 0} đánh giá)
                                            </span>
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
                        {caseData.fee_amount ? (
                          <div className={styles.paymentSection}>
                            <Title level={4}>Thông tin phí dịch vụ</Title>

                            <div className={styles.feeItem}>
                              <span>Phí cơ bản:</span>
                              <span>
                                {(() => {
                                  try {
                                    if (caseData.fee_details) {
                                      // Kiểm tra xem fee_details đã là object hay chưa
                                      const feeDetails = typeof caseData.fee_details === 'string'
                                        ? JSON.parse(caseData.fee_details)
                                        : caseData.fee_details;
                                      
                                      return formatCurrency(feeDetails.base_fee || 0);
                                    }
                                    return formatCurrency(0);
                                  } catch (error) {
                                    console.error('Lỗi khi phân tích fee_details:', error);
                                    return formatCurrency(0);
                                  }
                                })()}
                              </span>
                            </div>

                            <div className={styles.feeItem}>
                              <span>Phí bổ sung:</span>
                              <span>
                                {(() => {
                                  try {
                                    if (caseData.fee_details) {
                                      // Kiểm tra xem fee_details đã là object hay chưa
                                      const feeDetails = typeof caseData.fee_details === 'string'
                                        ? JSON.parse(caseData.fee_details)
                                        : caseData.fee_details;
                                      
                                      return formatCurrency(feeDetails.additional_fee || 0);
                                    }
                                    return formatCurrency(0);
                                  } catch (error) {
                                    console.error('Lỗi khi phân tích fee_details:', error);
                                    return formatCurrency(0);
                                  }
                                })()}
                              </span>
                            </div>

                            <div className={styles.feeTotal}>
                              <span>Tổng phí:</span>
                              <span>{formatCurrency(caseData.fee_amount || 0)}</span>
                            </div>

                            {caseData.status !== 'paid' && isOwner && (
                              <div className={styles.paymentButton}>
                                <Button
                                  type="primary"
                                  icon={<DollarOutlined />}
                                  onClick={handlePayment}
                                  loading={processingPayment}
                                  disabled={!caseData.lawyer}
                                  size="large"
                                  className={styles.primaryButton}
                                >
                                  Thanh toán
                                </Button>
                                {!caseData.lawyer && (
                                  <div className={styles.paymentWarning}>
                                    Vui lòng chọn luật sư trước khi thanh toán
                                  </div>
                                )}
                              </div>
                            )}

                            {caseData.status === 'paid' && (
                              <div className={styles.paidStatus}>
                                <Tag color="green" icon={<CheckCircleOutlined />}>Đã thanh toán</Tag>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className={styles.calculateFeeSection}>
                            <Title level={4}>Tính phí dịch vụ</Title>
                            <Paragraph className={styles.sectionDescription}>
                              {(() => {
                                try {
                                  // Kiểm tra quyền tính phí
                                  const userData = JSON.parse(localStorage.getItem('user') || '{}');
                                  
                                  // Lấy thông tin luật sư được gán từ state
                                  const isLawyerRole = userData.role && (userData.role.toLowerCase() === 'lawyer' || userData.role.toLowerCase() === 'luật sư');
                                  
                                  // Lấy ID luật sư từ cả hai nguồn có thể có
                                  const assignedLawyerId = caseData.lawyer_id || (caseData.lawyer && caseData.lawyer.id);
                                  
                                  console.log('Dữ liệu kiểm tra quyền tính phí:', {
                                    caseData,
                                    userRole: userData.role,
                                    isLawyerRole,
                                    userId: userData.id,
                                    lawyerId: caseData.lawyer_id,
                                    lawyerObjectId: caseData.lawyer?.id,
                                    assignedLawyerId,
                                    areIdsEqual: assignedLawyerId && String(userData.id) === String(assignedLawyerId)
                                  });
                                  
                                  // QUAN TRỌNG: Kiểm tra xem người dùng có phải là luật sư được gán không
                                  const canCalculateFee = isLawyerRole && assignedLawyerId && String(userData.id) === String(assignedLawyerId);
                                  
                                  if (canCalculateFee) {
                                    return (
                                      <>
                                        <p>Nhập giá trị tranh chấp (nếu có) để tính phí dịch vụ. Phí sẽ được tính dựa trên loại vụ án và các thông số bổ sung.</p>
                                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                                          <div className={styles.disputeValueInput}>
                                            <span className={styles.inputLabel}>Giá trị tranh chấp (VNĐ):</span>
                                            <InputNumber
                                              className={styles.amountInput}
                                              min={0}
                                              step={1000000}
                                              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                              parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                              value={disputeValue}
                                              onChange={value => setDisputeValue(value)}
                                              size="large"
                                            />
                                          </div>

                                          <Button
                                            type="primary"
                                            onClick={handleCalculateFee}
                                            loading={calculatingFee}
                                            size="large"
                                            className={styles.primaryButton}
                                          >
                                            Tính phí
                                          </Button>
                                        </Space>
                                      </>
                                    );
                                  } else {
                                    return (
                                      <div className={styles.waitingForFee}>
                                        <p className={styles.waitingText}>
                                          Vui lòng đợi luật sư được phân công tính toán phí dịch vụ. Bạn sẽ có thể thanh toán sau khi phí được tính.
                                        </p>
                                      </div>
                                    );
                                  }
                                } catch (err) {
                                  console.error('Lỗi khi hiển thị phần tính phí:', err);
                                  return (
                                    <div className={styles.waitingForFee}>
                                      <p className={styles.waitingText}>
                                        Đã xảy ra lỗi khi tải phần tính phí. Vui lòng tải lại trang.
                                      </p>
                                    </div>
                                  );
                                }
                              })()}
                            </Paragraph>
                          </div>
                        )}
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