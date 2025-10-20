// routes/contentRoutes.js
const express = require('express');
const router = express.Router();
const {
    getAllContent,
    updateContentSections,
    seedDefaultContent
} = require('../controllers/contentController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public route to get all content (can be restricted if needed)
router.get('/', getAllContent); // GET /api/content

// Admin route to update content (bulk update)
router.put('/', protect, admin, updateContentSections); // PUT /api/content

// Admin utility route to seed default content (use with caution)
router.post('/seed', protect, admin, seedDefaultContent); // POST /api/content/seed


module.exports = router;