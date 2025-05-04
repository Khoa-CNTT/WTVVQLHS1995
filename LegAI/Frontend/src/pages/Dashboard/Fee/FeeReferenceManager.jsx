import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, Popconfirm, message, Card, Typography, Row, Col } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import transactionService from '../../../services/transactionService';
import { formatCurrency } from '../../../utils/formatters';

const { Title } = Typography;
const { Option } = Select;

const FeeReferenceManager = () => {
  const [feeReferences, setFeeReferences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('Thêm mới phí pháp lý');
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  // Load danh sách phí pháp lý
  const loadFeeReferences = async () => {
    setLoading(true);
    try {
      const result = await transactionService.getFeeReferences();
      if (result.success && result.data) {
        setFeeReferences(result.data);
      } else {
        message.error('Không thể tải danh sách phí pháp lý');
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách phí pháp lý:', error);
      message.error('Lỗi khi tải danh sách phí pháp lý');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeeReferences();
  }, []);

  // Mở modal thêm mới
  const showAddModal = () => {
    setModalTitle('Thêm mới phí pháp lý');
    setEditingId(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Mở modal sửa
  const showEditModal = (record) => {
    setModalTitle('Cập nhật phí pháp lý');
    setEditingId(record.id);
    form.setFieldsValue({
      case_type: record.case_type,
      description: record.description,
      base_fee: record.base_fee,
      percentage_fee: record.percentage_fee,
      calculation_method: record.calculation_method,
      min_fee: record.min_fee,
      max_fee: record.max_fee
    });
    setModalVisible(true);
  };

  // Xử lý submit form
  const handleSubmit = async (values) => {
    try {
      let result;
      
      if (editingId) {
        // Cập nhật
        result = await transactionService.updateFeeReference(editingId, values);
        if (result.success) {
          message.success('Cập nhật phí pháp lý thành công');
        }
      } else {
        // Thêm mới
        result = await transactionService.createFeeReference(values);
        if (result.success) {
          message.success('Thêm mới phí pháp lý thành công');
        }
      }
      
      setModalVisible(false);
      loadFeeReferences();
    } catch (error) {
      console.error('Lỗi khi lưu phí pháp lý:', error);
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Lỗi khi lưu phí pháp lý');
      }
    }
  };

  // Xóa phí pháp lý
  const handleDelete = async (id) => {
    try {
      const result = await transactionService.deleteFeeReference(id);
      if (result.success) {
        message.success('Xóa phí pháp lý thành công');
        loadFeeReferences();
      }
    } catch (error) {
      console.error('Lỗi khi xóa phí pháp lý:', error);
      message.error('Lỗi khi xóa phí pháp lý');
    }
  };

  // Định nghĩa cột cho bảng
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: 'Loại vụ án',
      dataIndex: 'case_type',
      key: 'case_type',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'Phí cơ bản',
      dataIndex: 'base_fee',
      key: 'base_fee',
      render: (text) => formatCurrency(text)
    },
    {
      title: 'Phí theo %',
      dataIndex: 'percentage_fee',
      key: 'percentage_fee',
      render: (text) => `${text}%`
    },
    {
      title: 'Phương thức tính',
      dataIndex: 'calculation_method',
      key: 'calculation_method',
      render: (text) => {
        switch (text) {
          case 'fixed': return 'Cố định';
          case 'percentage': return 'Theo %';
          default: return text;
        }
      }
    },
    {
      title: 'Phí tối thiểu',
      dataIndex: 'min_fee',
      key: 'min_fee',
      render: (text) => formatCurrency(text)
    },
    {
      title: 'Phí tối đa',
      dataIndex: 'max_fee',
      key: 'max_fee',
      render: (text) => text ? formatCurrency(text) : 'Không giới hạn'
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
            size="small"
          />
          <Popconfirm
            title="Bạn có chắc muốn xóa phí pháp lý này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="fee-reference-manager">
      <Card>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Title level={4}>Quản lý phí pháp lý</Title>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={showAddModal}
            >
              Thêm mới
            </Button>
          </Col>
        </Row>
        
        <Table
          columns={columns}
          dataSource={feeReferences}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng số: ${total} bản ghi`
          }}
        />
      </Card>

      {/* Modal thêm/sửa phí pháp lý */}
      <Modal
        title={modalTitle}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="case_type"
                label="Loại vụ án"
                rules={[{ required: true, message: 'Vui lòng nhập loại vụ án' }]}
              >
                <Input placeholder="Ví dụ: civil, criminal, ..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="description"
                label="Mô tả"
                rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
              >
                <Input placeholder="Ví dụ: Vụ án dân sự" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="base_fee"
                label="Phí cơ bản"
                rules={[{ required: true, message: 'Vui lòng nhập phí cơ bản' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="Ví dụ: 2000000"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="percentage_fee"
                label="Phí theo %"
                initialValue={0}
                rules={[{ required: true, message: 'Vui lòng nhập phí theo %' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  formatter={(value) => `${value}%`}
                  parser={(value) => value.replace('%', '')}
                  placeholder="Ví dụ: 1.5"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="calculation_method"
                label="Phương thức tính"
                initialValue="fixed"
              >
                <Select>
                  <Option value="fixed">Cố định</Option>
                  <Option value="percentage">Theo %</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="min_fee"
                label="Phí tối thiểu"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="Ví dụ: 1000000"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="max_fee"
                label="Phí tối đa"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="Ví dụ: 50000000"
                />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Button style={{ marginRight: 8 }} onClick={() => setModalVisible(false)}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              {editingId ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default FeeReferenceManager; 