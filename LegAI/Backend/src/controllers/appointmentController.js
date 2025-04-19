const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const appointmentModel = require('../models/appointmentModel');
const userModel = require('../models/userModel');
const emailService = require('../services/emailService');
const db = require('../config/database');

// @desc    Tạo lịch hẹn mới
// @route   POST /api/appointments
// @access  Private (User)
exports.createAppointment = async (req, res) => {
  const { lawyer_id, start_time, end_time, notes, type, meet_link, purpose } = req.body;
  const customer_id = req.user.id;

  try {
    // Chuyển đổi thời gian từ string sang đối tượng Date
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    // Kiểm tra tính hợp lệ của thời gian
    if (startDate >= endDate) {
      return res.status(400).json({ 
        success: false, 
        message: "Thời gian kết thúc phải sau thời gian bắt đầu" 
      });
    }

    // Kiểm tra thời lượng tối thiểu (ví dụ: 30 phút)
    const minDuration = 30 * 60 * 1000; // 30 phút tính bằng mili giây
    if (endDate - startDate < minDuration) {
      return res.status(400).json({ 
        success: false, 
        message: "Cuộc hẹn phải kéo dài ít nhất 30 phút" 
      });
    }

    // Kiểm tra tính khả dụng của luật sư
    const availability = await appointmentModel.checkLawyerAvailability(
      lawyer_id,
      startDate.toISOString(),
      endDate.toISOString()
    );

    if (!availability.isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Luật sư không có sẵn trong khoảng thời gian đã chọn",
        conflictingAppointments: availability.conflictingAppointments
      });
    }

    // Lấy thông tin luật sư
    const lawyerResult = await db.query(
      'SELECT full_name as name, email FROM Users WHERE id = $1',
      [lawyer_id]
    );
    
    if (lawyerResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy luật sư" });
    }
    
    const lawyer = lawyerResult.rows[0];

    // Lấy thông tin khách hàng
    const customerResult = await db.query(
      'SELECT full_name as name, email FROM Users WHERE id = $1',
      [customer_id]
    );
    
    if (customerResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thông tin khách hàng" });
    }
    
    const customer = customerResult.rows[0];

    // Tạo cuộc hẹn trong database
    const appointment = await appointmentModel.createAppointment({
      customer_id,
      lawyer_id,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      notes,
      type,
      meet_link,
      purpose
    });

    // Gửi email thông báo cho luật sư - bỏ qua nếu có lỗi
    try {
      await emailService.sendAppointmentNotification({
        email: lawyer.email,
        name: lawyer.name,
        role: 'lawyer',
        appointmentId: appointment.id,
        customerName: customer.name,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        notes: notes || '',
        type: type || 'Tư vấn',
        meetLink: meet_link || '',
        purpose: purpose || ''
      });
    } catch (emailError) {
      console.error('Không thể gửi email thông báo cho luật sư:', emailError.message);
      // Bỏ qua lỗi email, không ảnh hưởng đến việc tạo lịch hẹn
    }

    // Gửi email thông báo cho khách hàng - bỏ qua nếu có lỗi
    try {
      await emailService.sendAppointmentNotification({
        email: customer.email,
        name: customer.name,
        role: 'customer',
        appointmentId: appointment.id,
        lawyerName: lawyer.name,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        notes: notes || '',
        type: type || 'Tư vấn',
        meetLink: meet_link || ''
      });
    } catch (emailError) {
      console.error('Không thể gửi email thông báo cho khách hàng:', emailError.message);
      // Bỏ qua lỗi email, không ảnh hưởng đến việc tạo lịch hẹn
    }

    res.status(201).json({
      success: true,
      message: "Đã tạo cuộc hẹn thành công",
      data: appointment,
      availabilityInfo: availability
    });
  } catch (err) {
    console.error(`Lỗi khi tạo cuộc hẹn: ${err.message}`);
    res.status(500).json({ success: false, message: `Lỗi khi tạo cuộc hẹn: ${err.message}` });
  }
};

// @desc    Lấy danh sách lịch hẹn của người dùng (khách hàng hoặc luật sư)
// @route   GET /api/appointments
// @access  Private
exports.getAppointments = asyncHandler(async (req, res, next) => {
  const { status } = req.query;
  const userId = req.user.id;
  const isLawyer = req.user.role.toLowerCase() === 'lawyer';


  let appointments;
  if (isLawyer) {
    appointments = await appointmentModel.getAppointmentsByLawyerId(userId, status);
  } else {
    appointments = await appointmentModel.getAppointmentsByCustomerId(userId, status);
  }


  res.status(200).json({
    status: 'success',
    count: appointments.length,
    data: appointments
  });
});

// @desc    Lấy chi tiết lịch hẹn theo ID
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointmentById = asyncHandler(async (req, res, next) => {
  const appointmentId = req.params.id;
  const userId = req.user.id;

  const appointment = await appointmentModel.getAppointmentById(appointmentId);

  if (!appointment) {
    return next(new ErrorResponse('Không tìm thấy lịch hẹn', 404));
  }

  // Kiểm tra xem người dùng có quyền xem lịch hẹn này không
  if (appointment.customer_id !== userId && appointment.lawyer_id !== userId && req.user.role !== 'admin') {
    return next(new ErrorResponse('Không có quyền truy cập', 403));
  }

  res.status(200).json({
    status: 'success',
    data: appointment
  });
});

