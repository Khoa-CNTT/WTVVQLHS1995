const express = require('express');
const router = express.Router();

// Import các route
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const reviewRoutes = require('./reviewRoutes');
const appointmentRoutes = require('./appointmentRoutes');

// Sử dụng các route
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/reviews', reviewRoutes);
router.use('/appointments', appointmentRoutes);

module.exports = router;
