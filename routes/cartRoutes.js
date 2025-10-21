// sparkle-crackers-backend/routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const {
    getCart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware'); // Only logged-in users

// All cart routes are protected
router.route('/')
    .get(protect, getCart)       // GET /api/cart - Get user's cart
    .post(protect, addToCart)    // POST /api/cart - Add item or update quantity
    .delete(protect, clearCart); // DELETE /api/cart - Clear entire cart

router.route('/:productId')
    .put(protect, updateCartItemQuantity) // PUT /api/cart/:productId - Set specific quantity
    .delete(protect, removeFromCart);    // DELETE /api/cart/:productId - Remove specific item

module.exports = router;