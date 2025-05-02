import React, { useState, useEffect, useRef } from 'react';
import { Table, Card, Button, Input, Select, Space, Pagination, Modal, Form, Spin, Typography, Alert, DatePicker, Upload, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, FileTextOutlined, UploadOutlined, ExclamationCircleOutlined, CalendarOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import styles from './LegalDocumentsManager.module.css';
import axiosInstance from '../../../config/axios';
import { API_URL } from '../../../config/constants';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { confirm } = Modal;

const LegalDocumentsManager = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [documentTypes, setDocumentTypes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [form] = Form.useForm();
  
  const [formData, setFormData] = useState({
    title: '',
    document_type: '',
    version: '',
    content: '',
    summary: '',
    issued_date: '',
    language: 'Tiếng Việt',
    keywords: []
  });

  useEffect(() => {
    fetchDocuments();
    fetchDocumentTypes();
  }, [currentPage, searchTerm, selectedDocumentType]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', 10);
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (selectedDocumentType) {
        params.append('document_type', selectedDocumentType);
      }
      
      const response = await axiosInstance.get(`${API_URL}/legal/documents?${params.toString()}`);
      
      if (response.data && response.data.status === 'success') {
        setDocuments(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setTotalItems(response.data.pagination.totalItems || response.data.pagination.totalPages * 10);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách văn bản pháp lý:', err);
      setError('Không thể tải danh sách văn bản pháp lý');
      toast.error('Không thể tải danh sách văn bản pháp lý');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentTypes = async () => {
    try {
      const response = await axiosInstance.get(`${API_URL}/legal/document-types`);
      if (response.data && response.data.status === 'success') {
        setDocumentTypes(response.data.data);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách loại văn bản pháp lý:', err);
    }
  };

  const openAddModal = () => {
    navigate('/dashboard/legal-documents/new');
  };

  const openEditModal = (document) => {
    if (document && document.id) {
      localStorage.setItem('editingDocument', JSON.stringify(document));
      
      navigate(`/dashboard/legal-documents/edit/${document.id}`);
    } else {
      toast.error('Không tìm thấy thông tin văn bản để chỉnh sửa');
    }
  };

  const openDeleteModal = (document) => {
    setSelectedDocument(document);
    confirm({
      title: 'Xác nhận xóa văn bản pháp lý',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: `Bạn có chắc chắn muốn xóa văn bản "${document.title}" không? 
                Hành động này không thể hoàn tác.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk() {
        handleDelete(document);
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

  const handleDocumentTypeChange = (value) => {
    setSelectedDocumentType(value);
    setCurrentPage(1);
  };

  const handleSubmitForm = async () => {
    try {
      const values = await form.validateFields();
      
      // Chuyển đổi mảng từ khóa thành chuỗi
      if (values.keywords && Array.isArray(values.keywords)) {
        values.keywords = values.keywords.join(', ');
      }
      
      // Chuyển đổi ngày phát hành sang định dạng chuẩn
      if (values.issued_date) {
        values.issued_date = values.issued_date.format('YYYY-MM-DD');
      }
      
      setLoading(true);
      
      if (modalMode === 'add') {
        const response = await axiosInstance.post(`${API_URL}/legal/documents`, values);
        if (response.data && response.data.status === 'success') {
          toast.success('Thêm văn bản pháp lý mới thành công');
          setIsModalOpen(false);
          fetchDocuments();
        }
      } else if (modalMode === 'edit' && selectedDocument) {
        const response = await axiosInstance.put(
          `${API_URL}/legal/documents/${selectedDocument.id}`,
          values
        );
        if (response.data && response.data.status === 'success') {
          toast.success('Cập nhật văn bản pháp lý thành công');
          setIsModalOpen(false);
          fetchDocuments();
        }
      }
    } catch (err) {
      console.error('Lỗi khi lưu văn bản pháp lý:', err);
      toast.error('Không thể lưu văn bản pháp lý: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (doc) => {
    try {
      setLoading(true);
      // Sử dụng document được truyền vào hoặc selectedDocument nếu có
      const documentToDelete = doc || selectedDocument;
      
      if (!documentToDelete || !documentToDelete.id) {
        throw new Error('Không tìm thấy thông tin văn bản pháp lý để xóa');
      }
      
      const response = await axiosInstance.delete(
        `${API_URL}/legal/documents/${documentToDelete.id}`
      );
      
      if (response.data && response.data.status === 'success') {
        toast.success('Xóa văn bản pháp lý thành công');
        fetchDocuments();
      }
    } catch (err) {
      console.error('Lỗi khi xóa văn bản pháp lý:', err);
      toast.error('Không thể xóa văn bản pháp lý: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
      setSelectedDocument(null);
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
      formData.append('file', info.file.originFileObj);
      
      const response = await axiosInstance.post(
        `${API_URL}/legal/upload-pdf`,
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
        toast.success('Chuyển đổi Word/PDF thành HTML thành công');
        setIsPdfModalOpen(false);
      }
    } catch (err) {
      console.error('Lỗi khi chuyển đổi Word/PDF:', err);
      toast.error('Không thể chuyển đổi Word/PDF: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDocument(null);
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
      width: '35%',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Loại văn bản',
      dataIndex: 'document_type',
      key: 'document_type',
    },
    {
      title: 'Ngày ban hành',
      dataIndex: 'issued_date',
      key: 'issued_date',
      render: (text) => text ? formatDate(text) : 'N/A',
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
          Thêm văn bản pháp lý
        </Button>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
        <Input
          placeholder="Tìm kiếm văn bản pháp lý..."
          value={searchTerm}
          onChange={handleSearchInputChange}
          prefix={<SearchOutlined />}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="Loại văn bản"
          value={selectedDocumentType}
          onChange={handleDocumentTypeChange}
          style={{ width: 200 }}
          allowClear
        >
          {documentTypes.map((type) => (
            <Option key={type.id || type} value={type.id || type}>
              {type.name || type}
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
            <Button onClick={fetchDocuments} type="primary" size="small">
              Thử lại
            </Button>
          }
        />
      ) : (
        <Table
          columns={columns}
          dataSource={documents}
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
        title={modalMode === 'add' ? 'Thêm văn bản pháp lý mới' : 'Chỉnh sửa văn bản pháp lý'}
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
            Tải tệp
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
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề văn bản pháp lý' }]}
          >
            <Input placeholder="Nhập tiêu đề văn bản pháp lý" />
          </Form.Item>
          
          <Form.Item
            name="document_type"
            label="Loại văn bản"
            rules={[{ required: true, message: 'Vui lòng chọn loại văn bản pháp lý' }]}
          >
            <Select placeholder="Chọn loại văn bản pháp lý">
              {documentTypes.map((type) => (
                <Option key={type.id || type} value={type.id || type}>
                  {type.name || type}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="version"
            label="Phiên bản"
          >
            <Input placeholder="Nhập phiên bản (nếu có)" />
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
            name="issued_date"
            label="Ngày ban hành"
          >
            <DatePicker 
              format="DD/MM/YYYY" 
              placeholder="Chọn ngày"
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            name="keywords"
            label="Từ khóa"
          >
            <Select
              mode="tags"
              placeholder="Nhập từ khóa và nhấn Enter"
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            name="summary"
            label="Tóm tắt"
          >
            <TextArea
              rows={4}
              placeholder="Nhập tóm tắt về văn bản pháp lý"
            />
          </Form.Item>
          
          <Form.Item
            name="content"
            label="Nội dung HTML"
            rules={[{ required: true, message: 'Vui lòng nhập nội dung văn bản pháp lý' }]}
          >
            <TextArea
              rows={15}
              placeholder="Nhập mã HTML cho văn bản pháp lý"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Tải lên và chuyển đổi file Word/PDF"
        open={isPdfModalOpen}
        onCancel={closePdfModal}
        footer={null}
      >
        <p>Chọn file Word (DOCX, DOC) hoặc PDF để tự động chuyển đổi thành nội dung HTML.</p>
        <Upload.Dragger
          name="file"
          accept=".pdf,.doc,.docx"
          action={`${API_URL}/legal/upload-pdf`}
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
          <p className="ant-upload-text">Nhấp hoặc kéo thả file vào khu vực này</p>
          <p className="ant-upload-hint">Hỗ trợ tệp DOCX, DOC và PDF</p>
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

export default LegalDocumentsManager; 