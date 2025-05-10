import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Button, Card, Select, InputNumber, 
  Typography, Spin, Divider, Row, Col, Tag, Alert,
  Space, Descriptions
} from 'antd';
import { 
  SaveOutlined, BookOutlined,
  TrophyOutlined, BankOutlined, TeamOutlined, UserOutlined, FileTextOutlined,
  BuildOutlined, EnvironmentOutlined, GlobalOutlined, MailOutlined,
  EditOutlined, RollbackOutlined
} from '@ant-design/icons';
import userService from '../../../services/userService';
import authService from '../../../services/authService';
import './LawyerSpecialtyEditor.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const LawyerSpecialtyEditor = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lawyer, setLawyer] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [specializations, setSpecializations] = useState([
    'Dân sự',
    'Hình sự',
    'Hành chính',
    'Hôn nhân và gia đình',
    'Kinh doanh và thương mại',
    'Đất đai',
    'Lao động',
    'Sở hữu trí tuệ',
    'Thuế',
    'Quốc tế'
  ]);

  useEffect(() => {
    fetchLawyerData();
  }, []);

  const fetchLawyerData = async () => {
    setLoading(true);
    setError('');
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser || !currentUser.id || currentUser.role?.toLowerCase() !== 'lawyer') {
        setError('Bạn không phải là luật sư hoặc chưa đăng nhập');
        setLoading(false);
        return;
      }

      // Lấy thông tin luật sư
      try {
        const lawyerData = await userService.getLawyerById(currentUser.id);
        if (lawyerData) {
          // Chuyển đổi trường specialization từ string thành array nếu cần
          const specialization = lawyerData.specialization || [];
          const parsedSpecialization = Array.isArray(specialization) 
            ? specialization 
            : specialization.split(',').map(item => item.trim());
          
          // Cập nhật state lawyer với dữ liệu đã xử lý
          setLawyer({
            ...lawyerData,
            specialization: parsedSpecialization
          });
          
          // Đặt giá trị cho form
          form.setFieldsValue({
            fullName: lawyerData.fullName || lawyerData.full_name || currentUser.fullName,
            email: lawyerData.email || currentUser.email,
            certification: lawyerData.certification || '',
            experienceYears: lawyerData.experienceYears || 0,
            specialization: parsedSpecialization,
            description: lawyerData.description || lawyerData.bio || ''
          });
        }
      } catch (err) {
        console.error('Lỗi khi lấy thông tin luật sư:', err);
        setLawyer({
          fullName: currentUser.fullName || '',
          email: currentUser.email || '',
          certification: '',
          experienceYears: 0,
          specialization: [],
          description: ''
        });
        
        form.setFieldsValue({
          fullName: currentUser.fullName || '',
          email: currentUser.email || '',
          certification: '',
          experienceYears: 0,
          specialization: [],
          description: ''
        });
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin:', error);
      setError('Không thể lấy thông tin luật sư');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser || !currentUser.id) {
        throw new Error('Bạn chưa đăng nhập');
      }

      // Chuyển đổi specialization từ array sang string nếu API yêu cầu
      const specialization = Array.isArray(values.specialization) 
        ? values.specialization.join(', ') 
        : values.specialization;

      // Chuẩn bị dữ liệu cập nhật
      const updateData = {
        fullName: values.fullName,
        certification: values.certification,
        experienceYears: values.experienceYears,
        specialization,
        description: values.description,
        bio: values.description  // Sử dụng cùng giá trị cho cả bio và description
      };

      // Gọi API cập nhật thông tin luật sư
      const response = await userService.updateUserProfile(currentUser.id, updateData);
      
      if (response && response.success) {
        setSuccessMessage('Cập nhật thông tin chuyên môn thành công!');
        
        // Làm mới thông tin user trong localStorage
        await userService.refreshUserData();
        
        // Cập nhật thông tin luật sư trong state
        setLawyer({
          ...lawyer,
          ...updateData,
          specialization: values.specialization // Lưu dạng mảng trong state
        });
        
        // Tắt chế độ chỉnh sửa
        setEditMode(false);
      } else {
        throw new Error(response?.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin:', error);
      setError(error.message || 'Đã xảy ra lỗi khi cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  // Hiển thị các icon cho các lĩnh vực chuyên môn
  const getSpecIcon = (name) => {
    const icons = {
      'Dân sự': <TeamOutlined />,
      'Hình sự': <FileTextOutlined />,
      'Hành chính': <BankOutlined />,
      'Hôn nhân và gia đình': <TeamOutlined />,
      'Kinh doanh và thương mại': <BuildOutlined />,
      'Đất đai': <EnvironmentOutlined />,
      'Lao động': <TeamOutlined />,
      'Sở hữu trí tuệ': <BookOutlined />,
      'Thuế': <FileTextOutlined />,
      'Quốc tế': <GlobalOutlined />
    };
    
    return icons[name] || <BookOutlined />;
  };

  // Hiển thị chế độ xem thông tin
  const renderViewMode = () => {
    // Sử dụng thông tin từ state lawyer thay vì form.getFieldsValue()
    if (!lawyer) return null;
    
    return (
      <div className="profile-view-mode">
        <div className="profile-header">
          <Title level={4}>Thông tin cá nhân và chuyên môn</Title>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={toggleEditMode}
            className="edit-button"
          >
            Chỉnh sửa
          </Button>
        </div>

        <Divider className="profile-divider" />
        
        <Descriptions 
          bordered 
          column={1} 
          className="profile-descriptions"
          labelStyle={{ fontWeight: 'bold', width: '200px' }}
        >
          <Descriptions.Item label="Họ và tên">{lawyer.fullName || lawyer.full_name}</Descriptions.Item>
          <Descriptions.Item label="Email">{lawyer.email}</Descriptions.Item>
          <Descriptions.Item label="Chứng chỉ hành nghề">
            {lawyer.certification || <Text type="secondary">Chưa cập nhật</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="Số năm kinh nghiệm">
            {lawyer.experienceYears > 0 ? `${lawyer.experienceYears} năm` : <Text type="secondary">Chưa cập nhật</Text>}
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left" className="section-divider">
          <Space>
            <BookOutlined />
            <span>Lĩnh vực chuyên môn</span>
          </Space>
        </Divider>
        
        <Descriptions 
          bordered 
          column={1} 
          className="profile-descriptions"
          labelStyle={{ fontWeight: 'bold' }}
        >
          <Descriptions.Item label="Lĩnh vực">
            {lawyer.specialization && lawyer.specialization.length > 0 ? (
              <div className="specialization-tags">
                {lawyer.specialization.map(spec => (
                  <Tag color="#1890ff" key={spec} className="specialization-tag">
                    {getSpecIcon(spec)} {spec}
                  </Tag>
                ))}
              </div>
            ) : (
              <Text type="secondary">Chưa cập nhật</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Mô tả chuyên môn">
            {lawyer.description ? (
              <div className="description-content">{lawyer.description}</div>
            ) : (
              <Text type="secondary">Chưa cập nhật</Text>
            )}
          </Descriptions.Item>
        </Descriptions>
      </div>
    );
  };

  // Hiển thị chế độ chỉnh sửa
  const renderEditMode = () => {
    return (
      <div className="profile-edit-mode">
        <div className="profile-header">
          <Title level={4}>Chỉnh sửa thông tin chuyên môn</Title>
          <Button 
            icon={<RollbackOutlined />} 
            onClick={toggleEditMode}
            className="cancel-edit-button"
          >
            Hủy chỉnh sửa
          </Button>
        </div>

        <Divider className="profile-divider" />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="profile-form"
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="fullName"
                label="Họ và tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
              >
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
              >
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="certification"
                label="Chứng chỉ hành nghề"
                rules={[{ required: true, message: 'Vui lòng nhập chứng chỉ hành nghề' }]}
              >
                <Input placeholder="Ví dụ: Chứng chỉ hành nghề luật sư số 12345/TP/LS" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="experienceYears"
                label="Số năm kinh nghiệm"
                rules={[{ required: true, message: 'Vui lòng nhập số năm kinh nghiệm' }]}
              >
                <InputNumber min={0} max={50} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Thông tin chuyên môn</Divider>

          <Form.Item
            name="specialization"
            label="Lĩnh vực chuyên môn"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một lĩnh vực chuyên môn' }]}
          >
            <Select
              mode="multiple"
              placeholder="Chọn lĩnh vực chuyên môn"
              style={{ width: '100%' }}
              optionLabelProp="label"
              tagRender={(props) => {
                const { label, value, closable, onClose } = props;
                return (
                  <Tag 
                    color="#1890ff" 
                    closable={closable}
                    onClose={onClose}
                    style={{ marginRight: 3 }}
                  >
                    {getSpecIcon(value)} {label}
                  </Tag>
                );
              }}
            >
              {specializations.map(spec => (
                <Option key={spec} value={spec} label={spec}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {getSpecIcon(spec)}
                    <span style={{ marginLeft: 8 }}>{spec}</span>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả chuyên môn"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả chuyên môn' }]}
          >
            <TextArea
              rows={6}
              placeholder="Mô tả chi tiết về chuyên môn của bạn"
              className="specialty-textarea"
            />
          </Form.Item>

          <Form.Item className="form-actions">
            <Space>
              <Button
                onClick={toggleEditMode}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={saving}
              >
                {saving ? 'Đang lưu...' : 'Lưu thông tin'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>
    );
  };

  return (
    <div className="specialty-editor-container">
      <Card 
        title={
          <div className="specialty-title">
            <BankOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            <Title level={3} style={{ margin: 0 }}>Hồ sơ chuyên môn luật sư</Title>
          </div>
        } 
        className="specialty-card"
        bordered={false}
        style={{ 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.09)'
        }}
      >
        <Paragraph type="secondary" style={{ fontSize: '16px', marginBottom: '30px' }}>
          Thông tin chuyên môn của bạn giúp khách hàng hiểu rõ về năng lực và kinh nghiệm, 
          từ đó tăng cơ hội họ sẽ lựa chọn dịch vụ của bạn.
        </Paragraph>

        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
            <div style={{ marginTop: 15 }}>Đang tải thông tin chuyên môn...</div>
          </div>
        ) : (
          <>
            {error && (
              <Alert
                message="Lỗi"
                description={error}
                type="error"
                showIcon
                style={{ marginBottom: 24 }}
              />
            )}
            
            {successMessage && (
              <Alert
                message="Thành công"
                description={successMessage}
                type="success"
                showIcon
                style={{ marginBottom: 24 }}
              />
            )}
            
            {editMode ? renderEditMode() : renderViewMode()}
          </>
        )}
      </Card>
    </div>
  );
};

export default LawyerSpecialtyEditor; 