import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Button, Card, message, 
  Typography, Select, Row, Col, Spin, List, Tag, Tooltip, Alert, Empty, Space, Modal, Checkbox
} from 'antd';
import { BankOutlined, CheckCircleOutlined, EditOutlined, InfoCircleOutlined, PlusOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import transactionService from '../../../services/transactionService';
import userService from '../../../services/userService';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const PaymentInfoSetup = ({ onComplete }) => {
  const [bankAccountForm] = Form.useForm();
  const [editBankAccountForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [existingBankAccounts, setExistingBankAccounts] = useState([]);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [editBankAccountModal, setEditBankAccountModal] = useState(false);
  const [currentBankAccount, setCurrentBankAccount] = useState(null);

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
          
          // Nếu đã có tài khoản ngân hàng, hiển thị giao diện quản lý
          if (response.data.length > 0) {
            setIsAddingAccount(false);
          } else {
            // Nếu chưa có tài khoản, hiển thị form thêm mới
            setIsAddingAccount(true);
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
  }, [bankAccountForm]);

  const handleBankAccountSetup = async (values) => {
    try {
      setLoading(true);
      
      const response = await transactionService.addBankAccount({
        ...values,
        is_default: true
      });
      
      if (response && response.success) {
        message.success('Thông tin tài khoản ngân hàng đã được lưu');
        
        // Lấy lại danh sách tài khoản ngân hàng
        const accountsResponse = await transactionService.getLawyerBankAccounts();
        if (accountsResponse && accountsResponse.success && Array.isArray(accountsResponse.data)) {
          setExistingBankAccounts(accountsResponse.data);
        }
        
        // Quay lại màn hình quản lý tài khoản
        setIsAddingAccount(false);
        
        // Gọi lại callback khi hoàn thành
        if (onComplete) onComplete();
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

  const handleAddNewBankAccount = () => {
    bankAccountForm.resetFields();
    
    // Đặt lại tên chủ tài khoản từ thông tin người dùng
    if (currentUser) {
      bankAccountForm.setFieldsValue({
        account_holder: currentUser.fullName || ''
      });
    }
    
    setIsAddingAccount(true);
  };

  const handleEditBankAccount = (account) => {
    setCurrentBankAccount(account);
    editBankAccountForm.setFieldsValue({
      bank_name: account.bank_name,
      account_number: account.account_number,
      account_holder: account.account_holder,
      branch: account.branch || '',
      is_default: account.is_default || false
    });
    setEditBankAccountModal(true);
  };

  const handleDeleteBankAccount = (accountId) => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa tài khoản ngân hàng này?',
      icon: <ExclamationCircleOutlined />,
      content: 'Tài khoản ngân hàng sau khi xóa sẽ không thể khôi phục',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const response = await transactionService.deleteBankAccount(accountId);
          
          if (response && response.success) {
            message.success('Tài khoản ngân hàng đã được xóa thành công.');
            
            // Làm mới danh sách tài khoản ngân hàng
            const accountsResponse = await transactionService.getLawyerBankAccounts();
            if (accountsResponse && accountsResponse.success && Array.isArray(accountsResponse.data)) {
              setExistingBankAccounts(accountsResponse.data);
              
              // Nếu đã xóa hết tài khoản, hiển thị form thêm mới
              if (accountsResponse.data.length === 0) {
                setIsAddingAccount(true);
              }
            }
          } else {
            message.error(response?.message || 'Không thể xóa tài khoản ngân hàng.');
          }
        } catch (error) {
          console.error('Lỗi khi xóa tài khoản ngân hàng:', error);
          message.error('Không thể xóa tài khoản ngân hàng. Vui lòng thử lại sau.');
        }
      }
    });
  };

  const handleUpdateBankAccount = async (values) => {
    if (!currentBankAccount) return;
    
    try {
      setLoading(true);
      const response = await transactionService.updateBankAccount(currentBankAccount.id, values);
      
      if (response && response.success) {
        message.success('Thông tin tài khoản ngân hàng đã được cập nhật');
        
        // Đóng modal và làm mới dữ liệu
        setEditBankAccountModal(false);
        setCurrentBankAccount(null);
        
        // Lấy lại danh sách tài khoản ngân hàng
        const accountsResponse = await transactionService.getLawyerBankAccounts();
        if (accountsResponse && accountsResponse.success && Array.isArray(accountsResponse.data)) {
          setExistingBankAccounts(accountsResponse.data);
        }
      } else {
        message.error(response?.message || 'Không thể cập nhật thông tin tài khoản ngân hàng');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật tài khoản ngân hàng:', error);
      message.error('Không thể cập nhật thông tin tài khoản ngân hàng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
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

    // Hiển thị form thêm tài khoản
    return (
      <Card 
        title="Thêm tài khoản ngân hàng"
        extra={
          existingBankAccounts.length > 0 && (
            <Button 
              onClick={() => setIsAddingAccount(false)}
            >
              Quay lại
            </Button>
          )
        }
      >
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
              <Option value="Agribank">Ngân hàng Nông nghiệp và Phát triển Nông thôn (Agribank)</Option>
              <Option value="Techcombank">Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)</Option>
              <Option value="ACB">Ngân hàng TMCP Á Châu (ACB)</Option>
              <Option value="MBBank">Ngân hàng TMCP Quân đội (MBBank)</Option>
              <Option value="VPBank">Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)</Option>
              <Option value="TPBank">Ngân hàng TMCP Tiên Phong (TPBank)</Option>
              <Option value="Sacombank">Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)</Option>
              <Option value="OCB">Ngân hàng TMCP Phương Đông (OCB)</Option>
              <Option value="HDBank">Ngân hàng TMCP Phát triển TP. Hồ Chí Minh (HDBank)</Option>
              <Option value="VIB">Ngân hàng TMCP Quốc tế Việt Nam (VIB)</Option>
              <Option value="SHB">Ngân hàng TMCP Sài Gòn - Hà Nội (SHB)</Option>
              <Option value="SeABank">Ngân hàng TMCP Đông Nam Á (SeABank)</Option>
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
              Lưu thông tin tài khoản
            </Button>
          </Form.Item>
        </Form>
      </Card>
    );
  };

  const renderBankAccountManagement = () => {
    if (loadingBankAccounts) {
      return (
        <Card title="Tài khoản ngân hàng">
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin tip="Đang tải danh sách tài khoản ngân hàng..." />
          </div>
        </Card>
      );
    }

    return (
      <Card 
        title="Tài khoản ngân hàng của bạn"
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddNewBankAccount}
          >
            Thêm tài khoản mới
          </Button>
        }
      >
        {existingBankAccounts.length > 0 ? (
          <>
            <List
              dataSource={existingBankAccounts}
              renderItem={account => (
                <List.Item 
                  actions={[
                    <Tooltip title="Sửa tài khoản">
                      <Button 
                        icon={<EditOutlined />} 
                        type="text"
                        onClick={() => handleEditBankAccount(account)}
                      />
                    </Tooltip>,
                    <Tooltip title="Xóa tài khoản">
                      <Button 
                        icon={<DeleteOutlined />} 
                        type="text" 
                        danger
                        onClick={() => handleDeleteBankAccount(account.id)}
                      />
                    </Tooltip>,
                    account.is_default && <Tag color="green">Mặc định</Tag>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<BankOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                    title={`${account.bank_name} - ${account.account_number}`}
                    description={`Chủ tài khoản: ${account.account_holder}${account.branch ? ` | Chi nhánh: ${account.branch}` : ''}`}
                  />
                </List.Item>
              )}
            />
            
            <Alert
              message="Thông tin quan trọng"
              description="Tài khoản ngân hàng này sẽ được sử dụng để tạo mã QR thanh toán. Khách hàng sẽ quét mã này để thanh toán trực tiếp vào tài khoản của bạn."
              type="info"
              showIcon
              style={{ marginTop: 16, marginBottom: 16 }}
            />
            
            {onComplete && (
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Button 
                  type="primary" 
                  onClick={onComplete}
                  icon={<CheckCircleOutlined />}
                >
                  Quản lý giao dịch thanh toán
                </Button>
              </div>
            )}
          </>
        ) : (
          <Empty
            description="Bạn chưa có tài khoản ngân hàng nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button 
              type="primary" 
              onClick={handleAddNewBankAccount}
            >
              Thêm tài khoản ngân hàng
            </Button>
          </Empty>
        )}
      </Card>
    );
  };

  // Phần render chính
  return (
    <div>
      <Row gutter={[0, 16]}>
        <Col span={24}>
          <Title level={3}>Quản lý tài khoản thanh toán</Title>
          <Paragraph>
            Quản lý tài khoản ngân hàng của bạn để nhận thanh toán từ khách hàng.
          </Paragraph>
        </Col>
        
        <Col span={24}>
          {isAddingAccount ? renderBankAccountSetup() : renderBankAccountManagement()}
        </Col>
      </Row>

      {/* Modal chỉnh sửa tài khoản ngân hàng */}
      <Modal
        title="Chỉnh sửa tài khoản ngân hàng"
        open={editBankAccountModal}
        onCancel={() => {
          setEditBankAccountModal(false);
          setCurrentBankAccount(null);
        }}
        footer={null}
      >
        <Form
          form={editBankAccountForm}
          layout="vertical"
          onFinish={handleUpdateBankAccount}
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
              <Option value="Agribank">Ngân hàng Nông nghiệp và Phát triển Nông thôn (Agribank)</Option>
              <Option value="Techcombank">Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)</Option>
              <Option value="ACB">Ngân hàng TMCP Á Châu (ACB)</Option>
              <Option value="MBBank">Ngân hàng TMCP Quân đội (MBBank)</Option>
              <Option value="VPBank">Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)</Option>
              <Option value="TPBank">Ngân hàng TMCP Tiên Phong (TPBank)</Option>
              <Option value="Sacombank">Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)</Option>
              <Option value="OCB">Ngân hàng TMCP Phương Đông (OCB)</Option>
              <Option value="HDBank">Ngân hàng TMCP Phát triển TP. Hồ Chí Minh (HDBank)</Option>
              <Option value="VIB">Ngân hàng TMCP Quốc tế Việt Nam (VIB)</Option>
              <Option value="SHB">Ngân hàng TMCP Sài Gòn - Hà Nội (SHB)</Option>
              <Option value="SeABank">Ngân hàng TMCP Đông Nam Á (SeABank)</Option>
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
          
          <Form.Item
            name="is_default"
            valuePropName="checked"
          >
            <Checkbox>Đặt làm tài khoản mặc định</Checkbox>
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button
                type="default"
                onClick={() => {
                  setEditBankAccountModal(false);
                  setCurrentBankAccount(null);
                }}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
              >
                Cập nhật tài khoản
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PaymentInfoSetup; 