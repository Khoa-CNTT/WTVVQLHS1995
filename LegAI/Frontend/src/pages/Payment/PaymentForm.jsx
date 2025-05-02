import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Button, Card, Typography, Steps,
  message, Divider, Row, Col, Spin, Alert
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
      setTransactionData({
        amount,
        status: 'pending'
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
          // Sử dụng tài khoản mặc định
          setDefaultBankAccount({
            bank_name: 'Vietcombank',
            account_number: '1023456789',
            account_holder: 'CÔNG TY LEGAI',
            branch: 'Hà Nội'
          });
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
            // Sử dụng tài khoản mặc định của hệ thống nếu không lấy được tài khoản của luật sư
            setDefaultBankAccount({
              bank_name: 'Vietcombank',
              account_number: '1023456789',
              account_holder: 'CÔNG TY LEGAI',
              branch: 'Hà Nội'
            });
          }
        } catch (apiError) {
          console.error('Lỗi API khi lấy thông tin tài khoản ngân hàng:', apiError);
          // Sử dụng tài khoản mặc định trong trường hợp lỗi API
          setDefaultBankAccount({
            bank_name: 'Vietcombank',
            account_number: '1023456789',
            account_holder: 'CÔNG TY LEGAI',
            branch: 'Hà Nội'
          });
        }
      } else {
        console.log('Không có lawyer_id, sử dụng tài khoản mặc định của hệ thống');
        // Nếu không có case_id hoặc lawyer_id, lấy tài khoản mặc định của hệ thống
        setDefaultBankAccount({
          bank_name: 'Vietcombank',
          account_number: '1023456789',
          account_holder: 'CÔNG TY LEGAI',
          branch: 'Hà Nội'
        });
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin tài khoản ngân hàng:', error);
      // Sử dụng tài khoản mặc định trong trường hợp lỗi
      setDefaultBankAccount({
        bank_name: 'Vietcombank',
        account_number: '1023456789',
        account_holder: 'CÔNG TY LEGAI',
        branch: 'Hà Nội'
      });
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
    // Tạo một ảnh từ SVG và tải xuống
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
  };
  
  // Xử lý xác nhận đã thanh toán
  const handleConfirmPayment = async () => {
    try {
      setSubmitting(true);
      
      if (!transactionData || !transactionData.id) {
        message.error('Thiếu thông tin giao dịch');
        return;
      }
      
      // Cập nhật trạng thái giao dịch
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
      console.error('Lỗi khi ghi nhận giao dịch:', error);
      message.error('Có lỗi xảy ra khi ghi nhận giao dịch. Vui lòng thử lại.');
    } finally {
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
    <>
      {loadingBankAccount ? (
        <Spin tip="Đang tải thông tin tài khoản...">
          <div style={{ minHeight: 100 }} />
        </Spin>
      ) : defaultBankAccount ? (
        <>
          <Alert
            message="Thông tin chuyển khoản"
            description={
              <div>
                <Paragraph>
                  <Text strong>Ngân hàng:</Text> {defaultBankAccount.bank_name}
                </Paragraph>
                <Paragraph>
                  <Text strong>Số tài khoản:</Text> {defaultBankAccount.account_number}
                </Paragraph>
                <Paragraph>
                  <Text strong>Chủ tài khoản:</Text> {defaultBankAccount.account_holder}
                </Paragraph>
                {defaultBankAccount.branch && (
                  <Paragraph>
                    <Text strong>Chi nhánh:</Text> {defaultBankAccount.branch}
                  </Paragraph>
                )}
                <Paragraph>
                  <Text strong>Nội dung chuyển khoản:</Text> {transactionData?.id ? `LEGAI ${transactionData.id}` : 'LEGAI PAYMENT'}
                </Paragraph>
                <Paragraph>
                  <Text strong>Số tiền:</Text> {transactionData ? `${parseInt(transactionData.amount).toLocaleString('vi-VN')} VNĐ` : 'N/A'}
                </Paragraph>
              </div>
            }
            type="info"
            showIcon
          />
          
          {caseData && !caseData.lawyer_id && (
            <Alert
              message="Chưa có luật sư phụ trách"
              description="Vụ án này chưa được phân công cho luật sư. Khoản thanh toán của bạn sẽ được chuyển vào tài khoản của hệ thống và sẽ được chuyển tiếp đến luật sư khi vụ án được phân công."
              type="warning"
              showIcon
              style={{ marginTop: 16, marginBottom: 16 }}
            />
          )}
          
          <div className={styles.qrCodeContainer}>
            <Title level={5}>Quét mã QR để thanh toán</Title>
            <QRCodeSVG 
              id="bankQRCode"
              value={transactionService.generateBankQRData(
                defaultBankAccount,
                transactionData?.amount || 0,
                transactionData?.id ? `LEGAI ${transactionData.id}` : 'LEGAI PAYMENT'
              )}
              size={200}
              level="H"
              includeMargin={true}
              className={styles.qrCode}
            />
            <Button 
              type="default"
              icon={<DownloadOutlined />}
              onClick={handleDownloadQR}
            >
              Tải xuống mã QR
            </Button>
            <Paragraph className={styles.paymentInstructions}>
              Sử dụng ứng dụng ngân hàng của bạn để quét mã QR và thanh toán nhanh chóng
            </Paragraph>
          </div>
          
          <Divider />
          
          <Alert
            message="Thông tin quan trọng"
            description={
              caseData && caseData.lawyer_id ? 
              "Sau khi bạn chuyển khoản, luật sư phụ trách vụ án sẽ xác nhận thanh toán của bạn. Trạng thái vụ án sẽ được cập nhật sau khi luật sư xác nhận đã nhận được thanh toán." :
              "Sau khi bạn chuyển khoản, hệ thống sẽ ghi nhận giao dịch của bạn. Khi vụ án được phân công cho luật sư, họ sẽ xác nhận thanh toán và tiếp tục xử lý vụ việc của bạn."
            }
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
          />
          
          <div className={styles.actionButtons}>
            <Button 
              type="primary"
              onClick={handleConfirmPayment}
              loading={submitting}
              size="large"
            >
              Đã thanh toán - Tiếp tục
            </Button>
          </div>
          
          <Paragraph className={styles.noteText}>
            Vui lòng giữ lại biên lai hoặc chứng từ chuyển khoản để đối chiếu khi cần thiết.
          </Paragraph>
        </>
      ) : (
        <Alert
          message="Không tìm thấy thông tin tài khoản"
          description="Không thể tải thông tin tài khoản ngân hàng. Vui lòng liên hệ với chúng tôi để được hỗ trợ."
          type="warning"
          showIcon
        />
      )}
    </>
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