import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Button, Card, Typography, Radio, Steps,
  message, Divider, Row, Col, Spin, Checkbox, Alert
} from 'antd';
import { 
  CreditCardOutlined, BankOutlined, MobileOutlined,
  CheckCircleOutlined, DollarOutlined, SafetyOutlined
} from '@ant-design/icons';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [transactionData, setTransactionData] = useState(null);
  const [paymentMethods] = useState(transactionService.getPaymentMethods());
  const [selectedMethod, setSelectedMethod] = useState('credit_card');
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [caseData, setCaseData] = useState(null);
  const [loadingBankAccount, setLoadingBankAccount] = useState(true);
  const [defaultBankAccount, setDefaultBankAccount] = useState(null);
  
  // Lấy transaction_id từ query params
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const transactionId = queryParams.get('transaction_id');
    const amount = queryParams.get('amount');
    
    if (transactionId) {
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
  
  // Lấy tài khoản ngân hàng mặc định khi chọn phương thức thanh toán
  useEffect(() => {
    if (selectedMethod === 'bank_transfer') {
      fetchBankAccount();
    }
  }, [selectedMethod]);

  const fetchBankAccount = async () => {
    try {
      setLoadingBankAccount(true);
      // Nếu có case_id, lấy tài khoản ngân hàng của luật sư xử lý vụ án
      if (caseData && caseData.lawyer_id) {
        const response = await legalCaseService.getLawyerBankAccount(caseData.lawyer_id);
        if (response && response.success && response.data) {
          setDefaultBankAccount(response.data);
        } else {
          setDefaultBankAccount(null);
        }
      } else {
        // Nếu không có case_id, lấy tài khoản mặc định của hệ thống
        setDefaultBankAccount({
          bank_name: 'Vietcombank',
          account_number: '1023456789',
          account_holder: 'CÔNG TY LEGAI',
          branch: 'Hà Nội'
        });
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin tài khoản ngân hàng:', error);
      setDefaultBankAccount(null);
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
      
      const response = await transactionService.getTransactionById(transactionId);
      
      if (response && response.success) {
        setTransactionData(response.data);
        
        // Nếu giao dịch đã hoàn thành, chuyển đến bước hoàn tất
        if (response.data.status === 'completed') {
          setPaymentComplete(true);
          setCurrentStep(2);
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
  
  const handleMethodChange = (e) => {
    setSelectedMethod(e.target.value);
  };
  
  const handlePaymentSubmit = async (values) => {
    try {
      setSubmitting(true);
      
      // TODO: Tích hợp API cổng thanh toán thực tế ở đây
      // Hiện tại chỉ mô phỏng quá trình thanh toán
      
      // Mô phỏng xử lý thanh toán
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Cập nhật trạng thái giao dịch (mô phỏng webhook từ cổng thanh toán)
      if (transactionData && transactionData.id) {
        try {
          await transactionService.updateTransactionStatus(
            transactionData.id,
            'completed',
            {
              payment_method: selectedMethod,
              transaction_code: `SIM${Date.now()}`,
              payment_details: values
            }
          );
          
          // Cập nhật lại thông tin giao dịch
          await fetchTransactionData(transactionData.id);
        } catch (updateError) {
          console.error('Lỗi khi cập nhật trạng thái giao dịch:', updateError);
        }
      }
      
      message.success('Thanh toán thành công!');
      setPaymentComplete(true);
      setCurrentStep(2);
    } catch (error) {
      console.error('Lỗi khi xử lý thanh toán:', error);
      message.error('Có lỗi xảy ra khi xử lý thanh toán. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleNextStep = () => {
    form.validateFields()
      .then(() => {
        setCurrentStep(currentStep + 1);
      })
      .catch(error => {
        console.error('Lỗi validation:', error);
      });
  };
  
  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  const renderPaymentMethodSelection = () => (
    <div>
      <Title level={4}>Chọn phương thức thanh toán</Title>
      
      <Radio.Group 
        value={selectedMethod}
        onChange={handleMethodChange}
        className={styles.paymentMethodGroup}
      >
        {paymentMethods.map(method => (
          <Radio.Button 
            key={method.id} 
            value={method.id}
            className={styles.paymentMethodButton}
          >
            {method.id === 'credit_card' && <CreditCardOutlined />}
            {method.id === 'bank_transfer' && <BankOutlined />}
            {(method.id === 'momo' || method.id === 'zalopay' || method.id === 'e_wallet') && <MobileOutlined />}
            {method.id === 'cash' && <DollarOutlined />}
            <span>{method.name}</span>
          </Radio.Button>
        ))}
      </Radio.Group>
      
      <div className={styles.actionButtons}>
        <Button 
          type="primary" 
          onClick={handleNextStep}
        >
          Tiếp tục
        </Button>
      </div>
    </div>
  );
  
  const renderPaymentForm = () => {
    switch (selectedMethod) {
      case 'credit_card':
        return (
          <div>
            <Title level={4}>Thông tin thẻ</Title>
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handlePaymentSubmit}
            >
              <Form.Item
                name="card_number"
                label="Số thẻ"
                rules={[
                  { required: true, message: 'Vui lòng nhập số thẻ' },
                  { pattern: /^\d{13,19}$/, message: 'Số thẻ không hợp lệ' }
                ]}
              >
                <Input 
                  prefix={<CreditCardOutlined />} 
                  placeholder="Nhập số thẻ"
                  maxLength={19}
                />
              </Form.Item>
              
              <Row gutter={16}>
                <Col span={16}>
                  <Form.Item
                    name="expiry_date"
                    label="Ngày hết hạn (MM/YY)"
                    rules={[
                      { required: true, message: 'Vui lòng nhập ngày hết hạn' },
                      { pattern: /^(0[1-9]|1[0-2])\/?([0-9]{2})$/, message: 'Định dạng MM/YY' }
                    ]}
                  >
                    <Input placeholder="MM/YY" maxLength={5} />
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item
                    name="cvv"
                    label="CVV"
                    rules={[
                      { required: true, message: 'Vui lòng nhập CVV' },
                      { pattern: /^\d{3,4}$/, message: 'CVV không hợp lệ' }
                    ]}
                  >
                    <Input 
                      placeholder="CVV" 
                      maxLength={4}
                      type="password"
                    />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item
                name="card_holder"
                label="Chủ thẻ"
                rules={[{ required: true, message: 'Vui lòng nhập tên chủ thẻ' }]}
              >
                <Input placeholder="Tên chủ thẻ" />
              </Form.Item>
              
              <Form.Item
                name="save_card"
                valuePropName="checked"
              >
                <Checkbox>Lưu thông tin thẻ cho lần sau</Checkbox>
              </Form.Item>
              
              <div className={styles.actionButtons}>
                <Button 
                  onClick={handlePrevStep}
                >
                  Quay lại
                </Button>
                
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={submitting}
                >
                  Thanh toán
                </Button>
              </div>
            </Form>
          </div>
        );
      
      case 'bank_transfer':
        return (
          <div>
            <Title level={4}>Chuyển khoản ngân hàng</Title>
            
            {loadingBankAccount ? (
              <Spin tip="Đang tải thông tin tài khoản...">
                <div style={{ minHeight: 100 }} />
              </Spin>
            ) : defaultBankAccount ? (
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
                  </div>
                }
                type="info"
                showIcon
              />
            ) : (
              <Alert
                message="Không tìm thấy thông tin tài khoản"
                description="Không thể tải thông tin tài khoản ngân hàng. Vui lòng liên hệ với chúng tôi để được hỗ trợ."
                type="warning"
                showIcon
              />
            )}
            
            <Paragraph className={styles.noteText}>
              Sau khi chuyển khoản, vui lòng nhập thông tin giao dịch bên dưới để chúng tôi có thể xác nhận thanh toán của bạn.
            </Paragraph>
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handlePaymentSubmit}
            >
              <Form.Item
                name="transfer_account"
                label="Tài khoản chuyển"
                rules={[{ required: true, message: 'Vui lòng nhập tài khoản chuyển' }]}
              >
                <Input placeholder="Số tài khoản hoặc tên tài khoản của bạn" />
              </Form.Item>
              
              <Form.Item
                name="transfer_time"
                label="Thời gian chuyển khoản"
                rules={[{ required: true, message: 'Vui lòng nhập thời gian chuyển khoản' }]}
              >
                <Input placeholder="DD/MM/YYYY HH:MM" />
              </Form.Item>
              
              <Form.Item
                name="transfer_amount"
                label="Số tiền đã chuyển"
                rules={[{ required: true, message: 'Vui lòng nhập số tiền đã chuyển' }]}
              >
                <Input placeholder="Số tiền (VNĐ)" />
              </Form.Item>
              
              <Form.Item
                name="transfer_note"
                label="Nội dung chuyển khoản"
              >
                <Input placeholder="Nội dung bạn đã ghi khi chuyển khoản" />
              </Form.Item>
              
              <div className={styles.actionButtons}>
                <Button 
                  onClick={handlePrevStep}
                >
                  Quay lại
                </Button>
                
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={submitting}
                >
                  Xác nhận đã chuyển khoản
                </Button>
              </div>
            </Form>
          </div>
        );
      
      case 'momo':
      case 'zalopay':
      case 'e_wallet':
        return (
          <div>
            <Title level={4}>Thanh toán qua ví điện tử</Title>
            
            <div className={styles.qrCodeContainer}>
              <img 
                src="/qrcode-placeholder.png" 
                alt="QR Code" 
                className={styles.qrCode}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/200?text=QR+Code';
                }}
              />
              <Paragraph>
                Quét mã QR bằng ứng dụng {selectedMethod === 'momo' ? 'MoMo' : selectedMethod === 'zalopay' ? 'ZaloPay' : 'ví điện tử'} để thanh toán
              </Paragraph>
            </div>
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handlePaymentSubmit}
            >
              <Form.Item
                name="wallet_account"
                label="Tài khoản ví"
                rules={[{ required: true, message: 'Vui lòng nhập tài khoản ví' }]}
              >
                <Input placeholder="Số điện thoại hoặc email đăng ký ví" />
              </Form.Item>
              
              <div className={styles.actionButtons}>
                <Button 
                  onClick={handlePrevStep}
                >
                  Quay lại
                </Button>
                
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={submitting}
                >
                  Xác nhận đã thanh toán
                </Button>
              </div>
            </Form>
          </div>
        );
      
      default:
        return (
          <div>
            <Button onClick={handlePrevStep}>Quay lại</Button>
          </div>
        );
    }
  };
  
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
                <Text strong>Phương thức thanh toán:</Text> {
                  paymentMethods.find(m => m.id === transactionData?.payment_method)?.name || 
                  transactionData?.payment_method || 
                  'N/A'
                }
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
        
        <Steps current={currentStep} className={styles.steps}>
          <Step title="Phương thức" icon={<SafetyOutlined />} />
          <Step title="Thông tin" icon={<BankOutlined />} />
          <Step title="Hoàn tất" icon={<CheckCircleOutlined />} />
        </Steps>
        
        <div className={styles.paymentContent}>
          {currentStep === 0 && renderPaymentMethodSelection()}
          {currentStep === 1 && renderPaymentForm()}
          {currentStep === 2 && renderPaymentConfirmation()}
        </div>
      </Card>
    </div>
  );
};

export default PaymentForm; 