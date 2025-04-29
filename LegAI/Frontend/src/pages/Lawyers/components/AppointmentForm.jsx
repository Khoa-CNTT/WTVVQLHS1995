import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Modal, Button, Form, Input, Radio, Space, Alert, Spin, Typography,
  Card, List, Badge, Divider, Row, Col, Empty
} from 'antd';
import { 
  CloseOutlined, ExclamationCircleOutlined, 
  LoginOutlined, ClockCircleOutlined,
  CalendarOutlined, CheckOutlined, LoadingOutlined
} from '@ant-design/icons';
import appointmentService from '../../../services/appointmentService';
import authService from '../../../services/authService';
import { toast } from 'react-toastify';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const AppointmentForm = ({ lawyer, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [formData, setFormData] = useState({
    start_time: '',
    end_time: '',
    purpose: '',
    notes: ''
  });

  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateSelected, setDateSelected] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Định nghĩa hàm fetchAvailability trước useEffect
  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (!lawyer || !lawyer.id) {
        console.error('ID luật sư không tồn tại:', lawyer);
        setError('Không thể lấy lịch khả dụng - ID luật sư không hợp lệ');
        setAvailabilitySlots([]);
        setLoading(false);
        return;
      }

      // Lấy khung giờ từ API
      const result = await appointmentService.getLawyerAvailability(lawyer.id);

      if (result && result.status === 'success' && Array.isArray(result.data)) {
        // Trước khi cập nhật state, xử lý dữ liệu để đánh dấu slot đã chọn nếu có
        const processedSlots = result.data.map(slot => {
          // Kiểm tra slot đã được đặt hay chưa
          const isBooked = slot.status === 'booked';
          // Kiểm tra xem có phải slot đang chọn không
          const isSelected = selectedSlot && 
            slot.start_time === selectedSlot.start_time && 
            slot.end_time === selectedSlot.end_time;

          return {
            ...slot,
            isBooked,
            isSelected
          };
        });

        setAvailabilitySlots(processedSlots);
      } else {
        // Xử lý trường hợp API trả về lỗi hoặc không có dữ liệu
        const errorMessage = (result && result.message) ? result.message : 'Không thể lấy lịch làm việc';
        console.error('Lỗi khi lấy lịch:', errorMessage);
        setError(errorMessage);
        toast.error(errorMessage);
        setAvailabilitySlots([]);
      }
    } catch (error) {
      console.error('Lỗi khi lấy lịch khả dụng:', error);
      const errorMessage = error.message || 'Không thể lấy lịch khả dụng';
      setError(errorMessage);
      toast.info(errorMessage);
      setAvailabilitySlots([]);
    } finally {
      setLoading(false);
    }
  }, [lawyer, selectedSlot]);

  useEffect(() => {
    // Lấy thông tin người dùng đăng nhập
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    
    // Chỉ fetch lịch trống khi có ID của luật sư
    if (lawyer && lawyer.id) {
      fetchAvailability();
    } else {
      console.log('Không thể lấy lịch trống - thiếu ID luật sư');
    }
  }, [lawyer, fetchAvailability]);

  const handleDateSelection = (date) => {
    setSelectedDate(date);
    setDateSelected(true);
    setSelectedSlot(null);
  };

  const handleSlotSelection = (slot) => {
    // Kiểm tra xem slot có bị đánh dấu là không thể đặt không
    if (slot.isBooked) {
      toast.error('Khung giờ này đã được đặt bởi người khác');
      return;
    }
    
    // Kiểm tra slot có trạng thái 'booked' không
    if (slot.status === 'booked') {
      toast.error('Khung giờ này đã được đặt');
      return;
    }
    
    // Kiểm tra thời gian đã qua
    const now = new Date();
    const slotStart = new Date(slot.start_time);
    if (slotStart < now) {
      toast.error('Không thể đặt lịch cho thời gian đã qua');
      return;
    }
    
    setSelectedSlot(slot);
    setFormData({
      ...formData,
      start_time: slot.start_time,
      end_time: slot.end_time
    });
    
    form.setFieldsValue({
      purpose: formData.purpose
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const extractErrorMessage = (error) => {
    if (typeof error === 'string' && error.includes('Error:')) {
      const match = error.match(/Error: (.*?)<br>/);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    if (error.message) {
      return error.message;
    }
    
    return 'Không thể đặt lịch hẹn. Vui lòng thử lại sau.';
  };

  const handleSubmit = async (values) => {
    if (!currentUser) {
      setError('Vui lòng đăng nhập để đặt lịch');
      toast.error('Vui lòng đăng nhập để đặt lịch');
      return;
    }
    
    if (!selectedSlot) {
      setError('Vui lòng chọn thời gian cho cuộc hẹn');
      toast.error('Vui lòng chọn thời gian cho cuộc hẹn');
      return;
    }

    // Kiểm tra lại một lần nữa về trạng thái slot
    if (isSlotDisabled(selectedSlot)) {
      setError('Khung giờ này đã được đặt');
      toast.error('Khung giờ này đã được đặt');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Tạo đối tượng Date từ chuỗi thời gian đã chọn
      const startTimeDate = new Date(selectedSlot.start_time); 
      const endTimeDate = new Date(selectedSlot.end_time);
      
      // Đảm bảo sử dụng múi giờ của Việt Nam khi gửi dữ liệu
      const appointmentData = {
        lawyer_id: lawyer.id,
        customer_id: currentUser.id,
        start_time: startTimeDate.toISOString(),
        end_time: endTimeDate.toISOString(),
        purpose: values.purpose.trim(),
        status: 'pending'
      };
      
      const response = await appointmentService.createAppointment(appointmentData);
      
      // Kiểm tra response có đúng định dạng không
      if (response && response.status === 'success') {
        toast.success('Đặt lịch hẹn thành công');
        if (onSuccess && response.data) {
          onSuccess(response.data);
        }
        onClose();
      } else {
        // Đảm bảo luôn có thông báo lỗi
        const errorMessage = response && response.message 
          ? response.message 
          : 'Không thể đặt lịch hẹn';
        
        // Xử lý các lỗi cụ thể để hiển thị thông báo phù hợp
        if (errorMessage.includes('Luật sư không có sẵn trong khoảng thời gian đã chọn')) {
          setError('Luật sư không khả dụng trong khung giờ này. Vui lòng chọn thời gian khác.');
          toast.error('Luật sư không khả dụng trong khung giờ này. Vui lòng chọn thời gian khác.');
          
          // Làm mới lại danh sách slot để cập nhật trạng thái
          await fetchAvailability();
        } else if (errorMessage.includes('trùng') || 
            errorMessage.includes('đã đặt') || 
            errorMessage.includes('đã có người đặt') || 
            errorMessage.includes('không có sẵn')) {
          // Lỗi lịch trùng - cần làm mới danh sách slot để cập nhật
          setError('Khung giờ này đã được đặt bởi người khác. Vui lòng chọn thời gian khác.');
          toast.error('Khung giờ này đã được đặt. Vui lòng chọn thời gian khác.');
          
          // Làm mới lại danh sách slot
          await fetchAvailability();
        } else {
          // Lỗi khác
          setError(errorMessage);
          toast.info(errorMessage);
        }
      }
    } catch (error) {
      console.error('Lỗi khi đặt lịch hẹn:', error);
      const errorMsg = extractErrorMessage(error);
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Nhóm các slot theo ngày
  const groupSlotsByDate = () => {
    const grouped = {};
    availabilitySlots.forEach(slot => {
      const date = new Date(slot.start_time).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(slot);
    });
    return grouped;
  };

  const groupedSlots = groupSlotsByDate();
  const availableDates = Object.keys(groupedSlots);

  // Kiểm tra slot có thể đặt được không (dùng cho disabled attribute)
  const isSlotDisabled = (slot) => {
    // Slot đã được đặt trước thì không thể chọn
    if (slot.status === 'booked' || slot.isBooked) {
      return true;
    }
    
    // Thời gian đã qua thì không thể chọn
    const now = new Date();
    const slotStart = new Date(slot.start_time);
    
    if (slotStart < now) {
      return true;
    }
    
    // Mặc định, các slot khả dụng có thể chọn
    return false;
  };

  // Kiểm tra người dùng đã đăng nhập chưa
  const isLoggedIn = authService.isAuthenticated();

  const formatTime = (dateString) => {
    return moment(dateString).format('HH:mm');
  };

  return (
    <Modal
      title={`Đặt lịch hẹn :`}
      visible={true}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnClose
    >
      {!isLoggedIn ? (
        <div style={{ textAlign: 'center', padding: '30px 0' }}>
          <ExclamationCircleOutlined style={{ fontSize: 40, color: '#ff4d4f', marginBottom: 16 }} />
          <Title level={4}>Vui lòng đăng nhập để đặt lịch hẹn</Title>
          <Button 
            type="primary" 
            icon={<LoginOutlined />} 
            href="/login"
            style={{ marginTop: 16 }}
          >
            Đăng nhập
          </Button>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 40 }} spin />} />
          <div style={{ marginTop: 16 }}>Đang tải...</div>
        </div>
      ) : error ? (
        <Alert
          message="Thành công"
          description={error}
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      ) : availableDates.length === 0 ? (
        <Empty 
          description="Hiện tại luật sư chưa có lịch trống nào" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleSubmit}
          initialValues={{ purpose: formData.purpose }}
        >
          <Title level={5}>Chọn ngày:</Title>
          <div style={{ marginBottom: 16 }}>
            <Radio.Group 
              onChange={(e) => handleDateSelection(e.target.value)}
              value={selectedDate}
              buttonStyle="solid"
            >
              <Space wrap>
                {availableDates.map(date => (
                  <Radio.Button key={date} value={date}>
                    {new Date(date).toLocaleDateString('vi-VN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'numeric'
                    })}
                  </Radio.Button>
                ))}
              </Space>
            </Radio.Group>
          </div>

          {selectedDate && (
            <>
              <Title level={5}>Chọn giờ:</Title>
              <div style={{ marginBottom: 16 }}>
                <Space wrap>
                  {groupedSlots[selectedDate].map(slot => {
                    const isDisabled = isSlotDisabled(slot);
                    const isSelectedSlot = selectedSlot && selectedSlot.id === slot.id;
                    
                    return (
                      <Button
                        key={`${slot.id}-${slot.start_time}`}
                        type={isSelectedSlot ? "primary" : "default"}
                        onClick={() => handleSlotSelection(slot)}
                        disabled={isDisabled}
                        icon={<ClockCircleOutlined />}
                        style={{ 
                          margin: '0 8px 8px 0',
                          opacity: isDisabled ? 0.5 : 1
                        }}
                      >
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        {isDisabled && " (Đã đặt)"}
                      </Button>
                    );
                  })}
                </Space>
              </div>
            </>
          )}

          <Form.Item
            name="purpose"
            label="Mục đích tư vấn:"
            rules={[
              { required: true, message: 'Vui lòng nhập mục đích tư vấn' }
            ]}
          >
            <TextArea
              placeholder="Nhập mục đích tư vấn của bạn..."
              autoSize={{ minRows: 4, maxRows: 8 }}
              onChange={(e) => handleChange({ target: { name: 'purpose', value: e.target.value } })}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Button 
                block 
                onClick={onClose}
                icon={<CloseOutlined />}
              >
                Hủy
              </Button>
            </Col>
            <Col span={12}>
              <Button
                type="primary"
                htmlType="submit"
                block
                disabled={!selectedSlot || loading}
                icon={loading ? <LoadingOutlined /> : <CheckOutlined />}
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận'}
              </Button>
            </Col>
          </Row>
        </Form>
      )}
    </Modal>
  );
};

export default AppointmentForm; 