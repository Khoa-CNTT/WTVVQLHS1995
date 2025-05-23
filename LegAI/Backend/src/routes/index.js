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
const autoUpdateRoutes = require('./autoUpdateRoutes');
const userLegalDocRoutes = require('./userLegalDocRoutes');
const contractRoutes = require('./contractRoutes');
const aiRoutes = require('./aiRoutes');
const legalCaseRoutes = require('./legalCaseRoutes');
const transactionRoutes = require('./transactionRoutes');
const statisticsRoutes = require('./statisticsRoutes');

// Sử dụng các route
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/reviews', reviewRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/chats', chatRoutes);
router.use('/mail', mailRoutes);
router.use('/legal', legalRoutes);
router.use('/legal-docs', userLegalDocRoutes);
router.use('/node-scraper', nodeScraperRoutes);
router.use('/auto-update', autoUpdateRoutes);
router.use('/contracts', contractRoutes);
router.use('/ai', aiRoutes);
router.use('/legal-cases', legalCaseRoutes);
router.use('/transactions', transactionRoutes);
router.use('/statistics', statisticsRoutes);

module.exports = router;
