import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Button, Card, Steps, message, 
  Typography, Select, InputNumber, Row, Col, Divider, Spin, List, Tag
} from 'antd';
import { BankOutlined, CheckCircleOutlined, DollarOutlined, EditOutlined } from '@ant-design/icons';
import transactionService from '../../../services/transactionService';
import userService from '../../../services/userService';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

const PaymentInfoSetup = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [bankAccountForm] = Form.useForm();
  const [commissionForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [existingBankAccounts, setExistingBankAccounts] = useState([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState(null);
  const [isEditingPayment, setIsEditingPayment] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await userService.refreshUserData();
        setCurrentUser(userData);
        
        // Nếu đã lấy được thông tin người dùng, đặt giá trị mặc định cho form
        if (userData) {
          bankAccountForm.setFieldsValue({
            account_holder: userData.fullName || ''
          });
          
          // Nạp thông tin phí dịch vụ vào form
          commissionForm.setFieldsValue({
            hourly_rate: userData.hourly_rate || 500000,
            commission_rate: userData.commission_rate || 10,
            min_retainer_fee: userData.min_retainer_fee || 1000000,
            payment_notes: userData.payment_notes || '',
          });
        }
        
        // Kiểm tra nếu đã hoàn thành thiết lập thanh toán
        if (userData && userData.payment_setup_complete) {
          setSetupComplete(true);
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
      }
    };
    
    const fetchBankAccounts = async () => {
      try {
        setLoadingBankAccounts(true);
        const response = await transactionService.getLawyerBankAccounts();
        if (response && response.success && response.data && Array.isArray(response.data)) {
          setExistingBankAccounts(response.data);
          
          // Tìm tài khoản mặc định
          const defaultAccount = response.data.find(account => account.is_default);
          if (defaultAccount) {
            setSelectedBankAccount(defaultAccount);
            
            // Nếu đã có tài khoản ngân hàng và đã thiết lập thanh toán
            const userData = await userService.getUserProfile(defaultAccount.user_id);
            if (userData && userData.payment_setup_complete) {
              setSetupComplete(true);
              setCurrentStep(2); // Chuyển đến bước hoàn tất
            } else if (currentStep === 0) {
              // Nếu có tài khoản nhưng chưa thiết lập xong và đang ở bước 0
              setCurrentStep(1); // Chuyển đến bước thiết lập phí dịch vụ
            }
          }
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách tài khoản ngân hàng:', error);
      } finally {
        setLoadingBankAccounts(false);
      }
    };
    
    fetchUserData();
    fetchBankAccounts();
  }, [onComplete, bankAccountForm, commissionForm]);

  const handleBankAccountSetup = async (values) => {
    try {
      setLoading(true);
      
      const response = await transactionService.addBankAccount({
        ...values,
        is_default: true
      });
      
      if (response && response.success) {
        // Lưu tài khoản đã thêm/cập nhật
        if (response.data) {
          setSelectedBankAccount(response.data);
        }
        message.success('Thông tin tài khoản ngân hàng đã được lưu');
        
        // Lấy lại danh sách tài khoản ngân hàng
        const accountsResponse = await transactionService.getLawyerBankAccounts();
        if (accountsResponse && accountsResponse.success && Array.isArray(accountsResponse.data)) {
          setExistingBankAccounts(accountsResponse.data);
        }
        
        // Nếu đã thiết lập xong, quay lại màn hình thông tin thanh toán
        if (setupComplete) {
          setCurrentStep(2); // Hiển thị thông tin đã thiết lập
          setIsEditingPayment(false);
        } else {
          setCurrentStep(1); // Nếu lần đầu thiết lập, chuyển đến bước tiếp theo
        }
      } else {
        message.error(response?.message || 'Không thể thêm thông tin tài khoản ngân hàng');
      }
    } catch (error) {
      console.error('Lỗi khi thêm tài khoản ngân hàng:', error);
      message.error('Không thể thêm thông tin tài khoản ngân hàng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommissionSetup = async (values) => {
    try {
      setLoading(true);
      
      // Cập nhật thông tin phí dịch vụ của luật sư - chỉ bao gồm các thông tin liên quan đến thanh toán
      const response = await userService.updateUserProfile(currentUser.id, {
        hourly_rate: values.hourly_rate,
        commission_rate: values.commission_rate,
        min_retainer_fee: values.min_retainer_fee,
        payment_notes: values.payment_notes,
        payment_setup_complete: true
      });
      
      if (response && response.success) {
        message.success('Thiết lập thông tin thanh toán thành công');
        setSetupComplete(true);
        setCurrentStep(2);
        setIsEditingPayment(false);
        
        // Cập nhật thông tin người dùng
        const userData = await userService.refreshUserData();
        setCurrentUser(userData);
        
        if (onComplete) onComplete();
      } else {
        message.error(response?.message || 'Không thể cập nhật thông tin thanh toán');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin thanh toán:', error);
      message.error('Không thể cập nhật thông tin thanh toán. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPaymentInfo = () => {
    setIsEditingPayment(true);
    setCurrentStep(1);
  };

  const handleAddNewBankAccount = () => {
    bankAccountForm.resetFields();
    setSelectedBankAccount(null);
    setCurrentStep(0);
  };

  const renderBankAccountSetup = () => {
    if (loadingBankAccounts) {
      return (
        <Card title="Thông tin tài khoản ngân hàng">
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin tip="Đang kiểm tra thông tin tài khoản ngân hàng..." />
          </div>
        </Card>
      );
    }

    // Hiển thị tài khoản đã có nếu tồn tại
    if (existingBankAccounts.length > 0) {
      return (
        <Card title="Thông tin tài khoản ngân hàng của bạn">
          <div className="bank-account-summary">
            <List
              dataSource={existingBankAccounts}
              renderItem={account => (
                <List.Item actions={[
                  account.is_default && <Tag color="green">Mặc định</Tag>
                ]}>
                  <List.Item.Meta
                    avatar={<BankOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                    title={`${account.bank_name} - ${account.account_number}`}
                    description={`Chủ tài khoản: ${account.account_holder}${account.branch ? ` | Chi nhánh: ${account.branch}` : ''}`}
                  />
                </List.Item>
              )}
            />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <Button 
                onClick={() => setCurrentStep(1)}
                type="primary"
              >
                Tiếp tục thiết lập phí dịch vụ
              </Button>
              
              <Button 
                onClick={handleAddNewBankAccount}
              >
                Thêm tài khoản mới
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card title="Thông tin tài khoản ngân hàng">
        <Paragraph>
          Vui lòng cung cấp thông tin tài khoản ngân hàng của bạn để nhận thanh toán từ khách hàng.
        </Paragraph>
        
        <Form
          form={bankAccountForm}
          layout="vertical"
          onFinish={handleBankAccountSetup}
          initialValues={{
            bank_name: '',
            account_number: '',
            account_holder: currentUser?.fullName || '',
            branch: ''
          }}
        >
          <Form.Item
            name="bank_name"
            label="Tên ngân hàng"
            rules={[{ required: true, message: 'Vui lòng chọn tên ngân hàng' }]}
          >
            <Select prefix={<BankOutlined />} placeholder="Chọn ngân hàng">
              <Option value="Vietcombank">Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)</Option>
              <Option value="VietinBank">Ngân hàng TMCP Công thương Việt Nam (VietinBank)</Option>
              <Option value="BIDV">Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)</Option>
              <Option value="Agribank">Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam (Agribank)</Option>
              <Option value="Techcombank">Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)</Option>
              <Option value="ACB">Ngân hàng TMCP Á Châu (ACB)</Option>
              <Option value="VPBank">Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)</Option>
              <Option value="MBBank">Ngân hàng TMCP Quân đội (MBBank)</Option>
              <Option value="Sacombank">Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)</Option>
              <Option value="TPBank">Ngân hàng TMCP Tiên Phong (TPBank)</Option>
              <Option value="HDBank">Ngân hàng TMCP Phát triển TP.HCM (HDBank)</Option>
              <Option value="OCB">Ngân hàng TMCP Phương Đông (OCB)</Option>
              <Option value="SHB">Ngân hàng TMCP Sài Gòn - Hà Nội (SHB)</Option>
              <Option value="SeABank">Ngân hàng TMCP Đông Nam Á (SeABank)</Option>
              <Option value="VIB">Ngân hàng TMCP Quốc tế Việt Nam (VIB)</Option>
              <Option value="MSB">Ngân hàng TMCP Hàng Hải Việt Nam (MSB)</Option>
              <Option value="Eximbank">Ngân hàng TMCP Xuất Nhập khẩu Việt Nam (Eximbank)</Option>
              <Option value="LienVietPostBank">Ngân hàng TMCP Bưu điện Liên Việt (LienVietPostBank)</Option>
              <Option value="Other">Ngân hàng khác</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="account_number"
            label="Số tài khoản"
            rules={[{ required: true, message: 'Vui lòng nhập số tài khoản' }]}
          >
            <Input placeholder="Số tài khoản" />
          </Form.Item>
          
          <Form.Item
            name="account_holder"
            label="Chủ tài khoản"
            rules={[{ required: true, message: 'Vui lòng nhập tên chủ tài khoản' }]}
          >
            <Input placeholder="Tên chủ tài khoản" />
          </Form.Item>
          
          <Form.Item
            name="branch"
            label="Chi nhánh"
          >
            <Input placeholder="Chi nhánh ngân hàng (không bắt buộc)" />
          </Form.Item>
          
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              Tiếp tục
            </Button>
          </Form.Item>
        </Form>
      </Card>
    );
  };

  const renderCommissionSetup = () => (
    <Card title="Cấu hình phí dịch vụ">
      <Paragraph>
        Thiết lập mức phí dịch vụ của bạn để khách hàng biết chi phí khi sử dụng dịch vụ của bạn.
      </Paragraph>
      
      <Form
        form={commissionForm}
        layout="vertical"
        onFinish={handleCommissionSetup}
        initialValues={{
          hourly_rate: currentUser?.hourly_rate || 500000,
          commission_rate: currentUser?.commission_rate || 10,
          min_retainer_fee: currentUser?.min_retainer_fee || 1000000,
          payment_notes: currentUser?.payment_notes || ''
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="hourly_rate"
              label="Phí tư vấn theo giờ (VNĐ)"
              rules={[{ required: true, message: 'Vui lòng nhập phí tư vấn theo giờ' }]}
            >
              <InputNumber
                min={0}
                step={50000}
                style={{ width: '100%' }}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                prefix={<DollarOutlined />}
              />
            </Form.Item>
          </Col>
          
          <Col xs={24} md={12}>
            <Form.Item
              name="commission_rate"
              label="Tỷ lệ hoa hồng (%)"
              rules={[{ required: true, message: 'Vui lòng nhập tỷ lệ hoa hồng' }]}
            >
              <InputNumber
                min={0}
                max={100}
                step={0.5}
                style={{ width: '100%' }}
                formatter={value => `${value}%`}
                parser={value => value.replace('%', '')}
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item
          name="min_retainer_fee"
          label="Phí đặt cọc tối thiểu (VNĐ)"
          rules={[{ required: true, message: 'Vui lòng nhập phí đặt cọc tối thiểu' }]}
        >
          <InputNumber
            min={0}
            step={100000}
            style={{ width: '100%' }}
            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value.replace(/\$\s?|(,*)/g, '')}
          />
        </Form.Item>
        
        <Form.Item
          name="payment_notes"
          label="Ghi chú về thanh toán"
        >
          <TextArea
            rows={4}
            placeholder="Thông tin bổ sung về chính sách thanh toán của bạn (không bắt buộc)"
          />
        </Form.Item>
        
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
          >
            Hoàn tất thiết lập
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const renderPaymentInfo = () => (
    <Card title="Thông tin thanh toán của bạn">
      <Row gutter={[16, 24]}>
        <Col span={24}>
          <Card type="inner" title="Tài khoản ngân hàng">
            {loadingBankAccounts ? (
              <Spin />
            ) : existingBankAccounts.length > 0 ? (
              <List
                dataSource={existingBankAccounts}
                renderItem={account => (
                  <List.Item actions={[
                    account.is_default && <Tag color="green">Mặc định</Tag>
                  ]}>
                    <List.Item.Meta
                      avatar={<BankOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                      title={`${account.bank_name} - ${account.account_number}`}
                      description={`Chủ tài khoản: ${account.account_holder}${account.branch ? ` | Chi nhánh: ${account.branch}` : ''}`}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Paragraph>Chưa có tài khoản ngân hàng nào được thiết lập.</Paragraph>
            )}
            <Button 
              type="default" 
              icon={<EditOutlined />} 
              onClick={handleAddNewBankAccount}
              style={{ marginTop: '16px' }}
            >
              Thêm tài khoản ngân hàng mới
            </Button>
          </Card>
        </Col>
        
        <Col span={24}>
          <Card type="inner" title="Cấu hình phí dịch vụ">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Statistic title="Phí tư vấn theo giờ" value={currentUser?.hourly_rate || 0} 
                  formatter={value => `${value.toLocaleString('vi-VN')} VNĐ`} />
              </Col>
              <Col xs={24} md={8}>
                <Statistic title="Tỷ lệ hoa hồng" value={currentUser?.commission_rate || 0}
                  formatter={value => `${value}%`} />
              </Col>
              <Col xs={24} md={8}>
                <Statistic title="Phí đặt cọc tối thiểu" value={currentUser?.min_retainer_fee || 0}
                  formatter={value => `${value.toLocaleString('vi-VN')} VNĐ`} />
              </Col>
            </Row>
            
            {currentUser?.payment_notes && (
              <div style={{ marginTop: '16px' }}>
                <Text strong>Ghi chú thanh toán:</Text>
                <Paragraph>{currentUser.payment_notes}</Paragraph>
              </div>
            )}
            
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              onClick={handleEditPaymentInfo}
              style={{ marginTop: '16px' }}
            >
              Chỉnh sửa thông tin phí dịch vụ
            </Button>
          </Card>
        </Col>
      </Row>
      
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a', marginBottom: 8 }} />
        <Paragraph>
          Thiết lập thanh toán đã hoàn tất. Khách hàng có thể thanh toán cho các dịch vụ của bạn.
        </Paragraph>
        
        {onComplete && (
          <Button type="primary" onClick={onComplete}>
            Quản lý giao dịch
          </Button>
        )}
      </div>
    </Card>
  );

  const renderSetupComplete = () => (
    isEditingPayment ? renderCommissionSetup() : renderPaymentInfo()
  );

  // Luôn hiển thị màn hình thông tin đã thiết lập khi:
  // - Đã hoàn thành thiết lập (setupComplete=true)
  // - Không đang chỉnh sửa thông tin phí dịch vụ (isEditingPayment=false)
  // - Không đang thêm tài khoản mới (currentStep=0)
  if (setupComplete && !isEditingPayment && currentStep !== 0) {
    // Mặc định luôn hiển thị màn hình hoàn tất khi đã setup
    return renderPaymentInfo();
  }

  // Nếu đã setup xong nhưng đang chỉnh sửa thông tin hoặc thêm tài khoản mới
  if (setupComplete) {
    return (
      <div>
        <Title level={3}>
          {currentStep === 0 ? 'Thêm tài khoản ngân hàng' : 'Chỉnh sửa thông tin thanh toán'}
        </Title>
        <Paragraph>
          {currentStep === 0 
            ? 'Thêm tài khoản ngân hàng mới để nhận thanh toán từ khách hàng.'
            : 'Chỉnh sửa thông tin phí dịch vụ của bạn.'
          }
        </Paragraph>
        
        <Button 
          icon={<CheckCircleOutlined />} 
          style={{ marginBottom: 16 }} 
          onClick={() => {
            setIsEditingPayment(false);
            setCurrentStep(2);
          }}
        >
          Quay lại thông tin thanh toán
        </Button>
        
        {currentStep === 0 && renderBankAccountSetup()}
        {currentStep === 1 && renderCommissionSetup()}
      </div>
    );
  }

  // Mặc định - đang trong quá trình setup lần đầu
  return (
    <div>
      <Title level={3}>Thiết lập thanh toán</Title>
      <Paragraph>
        Cung cấp thông tin tài khoản và thiết lập cấu hình phí dịch vụ của bạn.
      </Paragraph>
      
      <Steps current={currentStep} style={{ marginBottom: 32 }}>
        <Step title="Thông tin tài khoản" description="Cung cấp thông tin ngân hàng" />
        <Step title="Cấu hình phí dịch vụ" description="Thiết lập mức phí" />
        <Step title="Hoàn tất" description="Hoàn thành thiết lập" />
      </Steps>
      
      {currentStep === 0 && renderBankAccountSetup()}
      {currentStep === 1 && renderCommissionSetup()}
      {currentStep === 2 && renderSetupComplete()}
    </div>
  );
};

const Statistic = ({ title, value, formatter }) => {
  return (
    <div style={{ marginBottom: 8 }}>
      <Text type="secondary">{title}</Text>
      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
        {formatter ? formatter(value) : value}
      </div>
    </div>
  );
};

export default PaymentInfoSetup; 