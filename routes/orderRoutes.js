// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,      // Admin
    updateOrderStatus // Admin
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

// User Routes (Protected)
router.post('/', protect, createOrder); // POST /api/orders
router.get('/myorders', protect, getMyOrders); // GET /api/orders/myorders
router.get('/:id', protect, getOrderById); // GET /api/orders/:id (User can get their own, Admin gets any)

// Admin Routes (Protected + Admin Role)
router.get('/', protect, admin, getAllOrders); // GET /api/orders (Admin gets all)
router.put('/:id/status', protect, admin, updateOrderStatus); // PUT /api/orders/:id/status

module.exports = router;