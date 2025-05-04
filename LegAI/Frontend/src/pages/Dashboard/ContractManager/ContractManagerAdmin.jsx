import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Card, Typography, Row, Col, Tag, message, Tooltip, Modal, Spin } from 'antd';
import { SearchOutlined, DownloadOutlined, EyeOutlined, DeleteOutlined, UserOutlined, FileOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import { getAllContracts, getContractById, deleteContract, downloadContractFile } from '../../../services/contractService';
import AddEditContract from './AddEditContract';
import styles from './ContractManagerAdmin.module.css';

const { Title, Text } = Typography;
const { confirm } = Modal;

const ContractManagerAdmin = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [contractDetail, setContractDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [addEditVisible, setAddEditVisible] = useState(false);
  const [editContractId, setEditContractId] = useState(null);

  useEffect(() => {
    fetchContracts();
  }, [pagination.current, pagination.pageSize, searchTerm]);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const response = await getAllContracts(pagination.current, pagination.pageSize, searchTerm);
      if (response?.success) {
        setContracts(response.contracts || []);
        setPagination({ ...pagination, total: response.total || 0 });
      } else {
        message.error('Không thể tải danh sách hợp đồng');
      }
    } catch (error) {
      message.error(`Lỗi khi tải danh sách hợp đồng: ${error.message || 'Đã có lỗi xảy ra'}`);
      console.error('Lỗi khi tải danh sách hợp đồng:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  const showContractDetail = async (contractId) => {
    setDetailVisible(true);
    setDetailLoading(true);
    try {
      const response = await getContractById(contractId);
      if (response?.success) {
        setContractDetail(response.data);
      } else {
        message.error('Không thể tải chi tiết hợp đồng');
      }
    } catch (error) {
      message.error(`Lỗi khi tải chi tiết hợp đồng: ${error.message || 'Đã có lỗi xảy ra'}`);
      console.error('Lỗi khi tải chi tiết hợp đồng:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDownload = async (contractId) => {
    setLoading(true);
    try {
      const result = await downloadContractFile(contractId);
      if (result?.success) {
        message.success('Đã tải xuống hợp đồng thành công');
      }
    } catch (error) {
      message.error(`Lỗi khi tải xuống hợp đồng: ${error.message || 'Đã có lỗi xảy ra'}`);
      console.error('Lỗi khi tải xuống hợp đồng:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (contractId, contractTitle) => {
    confirm({
      title: 'Xác nhận xóa hợp đồng',
      content: `Bạn có chắc chắn muốn xóa hợp đồng "${contractTitle}" không?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        setLoading(true);
        try {
          const result = await deleteContract(contractId);
          if (result?.success) {
            message.success('Đã xóa hợp đồng thành công');
            fetchContracts();
          } else {
            message.error('Không thể xóa hợp đồng');
          }
        } catch (error) {
          message.error(`Lỗi khi xóa hợp đồng: ${error.message || 'Đã có lỗi xảy ra'}`);
          console.error('Lỗi khi xóa hợp đồng:', error);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Mở form thêm/sửa hợp đồng
  const showAddEditForm = (contractId = null) => {
    setEditContractId(contractId);
    setAddEditVisible(true);
    
    // Đóng modal chi tiết nếu đang mở
    if (detailVisible) {
      setDetailVisible(false);
    }
  };

  // Đóng form thêm/sửa hợp đồng
  const handleCloseAddEdit = () => {
    setAddEditVisible(false);
    setEditContractId(null);
  };

  // Xử lý sau khi thêm/sửa thành công
  const handleAddEditSuccess = () => {
    fetchContracts(); // Tải lại danh sách
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <a href="#" onClick={(e) => { e.preventDefault(); showContractDetail(record.id); }}>
          {text}
        </a>
      ),
    },
    { title: 'Loại', dataIndex: 'contract_type', key: 'contract_type', width: 120, render: (text) => <Tag color="blue">{text}</Tag> },
    {
      title: 'Người dùng',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 150,
      render: (text, record) => (
        <Tooltip title={record.user_email}>
          <UserOutlined style={{ marginRight: 8 }} />{text}
        </Tooltip>
      ),
    },
    { title: 'Đối tác', dataIndex: 'partner', key: 'partner', width: 150, render: (text) => text || 'N/A' },
    { title: 'Bắt đầu', dataIndex: 'start_date', key: 'start_date', width: 100, render: formatDate },
    { title: 'Kết thúc', dataIndex: 'end_date', key: 'end_date', width: 100, render: formatDate },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <div className="flex gap-2">
          <Tooltip title="Xem chi tiết">
            <Button type="text" icon={<EyeOutlined />} onClick={() => showContractDetail(record.id)} />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button type="text" icon={<EditOutlined />} onClick={() => showAddEditForm(record.id)} />
          </Tooltip>
          <Tooltip title="Tải xuống">
            <Button type="text" icon={<DownloadOutlined />} onClick={() => handleDownload(record.id)} />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id, record.title)} />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <Card className={styles.searchCard}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={6}>
            <Title level={5} className="m-0">
              <SearchOutlined className="mr-2" /> Tìm kiếm
            </Title>
          </Col>
          <Col xs={24} md={12}>
            <Input
              placeholder="Tìm theo tiêu đề, loại, đối tác..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={24} md={6} style={{ textAlign: 'right' }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => showAddEditForm()}
            >
              Thêm hợp đồng
            </Button>
          </Col>
        </Row>
      </Card>

      <Card title="Danh sách hợp đồng" className={styles.contractTable}>
        <Table
          columns={columns}
          dataSource={contracts}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} hợp đồng`,
          }}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title="Chi tiết hợp đồng"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button 
            key="edit" 
            icon={<EditOutlined />} 
            onClick={() => showAddEditForm(contractDetail?.id)}
          >
            Sửa
          </Button>,
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={() => contractDetail && handleDownload(contractDetail.id)}>
            Tải xuống
          </Button>,
          <Button key="close" onClick={() => setDetailVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {detailLoading ? (
          <div className="text-center py-5">
            <Spin size="large" />
          </div>
        ) : contractDetail ? (
          <div className={styles.contractDetail}>
            <Card>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <div className={styles.detailItem}><Text strong>Tiêu đề:</Text> <Text>{contractDetail.title}</Text></div>
                  <div className={styles.detailItem}><Text strong>Loại:</Text> <Tag color="blue">{contractDetail.contract_type}</Tag></div>
                  <div className={styles.detailItem}><Text strong>Đối tác:</Text> <Text>{contractDetail.partner || 'N/A'}</Text></div>
                  <div className={styles.detailItem}><Text strong>Bắt đầu:</Text> <Text>{formatDate(contractDetail.start_date)}</Text></div>
                  <div className={styles.detailItem}><Text strong>Kết thúc:</Text> <Text>{formatDate(contractDetail.end_date)}</Text></div>
                </Col>
                <Col xs={24} md={12}>
                  <div className={styles.detailItem}><Text strong>Người dùng:</Text> <Text>{contractDetail.user_name}</Text></div>
                  <div className={styles.detailItem}><Text strong>Email:</Text> <Text>{contractDetail.user_email}</Text></div>
                  <div className={styles.detailItem}><Text strong>Chữ ký:</Text> <Text>{contractDetail.signature || 'N/A'}</Text></div>
                  <div className={styles.detailItem}><Text strong>Ngày tạo:</Text> <Text>{formatDate(contractDetail.created_at)}</Text></div>
                  <div className={styles.detailItem}><Text strong>Cập nhật:</Text> <Text>{formatDate(contractDetail.updated_at)}</Text></div>
                </Col>
              </Row>
            </Card>
            <div className={styles.filePreview}>
              <FileOutlined className="text-5xl" />
              <div className={styles.fileInfo}>
                <Text strong>File đính kèm</Text>
                <Text>Tải xuống để xem nội dung</Text>
              </div>
            </div>
          </div>
        ) : (
          <div>Không có dữ liệu</div>
        )}
      </Modal>

      {/* Form thêm/sửa hợp đồng */}
      <AddEditContract
        visible={addEditVisible}
        onCancel={handleCloseAddEdit}
        onSuccess={handleAddEditSuccess}
        contractId={editContractId}
      />
    </div>
  );
};

export default ContractManagerAdmin;