// @desc    Cập nhật trạng thái lịch hẹn
// @route   PUT /api/appointments/:id/status
// @access  Private
exports.updateAppointmentStatus = asyncHandler(async (req, res, next) => {
  const appointmentId = req.params.id;
  const { status, notes } = req.body;
  const userId = req.user.id;

  // Kiểm tra xem lịch hẹn có tồn tại không
  const existingAppointment = await appointmentModel.getAppointmentById(appointmentId);
  if (!existingAppointment) {
    return next(new ErrorResponse('Không tìm thấy lịch hẹn', 404));
  }

  // Kiểm tra xem người dùng có quyền cập nhật lịch hẹn này không
  if (existingAppointment.lawyer_id !== userId && req.user.role !== 'lawyer') {
    return next(new ErrorResponse('Chỉ luật sư hoặc admin mới có thể cập nhật trạng thái lịch hẹn', 403));
  }

  // Kiểm tra trạng thái hợp lệ
  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return next(new ErrorResponse('Trạng thái không hợp lệ', 400));
  }

  // Cập nhật trạng thái lịch hẹn
  const updatedAppointment = await appointmentModel.updateAppointmentStatus(
    appointmentId,
    status,
    notes
  );

  // Gửi email thông báo cho khách hàng - bỏ qua nếu có lỗi
  try {
    // Lấy thông tin chi tiết khách hàng và luật sư
    const customerResult = await db.query(
      'SELECT id, email, full_name FROM Users WHERE id = $1',
      [existingAppointment.customer_id]
    );
    
    const lawyerResult = await db.query(
      'SELECT id, email, full_name FROM Users WHERE id = $1',
      [existingAppointment.lawyer_id]
    );
    
    if (customerResult.rows.length > 0 && lawyerResult.rows.length > 0) {
      const customer = customerResult.rows[0];
      const lawyer = lawyerResult.rows[0];
      
      // Nếu trạng thái là "cancelled" - đã hủy
      if (status === 'cancelled') {
        await emailService.sendAppointmentCancellationToCustomer(
          customer.email,
          customer.full_name,
          {
            appointmentId: updatedAppointment.id,
            lawyerName: lawyer.full_name,
            startTime: updatedAppointment.start_time,
            endTime: updatedAppointment.end_time,
            reason: notes || 'Lịch hẹn đã bị hủy bởi luật sư'
          }
        );
      } 
      // Nếu trạng thái là "completed" - đã hoàn thành
      else if (status === 'completed') {
        // Gửi email thông báo hoàn thành cho khách hàng
        await emailService.sendAppointmentStatusUpdateToCustomer(
          customer.email,
          customer.full_name,
          {
            appointmentId: updatedAppointment.id,
            lawyerName: lawyer.full_name,
            startTime: updatedAppointment.start_time,
            endTime: updatedAppointment.end_time,
            status: 'completed',
            notes: notes || 'Cuộc hẹn đã hoàn thành'
          }
        );
      }
      // Nếu là trạng thái khác (confirmed, pending)
      else {
        await emailService.sendAppointmentStatusUpdateToCustomer(
          customer.email,
          customer.full_name,
          {
            appointmentId: updatedAppointment.id,
            lawyerName: lawyer.full_name,
            startTime: updatedAppointment.start_time,
            endTime: updatedAppointment.end_time,
            status: updatedAppointment.status,
            notes: updatedAppointment.notes
          }
        );
      }
    }
  } catch (error) {
    console.error('Không thể gửi email thông báo cập nhật trạng thái:', error.message);
    // Bỏ qua lỗi email, không ảnh hưởng đến việc cập nhật trạng thái
  }

  res.status(200).json({
    status: 'success',
    data: updatedAppointment
  });
});

