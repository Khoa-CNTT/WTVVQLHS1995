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
          setCaseData(response.data);
          
          // Kiểm tra quyền và vai trò
          const userData = authService.getCurrentUser() || {};
          const isAssigned = response.data.lawyer && 
                             userData.id && 
                             response.data.lawyer.id === userData.id;
          
          // Kiểm tra role không phân biệt hoa thường
          const userRole = userData.role ? userData.role.toLowerCase() : '';
          const isAdminUser = userRole === 'admin';
          const isLawyer = userRole === 'lawyer' || userRole === 'luật sư';
          const isOwner = response.data.user_id === userData.id;
          
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
          
          // Nếu có luật sư, lấy thông tin chi tiết
          if (response.data.lawyer && response.data.lawyer.id) {
            fetchLawyerDetails(response.data.lawyer.id);
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
      
      if (response && response.status === 'success' && response.data) {
        setLawyerDetails(response.data);
        // Cập nhật lại caseData.lawyer với thông tin chi tiết
        setCaseData(prevData => ({
          ...prevData,
          lawyer: {
            ...prevData.lawyer,
            specialization: response.data.specialization,
            experience_years: response.data.experience_years,
            rating: response.data.rating,
            avatar_url: response.data.avatar_url
          }
        }));
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin chi tiết luật sư:', error);
      // Không hiện thông báo lỗi cho người dùng, chỉ ghi log
    }
  };

  // Xử lý tải xuống tài liệu
  const handleDownloadDocument = async (documentId) => {
    try {
      const blob = await legalCaseService.downloadDocument(id, documentId);

      // Tìm tên tài liệu từ caseData
      let fileName = `document-${documentId}`;
      if (caseData.documents && Array.isArray(caseData.documents)) {
        const document = caseData.documents.find(doc => doc.id === documentId);
        if (document && document.original_name) {
          fileName = document.original_name;
        }
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
            // Chuyển đổi lawyerId thành số nếu cần
            const parsedLawyerId = Number(lawyerId);
            
            const response = await legalCaseService.assignLawyer(id, parsedLawyerId);

            if (response && (response.success || response.partial_success)) {
              if (response.partial_success) {
                message.success('Đã gán luật sư thành công, nhưng có lỗi khi tạo lịch hẹn');
              } else {
                message.success('Đã gán luật sư thành công');
              }
              
              // Cập nhật trạng thái vụ án thành 'pending' (đang xử lý)
              await legalCaseService.updateCaseStatus(id, 'pending', 'Vụ án đã được gán cho luật sư và đang chờ xử lý');
              
              // Cập nhật lại thông tin vụ án
              const updatedCase = await legalCaseService.getLegalCaseById(id);
              if (updatedCase && updatedCase.success) {
                setCaseData(updatedCase.data);
              }
            } else {
              message.error(response?.message || 'Không thể gán luật sư');
            }
          } catch (error) {
            console.error('Lỗi khi gán luật sư:', error);
            message.error('Không thể gán luật sư. Vui lòng thử lại sau.');
          } finally {
            setAssigningLawyer(false);
          }
        },
        onCancel: () => {
          setAssigningLawyer(false);
        }
      });
    } catch (error) {
      console.error('Lỗi khi gán luật sư:', error);
      message.error('Không thể gán luật sư. Vui lòng thử lại sau.');
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

      // Trực tiếp lấy thông tin vụ án để xác minh luật sư được gán
      let canCalculateFee = false;
      let assignedLawyerId = null;
      
      try {
        const freshCaseData = await legalCaseService.getLegalCaseById(id);
        
        if (freshCaseData && freshCaseData.success && freshCaseData.data) {
          const caseInfo = freshCaseData.data;
          
          // Cập nhật state với dữ liệu mới
          setCaseData(caseInfo);
          
          // Lưu ID của luật sư được gán cho vụ án
          assignedLawyerId = caseInfo.lawyer?.id;
          
          // QUAN TRỌNG: Kiểm tra xem người dùng có phải là luật sư được gán cho vụ án này không
          // Chuyển cả hai ID thành chuỗi để đảm bảo so sánh chính xác
          const isExactAssignedLawyer = 
              caseInfo.lawyer && 
              userData.id && 
              String(caseInfo.lawyer.id) === String(userData.id);
          
          // Chỉ có luật sư được gán mới có thể tính phí
          canCalculateFee = isExactAssignedLawyer;
          
          // Cập nhật state
          setIsAssignedLawyer(isExactAssignedLawyer);
        }
      } catch (err) {
        console.error('Lỗi khi lấy thông tin vụ án mới nhất:', err);
      }
      
      // Nếu không có quyền tính phí, hiển thị thông báo và dừng
      if (!canCalculateFee) {
        message.error('Chỉ luật sư được gán cho vụ án này mới có quyền tính phí');
        return;
      }

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
  const handleCreatePayment = async (paymentMethod) => {
    try {
      setProcessingPayment(true);

      const response = await legalCaseService.createPayment(id, paymentMethod);

      if (response.success) {
        message.success('Đang chuyển hướng đến trang thanh toán...');

        // Chuyển hướng đến URL thanh toán
        window.location.href = response.data.payment_url;
      } else {
        message.error(response.message || 'Không thể tạo giao dịch thanh toán');
      }
    } catch (error) {
      console.error('Lỗi khi tạo giao dịch thanh toán:', error);
      message.error('Không thể tạo giao dịch thanh toán. Vui lòng thử lại sau.');
    } finally {
      setProcessingPayment(false);
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
        return <Tag color="orange">Đang xử lý</Tag>;
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
                    {caseData.is_ai_generated && <Tag color="purple">AI</Tag>}
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
                        {caseData.is_ai_generated && caseData.ai_content && (
                          <div className={styles.aiContentSection}>
                            <Divider orientation="left">
                              <span className={styles.dividerTitle}>Nội dung do AI soạn thảo</span>
                            </Divider>
                            <div className={styles.aiContent}>
                              {caseData.ai_content.split('\n').map((line, i) => (
                                <p key={i}>{line}</p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Hiển thị tài liệu */}
                        {caseData.documents && caseData.documents.length > 0 && (
                          <div className={styles.documentSection}>
                            <Divider orientation="left">
                              <span className={styles.dividerTitle}>Tài liệu</span>
                            </Divider>
                            {caseData.documents.map(doc => (
                              <div key={doc.id} className={styles.documentItem}>
                                <div className={styles.documentIcon}>
                                  {renderFileIcon(doc.mime_type)}
                                </div>
                                <div className={styles.documentInfo}>
                                  <div className={styles.documentName}>{doc.original_name}</div>
                                </div>
                                <div className={styles.documentAction}>
                                  <Button
                                    type="primary"
                                    icon={<DownloadOutlined />}
                                    size="middle"
                                    onClick={() => handleDownloadDocument(doc.id)}
                                    className={styles.downloadButton}
                                  >
                                    Tải xuống
                                  </Button>
                                </div>
                              </div>
                            ))}
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
                          <div>
                            <Card bordered={false} className={styles.lawyerCard}>
                              <div className={styles.lawyerProfile}>
                                <Avatar size={80} icon={<UserOutlined />} src={caseData.lawyer.avatar_url} className={styles.lawyerAvatar} />
                                <div className={styles.lawyerInfo}>
                                  <Title level={4}>{caseData.lawyer.full_name}</Title>
                                  <Text type="secondary">{caseData.lawyer.email}</Text>
                                </div>
                              </div>
                              <Divider />
                              <Descriptions title="Thông tin luật sư" column={1} className={styles.lawyerDetails}>
                                <Descriptions.Item label="Chuyên môn">
                                  {caseData.lawyer.specialization ? 
                                    (Array.isArray(caseData.lawyer.specialization) ? 
                                      caseData.lawyer.specialization.join(', ') : 
                                      caseData.lawyer.specialization) : 
                                    'Chưa cập nhật'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Số năm kinh nghiệm">
                                  {caseData.lawyer.experience_years || caseData.lawyer.experienceYears || '0'} năm
                                </Descriptions.Item>
                                <Descriptions.Item label="Đánh giá">
                                  <Rate disabled defaultValue={parseFloat(caseData.lawyer.rating || 0) || 0} allowHalf />
                                  <span style={{ marginLeft: '10px' }}>
                                    {parseFloat(caseData.lawyer.rating || 0).toFixed(1)}/5
                                  </span>
                                </Descriptions.Item>
                              </Descriptions>
                            </Card>
                          </div>
                        ) : (
                          <div className={styles.assignLawyerSection}>
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
                                      const feeDetails = JSON.parse(caseData.fee_details);
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
                                      const feeDetails = JSON.parse(caseData.fee_details);
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
                                  onClick={() => handleCreatePayment('credit_card')}
                                  loading={processingPayment}
                                  disabled={!caseData.lawyer}
                                  size="large"
                                  className={styles.primaryButton}
                                >
                                  Thanh toán ngay
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
                                  const assignedLawyerId = caseData.lawyer?.id;
                                  
                                  // QUAN TRỌNG: Chỉ có luật sư được gán chính xác mới có thể tính phí
                                  const isExactAssignedLawyer = 
                                      assignedLawyerId && 
                                      userData.id && 
                                      String(assignedLawyerId) === String(userData.id);
                                  
                                  // Phần này trả về text mô tả phần tính phí
                                  return isExactAssignedLawyer
                                    ? "Nhập giá trị tranh chấp (nếu có) để tính phí dịch vụ. Phí sẽ được tính dựa trên loại vụ án và các thông số bổ sung."
                                    : "Phí dịch vụ sẽ được luật sư tính toán sau khi xem xét thông tin vụ án của bạn.";
                                } catch (err) {
                                  console.error('Lỗi khi kiểm tra quyền tính phí:', err);
                                  return "Phí dịch vụ sẽ được luật sư tính toán sau khi xem xét thông tin vụ án của bạn.";
                                }
                              })()}
                            </Paragraph>

                            {(() => {
                              try {
                                // Kiểm tra quyền tính phí
                                const userData = JSON.parse(localStorage.getItem('user') || '{}');
                                
                                // Lấy thông tin luật sư được gán từ state
                                const assignedLawyerId = caseData.lawyer?.id;
                                
                                // QUAN TRỌNG: Chỉ có luật sư được gán chính xác mới có thể tính phí, loại bỏ admin
                                const isExactAssignedLawyer = 
                                    assignedLawyerId && 
                                    userData.id && 
                                    String(assignedLawyerId) === String(userData.id);
                                
                                // Chỉ luật sư được gán mới có quyền tính phí
                                const canCalculateFee = isExactAssignedLawyer;
                                
                                if (canCalculateFee) {
                                  return (
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