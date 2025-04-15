const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const appointmentModel = require('../models/appointmentModel');
const userModel = require('../models/userModel');
const emailService = require('../services/emailService');

// @desc    Tạo lịch hẹn mới
// @route   POST /api/appointments
// @access  Private (User)
exports.createAppointment = asyncHandler(async (req, res, next) => {
  const { lawyer_id, start_time, end_time, purpose, notes } = req.body;
  const customer_id = req.user.id;

  // Kiểm tra xem luật sư có tồn tại không
  const lawyer = await userModel.findLawyerById(lawyer_id);
  if (!lawyer) {
    return next(new ErrorResponse('Luật sư không tồn tại', 404));
  }

  // Kiểm tra xem luật sư có lịch trống trong khoảng thời gian này không
  const availability = await appointmentModel.checkLawyerAvailability(
    lawyer_id,
    start_time,
    end_time
  );

  if (!availability.isAvailable) {
    return next(
      new ErrorResponse(
        'Luật sư không có lịch trống trong khoảng thời gian này',
        400
      )
    );
  }

  // Tạo lịch hẹn mới
  const appointment = await appointmentModel.createAppointment({
    customer_id,
    lawyer_id,
    start_time,
    end_time,
    status: 'pending',
    purpose,
    notes
  });

  // Gửi email thông báo cho luật sư
  try {
    const customer = await userModel.findById(customer_id);
    await emailService.sendAppointmentNotificationToLawyer(
      lawyer.email,
      lawyer.full_name,
      {
        appointmentId: appointment.id,
        customerName: customer.full_name,
        customerEmail: customer.email,
        startTime: appointment.start_time,
        endTime: appointment.end_time,
        purpose: appointment.purpose || 'N/A'
      }
    );
  } catch (error) {
    console.error('Không thể gửi email thông báo:', error);
  }

  res.status(201).json({
    status: 'success',
    data: appointment
  });
});

// @desc    Lấy danh sách lịch hẹn của người dùng (khách hàng hoặc luật sư)
// @route   GET /api/appointments
// @access  Private
exports.getAppointments = asyncHandler(async (req, res, next) => {
  const { status } = req.query;
  const userId = req.user.id;
  const isLawyer = req.user.role === 'lawyer';

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
  if (existingAppointment.lawyer_id !== userId && req.user.role !== 'admin') {
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

  // Gửi email thông báo cho khách hàng
  try {
    const customer = await userModel.findById(existingAppointment.customer_id);
    const lawyer = await userModel.findById(existingAppointment.lawyer_id);

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
  } catch (error) {
    console.error('Không thể gửi email thông báo:', error);
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

  // Gửi email thông báo
  try {
    const customer = await userModel.findById(existingAppointment.customer_id);
    const lawyer = await userModel.findById(existingAppointment.lawyer_id);

    // Xác định người huỷ lịch
    const isCancelledByCustomer = userId === existingAppointment.customer_id;
    
    if (isCancelledByCustomer) {
      // Gửi email thông báo cho luật sư
      await emailService.sendAppointmentCancellationToLawyer(
        lawyer.email,
        lawyer.full_name,
        {
          appointmentId: cancelledAppointment.id,
          customerName: customer.full_name,
          startTime: cancelledAppointment.start_time,
          endTime: cancelledAppointment.end_time,
          reason: reason || 'Không có lý do'
        }
      );
    } else {
      // Gửi email thông báo cho khách hàng
      await emailService.sendAppointmentCancellationToCustomer(
        customer.email,
        customer.full_name,
        {
          appointmentId: cancelledAppointment.id,
          lawyerName: lawyer.full_name,
          startTime: cancelledAppointment.start_time,
          endTime: cancelledAppointment.end_time,
          reason: reason || 'Không có lý do'
        }
      );
    }
  } catch (error) {
    console.error('Không thể gửi email thông báo:', error);
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

  // Kiểm tra xem người dùng có phải là luật sư không
  if (req.user.role !== 'lawyer') {
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