// @desc    Huỷ lịch hẹn
// @route   DELETE /api/appointments/:id
// @access  Private
exports.cancelAppointment = asyncHandler(async (req, res, next) => {
  const appointmentId = req.params.id;
  const { reason } = req.body;
  const userId = req.user.id;

  // Kiểm tra xem lịch hẹn có tồn tại không
  const existingAppointment = await appointmentModel.getAppointmentById(appointmentId);
  if (!existingAppointment) {
    return next(new ErrorResponse('Không tìm thấy lịch hẹn', 404));
  }

  // Kiểm tra xem người dùng có quyền huỷ lịch hẹn này không
  if (existingAppointment.customer_id !== userId && existingAppointment.lawyer_id !== userId && req.user.role !== 'admin') {
    return next(new ErrorResponse('Không có quyền huỷ lịch hẹn này', 403));
  }

  // Huỷ lịch hẹn
  const cancelledAppointment = await appointmentModel.deleteAppointment(
    appointmentId,
    reason
  );

  // Nếu người dùng là luật sư, gửi email thông báo cho khách hàng
  if (req.user.role.toLowerCase() === 'lawyer') {
    try {
      const lawyerName = await userModel.getLawyerName(userId);
      await emailService.sendAppointmentCancellationToCustomer(
        existingAppointment.customer_email,
        existingAppointment.customer_name,
        {
          appointmentId: existingAppointment.id,
          lawyerName: lawyerName,
          startTime: existingAppointment.start_time,
          endTime: existingAppointment.end_time,
          reason: reason || 'Không có lý do cụ thể'
        }
      );
    } catch (error) {
      console.error('Không thể gửi email thông báo hủy lịch hẹn cho khách hàng:', error);
      // Bỏ qua lỗi email
    }
  } 
  // Nếu người dùng là khách hàng, gửi email thông báo cho luật sư
  else if (req.user.role.toLowerCase() === 'customer') {
    try {
      const customerName = await userModel.getCustomerName(userId);
      await emailService.sendAppointmentCancellationToLawyer(
        existingAppointment.lawyer_email,
        existingAppointment.lawyer_name,
        {
          appointmentId: existingAppointment.id,
          customerName: customerName,
          startTime: existingAppointment.start_time,
          endTime: existingAppointment.end_time,
          reason: reason || 'Không có lý do cụ thể'
        }
      );
    } catch (error) {
      console.error('Không thể gửi email thông báo hủy lịch hẹn cho luật sư:', error);
      // Bỏ qua lỗi email
    }
  }

  res.status(200).json({
    status: 'success',
    data: cancelledAppointment
  });
});

// @desc    Lấy khung giờ làm việc của luật sư
// @route   GET /api/appointments/lawyer/:id/availability
// @access  Public
exports.getLawyerAvailability = asyncHandler(async (req, res, next) => {
  const lawyerId = req.params.id;

  // Kiểm tra xem luật sư có tồn tại không
  const lawyer = await userModel.findLawyerById(lawyerId);
  if (!lawyer) {
    // Thay vì báo lỗi, trả về mảng trống
    return res.status(200).json({
      status: 'success',
      message: 'Không tìm thấy thông tin luật sư hoặc luật sư chưa có lịch trống',
      count: 0,
      data: []
    });
  }

  // Lấy khung giờ làm việc của luật sư
  const availabilities = await appointmentModel.getLawyerAvailabilities(lawyerId);

  res.status(200).json({
    status: 'success',
    count: availabilities.length,
    data: availabilities
  });
});

// @desc    Thêm khung giờ làm việc cho luật sư
// @route   POST /api/appointments/availability
// @access  Private (Lawyer)
exports.addAvailability = asyncHandler(async (req, res, next) => {
  const { start_time, end_time } = req.body;
  const lawyerId = req.user.id;

  // Kiểm tra xem người dùng có phải là luật sư không - chấp nhận cả 'lawyer' và 'Lawyer'
  const userRole = req.user.role.toLowerCase();
  if (userRole !== 'lawyer') {
    return next(new ErrorResponse('Chỉ luật sư mới có thể thêm lịch làm việc', 403));
  }

  // Thêm khung giờ làm việc mới
  const availability = await appointmentModel.addLawyerAvailability(
    lawyerId,
    start_time,
    end_time
  );

  res.status(201).json({
    status: 'success',
    data: availability
  });
});

// @desc    Xoá khung giờ làm việc của luật sư
// @route   DELETE /api/appointments/availability/:id
// @access  Private (Lawyer)
exports.deleteAvailability = asyncHandler(async (req, res, next) => {
  const availabilityId = req.params.id;
  const lawyerId = req.user.id;

  // Kiểm tra xem khung giờ làm việc có tồn tại không
  const availabilities = await appointmentModel.getLawyerAvailabilities(lawyerId);
  const availability = availabilities.find(a => a.id === parseInt(availabilityId));

  if (!availability) {
    return next(new ErrorResponse('Không tìm thấy khung giờ làm việc', 404));
  }

  // Kiểm tra xem người dùng có quyền xoá khung giờ làm việc này không
  if (availability.lawyer_id !== lawyerId && req.user.role !== 'admin') {
    return next(new ErrorResponse('Không có quyền xoá khung giờ làm việc này', 403));
  }

  // Xoá khung giờ làm việc
  const deletedAvailability = await appointmentModel.deleteLawyerAvailability(availabilityId);

  res.status(200).json({
    status: 'success',
    data: deletedAvailability
  });
});

// @desc    Lấy số lượng lịch hẹn theo trạng thái
// @route   GET /api/appointments/stats
// @access  Private
exports.getAppointmentStats = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const isLawyer = req.user.role === 'lawyer';

  const counts = await appointmentModel.getAppointmentCountsByStatus(userId, isLawyer);

  res.status(200).json({
    status: 'success',
    data: counts
  });
});

// @desc    Lấy lịch hẹn sắp tới
// @route   GET /api/appointments/upcoming
// @access  Private
exports.getUpcomingAppointments = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const isLawyer = req.user.role === 'lawyer';
  const limit = parseInt(req.query.limit) || 5;

  const appointments = await appointmentModel.getUpcomingAppointments(userId, isLawyer, limit);

  res.status(200).json({
    status: 'success',
    count: appointments.length,
    data: appointments
  });
}); 