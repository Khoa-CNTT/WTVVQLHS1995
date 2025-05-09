const express = require('express');
const router = express.Router();
const { 
  createAppointment, 
  getAppointments, 
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
  getLawyerAvailability,
  addAvailability,
  deleteAvailability,
  getAppointmentStats,
  getUpcomingAppointments,
  getAllAppointments
} = require('../controllers/appointmentController');

const { authenticateToken } = require('../middleware/authMiddleware');
const { protect, authorize } = require('../middleware/auth');

// Định tuyến cho quản lý lịch hẹn
router.route('/')
  .post(protect, createAppointment)
  .get(protect, getAppointments);

router.get('/stats', protect, getAppointmentStats);
router.get('/upcoming', protect, getUpcomingAppointments);

// Route cho báo cáo thống kê (chỉ admin)
router.get('/all', protect, authorize('admin'), getAllAppointments);

router.route('/:id')
  .get(protect, getAppointmentById);

router.route('/:id/status')
  .put(protect, authorize('lawyer', 'admin'), updateAppointmentStatus);

router.route('/:id')
  .delete(protect, cancelAppointment);

// Định tuyến cho quản lý lịch làm việc của luật sư
router.get('/lawyer/:id/availability', getLawyerAvailability);

router.route('/availability')
  .post(protect, authorize('lawyer'), addAvailability);

router.route('/availability/:id')
  .delete(protect, authorize('lawyer', 'admin'), deleteAvailability);

module.exports = router; 