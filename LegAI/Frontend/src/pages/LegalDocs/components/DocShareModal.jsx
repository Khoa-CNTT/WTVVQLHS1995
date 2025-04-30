import { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  List,
  Avatar,
  Space,
  Tooltip,
  message,
  Popconfirm,
  Typography,
  Divider,
  Tag
} from 'antd';
import {
  ShareAltOutlined,
  CloseOutlined,
  LoadingOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FileImageOutlined,
  FileTextOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import * as legalDocService from '../../../services/legalDocService';
import userService from '../../../services/userService';

const { Title, Text } = Typography;
const { Option } = Select;

const DocShareModal = ({ doc, onClose, onSuccess, visible = true }) => {
  const [form] = Form.useForm();
  const [isSharing, setIsSharing] = useState(false);
  const [sharedWith, setSharedWith] = useState(doc.shared_with || []);

  // Xử lý chia sẻ tài liệu
  const handleShare = async (values) => {
    const { email, permissions } = values;

    if (!email) {
      message.error('Vui lòng nhập email người nhận');
      return;
    }

    setIsSharing(true);
    try {
      // LẤY NGƯỜI DÙNG THEO EMAIL BẰNG SERVICE
      let userId = null;
      let userData = null;

      try {
        // Sử dụng service để tìm người dùng theo email
        const findUserResult = await userService.findUserByEmail(email);

        if (findUserResult && findUserResult.success && findUserResult.data) {
          userId = findUserResult.data.id;
          userData = findUserResult.data;

          // Kiểm tra ID người dùng là số hợp lệ
          if (!userId || isNaN(parseInt(userId))) {
            message.error('ID người dùng không hợp lệ. Vui lòng thử lại với email khác.');
            setIsSharing(false);
            return;
          }
        } else {
          const errorMessage = findUserResult?.message || 'Không tìm thấy người dùng với email này';
          message.error(errorMessage);
          setIsSharing(false);
          return;
        }
      } catch (findError) {
        console.error('Lỗi khi tìm kiếm người dùng theo email:', findError);

        // Hiển thị thông báo mô tả chi tiết hơn
        if (findError.response) {
          message.error(`Lỗi tìm kiếm người dùng: ${findError.response.status} - ${findError.response.statusText}`);
        } else {
          message.error('Không thể tìm thấy người dùng. Vui lòng thử lại sau.');
        }

        setIsSharing(false);
        return;
      }

      // Hiển thị thông báo khi tìm thấy người dùng
      message.info(`Đang chia sẻ tài liệu với ${userData.full_name || userData.username || email}...`);

      // Chuyển đổi quyền thành mảng đúng định dạng API
      let permissionArray = [];
      if (permissions === 'view') permissionArray = ['read'];
      else if (permissions === 'edit') permissionArray = ['read', 'edit'];
      else if (permissions === 'full') permissionArray = ['read', 'edit', 'delete'];

      // DEBUG
      console.log('Loại quyền từ UI:', permissions);
      console.log('Chuyển đổi thành mảng quyền:', permissionArray);

      try {
        // Chuyển đổi trực tiếp các quyền trong request
        const directShareData = {
          shared_with: parseInt(userId),
          permission: permissionArray.length === 1 && permissionArray[0] === 'read' ? 'read' :
            permissionArray.includes('edit') && !permissionArray.includes('delete') ? 'edit' :
              permissionArray.includes('delete') ? 'delete' : 'read',
          permissions: permissionArray
        };

        console.log('Dữ liệu gửi đi API chia sẻ:', directShareData);

        // Sử dụng cấu trúc quyền mới
        const response = await legalDocService.shareLegalDoc(doc.id, directShareData);

        if (response && response.success) {
          form.resetFields();

          // Cập nhật danh sách người được chia sẻ
          if (response.data && response.data.shared_with) {
            setSharedWith(response.data.shared_with);
          } else {
            // Nếu API không trả về danh sách cập nhật, thêm vào danh sách hiện tại
            const newSharedUser = {
              id: userId,
              email: email,
              username: userData?.username || email.split('@')[0],
              permissions: permissionArray,
              shared_at: new Date().toISOString()
            };
            setSharedWith([...sharedWith, newSharedUser]);
          }

          message.success('Đã chia sẻ tài liệu thành công');

          if (onSuccess) {
            onSuccess();
          }
        } else {
          message.error(response?.message || 'Không thể chia sẻ tài liệu');
        }
      } catch (shareError) {
        console.error("Lỗi khi chia sẻ tài liệu:", shareError);
        if (shareError.response) {
          message.error(`Lỗi khi chia sẻ: ${shareError.response.status} - ${shareError.response.data?.message || 'Người dùng không tồn tại hoặc đã bị xóa'}`);
        } else {
          message.error('Có lỗi xảy ra khi chia sẻ tài liệu');
        }
      }
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Có lỗi xảy ra khi chia sẻ tài liệu');
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Xử lý hủy chia sẻ
  const handleUnshare = async (userId) => {
    try {
      const response = await legalDocService.unshareLegalDoc(doc.id, userId);

      if (response.success) {
        message.success('Đã hủy chia sẻ tài liệu');

        // Xóa người dùng khỏi danh sách
        const newSharedWith = sharedWith.filter(user => user.id !== userId);
        setSharedWith(newSharedWith);

        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        message.error(response.message || 'Không thể hủy chia sẻ tài liệu');
      }
    } catch (error) {
      console.error(error);
      message.error('Có lỗi xảy ra khi hủy chia sẻ tài liệu');
    }
  };

  // Format ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return 'Không giới hạn';

    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  // Lấy tên quyền hạn
  const getPermissionName = (permissions) => {
    // Nếu permissions là mảng (từ API)
    if (Array.isArray(permissions)) {
      if (permissions.includes('delete')) return 'Toàn quyền';
      if (permissions.includes('edit')) return 'Chỉnh sửa';
      if (permissions.includes('read')) return 'Xem';
      return 'Xem';
    }

    // Nếu permissions là chuỗi (từ UI)
    switch (permissions) {
      case 'view':
        return 'Xem';
      case 'edit':
        return 'Chỉnh sửa';
      case 'full':
        return 'Toàn quyền';
      default:
        return 'Xem';
    }
  };

  // Xác định icon dựa trên loại file
  const getFileIcon = (fileType) => {
    const type = fileType ? fileType.toLowerCase() : '';

    switch (type) {
      case 'pdf':
        return <FilePdfOutlined />;
      case 'docx':
      case 'doc':
        return <FileWordOutlined />;
      case 'xlsx':
      case 'xls':
        return <FileExcelOutlined />;
      case 'pptx':
      case 'ppt':
        return <FilePptOutlined />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImageOutlined />;
      case 'txt':
      default:
        return <FileTextOutlined />;
    }
  };

  // Lấy màu cho tag quyền
  const getPermissionTagColor = (permissions) => {
    // Nếu permissions là mảng (từ API)
    if (Array.isArray(permissions)) {
      if (permissions.includes('delete')) return 'red';
      if (permissions.includes('edit')) return 'blue';
      if (permissions.includes('read')) return 'green';
      return 'green';
    }

    // Nếu permissions là chuỗi (từ UI)
    switch (permissions) {
      case 'view':
        return 'green';
      case 'edit':
        return 'blue';
      case 'full':
        return 'red';
      default:
        return 'green';
    }
  };

  return (
    <Modal
      title="Chia sẻ hồ sơ pháp lý"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>
      ]}
      width={600}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* Document Info */}
        <Space align="center">
          {getFileIcon(doc.file_type)}
          <Title level={4} style={{ margin: 0 }}>{doc.title}</Title>
          {doc.category && <Tag color="blue">{doc.category}</Tag>}
        </Space>

        <Divider />

        {/* Share Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleShare}
          initialValues={{ permissions: 'view' }}
          style={{ display: 'flex', flexDirection: 'column', width: '100%' }}
        >
          <div style={{ display: 'flex', flexDirection: 'row', gap: 10,width: '100%' }}>
            <Form.Item
              name="email"
              label="Email người nhận"
              rules={[
                { required: true, message: 'Vui lòng nhập email người nhận' },
                { type: 'email', message: 'Email không hợp lệ' }
              ]}
              style={{ flex: '3' }}
            >
              <Input placeholder="Nhập email người nhận" />
            </Form.Item>

            <Form.Item
              name="permissions"
              label="Quyền hạn"
              style={{ flex: '1' }}
            >
              <Select>
                <Option value="view">Chỉ xem</Option>
                <Option value="edit">Chỉnh sửa</Option>
                <Option value="full">Toàn quyền</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item style={{ width: '100%' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSharing}
              icon={<ShareAltOutlined />}
              block
            >
              Chia sẻ
            </Button>
          </Form.Item>
        </Form>

        {/* Shared List */}
        {sharedWith && sharedWith.length > 0 && (
          <>
            <Divider orientation="left">Đã chia sẻ với</Divider>
            <List
              itemLayout="horizontal"
              dataSource={sharedWith}
              renderItem={(user) => (
                <List.Item
                  actions={[
                    <Popconfirm
                      title="Bạn có chắc chắn muốn hủy chia sẻ tài liệu này?"
                      onConfirm={() => handleUnshare(user.id)}
                      okText="Có"
                      cancelText="Không"
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        title="Hủy chia sẻ"
                      />
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar src={user.avatar_url}>
                        {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                      </Avatar>
                    }
                    title={user.name || user.email}
                    description={
                      <Space>
                        <Tag color={getPermissionTagColor(user.permissions)}>
                          {getPermissionName(user.permissions)}
                        </Tag>
                        {user.expiry_date && (
                          <Text type="secondary">
                            Hết hạn: {formatDate(user.expiry_date)}
                          </Text>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </>
        )}
      </Space>
    </Modal>
  );
};

export default DocShareModal;