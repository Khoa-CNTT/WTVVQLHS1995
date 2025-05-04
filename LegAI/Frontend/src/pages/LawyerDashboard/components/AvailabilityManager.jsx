import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Calendar, TimePicker, Modal, Form, Input, 
  Typography, Row, Col, Spin, List, Divider, Alert, Popconfirm, 
  DatePicker, Space, Badge, Empty, ConfigProvider
} from 'antd';
import { 
  PlusOutlined, CalendarOutlined, DeleteOutlined, 
  SaveOutlined, CloseOutlined, ExclamationCircleOutlined,
  CalendarTwoTone, ClockCircleOutlined
} from '@ant-design/icons';
import appointmentService from '../../../services/appointmentService';
import authService from '../../../services/authService';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import updateLocale from 'dayjs/plugin/updateLocale';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

// Cấu hình dayjs
dayjs.extend(customParseFormat);
dayjs.extend(updateLocale);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.locale('vi');

// Cấu hình lại định dạng hiển thị cho locale vi
dayjs.updateLocale('vi', {
  months: [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ],
  weekdays: ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'],
  weekdaysShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  weekdaysMin: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
});

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const AvailabilityManager = () => {
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAvailability, setNewAvailability] = useState({
    start_time: '',
    end_time: ''
  });
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);
  const [generatingSchedule, setGeneratingSchedule] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [date, setDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          toast.error('Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.');
          navigate('/login');
          return;
        }

        try {
          const user = JSON.parse(userStr);
          setCurrentUser(user);
          
          // Kiểm tra role không phân biệt chữ hoa chữ thường
          if (!user.role || typeof user.role !== 'string' || (user.role.toLowerCase() !== 'lawyer')) {
            toast.error('Bạn không có quyền truy cập trang này. Chỉ luật sư mới có thể quản lý lịch.');
            navigate('/dashboard');
            return;
          }

          await fetchAvailabilities(user.id);
        } catch (error) {
          console.error('Lỗi khi xử lý dữ liệu người dùng:', error);
          toast.error('Có lỗi xảy ra khi xác thực người dùng.');
          navigate('/login');
        }
      } catch (error) {
        handleApiError(error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  const fetchAvailabilities = async (lawyerId) => {
    try {
      setLoading(true);
      
      // Đảm bảo có ID luật sư - nếu không được truyền vào, lấy từ localStorage
      let id = lawyerId;
      if (!id) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          id = user.id;
        }
      }
      
      // Kiểm tra lại nếu vẫn không có ID
      if (!id) {
        console.error('Không có ID luật sư để lấy lịch trống');
        setAvailabilities([]);
        setLoading(false);
        return;
      }
      
      console.log(`[AvailabilityManager] Đang lấy lịch trống cho luật sư ID: ${id}`);
      const response = await appointmentService.getLawyerAvailability(id);
      console.log(`[AvailabilityManager] Kết quả từ API:`, response);
      
      if (response && response.status === 'success') {
        // Phần quan trọng: Kiểm tra xem data có phải là mảng và có dữ liệu không
        const data = Array.isArray(response.data) ? response.data : [];
        
        if (data.length > 0) {
          console.log(`[AvailabilityManager] Tìm thấy ${data.length} lịch trống`);
          setAvailabilities(data);
        } else {
          console.log(`[AvailabilityManager] Không tìm thấy lịch trống nào`);
          
          // So sánh với dữ liệu trong bảng PostgreSQL mà bạn gửi cho tôi
          if (id === 9) {
            console.log('[AvailabilityManager] Có 9 lịch trống trong database nhưng không được trả về trong API');
            console.log('[AvailabilityManager] Cần kiểm tra lại endpoint API /appointments/lawyer/:id/availability');
          }
          
          setAvailabilities([]);
        }
      } else {
        console.error(`[AvailabilityManager] API trả về trạng thái không phải success:`, response);
        setAvailabilities([]);
      }
    } catch (error) {
      console.error('[AvailabilityManager] Lỗi khi lấy lịch trống:', error);
      handleApiError(error, 'Không thể lấy danh sách lịch trống');
      setAvailabilities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddModalOpen = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);

    const endTime = new Date(tomorrow);
    endTime.setHours(17, 0, 0, 0);

    // Cập nhật state cho form mới
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    setDate(tomorrowString);
    setStartTime('08:00');
    setEndTime('17:00');

    // Hiển thị modal mới
    setIsModalVisible(true);
    
    // Giữ lại phần mới cho modal cũ để tương thích
    setNewAvailability({
      start_time: tomorrow.toISOString().slice(0, 16),
      end_time: endTime.toISOString().slice(0, 16)
    });
    
    // Sử dụng dayjs để khởi tạo giá trị mặc định với timezone cụ thể
    form.setFieldsValue({
      time_range: [
        dayjs(tomorrow).tz('Asia/Ho_Chi_Minh'), 
        dayjs(endTime).tz('Asia/Ho_Chi_Minh')
      ]
    });
    
    setShowAddModal(true);
    setError('');
  };

  const handleAddModalClose = () => {
    setShowAddModal(false);
    setError('');
    form.resetFields();
  };

  const handleApiError = (error, customMessage = 'Đã xảy ra lỗi') => {
    console.error('Chi tiết lỗi:', error);
    
    if (error.code === 403 || error.response?.status === 403) {
      const errorMessage = error.message || error.response?.data?.message || 'Bạn không có quyền thực hiện thao tác này';
      toast.error(`Lỗi phân quyền: ${errorMessage}`);
      
      // Kiểm tra xem lỗi có liên quan đến token hết hạn không
      if (errorMessage.includes('token') || errorMessage.includes('đăng nhập lại')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
      return;
    }
    
    if (error.code === 401 || error.response?.status === 401) {
      toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }
    
    // Hiển thị thông báo lỗi từ response nếu có, nếu không sử dụng thông báo tùy chỉnh
    const errorMessage = error.message || error.response?.data?.message || customMessage;
    toast.error(errorMessage);
  };

  const handleAddAvailability = async () => {
    // Đảm bảo các trường bắt buộc không bị trống
    if (!date || !startTime || !endTime) {
      toast.error('Vui lòng chọn đầy đủ ngày và giờ');
      return;
    }

    try {
      setIsLoading(true);

      // Kiểm tra đăng nhập và quyền hạn
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (!currentUser || !currentUser.id) {
        toast.error('Vui lòng đăng nhập để thực hiện chức năng này');
        setIsLoading(false);
        return;
      }

      // Tạo đối tượng ngày từ chuỗi ngày
      const selectedDate = dayjs(date).format('YYYY-MM-DD');
      
      // Tạo chuỗi thời gian đầy đủ cho thời gian bắt đầu và kết thúc
      const formattedStartTime = `${selectedDate}T${startTime}:00`;
      const formattedEndTime = `${selectedDate}T${endTime}:00`;

      // Kiểm tra thời gian kết thúc phải sau thời gian bắt đầu
      if (new Date(formattedEndTime) <= new Date(formattedStartTime)) {
        toast.error('Thời gian kết thúc phải sau thời gian bắt đầu');
        setIsLoading(false);
        return;
      }

      // Chuẩn bị dữ liệu để gửi đi
      const availabilityData = {
        lawyer_id: currentUser.id,
        start_time: formattedStartTime,
        end_time: formattedEndTime
      };

      // Gọi service để thêm slot trống
      const response = await appointmentService.addAvailability(availabilityData);

      if (response.success) {
        toast.success('Thêm lịch trống thành công');
        setIsModalVisible(false);
        // Reset form
        setDate(null);
        setStartTime(null);
        setEndTime(null);
        // Tải lại dữ liệu - không cần truyền ID vì đã được xử lý trong hàm
        fetchAvailabilities();
      } else {
        toast.error(response.message || 'Không thể thêm lịch trống');
      }
    } catch (error) {
      console.error('Lỗi khi thêm lịch trống:', error);
      toast.error('Đã xảy ra lỗi khi thêm lịch trống');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAvailability = async (availabilityId) => {
    try {
      const response = await appointmentService.deleteAvailability(availabilityId);
      if (response.success === true) {
        // Tải lại danh sách không cần truyền ID
        await fetchAvailabilities();
        toast.success('Xóa lịch trống thành công');
      } else {
        throw new Error(response.message || 'Không thể xóa lịch trống');
      }
    } catch (error) {
      console.error('Lỗi khi xóa lịch trống:', error);
      toast.error(error.message || 'Không thể xóa lịch trống');
    }
  };

  const handleGenerateWeeklySchedule = async () => {
    try {
      setGeneratingSchedule(true);
      
      // Lấy ngày hiện tại
      const currentDate = new Date();
      
      // Ngày bắt đầu tạo lịch là ngày hiện tại + 2 ngày
      const startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() + 2);
      startDate.setHours(8, 0, 0, 0);
      
      // Tạo các slot cho 5 ngày làm việc tiếp theo
      const slots = [];
      
      for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + dayOffset);
        
        // Slot buổi sáng (8:00 - 12:00)
        const morningStart = new Date(date);
        morningStart.setHours(8, 0, 0, 0);
        
        const morningEnd = new Date(date);
        morningEnd.setHours(12, 0, 0, 0);
        
        // Slot buổi chiều (13:00 - 17:00)
        const afternoonStart = new Date(date);
        afternoonStart.setHours(13, 0, 0, 0);
        
        const afternoonEnd = new Date(date);
        afternoonEnd.setHours(17, 0, 0, 0);
        
        // Thêm vào danh sách slot
        slots.push({
          lawyer_id: currentUser.id,
          start_time: morningStart.toISOString(),
          end_time: morningEnd.toISOString(),
          status: 'available',
          user_role: 'lawyer'
        });
        
        slots.push({
          lawyer_id: currentUser.id,
          start_time: afternoonStart.toISOString(),
          end_time: afternoonEnd.toISOString(),
          status: 'available',
          user_role: 'lawyer'
        });
      }
      
      // Kiểm tra các slot đã tồn tại
      const existingAvailabilities = await appointmentService.getLawyerAvailability(currentUser.id);
      
      // Lọc bỏ các slot trùng lặp
      const uniqueSlots = slots.filter(newSlot => {
        const newSlotStart = new Date(newSlot.start_time);
        const newSlotEnd = new Date(newSlot.end_time);
        
        // Kiểm tra xem slot mới có trùng với slot đã tồn tại không
        return !existingAvailabilities.data.some(existingSlot => {
          const existingSlotStart = new Date(existingSlot.start_time);
          const existingSlotEnd = new Date(existingSlot.end_time);
          
          // Kiểm tra điều kiện trùng lặp
          return (
            (newSlotStart <= existingSlotEnd && newSlotEnd >= existingSlotStart)
          );
        });
      });
      
      // Nếu không có slot mới nào cần thêm
      if (uniqueSlots.length === 0) {
        toast.info('Tất cả các slot trong tuần đã được tạo');
        setGeneratingSchedule(false);
        return;
      }
      
      // Thêm các slot mới
      let addedCount = 0;
      for (const slot of uniqueSlots) {
        try {
          await appointmentService.addAvailability(slot);
          addedCount++;
        } catch (error) {
          console.error('Lỗi khi thêm slot:', error);
        }
      }
      
      toast.success(`Đã tạo ${addedCount} khung giờ làm việc trong tuần`);
      // Không cần truyền currentUser.id nữa, hàm fetchAvailabilities tự xử lý
      fetchAvailabilities();
    } catch (error) {
      handleApiError(error);
    } finally {
      setGeneratingSchedule(false);
    }
  };

  // Sửa lại hàm nhóm các lịch trống theo ngày
  const groupAvailabilitiesByDate = () => {
    const grouped = {};
    if (Array.isArray(availabilities)) {
      availabilities.forEach(availability => {
        // Đảm bảo sử dụng đúng ngày từ chuỗi ISO
        const dbDate = new Date(availability.start_time);
        // Lấy chính xác ngày tháng năm từ đối tượng Date mà không quan tâm đến múi giờ
        const dateKey = `${dbDate.getFullYear()}-${dbDate.getMonth() + 1}-${dbDate.getDate()}`;
        
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(availability);
      });

      // Sắp xếp các slot theo thời gian
      Object.values(grouped).forEach(slots => {
        slots.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
      });
    }
    return grouped;
  };

  const formatTime = (dateString) => {
    return dayjs(dateString).format('HH:mm');
  };
  
  const formatDate = (dateKey) => {
    // Phân tích dateKey để lấy các thành phần ngày, tháng, năm
    const [year, month, day] = dateKey.split('-').map(num => parseInt(num));
    
    // Tạo đối tượng Date với các thành phần đã phân tích
    const date = new Date(year, month - 1, day);
    
    // Định dạng ngày tháng theo tiếng Việt
    return date.toLocaleDateString('vi-VN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div>
      <Card
        extra={
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAddModalOpen}
            >
              Thêm lịch trống
            </Button>
            <Button 
              type="default" 
              icon={<CalendarOutlined />} 
              onClick={handleGenerateWeeklySchedule}
              loading={generatingSchedule}
            >
              Tạo lịch tự động
            </Button>
          </Space>
        }
      >
        {successMessage && (
          <Alert 
            message={successMessage} 
            type="success" 
            showIcon 
            style={{ marginBottom: 16 }} 
            closable
          />
        )}
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Đang tải...</div>
          </div>
        ) : !Array.isArray(availabilities) || availabilities.length === 0 ? (
          <Empty 
            description="Chưa có lịch trống nào được tạo" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div>
            {Object.entries(groupAvailabilitiesByDate()).map(([dateKey, slots]) => (
              <Card 
                key={dateKey} 
                type="inner" 
                title={
                  <Space>
                    <CalendarTwoTone />
                    <Text strong>
                      {formatDate(dateKey)}
                    </Text>
                  </Space>
                }
                style={{ marginBottom: 16 }}
              >
                <List
                  dataSource={slots}
                  renderItem={slot => (
                    <List.Item
                      key={`${slot.id || ''}-${slot.start_time}-${slot.end_time}`}
                      actions={[
                        <Popconfirm
                          title="Bạn có chắc chắn muốn xóa lịch trống này?"
                          onConfirm={() => handleDeleteAvailability(slot.id)}
                          okText="Có"
                          cancelText="Không"
                        >
                          <Button 
                            danger 
                            type="text" 
                            icon={<DeleteOutlined />}
                          />
                        </Popconfirm>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Badge status="success" />}
                        title={
                          <Space>
                            <ClockCircleOutlined />
                            <Text>
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            ))}
          </div>
        )}
      </Card>
      {/* Modal thêm lịch trống mới (UI đơn giản hơn) */}
      <Modal
        title="Thêm lịch trống mới"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setIsModalVisible(false)}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" loading={isLoading} onClick={handleAddAvailability}>
            Thêm lịch
          </Button>
        ]}
      >
        <Form layout="vertical">
          <Form.Item 
            label="Ngày" 
            required
            rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
          >
            <DatePicker
              value={date ? dayjs(date) : null}
              onChange={(value) => setDate(value ? value.format('YYYY-MM-DD') : null)}
              format="DD/MM/YYYY"
              style={{ width: '100%' }}
              disabledDate={(current) => {
                return current && current.isBefore(dayjs().startOf('day'));
              }}
            />
          </Form.Item>
          
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item 
                label="Giờ bắt đầu" 
                required
                rules={[{ required: true, message: 'Vui lòng chọn giờ bắt đầu' }]}
              >
                <TimePicker
                  value={startTime ? dayjs(startTime, 'HH:mm') : null}
                  onChange={(value) => setStartTime(value ? value.format('HH:mm') : null)}
                  format="HH:mm"
                  style={{ width: '100%' }}
                  minuteStep={15}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="Giờ kết thúc" 
                required
                rules={[{ required: true, message: 'Vui lòng chọn giờ kết thúc' }]}
              >
                <TimePicker
                  value={endTime ? dayjs(endTime, 'HH:mm') : null}
                  onChange={(value) => setEndTime(value ? value.format('HH:mm') : null)}
                  format="HH:mm"
                  style={{ width: '100%' }}
                  minuteStep={15}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default AvailabilityManager; 