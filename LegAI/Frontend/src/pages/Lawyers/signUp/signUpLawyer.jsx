import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import authService from "../../../services/authService";
import userService from "../../../services/userService";
import { 
  Form, Input, Button, Checkbox, Upload, DatePicker, 
  InputNumber, Typography, Space, Divider, Alert, 
  Card, Row, Col, Spin, message as antMessage
} from 'antd';
import {
  UserOutlined, MailOutlined, PhoneOutlined, IdcardOutlined,
  CalendarOutlined, HomeOutlined, BookOutlined, AuditOutlined,
  SafetyOutlined, TeamOutlined, BankOutlined, FolderOutlined,
  UploadOutlined, CheckOutlined, SendOutlined, LeftOutlined,
  FilePdfOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

function LawyerRegisterForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [errors, setErrors] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [previewCertification, setPreviewCertification] = useState(null);
  const [form] = Form.useForm();
  
  const [formData, setFormData] = useState({
    // Thông tin cơ bản (từ tài khoản người dùng)
    username: "",
    email: "",
    phone: "",
    fullName: "",
    
    // Thông tin profile
    address: "",
    bio: "",
    
    // Thông tin luật sư
    certification: "",
    experienceYears: 0,
    specialization: [],
    
    // Thông tin bổ sung
    idCard: "",
    birthDate: null,
    licenseNumber: "",
    barAssociation: "",
    lawOffice: "",
    certificationFile: null,
    agree: false,
  });

  // Kiểm tra người dùng đã đăng nhập và lấy thông tin
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      
      // Điền thông tin từ người dùng đã đăng nhập
      const updatedFormData = {
        ...formData,
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        fullName: user.fullName || "",
      };
      
      setFormData(updatedFormData);
      
      // Cập nhật form Ant Design
      form.setFieldsValue({
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        fullName: user.fullName || "",
        experienceYears: 0
      });
    } else {
      // Nếu không có người dùng đăng nhập, chuyển hướng về trang đăng nhập
      navigate("/login");
    }
  }, [navigate, form]);

  const handleChange = (changedValues, allValues) => {
    const updatedData = { ...formData };
    
    // Cập nhật tất cả các trường từ form
    Object.keys(changedValues).forEach(key => {
      // Xử lý trường hợp đặc biệt
      if (key === 'birthDate') {
        updatedData[key] = changedValues[key] ? changedValues[key].format('YYYY-MM-DD') : null;
      } else {
        updatedData[key] = changedValues[key];
      }
    });
    
    setFormData(updatedData);
    
    // Xóa lỗi cho các trường đã được cập nhật
    if (errors) {
      const updatedErrors = { ...errors };
      Object.keys(changedValues).forEach(key => {
        delete updatedErrors[key];
      });
      setErrors(updatedErrors);
    }
  };
  
  const handleSpecializationChange = (checkedValues) => {
    setFormData({ ...formData, specialization: checkedValues });
    // Xóa lỗi nếu đã chọn chuyên môn
    if (errors.specialization && checkedValues.length > 0) {
      const { specialization, ...restErrors } = errors;
      setErrors(restErrors);
    }
  };

  const handleUploadChange = ({ file, fileList }, fieldName) => {
    if (file.status !== 'removed') {
      const fileObj = file.originFileObj || file;
      
      // Kiểm tra loại file
      const isJpgOrPngOrPdf = fileObj.type === 'image/jpeg' || fileObj.type === 'image/png' || fileObj.type === 'application/pdf';
      const isLt5M = fileObj.size / 1024 / 1024 < 5;
      
      if (!isJpgOrPngOrPdf) {
        antMessage.error('Chỉ hỗ trợ tải lên file JPG/PNG/PDF!');
        return;
      }
      
      if (!isLt5M) {
        antMessage.error('File phải nhỏ hơn 5MB!');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        [fieldName]: fileObj
      }));
      
      // Tạo URL xem trước cho tệp đã chọn
      if (fileObj && (fileObj.type === 'image/jpeg' || fileObj.type === 'image/png')) {
        const fileUrl = URL.createObjectURL(fileObj);
        if (fieldName === "certificationFile") {
          setPreviewCertification(fileUrl);
        }
      } else if (fileObj && fileObj.type === 'application/pdf') {
        // PDF không hiển thị xem trước ảnh, nhưng vẫn cần setPreviewCertification để kích hoạt hiển thị icon PDF
        if (fieldName === "certificationFile") {
          setPreviewCertification('pdf_preview');
        }
      }
      
      // Xóa lỗi khi đã tải lên file
      if (errors[fieldName]) {
        const updatedErrors = { ...errors };
        delete updatedErrors[fieldName];
        setErrors(updatedErrors);
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Lấy giá trị hiện tại từ form
    const values = form.getFieldsValue();
    
    // Kiểm tra các trường bắt buộc
    const requiredFields = [
      { field: "address", message: "Vui lòng nhập địa chỉ" },
      { field: "idCard", message: "Vui lòng nhập số CCCD/CMND" },
      { field: "licenseNumber", message: "Vui lòng nhập số thẻ luật sư" },
      { field: "barAssociation", message: "Vui lòng nhập tên Đoàn luật sư" },
      { field: "lawOffice", message: "Vui lòng nhập tên văn phòng/công ty luật" }
    ];
    
    requiredFields.forEach(item => {
      if (!values[item.field] || values[item.field].trim() === "") {
        newErrors[item.field] = item.message;
      }
    });
    
    // Kiểm tra chuyên môn
    if (!values.specialization || values.specialization.length === 0) {
      newErrors.specialization = "Vui lòng chọn ít nhất một lĩnh vực chuyên môn";
    }
    
    // Kiểm tra file chứng chỉ
    if (!formData.certificationFile) {
      newErrors.certificationFile = "Vui lòng tải lên ảnh chứng chỉ hành nghề luật sư";
    }
    
    // Kiểm tra đồng ý điều khoản
    if (!values.agree) {
      newErrors.agree = "Bạn phải đồng ý với điều khoản và chính sách";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (values) => {
    // Lưu lại trạng thái hiện tại của form
    setErrors({});
    
    // Kiểm tra form
    const isValid = validateForm();
    if (!isValid) {
      setMessage({
        type: "error",
        text: "Vui lòng điền đầy đủ thông tin bắt buộc"
      });
      
      // Scroll đến phần tử lỗi đầu tiên
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        form.scrollToField(firstErrorField);
      }
      
      return;
    }
    
    setLoading(true);
    setMessage({ type: "", text: "" });
    
    try {
      // Lấy token xác thực
      const token = localStorage.getItem('token');
      
      // Tạo đối tượng FormData để gửi cả file và dữ liệu
      const data = new FormData();
      
      // Thêm userId từ người dùng hiện tại
      if (currentUser && currentUser.id) {
        data.append("userId", currentUser.id);
      }
      
      // Thêm thông tin cơ bản của tài khoản đã đăng nhập
      data.append("username", formData.username);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      data.append("fullName", formData.fullName);
      
      // Thêm mật khẩu mặc định (backend yêu cầu)
      data.append("password", "updated_password_placeholder");
      
      // Thêm dữ liệu profile
      data.append("address", values.address);
      data.append("bio", values.bio || "");
      
      // Thêm dữ liệu luật sư
      data.append("certification", formData.certification || "");
      data.append("experienceYears", values.experienceYears || "0");
      data.append("specialization", values.specialization.join(","));
      
      // Thêm dữ liệu bổ sung
      data.append("idCard", values.idCard);
      data.append("birthDate", values.birthDate ? values.birthDate.format('YYYY-MM-DD') : '');
      data.append("licenseNumber", values.licenseNumber);
      data.append("barAssociation", values.barAssociation);
      data.append("lawOffice", values.lawOffice);
      
      // Thêm file chứng chỉ
      if (formData.certificationFile) {
        data.append("certificationFile", formData.certificationFile);
      }
      
      // Gửi yêu cầu đăng ký luật sư với token xác thực
      const response = await axios.post("http://localhost:8000/api/auth/register-lawyer", data, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`
        }
      });
      
      // Xử lý phản hồi thành công
      setMessage({
        type: "success",
        text: "Đăng ký thành công! Đơn đăng ký luật sư của bạn đã được gửi và đang chờ phê duyệt từ quản trị viên. Bạn vẫn có thể sử dụng tài khoản hiện tại cho đến khi được duyệt."
      });
      
      // Cập nhật thông tin người dùng trong localStorage mà không cần đăng nhập lại
      try {
        await userService.refreshUserData();
      } catch (refreshError) {
        // Xử lý lỗi khi cập nhật thông tin người dùng
      }
      
      // Cuộn lên đầu trang để hiển thị thông báo
      window.scrollTo({ top: 0, behavior: "smooth" });
      
      // Đăng xuất người dùng sau 5 giây và chuyển hướng về trang đăng nhập
      setTimeout(() => {
        authService.logout();
        navigate("/login?message=relogin_required");
      }, 5000);
      
    } catch (error) {
      // Xử lý lỗi
      if (error.response?.data?.message) {
        setMessage({
          type: "error",
          text: error.response.data.message
        });
      } else {
        setMessage({
          type: "error",
          text: "Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau."
        });
      }
      
      // Cuộn lên đầu trang để hiển thị thông báo lỗi
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  return (
    <Card 
      style={{ 
        maxWidth: 900, 
        margin: '3rem auto', 
        borderRadius: 15,
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
      }}
      bodyStyle={{ padding: '2.5rem' }}
    >
      <Space style={{ marginBottom: 24, width: '100%', justifyContent: 'space-between' }}>
        <Title level={2} style={{ marginBottom: 0 }}>Đăng Ký Trở Thành Luật Sư</Title>
        <Button icon={<LeftOutlined />} type="link" onClick={() => navigate('/')}>Trở về</Button>
      </Space>
      
      {message.text && (
        <Alert
          message={message.type === "success" ? "Thành công" : "Lỗi"}
          description={message.text}
          type={message.type === "success" ? "success" : "error"}
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={handleChange}
        initialValues={{
          experienceYears: 0,
          specialization: []
        }}
      >
        <Card
          title={
            <Space>
              <UserOutlined />
              <span>Thông tin tài khoản</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="username"
                label="Tên đăng nhập"
              >
                <Input 
                  prefix={<UserOutlined />} 
                  disabled={true} 
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="Email"
              >
                <Input 
                  prefix={<MailOutlined />} 
                  disabled={true} 
                />
              </Form.Item>
            </Col>
          </Row>
          <Text type="secondary">Đã đăng nhập với tài khoản này</Text>
        </Card>

        <Card
          title={
            <Space>
              <IdcardOutlined />
              <span>Thông tin cá nhân</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="fullName"
                label="Họ và tên"
              >
                <Input 
                  prefix={<UserOutlined />} 
                  disabled={true}
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12}>
              <Form.Item
                name="birthDate"
                label="Ngày sinh"
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  format="DD/MM/YYYY" 
                  placeholder="Chọn ngày sinh"
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
              >
                <Input 
                  prefix={<PhoneOutlined />} 
                  disabled={true} 
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12}>
              <Form.Item
                name="idCard"
                label="CCCD/CMND"
                rules={[
                  { required: true, message: 'Vui lòng nhập số CCCD/CMND' }
                ]}
                validateStatus={errors.idCard ? 'error' : ''}
                help={errors.idCard}
              >
                <Input 
                  prefix={<IdcardOutlined />} 
                  placeholder="Nhập số CCCD/CMND" 
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[
              { required: true, message: 'Vui lòng nhập địa chỉ liên hệ đầy đủ' }
            ]}
            validateStatus={errors.address ? 'error' : ''}
            help={errors.address}
          >
            <Input 
              prefix={<HomeOutlined />} 
              placeholder="Nhập địa chỉ liên hệ đầy đủ" 
            />
          </Form.Item>
          
          <Form.Item
            name="bio"
            label="Giới thiệu bản thân"
          >
            <TextArea
              placeholder="Hãy chia sẻ về kinh nghiệm và lý do bạn muốn trở thành luật sư trên LegAI..."
              autoSize={{ minRows: 4, maxRows: 8 }}
            />
          </Form.Item>
        </Card>
        
        <Card
          title={
            <Space>
              <AuditOutlined />
              <span>Thông tin chuyên môn</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="licenseNumber"
                label="Số thẻ luật sư"
                rules={[
                  { required: true, message: 'Vui lòng nhập số thẻ luật sư' }
                ]}
                validateStatus={errors.licenseNumber ? 'error' : ''}
                help={errors.licenseNumber}
              >
                <Input 
                  prefix={<SafetyOutlined />} 
                  placeholder="Nhập số thẻ luật sư"
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12}>
              <Form.Item
                name="barAssociation"
                label="Tên Đoàn luật sư"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên Đoàn luật sư' }
                ]}
                validateStatus={errors.barAssociation ? 'error' : ''}
                help={errors.barAssociation}
              >
                <Input 
                  prefix={<TeamOutlined />} 
                  placeholder="Nhập tên Đoàn luật sư" 
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12}>
              <Form.Item
                name="lawOffice"
                label="Tên văn phòng/công ty luật"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên văn phòng/công ty luật' }
                ]}
                validateStatus={errors.lawOffice ? 'error' : ''}
                help={errors.lawOffice}
              >
                <Input 
                  prefix={<BankOutlined />}
                  placeholder="Nhập tên văn phòng/công ty luật" 
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12}>
              <Form.Item
                name="experienceYears"
                label="Số năm kinh nghiệm"
              >
                <InputNumber 
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="Nhập số năm kinh nghiệm"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="specialization"
            label="Lĩnh vực chuyên môn"
            rules={[
              { required: true, message: 'Vui lòng chọn ít nhất một lĩnh vực chuyên môn' }
            ]}
            validateStatus={errors.specialization ? 'error' : ''}
            help={errors.specialization}
          >
            <Checkbox.Group 
              onChange={handleSpecializationChange}
              style={{ width: '100%' }}
            >
              <Row gutter={[16, 16]}>
                {["Dân sự", "Hình sự", "Hôn nhân", "Đất đai", "Doanh nghiệp", "Sở hữu trí tuệ", "Lao động", "Hành chính"].map((field) => (
                  <Col xs={24} sm={12} md={8} key={field}>
                    <Checkbox value={field} style={{ lineHeight: '32px' }}>
                      {field}
                    </Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>
        </Card>

        <Card
          title={
            <Space>
              <UploadOutlined />
              <span>Tài liệu chứng minh</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Form.Item
            name="certificationFile"
            label="Ảnh chứng chỉ hành nghề luật sư"
            valuePropName="fileList"
            getValueFromEvent={normFile}
            validateStatus={errors.certificationFile ? 'error' : ''}
            help={errors.certificationFile}
            extra="Tải lên ảnh chứng chỉ hành nghề luật sư để xác thực thông tin (hỗ trợ: JPG, PNG, PDF)"
          >
            <Dragger
              name="certificationFile"
              accept="image/jpeg,image/png,application/pdf"
              multiple={false}
              showUploadList={false}
              beforeUpload={(file) => {
                const isJpgOrPngOrPdf = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'application/pdf';
                if (!isJpgOrPngOrPdf) {
                  antMessage.error('Chỉ hỗ trợ tải lên file JPG/PNG/PDF!');
                }
                const isLt5M = file.size / 1024 / 1024 < 5;
                if (!isLt5M) {
                  antMessage.error('File phải nhỏ hơn 5MB!');
                }
                return false; // Luôn return false để tránh tự động upload, vì chúng ta đang xử lý bằng FormData
              }}
              onChange={(info) => handleUploadChange(info, 'certificationFile')}
              style={{ height: 200, width: '100%' }}
            >
              {previewCertification ? (
                <div>
                  {formData.certificationFile?.type === 'application/pdf' ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <FilePdfOutlined style={{ fontSize: '64px', color: '#ff4d4f' }} />
                      <p>Đã tải lên file PDF</p>
                      <p>{formData.certificationFile.name}</p>
                    </div>
                  ) : (
                    <img 
                      src={previewCertification} 
                      alt="Ảnh chứng chỉ hành nghề luật sư" 
                      style={{ 
                        maxHeight: '100%', 
                        maxWidth: '100%',
                        objectFit: 'contain' 
                      }} 
                    />
                  )}
                </div>
              ) : (
                <>
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">Kéo thả hoặc nhấp để chọn ảnh/tài liệu</p>
                  <p className="ant-upload-hint">Hỗ trợ: JPG, PNG, PDF (tối đa 5MB)</p>
                </>
              )}
            </Dragger>
          </Form.Item>
        </Card>

        <Card style={{ marginBottom: 24 }}>
          <Form.Item
            name="agree"
            valuePropName="checked"
            validateStatus={errors.agree ? 'error' : ''}
            help={errors.agree}
          >
            <Checkbox>
              Tôi đồng ý với <a href="#terms">Điều khoản & Chính sách</a> của LegAI
            </Checkbox>
          </Form.Item>
        </Card>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={loading ? null : <SendOutlined />}
            size="large"
            block
            style={{ height: 50 }}
          >
            {loading ? 'Đang xử lý...' : 'Gửi Đăng Ký'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default LawyerRegisterForm;
