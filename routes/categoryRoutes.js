// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public Routes
router.get('/', getCategories);       // GET /api/categories
router.get('/:id', getCategoryById); // GET /api/categories/:id

// Admin Only Routes
router.post('/', protect, admin, createCategory);    // POST /api/categories
router.put('/:id', protect, admin, updateCategory); // PUT /api/categories/:id
router.delete('/:id', protect, admin, deleteCategory); // DELETE /api/categories/:id

module.exports = router;