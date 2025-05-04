import React, { useState, useEffect } from 'react';
import { 
  Table, Card, Tabs, Input, Button, Tag, Avatar, 
  Tooltip, Badge, Modal, Spin, Empty, Typography, Row, Col, Statistic
} from 'antd';
import { 
  UserOutlined, SearchOutlined, MessageOutlined, 
  FileTextOutlined, CalendarOutlined, InfoCircleOutlined,
  PhoneOutlined, MailOutlined, EyeOutlined
} from '@ant-design/icons';
import appointmentService from '../../../services/appointmentService';
import chatService from '../../../services/chatService';
import legalCaseService from '../../../services/legalCaseService';
import authService from '../../../services/authService';
import { DEFAULT_AVATAR } from '../../../config/constants';

const { TabPane } = Tabs;
const { Text, Title } = Typography;

const ClientsManager = () => {
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetailVisible, setClientDetailVisible] = useState(false);
  const [statistics, setStatistics] = useState({
    totalClients: 0,
    activeClients: 0,
    newClientsThisMonth: 0
  });

  useEffect(() => {
    fetchAllClientData();
  }, []);

  const fetchAllClientData = async () => {
    setLoading(true);
    try {
      const user = authService.getCurrentUser();
      if (!user || !user.id) {
        throw new Error("Không thể xác định ID luật sư");
      }

      // Lấy danh sách tất cả các lịch hẹn
      const appointmentsResponse = await appointmentService.getAppointments();
      let appointmentsData = [];
      if (appointmentsResponse.status === 'success' && Array.isArray(appointmentsResponse.data)) {
        appointmentsData = appointmentsResponse.data;
      }

      // Lấy danh sách vụ án được gán cho luật sư
      const casesResponse = await legalCaseService.getLawyerCases();
      let casesData = [];
      if (casesResponse.success && Array.isArray(casesResponse.data)) {
        casesData = casesResponse.data;
      }

      // Lấy danh sách chat
      const chatsResponse = await chatService.getChats();
      let chatsData = [];
      if (chatsResponse && chatsResponse.data) {
        chatsData = chatsResponse.data;
      }

      // Tạo danh sách khách hàng duy nhất từ cả 3 nguồn dữ liệu
      const clientsMap = new Map();

      // Thêm khách hàng từ lịch hẹn
      appointmentsData.forEach(appointment => {
        const clientId = appointment.customer_id || appointment.client_id;
        if (clientId) {
          const client = {
            id: clientId,
            name: appointment.customer_name || appointment.client_name || 'Khách hàng',
            email: appointment.customer_email || appointment.client_email || 'Không có thông tin',
            phone: appointment.customer_phone || appointment.client_phone || '',
            avatar: appointment.customer_avatar || appointment.client_avatar || DEFAULT_AVATAR,
            appointments: 1,
            cases: 0,
            messages: 0,
            lastInteraction: appointment.created_at || appointment.start_time,
            appointmentList: [appointment]
          };

          if (clientsMap.has(clientId)) {
            const existingClient = clientsMap.get(clientId);
            existingClient.appointments += 1;
            existingClient.appointmentList.push(appointment);
            if (new Date(appointment.created_at) > new Date(existingClient.lastInteraction)) {
              existingClient.lastInteraction = appointment.created_at;
            }
            clientsMap.set(clientId, existingClient);
          } else {
            clientsMap.set(clientId, client);
          }
        }
      });

      // Thêm khách hàng từ vụ án
      casesData.forEach(legalCase => {
        const clientId = legalCase.user_id || legalCase.client_id;
        if (clientId) {
          if (clientsMap.has(clientId)) {
            const existingClient = clientsMap.get(clientId);
            existingClient.cases += 1;
            if (!existingClient.caseList) existingClient.caseList = [];
            existingClient.caseList.push(legalCase);
            if (new Date(legalCase.created_at) > new Date(existingClient.lastInteraction)) {
              existingClient.lastInteraction = legalCase.created_at;
            }
            clientsMap.set(clientId, existingClient);
          } else {
            const client = {
              id: clientId,
              name: legalCase.client_name || 'Khách hàng',
              email: legalCase.client_email || '',
              phone: legalCase.client_phone || '',
              avatar: legalCase.client_avatar || DEFAULT_AVATAR,
              appointments: 0,
              cases: 1,
              messages: 0,
              lastInteraction: legalCase.created_at,
              caseList: [legalCase]
            };
            clientsMap.set(clientId, client);
          }
        }
      });

      // Thêm khách hàng từ chat
      chatsData.forEach(chat => {
        const clientId = chat.customer_id || chat.user_id;
        if (clientId) {
          if (clientsMap.has(clientId)) {
            const existingClient = clientsMap.get(clientId);
            existingClient.messages = existingClient.messages || 0;
            existingClient.messages += 1;
            if (!existingClient.chatList) existingClient.chatList = [];
            existingClient.chatList.push(chat);
            if (new Date(chat.updated_at) > new Date(existingClient.lastInteraction)) {
              existingClient.lastInteraction = chat.updated_at;
            }
            clientsMap.set(clientId, existingClient);
          } else {
            const client = {
              id: clientId,
              name: chat.customer_name || 'Khách hàng',
              email: chat.customer_email || '',
              phone: chat.customer_phone || '',
              avatar: chat.customer_avatar || DEFAULT_AVATAR,
              appointments: 0,
              cases: 0,
              messages: 1,
              lastInteraction: chat.updated_at,
              chatList: [chat]
            };
            clientsMap.set(clientId, client);
          }
        }
      });

      // Chuyển đổi Map thành mảng khách hàng
      const clientsList = Array.from(clientsMap.values());
      
      // Sắp xếp theo thời gian tương tác gần nhất
      clientsList.sort((a, b) => new Date(b.lastInteraction) - new Date(a.lastInteraction));

      // Cập nhật thống kê
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      setStatistics({
        totalClients: clientsList.length,
        activeClients: clientsList.filter(client => 
          new Date(client.lastInteraction) >= new Date(now - 30 * 24 * 60 * 60 * 1000)
        ).length,
        newClientsThisMonth: clientsList.filter(client => 
          new Date(client.lastInteraction) >= firstDayOfMonth
        ).length
      });

      setClientData(clientsList);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu khách hàng:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const showClientDetail = (client) => {
    setSelectedClient(client);
    setClientDetailVisible(true);
  };

  const handleCloseModal = () => {
    setClientDetailVisible(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Không có dữ liệu';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredClients = () => {
    let filteredClients = [...clientData];

    // Lọc theo loại tương tác
    if (activeTab === 'appointments') {
      filteredClients = filteredClients.filter(client => client.appointments > 0);
    } else if (activeTab === 'cases') {
      filteredClients = filteredClients.filter(client => client.cases > 0);
    } else if (activeTab === 'messages') {
      filteredClients = filteredClients.filter(client => client.messages > 0);
    }

    // Lọc theo từ khóa tìm kiếm
    if (searchText) {
      const searchKeyword = searchText.toLowerCase();
      filteredClients = filteredClients.filter(client => 
        (client.name && client.name.toLowerCase().includes(searchKeyword)) ||
        (client.email && client.email.toLowerCase().includes(searchKeyword)) ||
        (client.phone && client.phone.includes(searchKeyword))
      );
    }

    return filteredClients;
  };

  const columns = [
    {
      title: 'Khách hàng',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={record.avatar} 
            icon={<UserOutlined />} 
            style={{ marginRight: 10 }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = DEFAULT_AVATAR;
            }}
          />
          <div>
            <div>{text}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Liên hệ',
      dataIndex: 'phone',
      key: 'phone',
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
        </div>
      ),
    },
    {
      title: 'Lần cuối tương tác',
      dataIndex: 'lastInteraction',
      key: 'lastInteraction',
      render: (text) => formatDate(text),
    },
    {
      title: 'Lịch hẹn',
      dataIndex: 'appointments',
      key: 'appointments',
      align: 'center',
      render: (count) => (
        <Badge count={count} style={{ backgroundColor: count > 0 ? '#1890ff' : '#d9d9d9' }} overflowCount={99} />
      ),
    },
    {
      title: 'Vụ án',
      dataIndex: 'cases',
      key: 'cases',
      align: 'center',
      render: (count) => (
        <Badge count={count} style={{ backgroundColor: count > 0 ? '#52c41a' : '#d9d9d9' }} overflowCount={99} />
      ),
    },
    {
      title: 'Tin nhắn',
      dataIndex: 'messages',
      key: 'messages',
      align: 'center',
      render: (count) => (
        <Badge count={count} style={{ backgroundColor: count > 0 ? '#faad14' : '#d9d9d9' }} overflowCount={99} />
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<EyeOutlined />} 
          onClick={() => showClientDetail(record)}
          size="small"
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px 0' }}>
      <Title level={3}>Danh sách khách hàng</Title>
      <Text type="secondary" style={{ marginBottom: 20, display: 'block' }}>
        Danh sách khách hàng đã tương tác với bạn thông qua lịch hẹn, vụ án, hoặc tin nhắn.
      </Text>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Tổng số khách hàng" 
              value={statistics.totalClients} 
              prefix={<UserOutlined />} 
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Khách hàng tích cực" 
              value={statistics.activeClients} 
              prefix={<UserOutlined />} 
              valueStyle={{ color: '#3f8600' }}
            />
            <Text type="secondary">Hoạt động trong 30 ngày qua</Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Khách hàng mới trong tháng" 
              value={statistics.newClientsThisMonth} 
              prefix={<UserOutlined />} 
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <Tabs activeKey={activeTab} onChange={handleTabChange} style={{ flex: 1 }}>
          <TabPane tab="Tất cả khách hàng" key="all" />
          <TabPane tab={<span><CalendarOutlined /> Đã đặt lịch hẹn</span>} key="appointments" />
          <TabPane tab={<span><FileTextOutlined /> Có vụ án</span>} key="cases" />
          <TabPane tab={<span><MessageOutlined /> Đã nhắn tin</span>} key="messages" />
        </Tabs>
        
        <Input
          placeholder="Tìm kiếm khách hàng..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={handleSearch}
          style={{ width: 300, marginLeft: 20 }}
          allowClear
        />
      </div>

      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 15 }}>Đang tải dữ liệu khách hàng...</div>
          </div>
        ) : getFilteredClients().length > 0 ? (
          <Table
            columns={columns}
            dataSource={getFilteredClients()}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <Empty
            description={
              searchText 
                ? "Không tìm thấy khách hàng phù hợp với từ khóa tìm kiếm" 
                : activeTab !== 'all' 
                  ? `Không có khách hàng nào ${activeTab === 'appointments' ? 'đã đặt lịch hẹn' : activeTab === 'cases' ? 'có vụ án' : 'đã nhắn tin'}`
                  : "Chưa có khách hàng nào trong hệ thống"
            }
          />
        )}
      </Card>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              size={40} 
              src={selectedClient?.avatar}
              icon={<UserOutlined />}
              style={{ marginRight: 10 }}
            />
            <div>
              {selectedClient?.name}
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>{selectedClient?.email}</Text>
              </div>
            </div>
          </div>
        }
        visible={clientDetailVisible}
        onCancel={handleCloseModal}
        footer={[
          <Button key="back" onClick={handleCloseModal}>
            Đóng
          </Button>
        ]}
        width={700}
      >
        {selectedClient && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <Title level={5}>Thông tin liên hệ</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ marginBottom: 10 }}>
                    <MailOutlined style={{ marginRight: 8 }} />
                    <Text strong>Email: </Text> 
                    <Text>{selectedClient.email || 'Không có thông tin'}</Text>
                  </div>
                </Col>
                <Col span={12}>
                  <div>
                    <PhoneOutlined style={{ marginRight: 8 }} />
                    <Text strong>Số điện thoại: </Text>
                    <Text>{selectedClient.phone || 'Không có thông tin'}</Text>
                  </div>
                </Col>
              </Row>
            </div>

            <Tabs defaultActiveKey="1">
              {selectedClient.appointments > 0 && (
                <TabPane 
                  tab={<span><CalendarOutlined /> Lịch hẹn ({selectedClient.appointments})</span>} 
                  key="1"
                >
                  {selectedClient.appointmentList?.map((appointment, index) => (
                    <Card key={index} size="small" style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <Text strong>Ngày hẹn: {formatDate(appointment.start_time)}</Text>
                        <Tag color={
                          appointment.status === 'pending' ? 'blue' : 
                          appointment.status === 'confirmed' ? 'green' : 
                          appointment.status === 'cancelled' ? 'red' : 
                          appointment.status === 'completed' ? 'purple' : 'default'
                        }>
                          {appointment.status === 'pending' ? 'Chờ xác nhận' : 
                          appointment.status === 'confirmed' ? 'Đã xác nhận' : 
                          appointment.status === 'cancelled' ? 'Đã hủy' : 
                          appointment.status === 'completed' ? 'Hoàn thành' : appointment.status}
                        </Tag>
                      </div>
                      <div>
                        <CalendarOutlined style={{ marginRight: 5 }} />
                        <Text>{appointment.purpose || 'Không có mục đích'}</Text>
                      </div>
                    </Card>
                  ))}
                </TabPane>
              )}

              {selectedClient.cases > 0 && (
                <TabPane 
                  tab={<span><FileTextOutlined /> Vụ án ({selectedClient.cases})</span>} 
                  key="2"
                >
                  {selectedClient.caseList?.map((legalCase, index) => (
                    <Card key={index} size="small" style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <Text strong>{legalCase.title || `Vụ án #${legalCase.id}`}</Text>
                        <Tag color={
                          legalCase.status === 'pending' ? 'blue' : 
                          legalCase.status === 'in_progress' ? 'green' : 
                          legalCase.status === 'completed' ? 'purple' : 'default'
                        }>
                          {legalCase.status === 'pending' ? 'Đang chờ' : 
                          legalCase.status === 'in_progress' ? 'Đang xử lý' : 
                          legalCase.status === 'completed' ? 'Hoàn thành' : legalCase.status}
                        </Tag>
                      </div>
                      <div>
                        <FileTextOutlined style={{ marginRight: 5 }} />
                        <Text>{legalCase.case_type || 'Không có loại vụ án'}</Text>
                      </div>
                      <div>
                        <Text type="secondary">Ngày tạo: {formatDate(legalCase.created_at)}</Text>
                      </div>
                    </Card>
                  ))}
                </TabPane>
              )}

              {selectedClient.messages > 0 && (
                <TabPane 
                  tab={<span><MessageOutlined /> Tin nhắn ({selectedClient.messages})</span>} 
                  key="3"
                >
                  {selectedClient.chatList?.map((chat, index) => (
                    <Card key={index} size="small" style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <Text strong>Phiên chat #{chat.id}</Text>
                        <Tag color={
                          chat.status === 'waiting' ? 'blue' : 
                          chat.status === 'active' ? 'green' : 
                          chat.status === 'closed' ? 'default' : 'default'
                        }>
                          {chat.status === 'waiting' ? 'Đang chờ' : 
                          chat.status === 'active' ? 'Đang hoạt động' : 
                          chat.status === 'closed' ? 'Đã đóng' : chat.status}
                        </Tag>
                      </div>
                      <div>
                        <Text type="secondary">Cập nhật: {formatDate(chat.updated_at)}</Text>
                      </div>
                    </Card>
                  ))}
                </TabPane>
              )}
            </Tabs>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClientsManager; 