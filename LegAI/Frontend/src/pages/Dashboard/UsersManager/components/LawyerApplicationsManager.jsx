import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Badge, Card, message, Space, Tag, Image, Typography, Tooltip, notification } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined, ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import axios from '../../../../config/axios';
import classes from '../UsersManagerPage.module.css';

const { Title, Text, Paragraph } = Typography;

const LawyerApplicationsManager = () => {
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [currentApplication, setCurrentApplication] = useState(null);

  // Fetch pending lawyer applications
  const fetchApplications = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      // Lấy tất cả các đơn đăng ký luật sư không phân trang để đảm bảo đầy đủ dữ liệu
      const response = await axios.get(`/users/pending-lawyers`, {
        params: {
          page,
          limit,
          full: true // Thêm tham số để yêu cầu lấy đầy đủ thông tin
        }
      });
      
      // In ra cấu trúc dữ liệu từ API để debug
      console.log('API response structure:', JSON.stringify(response.data, null, 2));
      
      // Kiểm tra dữ liệu trả về
      if (response && response.data && Array.isArray(response.data.data)) {
        // Kiểm tra mẫu dữ liệu đầu tiên nếu có
        if (response.data.data.length > 0) {
          console.log('First data sample:', JSON.stringify(response.data.data[0], null, 2));
        }
        
        // Lưu trữ dữ liệu nguyên bản không thay đổi, nhưng thêm key
        const dataWithKeys = response.data.data.map(item => {
          // Trích xuất ID từ nhiều nguồn khả dĩ
          const id = item.id || item._id || item.userId || item.lawyer_id || (item.user && (item.user.id || item.user._id));
          
          // Trích xuất họ tên từ nhiều nguồn khả dĩ
          const fullName = item.fullName || item.full_name || item.name || 
                         (item.user && (item.user.fullName || item.user.full_name || item.user.name));
          
          return {
            ...item,
            id: id,  // Đảm bảo luôn có ID
            fullName: fullName, // Đảm bảo luôn có họ tên
            key: id ? id.toString() : `item-${Math.random().toString(36).substr(2, 9)}`
          };
        });
        
        // Log ra một mẫu sau khi xử lý
        if (dataWithKeys.length > 0) {
          console.log('Sample item after processing:', dataWithKeys[0]);
        }
        
        setApplications(dataWithKeys);
        setPagination({
          current: page,
          pageSize: limit,
          total: response.data.total || dataWithKeys.length,
        });
      } else {
        // Xử lý trường hợp dữ liệu không đúng định dạng
        message.error('Dữ liệu không đúng định dạng từ máy chủ');
        setApplications([]);
        setPagination({
          current: 1,
          pageSize: 10,
          total: 0,
        });
      }
    } catch (error) {
      let errorMessage = 'Không thể tải danh sách đơn đăng ký luật sư';
      
      // Hiển thị thông tin lỗi chi tiết hơn nếu có
      if (error.response) {
        // Lỗi từ máy chủ với mã trạng thái
        errorMessage += `: ${error.response.status} - ${error.response.data?.message || 'Lỗi từ máy chủ'}`;
      } else if (error.request) {
        // Không nhận được phản hồi từ máy chủ
        errorMessage += ': Không nhận được phản hồi từ máy chủ';
      } else {
        // Lỗi khi thiết lập yêu cầu
        errorMessage += `: ${error.message}`;
      }
      
      message.error(errorMessage);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Handle table pagination
  const handleTableChange = (pagination) => {
    fetchApplications(pagination.current, pagination.pageSize);
  };

  // View application details - hiển thị thông tin chi tiết từ dữ liệu có sẵn
  const viewApplication = (application) => {
    // Kiểm tra nếu application tồn tại
    if (!application) {
      message.error('Không thể hiển thị thông tin, dữ liệu không hợp lệ');
      return;
    }

    // Ghi log chi tiết để debug dữ liệu
    console.log('Application data details:', JSON.stringify(application, null, 2));

    // Sử dụng trực tiếp dữ liệu đã có từ danh sách thay vì gọi API
    setCurrentApplication(application);
    setViewModalVisible(true);
  };

  // Approve lawyer application
  const approveApplication = async (lawyerId) => {
    try {
      await axios.put(`/users/approve-lawyer/${lawyerId}`);
      
      // Hiển thị thông báo thành công với hướng dẫn
      notification.success({
        message: 'Phê duyệt thành công',
        description: 
          'Đơn đăng ký luật sư đã được phê duyệt. Nhắc người dùng đăng xuất và đăng nhập lại để nhận quyền truy cập mới. Thông tin vai trò trong localStorage chỉ được cập nhật khi người dùng đăng nhập lại.',
        duration: 10, // Hiển thị lâu hơn để admin đọc kỹ
        icon: <InfoCircleOutlined style={{ color: '#108ee9' }} />
      });
      
      // Vẫn giữ thông báo ngắn gọn
      message.success('Đã phê duyệt đơn đăng ký luật sư thành công');
      
      // Tải lại danh sách đơn đăng ký
      fetchApplications(pagination.current, pagination.pageSize);
      setViewModalVisible(false);
    } catch (error) {
      message.error('Không thể phê duyệt đơn đăng ký');
    }
  };

  // Reject lawyer application
  const rejectApplication = async (lawyerId) => {
    try {
      await axios.put(`/users/reject-lawyer/${lawyerId}`);
      message.success('Đã từ chối đơn đăng ký luật sư');
      fetchApplications(pagination.current, pagination.pageSize);
      setViewModalVisible(false);
    } catch (error) {
      message.error('Không thể từ chối đơn đăng ký');
    }
  };

  // Confirm approve
  const showApproveConfirm = (lawyerId) => {
    Modal.confirm({
      title: 'Xác nhận phê duyệt',
      content: (
        <div>
          <p>Bạn có chắc chắn muốn phê duyệt đơn đăng ký này không? Người dùng sẽ được nâng cấp lên thành luật sư.</p>
          <p style={{ color: '#ff8800' }}>
            <InfoCircleOutlined /> Lưu ý: Người dùng cần đăng xuất và đăng nhập lại để nhận quyền mới.
          </p>
        </div>
      ),
      okText: 'Phê duyệt',
      cancelText: 'Hủy',
      onOk: () => approveApplication(lawyerId),
    });
  };

  // Confirm reject
  const showRejectConfirm = (lawyerId) => {
    Modal.confirm({
      title: 'Xác nhận từ chối',
      content: 'Bạn có chắc chắn muốn từ chối đơn đăng ký này không?',
      okText: 'Từ chối',
      cancelText: 'Hủy',
      okType: 'danger',
      onOk: () => rejectApplication(lawyerId),
    });
  };

  const renderStatus = (status, record) => {
    return (
      <Tag key={`tag-${record.key}`} color={status === 'pending' ? 'gold' : 'default'}>
        {status === 'pending' ? 'Chờ duyệt' : status}
      </Tag>
    );
  };

  const renderActions = (_, record) => {
    return (
      <Space key={`actions-${record.key}`} size="small">
        <Tooltip title="Xem chi tiết">
          <Button 
            key={`view-${record.key}`}
            icon={<EyeOutlined />} 
            onClick={() => viewApplication(record)} 
            size="small"
          />
        </Tooltip>
        <Tooltip title="Phê duyệt">
          <Button 
            key={`approve-${record.key}`}
            type="primary" 
            icon={<CheckOutlined />} 
            onClick={() => showApproveConfirm(record.lawyer_id)} 
            size="small"
          />
        </Tooltip>
        <Tooltip title="Từ chối">
          <Button 
            key={`reject-${record.key}`}
            danger 
            icon={<CloseOutlined />} 
            onClick={() => showRejectConfirm(record.lawyer_id)} 
            size="small"
          />
        </Tooltip>
      </Space>
    );
  };

  // Hiển thị tất cả thông tin (không thêm không bớt) từ đối tượng currentApplication
  const renderAllFields = () => {
    if (!currentApplication) return null;
    
    console.log('Rendering details for:', JSON.stringify(currentApplication, null, 2));
    
    // Hàm kiểm tra và định dạng giá trị ngày tháng
    const formatDateTime = (value) => {
      if (!value) return 'N/A';
      
      // Hiển thị giá trị gốc trước khi xử lý để debug
      console.log(`Formatting date value: "${value}" (${typeof value})`);
      
      // Kiểm tra xem giá trị có phải là chuỗi ISO date hoặc timestamp hợp lệ không
      if (isNaN(new Date(value).getTime())) {
        return value; // Nếu không phải ngày hợp lệ, trả về giá trị gốc
      }
      
      try {
        // Tạo đối tượng Date và kiểm tra tính hợp lệ
        const date = new Date(value);
        
        // Kiểm tra xem date có hợp lệ không
        if (date.toString() === "Invalid Date") {
          return value;
        }
        
        // Định dạng ngày tháng theo locale Việt Nam
        return new Intl.DateTimeFormat('vi-VN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }).format(date);
      } catch (e) {
        console.error('Error formatting date:', e);
        // Nếu có lỗi xảy ra, trả về giá trị gốc
        return value;
      }
    };
    
    // Tạo mảng chứa tất cả các trường dữ liệu từ đối tượng
    const allFields = Object.entries(currentApplication)
      .filter(([key, value]) => {
        // Ghi log để debug
        if (['id', 'fullName', 'created_at', 'registrationDate', 'registration_date'].includes(key)) {
          console.log(`Field: ${key}, Value: ${value}, Type: ${typeof value}`);
        }
        
        // Loại bỏ một số trường nhạy cảm hoặc không cần hiển thị
        return !['key', 'password', '__v'].includes(key) && 
        // Loại bỏ các trường là mảng hoặc đối tượng phức tạp (nhưng cho phép null)
        (typeof value !== 'object' || value === null);
      })
      .map(([key, value]) => {
        // Xử lý giá trị đặc biệt
        let displayValue = value;
        
        // Xử lý các trường ngày tháng - mở rộng để bắt nhiều mẫu khác nhau
        if (
          key.includes('date') || 
          key.includes('time') || 
          key.includes('at') || 
          key === 'created_at' || 
          key === 'updated_at' ||
          key === 'registrationDate' ||
          key === 'registration_date'
        ) {
          displayValue = formatDateTime(value);
        }
        
        // Xử lý giá trị null hoặc undefined
        if (value === null || value === undefined) {
          displayValue = 'N/A';
        }
        
        // Xử lý trường hợp đặc biệt cho tên trường
        let label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        // Điều chỉnh một số nhãn cụ thể
        if (key === 'fullName') label = 'Họ Tên';
        if (key === 'id') label = 'ID';
        if (key === 'created_at') label = 'Ngày Tạo';
        if (key === 'registrationDate' || key === 'registration_date') label = 'Ngày Đăng Ký';
        
        return {
          key: `field-${key}`,
          label: label,
          value: displayValue
        };
      });
    
    // Thêm thông tin debug
    console.log(`Found ${allFields.length} fields to display`);
    
    // Đảm bảo thông tin cơ bản luôn được hiển thị đầu tiên
    const importantFields = ['ID', 'Họ Tên', 'Email', 'Số Điện Thoại', 'Ngày Đăng Ký'];
    
    // Sắp xếp lại các trường để thông tin quan trọng hiển thị trước
    allFields.sort((a, b) => {
      const aImportance = importantFields.indexOf(a.label);
      const bImportance = importantFields.indexOf(b.label);
      
      if (aImportance !== -1 && bImportance !== -1) {
        return aImportance - bImportance;
      }
      if (aImportance !== -1) return -1;
      if (bImportance !== -1) return 1;
      return 0;
    });
    
    // Nhóm thông tin thành các nhóm có ý nghĩa
    const basicInfo = allFields.filter(item => 
      ['ID', 'Họ Tên', 'Email', 'Phone', 'Số Điện Thoại', 'Address', 'Địa Chỉ', 'IdCard', 'CCCD', 'BirthDate', 'Ngày Sinh'].some(
        field => item.label.includes(field)
      )
    );
    
    const dateInfo = allFields.filter(item =>
      ['Ngày Đăng Ký', 'Ngày Tạo', 'Created At', 'Updated At', 'Registration Date'].some(
        field => item.label.includes(field)
      )
    );
    
    const professionalInfo = allFields.filter(item => 
      ['License', 'Bar', 'Law', 'Experience', 'Specialization', 'Bio', 'Certification', 'Chứng Chỉ', 'Luật Sư'].some(
        field => item.label.includes(field)
      )
    );
    
    const statusInfo = allFields.filter(item => 
      ['Status', 'Trạng Thái', 'Role', 'Vai Trò'].some(
        field => item.label.includes(field)
      )
    );
    
    // Các trường còn lại
    const otherInfo = allFields.filter(item => 
      !basicInfo.includes(item) && 
      !professionalInfo.includes(item) && 
      !statusInfo.includes(item) &&
      !dateInfo.includes(item)
    );
    
    return (
      <>
        <Card title="Thông tin cá nhân" style={{ marginBottom: 16 }}>
          {basicInfo.length > 0 ? basicInfo.map(item => (
            <p key={item.key}><strong>{item.label}:</strong> {item.value}</p>
          )) : <p>Không có thông tin cá nhân</p>}
        </Card>
        
        <Card title="Thông tin ngày tháng" style={{ marginBottom: 16 }}>
          {dateInfo.length > 0 ? dateInfo.map(item => (
            <p key={item.key}><strong>{item.label}:</strong> {item.value}</p>
          )) : <p>Không có thông tin ngày tháng</p>}
        </Card>
        
        <Card title="Thông tin nghề nghiệp" style={{ marginBottom: 16 }}>
          {professionalInfo.length > 0 ? professionalInfo.map(item => (
            <p key={item.key}><strong>{item.label}:</strong> {item.value}</p>
          )) : <p>Không có thông tin nghề nghiệp</p>}
        </Card>
        
        <Card title="Thông tin trạng thái" style={{ marginBottom: 16 }}>
          {statusInfo.length > 0 ? statusInfo.map(item => (
            <p key={item.key}><strong>{item.label}:</strong> {item.value}</p>
          )) : <p>Không có thông tin trạng thái</p>}
        </Card>
        
        {otherInfo.length > 0 && (
          <Card title="Thông tin khác" style={{ marginBottom: 16 }}>
            {otherInfo.map(item => (
              <p key={item.key}><strong>{item.label}:</strong> {item.value}</p>
            ))}
          </Card>
        )}
        
        <Card title="Chứng chỉ hành nghề">
          {currentApplication.certification ? (
            <Image
              src={currentApplication.certification}
              alt="Chứng chỉ hành nghề"
              style={{ maxWidth: '100%' }}
            />
          ) : (
            <p>Không có ảnh chứng chỉ</p>
          )}
        </Card>
      </>
    );
  };

  // Hàm định dạng ngày tháng cho cột ngày đăng ký trong bảng
  const formatTableDate = (dateStr, record) => {
    if (!dateStr) {
      // Nếu không có ngày đăng ký, kiểm tra các trường thay thế
      const alternativeDate = record.registrationDate || record.registration_date;
      if (alternativeDate) {
        return formatSimpleDate(alternativeDate, record);
      }
      return <span key={`date-${record.key}`}>N/A</span>;
    }
    
    return formatSimpleDate(dateStr, record);
  };
  
  // Hàm định dạng đơn giản cho ngày tháng
  const formatSimpleDate = (dateStr, record) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.log(`Invalid date: ${dateStr}`);
        return <span key={`date-${record.key}`}>{dateStr}</span>;
      }
      
      return <span key={`date-${record.key}`}>
        {date.toLocaleDateString('vi-VN')}
      </span>;
    } catch (e) {
      console.error(`Error formatting date ${dateStr}:`, e);
      return <span key={`date-${record.key}`}>{dateStr}</span>;
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      render: (text, record) => {
        // Tìm ID từ nhiều nơi có thể
        const id = text || record._id || record.userId || record.lawyer_id || 
                 (record.user && (record.user.id || record.user._id));
        return id || 'N/A';
      }
    },
    {
      title: 'Họ tên',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (text, record) => {
        // Tìm họ tên từ nhiều nơi có thể
        const name = text || record.full_name || record.name || 
                   (record.user && (record.user.fullName || record.user.full_name || record.user.name));
        return name || 'N/A';
      }
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text) => text || 'N/A'
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      render: (text) => text || 'N/A'
    },
    {
      title: 'Ngày đăng ký',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text, record) => formatTableDate(text, record),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: renderStatus,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: renderActions,
    },
  ];

  // Tạo mảng footer buttons với key rõ ràng
  const modalFooterButtons = [
    <Button key="close-btn" onClick={() => setViewModalVisible(false)}>
      Đóng
    </Button>,
    <Button 
      key="reject-btn" 
      danger 
      onClick={() => currentApplication && showRejectConfirm(currentApplication.lawyer_id)}
    >
      Từ chối
    </Button>,
    <Button 
      key="approve-btn" 
      type="primary" 
      onClick={() => currentApplication && showApproveConfirm(currentApplication.lawyer_id)}
    >
      Phê duyệt
    </Button>,
  ];

  return (
    <div className={classes.usersManager}>
      <Card 
        title={<Title level={4}>Quản lý đơn đăng ký luật sư</Title>}
        extra={
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={() => fetchApplications()}
            loading={loading}
          >
            Làm mới
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={applications}
          rowKey="key"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {currentApplication && (
        <Modal
          title="Chi tiết đơn đăng ký"
          open={viewModalVisible}
          onCancel={() => setViewModalVisible(false)}
          footer={modalFooterButtons}
          width={800}
        >
          <div className={classes.applicationDetails}>
            {renderAllFields()}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LawyerApplicationsManager; 