// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory // Add more controller functions as needed
} = require('../controllers/productController'); // We'll create this next
const { protect, admin } = require('../middleware/authMiddleware'); // Authentication middleware

// Public Routes
router.get('/', getProducts); // GET /api/products
router.get('/:id', getProductById); // GET /api/products/:id
router.get('/category/:categoryId', getProductsByCategory); // GET /api/products/category/:categoryId

// Admin Only Routes
router.post('/', protect, admin, createProduct); // POST /api/products
router.put('/:id', protect, admin, updateProduct); // PUT /api/products/:id
router.delete('/:id', protect, admin, deleteProduct); // DELETE /api/products/:id

module.exports = router;