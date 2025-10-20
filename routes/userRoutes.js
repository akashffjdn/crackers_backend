// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {
    getUserProfile,
    updateUserProfile,
    getAllUsers, // Admin
    getUserById,   // Admin
    updateUser,    // Admin
    deleteUser,    // Admin
    // Import address handlers
    getUserAddresses,
    addUserAddress,
    updateUserAddress,
    deleteUserAddress,
    setDefaultUserAddress,
    // --- Import Wishlist Handlers ---
    getUserWishlist,
    addToWishlist,     // <-- Added this import
    removeFromWishlist // <-- Added this import
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// User Profile Routes (Protected)
router.route('/profile')
    .get(protect, getUserProfile)      // GET /api/users/profile
    .put(protect, updateUserProfile);  // PUT /api/users/profile (Handles non-address/wishlist profile fields)

// --- User Address Routes (Protected) ---
router.route('/addresses')
    .get(protect, getUserAddresses)    // GET /api/users/addresses
    .post(protect, addUserAddress);    // POST /api/users/addresses

router.route('/addresses/:addressId')
    .put(protect, updateUserAddress)   // PUT /api/users/addresses/:addressId
    .delete(protect, deleteUserAddress); // DELETE /api/users/addresses/:addressId

// Route to set an address as the default
router.put('/addresses/:addressId/default', protect, setDefaultUserAddress); // PUT /api/users/addresses/:addressId/default
// --- End Address Routes ---

// --- User Wishlist Routes (Protected) ---
router.route('/wishlist')
    .get(protect, getUserWishlist)    // GET /api/users/wishlist
    .post(protect, addToWishlist);     // POST /api/users/wishlist (expects { productId: "..." } in body)

router.delete('/wishlist/:productId', protect, removeFromWishlist); // DELETE /api/users/wishlist/:productId
// --- End Wishlist Routes ---

// Admin User Management Routes (Protected + Admin Role)
router.get('/', protect, admin, getAllUsers); // GET /api/users (Admin gets all)
router.route('/:id')
    .get(protect, admin, getUserById)      // GET /api/users/:id
    .put(protect, admin, updateUser)       // PUT /api/users/:id (Admin updates user)
    .delete(protect, admin, deleteUser);   // DELETE /api/users/:id (Admin deletes user)


module.exports = router;