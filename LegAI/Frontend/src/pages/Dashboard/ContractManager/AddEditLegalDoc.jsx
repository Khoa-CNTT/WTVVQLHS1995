import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Upload, message, Spin, Card, Typography, DatePicker, Modal } from 'antd';
import { UploadOutlined, SaveOutlined, CloseOutlined, FileOutlined } from '@ant-design/icons';
import { uploadLegalDoc, updateLegalDoc, getLegalDocById, getLegalDocCategories } from '../../../services/legalDocService';
import styles from './AddEditLegalDoc.module.css';
import dayjs from 'dayjs';
import locale from 'antd/es/date-picker/locale/vi_VN';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const AddEditLegalDoc = ({ visible, onCancel, onSuccess, docId }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isEdit, setIsEdit] = useState(false);

  // Tải dữ liệu khi component được khởi tạo
  useEffect(() => {
    if (visible) {
      fetchCategories();
      if (docId) {
        setIsEdit(true);
        fetchDocDetails(docId);
      } else {
        setIsEdit(false);
        resetForm();
      }
    }
  }, [visible, docId]);

  // Lấy danh sách danh mục
  const fetchCategories = async () => {
    try {
      const response = await getLegalDocCategories();
      if (response && response.success && response.categories) {
        setCategories(response.categories);
      } else {
        // Sử dụng danh mục mặc định nếu không lấy được từ API
        setCategories(['Hồ sơ cá nhân', 'Hợp đồng', 'Đơn kiện', 'Biên bản', 'Khác']);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách danh mục:', error);
      // Sử dụng danh mục mặc định nếu lỗi
      setCategories(['Hồ sơ cá nhân', 'Hợp đồng', 'Đơn kiện', 'Biên bản', 'Khác']);
    }
  };

  // Lấy thông tin chi tiết hồ sơ nếu là chế độ sửa
  const fetchDocDetails = async (id) => {
    try {
      setLoading(true);
      const response = await getLegalDocById(id);
      
      if (response && response.success && response.data) {
        const docData = response.data;
        
        // Thiết lập form values
        form.setFieldsValue({
          title: docData.title,
          category: docData.category,
          description: docData.description || '',
          // Nếu có các trường khác, thêm ở đây
        });
        
        setSelectedCategory(docData.category);
        
        // Thiết lập thông tin file
        if (docData.file_name) {
          setFileList([
            {
              uid: '-1',
              name: docData.file_name,
              status: 'done',
              url: docData.file_url,
            },
          ]);
        }
      } else {
        message.error('Không thể tải thông tin hồ sơ pháp lý');
      }
    } catch (error) {
      message.error(`Lỗi khi tải thông tin hồ sơ: ${error.message || 'Đã có lỗi xảy ra'}`);
      console.error('Lỗi khi tải thông tin hồ sơ pháp lý:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    form.resetFields();
    setFileList([]);
    setSelectedCategory('');
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
        message.error('Vui lòng tải lên file hồ sơ pháp lý');
        setLoading(false);
        return;
      }
      
      // Tạo form data
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('category', values.category);
      formData.append('description', values.description || '');
      
      // Thêm file nếu có
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('file', fileList[0].originFileObj);
      }
      
      let response;
      
      if (isEdit) {
        // Cập nhật hồ sơ hiện có
        response = await updateLegalDoc(docId, formData);
      } else {
        // Tạo hồ sơ mới
        response = await uploadLegalDoc(formData);
      }
      
      if (response && response.success) {
        message.success(isEdit ? 'Cập nhật hồ sơ thành công' : 'Tạo hồ sơ mới thành công');
        onSuccess();
        onCancel();
      } else {
        message.error(response?.message || 'Không thể lưu hồ sơ pháp lý');
      }
    } catch (error) {
      message.error(`Lỗi khi ${isEdit ? 'cập nhật' : 'tạo'} hồ sơ pháp lý: ${error.message || 'Đã có lỗi xảy ra'}`);
      console.error(`Lỗi khi ${isEdit ? 'cập nhật' : 'tạo'} hồ sơ pháp lý:`, error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={(
        <Title level={4} style={{ margin: 0 }}>
          {isEdit ? 'Cập nhật hồ sơ pháp lý' : 'Thêm hồ sơ pháp lý mới'}
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
            category: undefined,
            description: '',
          }}
        >
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[
              { required: true, message: 'Vui lòng nhập tiêu đề hồ sơ' },
              { max: 200, message: 'Tiêu đề không quá 200 ký tự' }
            ]}
          >
            <Input placeholder="Nhập tiêu đề hồ sơ pháp lý" />
          </Form.Item>
          
          <Form.Item
            name="category"
            label="Danh mục"
            rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
          >
            <Select 
              placeholder="Chọn danh mục" 
              onChange={(value) => setSelectedCategory(value)}
              allowClear
            >
              {categories.map((category, index) => (
                <Option key={index} value={category}>{category}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea 
              placeholder="Nhập mô tả hồ sơ pháp lý (không bắt buộc)" 
              rows={4}
              maxLength={500}
              showCount
            />
          </Form.Item>
          
          <Form.Item
            label="File hồ sơ"
            required={!isEdit}
            extra="Hỗ trợ tệp: .pdf, .doc, .docx, .jpg, .png"
          >
            <Upload
              fileList={fileList}
              onChange={handleFileChange}
              beforeUpload={() => false}
              maxCount={1}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
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
              {isEdit ? 'Cập nhật' : 'Lưu hồ sơ'}
            </Button>
          </div>
        </Form>
      </Spin>
    </Modal>
  );
};

export default AddEditLegalDoc; 