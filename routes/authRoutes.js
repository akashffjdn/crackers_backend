// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    forgotPassword, // Import new controller
    resetPassword   // Import new controller
} = require('../controllers/authController');

router.post('/register', registerUser); // POST /api/auth/register
router.post('/login', loginUser);       // POST /api/auth/login

// --- ADDED ROUTES ---
router.post('/forgot-password', forgotPassword); // POST /api/auth/forgot-password
router.put('/reset-password/:token', resetPassword); // PUT /api/auth/reset-password/:token
// --- END ADDED ROUTES ---

module.exports = router;