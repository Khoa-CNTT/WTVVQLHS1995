const express = require('express');
const router = express.Router();

// Import các route
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const reviewRoutes = require('./reviewRoutes');
const appointmentRoutes = require('./appointmentRoutes');
const chatRoutes = require('./chatRoutes');
const mailRoutes = require('./mailRoutes');
const legalRoutes = require('./legalRoutes');
const nodeScraperRoutes = require('./nodeScraperRoutes');

// Sử dụng các route
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/reviews', reviewRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/chats', chatRoutes);
router.use('/mail', mailRoutes);
router.use('/legal', legalRoutes);
router.use('/node-scraper', nodeScraperRoutes);
module.exports = router;
