import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Upload, message, Spin, DatePicker, Modal, Typography } from 'antd';
import { UploadOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { createContract, updateContract, getContractById } from '../../../services/contractService';
import styles from './AddEditContract.module.css';
import dayjs from 'dayjs';
import locale from 'antd/es/date-picker/locale/vi_VN';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const CONTRACT_TYPES = [
  'Hợp đồng lao động',
  'Hợp đồng dịch vụ',
  'Hợp đồng mua bán',
  'Hợp đồng thuê',
  'Hợp đồng hợp tác',
  'Hợp đồng bảo hiểm',
  'Khác'
];

const AddEditContract = ({ visible, onCancel, onSuccess, contractId }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [isEdit, setIsEdit] = useState(false);

  // Tải dữ liệu khi component được khởi tạo
  useEffect(() => {
    if (visible) {
      if (contractId) {
        setIsEdit(true);
        fetchContractDetails(contractId);
      } else {
        setIsEdit(false);
        resetForm();
      }
    }
  }, [visible, contractId]);

  // Lấy thông tin chi tiết hợp đồng nếu là chế độ sửa
  const fetchContractDetails = async (id) => {
    try {
      setLoading(true);
      const response = await getContractById(id);
      
      if (response && response.success && response.data) {
        const contractData = response.data;
        
        // Thiết lập form values
        form.setFieldsValue({
          title: contractData.title,
          contract_type: contractData.contract_type,
          description: contractData.description || '',
          partner: contractData.partner || '',
          dateRange: contractData.start_date && contractData.end_date ? 
            [dayjs(contractData.start_date), dayjs(contractData.end_date)] : undefined,
        });
        
        // Thiết lập thông tin file nếu có
        if (contractData.file_name || contractData.file_path) {
          setFileList([
            {
              uid: '-1',
              name: contractData.file_name || contractData.file_path.split('/').pop(),
              status: 'done',
              url: contractData.file_url,
            },
          ]);
        }
      } else {
        message.error('Không thể tải thông tin hợp đồng');
      }
    } catch (error) {
      message.error(`Lỗi khi tải thông tin hợp đồng: ${error.message || 'Đã có lỗi xảy ra'}`);
      console.error('Lỗi khi tải thông tin hợp đồng:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    form.resetFields();
    setFileList([]);
  };

  // Xử lý upload file
  const handleFileChange = ({ fileList }) => {
    // Giới hạn chỉ 1 file
    const newFileList = fileList.slice(-1);
    setFileList(newFileList);
  };

  // Xử lý nộp form
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Kiểm tra file khi thêm mới
      if (!isEdit && fileList.length === 0) {
        message.error('Vui lòng tải lên file hợp đồng');
        setLoading(false);
        return;
      }
      
      // Tạo đối tượng dữ liệu từ form
      const contractData = {
        title: values.title,
        contract_type: values.contract_type,
        description: values.description || '',
        partner: values.partner || '',
      };
      
      // Xử lý ngày bắt đầu và kết thúc
      if (values.dateRange && values.dateRange.length === 2) {
        contractData.start_date = values.dateRange[0].format('YYYY-MM-DD');
        contractData.end_date = values.dateRange[1].format('YYYY-MM-DD');
      }
      
      // Thêm file nếu có
      if (fileList.length > 0 && fileList[0].originFileObj) {
        contractData.file = fileList[0].originFileObj;
      }
      
      let response;
      
      if (isEdit) {
        // Cập nhật hợp đồng hiện có
        response = await updateContract(contractId, contractData);
      } else {
        // Tạo hợp đồng mới
        response = await createContract(contractData);
      }
      
      if (response && response.success) {
        message.success(isEdit ? 'Cập nhật hợp đồng thành công' : 'Tạo hợp đồng mới thành công');
        onSuccess();
        onCancel();
      } else {
        message.error(response?.message || 'Không thể lưu hợp đồng');
      }
    } catch (error) {
      message.error(`Lỗi khi ${isEdit ? 'cập nhật' : 'tạo'} hợp đồng: ${error.message || 'Đã có lỗi xảy ra'}`);
      console.error(`Lỗi khi ${isEdit ? 'cập nhật' : 'tạo'} hợp đồng:`, error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={(
        <Title level={4} style={{ margin: 0 }}>
          {isEdit ? 'Cập nhật hợp đồng' : 'Thêm hợp đồng mới'}
        </Title>
      )}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            title: '',
            contract_type: undefined,
            description: '',
            partner: '',
            dateRange: undefined,
          }}
        >
          <Form.Item
            name="title"
            label="Tiêu đề hợp đồng"
            rules={[
              { required: true, message: 'Vui lòng nhập tiêu đề hợp đồng' },
              { max: 200, message: 'Tiêu đề không quá 200 ký tự' }
            ]}
          >
            <Input placeholder="Nhập tiêu đề hợp đồng" />
          </Form.Item>
          
          <Form.Item
            name="contract_type"
            label="Loại hợp đồng"
            rules={[{ required: true, message: 'Vui lòng chọn loại hợp đồng' }]}
          >
            <Select 
              placeholder="Chọn loại hợp đồng" 
              allowClear
            >
              {CONTRACT_TYPES.map((type, index) => (
                <Option key={index} value={type}>{type}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="partner"
            label="Đối tác"
          >
            <Input placeholder="Nhập tên đối tác (không bắt buộc)" />
          </Form.Item>
          
          <Form.Item
            name="dateRange"
            label="Thời hạn hợp đồng"
            rules={[{ required: true, message: 'Vui lòng chọn thời hạn hợp đồng' }]}
          >
            <RangePicker 
              style={{ width: '100%' }} 
              format="DD/MM/YYYY"
              locale={locale}
              placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
            />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea 
              placeholder="Nhập mô tả hợp đồng (không bắt buộc)" 
              rows={4}
              maxLength={500}
              showCount
            />
          </Form.Item>
          
          <Form.Item
            label="File hợp đồng"
            required={!isEdit}
            extra="Hỗ trợ tệp: .pdf, .doc, .docx"
          >
            <Upload
              fileList={fileList}
              onChange={handleFileChange}
              beforeUpload={() => false}
              maxCount={1}
              accept=".pdf,.doc,.docx"
            >
              <Button icon={<UploadOutlined />}>
                {fileList.length > 0 ? 'Thay đổi file' : 'Tải lên file'}
              </Button>
            </Upload>
          </Form.Item>
          
          <div className={styles.formActions}>
            <Button onClick={onCancel} icon={<CloseOutlined />}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
              {isEdit ? 'Cập nhật' : 'Lưu hợp đồng'}
            </Button>
          </div>
        </Form>
      </Spin>
    </Modal>
  );
};

export default AddEditContract; 