// routes/collectionRoutes.js
const express = require('express');
const router = express.Router();
const {
    getActiveCollections,
    getCollectionBySlug,
    // Admin routes
    getAllCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    updateCollectionProducts,
    updateCollectionPacks
} = require('../controllers/collectionController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public Routes
router.get('/', getActiveCollections);      // GET /api/collections
router.get('/:slug', getCollectionBySlug); // GET /api/collections/:slug

// Admin Routes
router.get('/admin/all', protect, admin, getAllCollections); // GET /api/collections/admin/all
router.post('/', protect, admin, createCollection);          // POST /api/collections
router.put('/:id', protect, admin, updateCollection);       // PUT /api/collections/:id
router.delete('/:id', protect, admin, deleteCollection);     // DELETE /api/collections/:id
router.put('/:id/products', protect, admin, updateCollectionProducts); // PUT /api/collections/:id/products
router.put('/:id/packs', protect, admin, updateCollectionPacks);       // PUT /api/collections/:id/packs

module.exports = router;