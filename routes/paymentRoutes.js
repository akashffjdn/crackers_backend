// Example: routes/paymentRoutes.js (Create this file)
const express = require('express');
const router = express.Router();
const { createPaymentOrder, verifyPayment } = require('../controllers/paymentController'); // Create this controller
const { protect } = require('../middleware/authMiddleware');

router.post('/create-order', protect, createPaymentOrder);
router.post('/verify', protect, verifyPayment); // For verification after payment attempt

module.exports = router;

// Add to server.js:
// app.use('/api/payments', require('./routes/paymentRoutes'));