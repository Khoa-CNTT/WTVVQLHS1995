import React, { useState, useEffect, useRef } from 'react';
import { Table, Card, Button, Input, Select, Space, Pagination, Modal, Form, Spin, Typography, Alert, Upload, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, FileTextOutlined, UploadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import styles from './DocumentTemplatesManager.module.css';
import axiosInstance from '../../../config/axios';
import { API_URL } from '../../../config/constants';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { confirm } = Modal;

const DocumentTemplatesManager = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplateType, setSelectedTemplateType] = useState('');
  const [templateTypes, setTemplateTypes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [form] = Form.useForm();
  const pdfFileRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    template_type: '',
    content: '',
    language: 'Tiếng Việt'
  });

  useEffect(() => {
    fetchTemplates();
    fetchTemplateTypes();
  }, [currentPage, searchTerm, selectedTemplateType]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', 10);
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (selectedTemplateType) {
        params.append('template_type', selectedTemplateType);
      }
      
      const response = await axiosInstance.get(`${API_URL}/legal/templates?${params.toString()}`);
      
      if (response.data && response.data.status === 'success') {
        setTemplates(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setTotalItems(response.data.pagination.totalItems || response.data.pagination.totalPages * 10);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách mẫu văn bản:', err);
      setError('Không thể tải danh sách mẫu văn bản');
      toast.error('Không thể tải danh sách mẫu văn bản');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplateTypes = async () => {
    try {
      const response = await axiosInstance.get(`${API_URL}/legal/template-types`);
      if (response.data && response.data.status === 'success') {
        setTemplateTypes(response.data.data);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách loại mẫu văn bản:', err);
    }
  };

  const openAddModal = () => {
    form.resetFields();
    setFormData({
      title: '',
      template_type: '',
      content: '',
      language: 'Tiếng Việt'
    });
    setModalMode('add');
    setIsModalOpen(true);
  };

  const openEditModal = (template) => {
    setSelectedTemplate(template);
    setFormData({
      ...template,
      template_type: template.template_type
    });
    form.setFieldsValue({
      ...template,
      template_type: template.template_type
    });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const openDeleteModal = (template) => {
    setSelectedTemplate(template);
    confirm({
      title: 'Xác nhận xóa mẫu văn bản',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: `Bạn có chắc chắn muốn xóa mẫu văn bản "${template.title}" không? 
                Hành động này không thể hoàn tác.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk() {
        handleDelete();
      },
    });
  };

  const openPdfModal = () => {
    setHtmlContent('');
    setIsPdfModalOpen(true);
  };

  const handleInputChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleTemplateTypeChange = (value) => {
    setSelectedTemplateType(value);
    setCurrentPage(1);
  };

  const handleSubmitForm = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      if (modalMode === 'add') {
        const response = await axiosInstance.post(`${API_URL}/legal/templates`, values);
        if (response.data && response.data.status === 'success') {
          toast.success('Thêm mẫu văn bản mới thành công');
          setIsModalOpen(false);
          fetchTemplates();
        }
      } else if (modalMode === 'edit' && selectedTemplate) {
        const response = await axiosInstance.put(
          `${API_URL}/legal/templates/${selectedTemplate.id}`,
          values
        );
        if (response.data && response.data.status === 'success') {
          toast.success('Cập nhật mẫu văn bản thành công');
          setIsModalOpen(false);
          fetchTemplates();
        }
      }
    } catch (err) {
      console.error('Lỗi khi lưu mẫu văn bản:', err);
      toast.error('Không thể lưu mẫu văn bản: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      
      const response = await axiosInstance.delete(
        `${API_URL}/legal/templates/${selectedTemplate.id}`
      );
      
      if (response.data && response.data.status === 'success') {
        toast.success('Xóa mẫu văn bản thành công');
        fetchTemplates();
      }
    } catch (err) {
      console.error('Lỗi khi xóa mẫu văn bản:', err);
      toast.error('Không thể xóa mẫu văn bản: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
      setSelectedTemplate(null);
    }
  };

  const handleUploadPdf = async (info) => {
    if (info.file.status === 'uploading') {
      setIsUploading(true);
      return;
    }
    
    if (info.file.status !== 'done') {
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('pdf', info.file.originFileObj);
      
      const response = await axiosInstance.post(
        `${API_URL}/legal/templates/convert-pdf`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data && response.data.status === 'success') {
        setHtmlContent(response.data.data.content);
        form.setFieldsValue({
          content: response.data.data.content
        });
        setFormData(prev => ({
          ...prev,
          content: response.data.data.content
        }));
        toast.success('Chuyển đổi PDF thành HTML thành công');
        setIsPdfModalOpen(false);
      }
    } catch (err) {
      console.error('Lỗi khi chuyển đổi PDF:', err);
      toast.error('Không thể chuyển đổi PDF: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTemplate(null);
    form.resetFields();
  };

  const closePdfModal = () => {
    setIsPdfModalOpen(false);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const options = { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: '8%',
      render: (_, __, index) => (currentPage - 1) * 10 + index + 1,
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      width: '40%',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Loại mẫu',
      dataIndex: 'template_type',
      key: 'template_type',
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => formatDate(text),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: '15%',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => openEditModal(record)}
            size="small"
          />
          <Button 
            type="primary" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => openDeleteModal(record)}
            size="small"
          />
        </Space>
      ),
    },
  ];

  return (
    <Card className={styles.container}>
      <div className={styles.header}>
        <Button 
          type="primary"
          icon={<PlusOutlined />}
          onClick={openAddModal}
        >
          Thêm mẫu văn bản
        </Button>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
        <Input
          placeholder="Tìm kiếm mẫu văn bản..."
          value={searchTerm}
          onChange={handleSearchInputChange}
          prefix={<SearchOutlined />}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="Loại mẫu văn bản"
          value={selectedTemplateType}
          onChange={handleTemplateTypeChange}
          style={{ width: 200 }}
          allowClear
        >
          {templateTypes.map((type) => (
            <Option key={type} value={type}>
              {type}
            </Option>
          ))}
        </Select>
      </div>

      {error ? (
        <Alert
          message="Lỗi"
          description={error}
          type="error"
          showIcon
          action={
            <Button onClick={fetchTemplates} type="primary" size="small">
              Thử lại
            </Button>
          }
        />
      ) : (
        <Table
          columns={columns}
          dataSource={templates}
          rowKey="id"
          pagination={false}
          loading={loading}
        />
      )}

      {totalPages > 1 && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Pagination
            current={currentPage}
            total={totalItems}
            pageSize={10}
            onChange={handlePageChange}
            showSizeChanger={false}
          />
        </div>
      )}

      <Modal
        title={modalMode === 'add' ? 'Thêm mẫu văn bản mới' : 'Chỉnh sửa mẫu văn bản'}
        open={isModalOpen}
        onCancel={closeModal}
        footer={[
          <Button key="back" onClick={closeModal}>
            Hủy bỏ
          </Button>,
          <Button
            key="pdf"
            type="default"
            icon={<UploadOutlined />}
            onClick={openPdfModal}
          >
            Tải PDF
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handleSubmitForm}
          >
            {modalMode === 'add' ? 'Thêm mới' : 'Cập nhật'}
          </Button>,
        ]}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={formData}
        >
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề mẫu văn bản' }]}
          >
            <Input placeholder="Nhập tiêu đề mẫu văn bản" />
          </Form.Item>
          
          <Form.Item
            name="template_type"
            label="Loại mẫu văn bản"
            rules={[{ required: true, message: 'Vui lòng chọn loại mẫu văn bản' }]}
          >
            <Select placeholder="Chọn loại mẫu văn bản">
              {templateTypes.map((type) => (
                <Option key={type} value={type}>
                  {type}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="language"
            label="Ngôn ngữ"
            rules={[{ required: true, message: 'Vui lòng chọn ngôn ngữ' }]}
          >
            <Select>
              <Option value="Tiếng Việt">Tiếng Việt</Option>
              <Option value="English">English</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="content"
            label="Nội dung HTML"
            rules={[{ required: true, message: 'Vui lòng nhập nội dung mẫu văn bản' }]}
          >
            <TextArea
              rows={15}
              placeholder="Nhập mã HTML cho mẫu văn bản"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Tải lên và chuyển đổi file PDF"
        open={isPdfModalOpen}
        onCancel={closePdfModal}
        footer={null}
      >
        <p>Chọn file PDF để tự động chuyển đổi thành nội dung HTML.</p>
        <Upload.Dragger
          name="pdf"
          accept=".pdf"
          action={`${API_URL}/legal/templates/convert-pdf`}
          onChange={handleUploadPdf}
          showUploadList={false}
          customRequest={({ file, onSuccess }) => {
            setTimeout(() => {
              onSuccess("ok");
            }, 0);
          }}
        >
          <p className="ant-upload-drag-icon">
            <FileTextOutlined />
          </p>
          <p className="ant-upload-text">Nhấp hoặc kéo thả file PDF vào khu vực này</p>
          <p className="ant-upload-hint">Chỉ hỗ trợ tệp PDF</p>
        </Upload.Dragger>
        <div style={{ marginTop: '1rem', textAlign: 'right' }}>
          <Button onClick={closePdfModal} style={{ marginRight: 8 }}>
            Hủy bỏ
          </Button>
          <Button
            type="primary"
            loading={isUploading}
            icon={<UploadOutlined />}
          >
            Tải lên và chuyển đổi
          </Button>
        </div>
      </Modal>
    </Card>
  );
};

export default DocumentTemplatesManager; 