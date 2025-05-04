import React from 'react';
import { Form, Input, Button, Select, DatePicker, Upload, Space, Typography, Row, Col, Divider } from 'antd';
import { UploadOutlined, FileTextOutlined, TeamOutlined, 
  SignatureOutlined, CalendarOutlined, FileOutlined, LoadingOutlined } from '@ant-design/icons';
import moment from 'moment';

const { Option } = Select;
const { Text } = Typography;

const ContractForm = ({ 
  formData, 
  handleInputChange, 
  handleFileChange, 
  handleSubmit, 
  handleCancel, 
  loading, 
  isEdit,
  contractTypes 
}) => {
  // Hàm chuyển đổi cho DatePicker
  const handleDateChange = (date, dateString, fieldName) => {
    const event = {
      target: {
        name: fieldName,
        value: dateString
      }
    };
    handleInputChange(event);
  };

  // Chuẩn bị giá trị ngày tháng cho DatePicker
  const getDateValue = (dateString) => {
    return dateString ? moment(dateString) : null;
  };

  return (
    <Form layout="vertical" onSubmit={(e) => e.preventDefault()}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item 
            label="Tiêu đề hợp đồng" 
            required
            tooltip="Tiêu đề hợp đồng là bắt buộc"
          >
            <Input
              prefix={<FileTextOutlined />}
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Nhập tiêu đề hợp đồng"
              required
            />
          </Form.Item>
        </Col>
        
        <Col span={12}>
          <Form.Item 
            label="Loại hợp đồng"
            required
            tooltip="Loại hợp đồng là bắt buộc"
          >
            <Select
              name="contract_type"
              value={formData.contract_type}
              onChange={(value) => {
                handleInputChange({
                  target: { name: 'contract_type', value }
                });
              }}
              placeholder="Chọn loại hợp đồng"
              suffixIcon={<FileOutlined />}
            >
              <Option value="">Chọn loại hợp đồng</Option>
              {contractTypes.map((type, index) => (
                <Option key={index} value={type}>{type}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        
        <Col span={12}>
          <Form.Item 
            label="Đối tác"
            required
            tooltip="Đối tác là bắt buộc"
          >
            <Input
              prefix={<TeamOutlined />}
              name="partner"
              value={formData.partner}
              onChange={handleInputChange}
              placeholder="Tên đối tác"
              required
            />
          </Form.Item>
        </Col>
        
        <Col span={12}>
          <Form.Item 
            label="Chữ ký"
          >
            <Input
              prefix={<SignatureOutlined />}
              name="signature"
              value={formData.signature}
              onChange={handleInputChange}
              placeholder="Tên người ký"
            />
          </Form.Item>
        </Col>
        
        <Col span={12}>
          <Form.Item 
            label="Ngày bắt đầu"
            required
            tooltip="Ngày bắt đầu là bắt buộc"
          >
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              placeholder="Chọn ngày bắt đầu"
              value={getDateValue(formData.start_date)}
              onChange={(date, dateString) => handleDateChange(date, dateString, 'start_date')}
              suffixIcon={<CalendarOutlined />}
            />
          </Form.Item>
        </Col>
        
        <Col span={12}>
          <Form.Item 
            label="Ngày kết thúc"
          >
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              placeholder="Chọn ngày kết thúc"
              value={getDateValue(formData.end_date)}
              onChange={(date, dateString) => handleDateChange(date, dateString, 'end_date')}
              suffixIcon={<CalendarOutlined />}
            />
          </Form.Item>
        </Col>
      </Row>
      
      <Divider />
      
      <Form.Item
        label={isEdit ? 'Tải lên file hợp đồng mới (tùy chọn)' : 'Tải lên file hợp đồng'}
        required={!isEdit}
        tooltip={isEdit ? "Nếu không tải lên file mới, file hợp đồng hiện tại sẽ được giữ nguyên." : "Chỉ chấp nhận file PDF, DOC hoặc DOCX. Kích thước tối đa 10MB."}
      >
        <Upload
          beforeUpload={() => false}
          accept=".pdf,.doc,.docx"
          fileList={formData.file ? [formData.file] : []}
          onChange={({ file }) => {
            const customEvent = {
              target: {
                files: [file]
              }
            };
            handleFileChange(customEvent);
          }}
          maxCount={1}
        >
          <Button icon={<UploadOutlined />}>Chọn file</Button>
        </Upload>
        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          {isEdit 
            ? 'Nếu không tải lên file mới, file hợp đồng hiện tại sẽ được giữ nguyên.'
            : 'Chỉ chấp nhận file PDF, DOC hoặc DOCX. Kích thước tối đa 10MB.'}
        </Text>
      </Form.Item>
      
      <Divider />
      
      <Form.Item>
        <Space>
          <Button onClick={handleCancel}>
            Hủy
          </Button>
          <Button 
            type="primary" 
            onClick={handleSubmit}
            loading={loading}
          >
            {isEdit ? 'Cập nhật hợp đồng' : 'Tạo hợp đồng'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default ContractForm; 