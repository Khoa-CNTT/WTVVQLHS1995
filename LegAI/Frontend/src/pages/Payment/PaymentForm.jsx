import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Button, Card, Typography, Steps,
  message, Divider, Row, Col, Spin, Alert, Modal
} from 'antd';
import { 
  CheckCircleOutlined, BankOutlined, SafetyOutlined, DownloadOutlined
} from '@ant-design/icons';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import transactionService from '../../services/transactionService';
import legalCaseService from '../../services/legalCaseService';
import authService from '../../services/authService';
import styles from './PaymentForm.module.css';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const PaymentForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Các state cơ bản
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [transactionData, setTransactionData] = useState(null);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [caseData, setCaseData] = useState(null);
  const [loadingBankAccount, setLoadingBankAccount] = useState(true);
  const [defaultBankAccount, setDefaultBankAccount] = useState(null);
  const [qrDownloaded, setQrDownloaded] = useState(false);
  
  // Lấy transaction_id từ query params
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const transactionId = queryParams.get('transaction_id');
    const amount = queryParams.get('amount');
    
    if (transactionId && transactionId !== 'undefined') {
      fetchTransactionData(transactionId);
    } else if (amount) {
      // Tạo dữ liệu giao dịch tạm thời nếu không có transaction_id
      // Sử dụng trạng thái 'draft' thay vì 'pending' để không tự động chuyển trạng thái
      setTransactionData({
        amount,
        status: 'draft'
      });
      setLoading(false);
    } else {
      message.error('Không tìm thấy thông tin giao dịch');
      navigate('/');
    }
  }, [location, navigate]);
  
  // Lấy tài khoản ngân hàng của luật sư hoặc hệ thống
  useEffect(() => {
    if (caseData && caseData.lawyer_id) {
      fetchBankAccount(caseData.lawyer_id);
    }
  }, [caseData]);

  const fetchBankAccount = async (lawyerId) => {
    try {
      setLoadingBankAccount(true);
      
      // Khi có lawyer_id, lấy tài khoản ngân hàng của luật sư xử lý vụ án
      if (lawyerId) {
        console.log('Đang lấy thông tin tài khoản ngân hàng của luật sư ID:', lawyerId);
        // Chuyển đổi lawyerId thành số nguyên
        const parsedLawyerId = parseInt(lawyerId);
        
        if (isNaN(parsedLawyerId)) {
          console.error('ID luật sư không hợp lệ:', lawyerId);
          setDefaultBankAccount(null);
          setLoadingBankAccount(false);
          return;
        }

        try {
          const response = await legalCaseService.getLawyerBankAccount(parsedLawyerId);
          
          console.log('Phản hồi API tài khoản ngân hàng:', response);
          
          if (response && response.success && response.data) {
            console.log('Thông tin tài khoản ngân hàng luật sư:', response.data);
            setDefaultBankAccount(response.data);
          } else {
            console.warn('Không lấy được thông tin tài khoản ngân hàng của luật sư:', response?.message || 'Không có phản hồi');
            // Không sử dụng tài khoản mặc định nữa
            setDefaultBankAccount(null);
            
            // Hiển thị thông báo lỗi
            message.error('Luật sư chưa cập nhật thông tin tài khoản ngân hàng. Vui lòng liên hệ với luật sư để được hướng dẫn thanh toán.', 5);
            
            // Chuyển về trang chi tiết vụ án
            if (transactionData && transactionData.case_id) {
              setTimeout(() => {
                navigate(`/legal-cases/${transactionData.case_id}`);
              }, 2000);
            } else {
              setTimeout(() => {
                navigate('/legal-cases');
              }, 2000);
            }
          }
        } catch (apiError) {
          console.error('Lỗi API khi lấy thông tin tài khoản ngân hàng:', apiError);
          // Không sử dụng tài khoản mặc định nữa
          setDefaultBankAccount(null);
          
          // Hiển thị thông báo lỗi
          message.error('Không thể lấy thông tin tài khoản ngân hàng. Vui lòng thử lại sau hoặc liên hệ với luật sư.', 5);
        }
      } else {
        console.log('Không có lawyer_id, không thể tiếp tục thanh toán');
        setDefaultBankAccount(null);
        
        // Hiển thị thông báo lỗi
        message.error('Không thể xác định luật sư phụ trách vụ án. Vui lòng thử lại sau.', 5);
        
        // Chuyển về trang danh sách vụ án
        setTimeout(() => {
          navigate('/legal-cases');
        }, 2000);
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin tài khoản ngân hàng:', error);
      setDefaultBankAccount(null);
      
      // Hiển thị thông báo lỗi
      message.error('Không thể lấy thông tin tài khoản ngân hàng. Vui lòng thử lại sau.', 5);
    } finally {
      setLoadingBankAccount(false);
    }
  };
  
  const fetchTransactionData = async (transactionId) => {
    try {
      setLoading(true);
      
      // Kiểm tra xem người dùng đã đăng nhập chưa
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        // Lưu URL hiện tại để sau khi đăng nhập quay lại
        navigate('/login', { state: { from: location.pathname + location.search } });
        return;
      }
      
      // Kiểm tra transactionId hợp lệ
      if (!transactionId || transactionId === 'undefined') {
        message.error('ID giao dịch không hợp lệ');
        navigate('/');
        return;
      }
      
      const response = await transactionService.getTransactionById(transactionId);
      
      if (response && response.success) {
        // Lưu trạng thái giao dịch ban đầu mà không thay đổi
        setTransactionData(response.data);
        
        // Nếu giao dịch đã hoàn thành, chuyển đến bước hoàn tất
        if (response.data.status === 'completed') {
          setPaymentComplete(true);
        }
        
        // Lấy thông tin vụ án
        if (response.data.case_id) {
          try {
            const caseResponse = await legalCaseService.getLegalCaseById(response.data.case_id);
            if (caseResponse && caseResponse.success) {
              setCaseData(caseResponse.data);
            }
          } catch (caseError) {
            console.error('Lỗi khi lấy thông tin vụ án:', caseError);
          }
        }
      } else {
        message.error('Không thể lấy thông tin giao dịch');
        navigate('/');
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin giao dịch:', error);
      message.error('Không thể lấy thông tin giao dịch');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };
  
  // Xử lý tải xuống mã QR
  const handleDownloadQR = () => {
    // Kiểm tra xem QR code là URL sepay.vn hay SVG
    const qrData = transactionService.generateBankQRData(
      defaultBankAccount,
      transactionData?.amount || 0,
      transactionData?.id ? `LEGAI ${transactionData.id}` : 'LEGAI PAYMENT'
    );
    
    if (qrData.startsWith('http')) {
      // Nếu là URL từ sepay.vn, tải ảnh trực tiếp
      const qrImage = document.getElementById('bankQRCode');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Đảm bảo ảnh đã load xong
      if (qrImage.complete) {
        canvas.width = 250;
        canvas.height = 250;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(qrImage, 25, 25, 200, 200);
        
        // Tạo link tải xuống
        const a = document.createElement('a');
        a.download = `LegAI-QR-${transactionData?.id || 'payment'}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
        
        // Đánh dấu đã tải xuống
        setQrDownloaded(true);
      } else {
        // Nếu ảnh chưa load xong, đợi load
        qrImage.onload = () => {
          canvas.width = 250;
          canvas.height = 250;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(qrImage, 25, 25, 200, 200);
          
          // Tạo link tải xuống
          const a = document.createElement('a');
          a.download = `LegAI-QR-${transactionData?.id || 'payment'}.png`;
          a.href = canvas.toDataURL('image/png');
          a.click();
          
          // Đánh dấu đã tải xuống
          setQrDownloaded(true);
        };
      }
    } else {
      // Nếu là SVG, sử dụng phương thức cũ
      const svg = document.getElementById('bankQRCode');
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = 250;
        canvas.height = 250;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 25, 25, 200, 200);
        
        // Tạo link tải xuống
        const a = document.createElement('a');
        a.download = `LegAI-QR-${transactionData?.id || 'payment'}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
        
        // Đánh dấu đã tải xuống
        setQrDownloaded(true);
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
    }
  };
  
  // Xử lý xác nhận đã thanh toán - cần cập nhật để kiểm tra trạng thái hiện tại và xử lý đúng
  const handleConfirmPayment = async () => {
    try {
      setSubmitting(true);
      
      if (!transactionData || !transactionData.id) {
        message.error('Thiếu thông tin giao dịch');
        return;
      }

      // Hiển thị modal xác nhận trước khi thực hiện
      Modal.confirm({
        title: 'Xác nhận đã thanh toán',
        content: 'Bạn xác nhận đã chuyển khoản thanh toán cho vụ án này? Thao tác này không thể hoàn tác.',
        okText: 'Xác nhận',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            // Cập nhật trạng thái giao dịch - từ draft hoặc bất kỳ trạng thái nào sang pending
            const response = await transactionService.updateTransactionStatus(
              transactionData.id,
              'pending',
              {
                payment_method: 'bank_transfer',
                transaction_code: `LEGAI${Date.now()}`,
                payment_details: { waiting_lawyer_confirmation: true }
              }
            );
            
            if (response && response.success) {
              message.success('Đã ghi nhận giao dịch thành công! Đang đợi xác nhận từ luật sư.');
              
              // Chuyển về trang chi tiết vụ án
              if (caseData && caseData.id) {
                navigate(`/legal-cases/${caseData.id}`);
              } else {
                navigate('/');
              }
            } else {
              message.error(response?.message || 'Không thể ghi nhận giao dịch. Vui lòng thử lại.');
            }
          } catch (error) {
            console.error('Lỗi khi xác nhận thanh toán:', error);
            message.error('Có lỗi xảy ra khi ghi nhận thanh toán. Vui lòng thử lại.');
          } finally {
            setSubmitting(false);
          }
        },
        onCancel() {
          setSubmitting(false);
        }
      });
    } catch (error) {
      console.error('Lỗi khi ghi nhận giao dịch:', error);
      message.error('Có lỗi xảy ra khi ghi nhận giao dịch. Vui lòng thử lại.');
      setSubmitting(false);
    }
  };
  
  // Hiển thị thông tin xác nhận thanh toán
  const renderPaymentConfirmation = () => (
    <div className={styles.confirmationContainer}>
      <CheckCircleOutlined className={styles.successIcon} />
      
      <Title level={3}>Thanh toán thành công!</Title>
      
      <div className={styles.confirmationDetails}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card className={styles.confirmationCard}>
              <Paragraph>
                <Text strong>Mã giao dịch:</Text> {transactionData?.id || 'N/A'}
              </Paragraph>
              
              <Paragraph>
                <Text strong>Số tiền:</Text> {transactionData ? `${parseInt(transactionData.amount).toLocaleString('vi-VN')} VNĐ` : 'N/A'}
              </Paragraph>
              
              <Paragraph>
                <Text strong>Phương thức thanh toán:</Text> Chuyển khoản ngân hàng
              </Paragraph>
              
              <Paragraph>
                <Text strong>Thời gian:</Text> {
                  transactionData?.updated_at ? 
                  new Date(transactionData.updated_at).toLocaleString('vi-VN') : 
                  new Date().toLocaleString('vi-VN')
                }
              </Paragraph>
              
              {caseData && (
                <Paragraph>
                  <Text strong>Vụ án:</Text> {caseData.title}
                </Paragraph>
              )}
              
              <Divider />
              
              <Paragraph>
                Cảm ơn bạn đã thanh toán. Thông tin giao dịch đã được gửi đến email của bạn.
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </div>
      
      <div className={styles.actionButtons}>
        <Button 
          type="primary"
          onClick={() => {
            if (caseData) {
              navigate(`/legal-cases/${caseData.id}`);
            } else {
              navigate('/');
            }
          }}
        >
          {caseData ? 'Quay lại vụ án' : 'Quay lại trang chủ'}
        </Button>
      </div>
    </div>
  );
  
  // Hiển thị phương thức thanh toán qua mã QR
  const renderPaymentQR = () => (
    <div className={styles.paymentMethodSection}>
      {!defaultBankAccount ? (
        <div className={styles.noAccountWarning}>
          <Alert
            message="Không thể thanh toán"
            description="Luật sư chưa cập nhật thông tin tài khoản ngân hàng. Vui lòng liên hệ với luật sư để được hướng dẫn thanh toán."
            type="error"
            showIcon
          />
          <Button 
            type="primary" 
            onClick={() => navigate(`/legal-cases/${transactionData?.case_id || ''}`)}
            style={{ marginTop: '16px' }}
          >
            Quay lại vụ án
          </Button>
        </div>
      ) : (
        <div className={styles.qrCodeSection}>
          <Title level={4}>Quét mã QR để thanh toán</Title>
          <Paragraph className={styles.bankInfoText}>
            Vui lòng sử dụng ứng dụng ngân hàng để quét mã QR bên dưới và chuyển khoản theo số tiền yêu cầu.
          </Paragraph>
          
          <Row gutter={[24, 24]} className={styles.paymentInfoContainer}>
            <Col xs={24} sm={12}>
              <Card className={styles.bankInfoCard} bordered={false}>
                <div className={styles.bankAccountInfo}>
                  <div className={styles.bankAccountLabel}>
                    <BankOutlined /> Thông tin chuyển khoản
                  </div>
                  <div className={styles.bankInfo}>
                    <div className={styles.bankInfoRow}>
                      <span className={styles.infoLabel}>Ngân hàng:</span>
                      <span className={styles.infoValue}>{defaultBankAccount.bank_name}</span>
                    </div>
                    <div className={styles.bankInfoRow}>
                      <span className={styles.infoLabel}>Số tài khoản:</span>
                      <span className={styles.infoValue}>{defaultBankAccount.account_number}</span>
                    </div>
                    <div className={styles.bankInfoRow}>
                      <span className={styles.infoLabel}>Chủ tài khoản:</span>
                      <span className={styles.infoValue}>{defaultBankAccount.account_holder}</span>
                    </div>
                    <div className={styles.bankInfoRow}>
                      <span className={styles.infoLabel}>Số tiền:</span>
                      <span className={styles.infoValue}>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(transactionData?.amount || 0)}
                      </span>
                    </div>
                    <div className={styles.bankInfoRow}>
                      <span className={styles.infoLabel}>Nội dung CK:</span>
                      <span className={styles.infoValue}>LEGAI {transactionData?.id || ''}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} sm={12}>
              <div className={styles.qrCodeContainer}>
                {defaultBankAccount && transactionService.supportsBankQR(defaultBankAccount.bank_name) ? (
                  <div className={styles.qrImageContainer}>
                    {/* QR Code từ thư viện hoặc IMG từ URL */}
                    {transactionService.generateBankQRData(
                      defaultBankAccount,
                      transactionData?.amount || 0,
                      transactionData?.id ? `LEGAI ${transactionData.id}` : 'LEGAI PAYMENT'
                    ).startsWith('http') ? (
                      <img 
                        id="bankQRCode"
                        src={transactionService.generateBankQRData(
                          defaultBankAccount,
                          transactionData?.amount || 0,
                          transactionData?.id ? `LEGAI ${transactionData.id}` : 'LEGAI PAYMENT'
                        )} 
                        alt="Mã QR thanh toán"
                        className={styles.qrCodeImage}
                      />
                    ) : (
                      <QRCodeSVG
                        id="bankQRCode"
                        value={transactionService.generateBankQRData(
                          defaultBankAccount,
                          transactionData?.amount || 0,
                          transactionData?.id ? `LEGAI ${transactionData.id}` : 'LEGAI PAYMENT'
                        )}
                        size={200}
                        level="M"
                        className={styles.qrCodeSvg}
                      />
                    )}
                  </div>
                ) : (
                  <Alert
                    message="Không hỗ trợ tạo mã QR"
                    description={defaultBankAccount ? 
                      `Ngân hàng ${defaultBankAccount.bank_name} không được hỗ trợ tạo mã QR tự động. Vui lòng sử dụng thông tin chuyển khoản bên cạnh.` :
                      "Không thể tạo mã QR vì không có thông tin ngân hàng."}
                    type="warning"
                    showIcon
                  />
                )}
                
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadQR}
                  disabled={!defaultBankAccount || !transactionService.supportsBankQR(defaultBankAccount.bank_name)}
                  className={styles.downloadButton}
                >
                  Tải mã QR
                </Button>
              </div>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
  
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
        <Paragraph>Đang tải thông tin thanh toán...</Paragraph>
      </div>
    );
  }
  
  if (!transactionData) {
    return (
      <div className={styles.errorContainer}>
        <Alert
          message="Lỗi"
          description="Không tìm thấy thông tin giao dịch"
          type="error"
          showIcon
        />
        <Button 
          type="primary"
          onClick={() => navigate('/')}
          style={{ marginTop: 16 }}
        >
          Quay lại trang chủ
        </Button>
      </div>
    );
  }
  
  return (
    <div className={styles.paymentFormContainer}>
      <Card className={styles.paymentCard}>
        <div className={styles.paymentHeader}>
          <Title level={3}>Thanh toán</Title>
          
          <div className={styles.amountDisplay}>
            <Text>Tổng thanh toán:</Text>
            <Title level={3} className={styles.amount}>
              {parseInt(transactionData.amount).toLocaleString('vi-VN')} VNĐ
            </Title>
          </div>
        </div>
        
        <Steps current={paymentComplete ? 1 : 0} className={styles.steps}>
          <Step title="Thanh toán" icon={<BankOutlined />} />
          <Step title="Hoàn tất" icon={<CheckCircleOutlined />} />
        </Steps>
        
        <div className={styles.paymentContent}>
          {paymentComplete ? renderPaymentConfirmation() : renderPaymentQR()}
        </div>
      </Card>
    </div>
  );
};

export default PaymentForm;