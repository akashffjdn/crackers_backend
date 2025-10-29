// controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Built-in Node module for generating tokens
const sendPasswordResetEmail = require('../utils/emailSender'); // Import the email utility

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;

  // --- Input Validation ---
  if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
  }
  if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  // Basic email format check (more robust regex possible)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
  }
  // Add phone validation if needed
  // --- End Validation ---

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email address already in use' }); // More specific error
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      // This case might be redundant due to prior validation and create error handling
      res.status(400).json({ message: 'Invalid user data during creation' });
    }
  } catch (error) {
    console.error(`Error registering user: ${error.message}`);
     if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(', ') });
    }
     if (error.code === 11000) { // Mongoose duplicate key error
        return res.status(400).json({ message: 'Email address already in use' });
    }
    res.status(500).json({ message: 'Server Error during registration' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
     if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
    }
    // Find user by email AND explicitly select the password field
    const user = await User.findOne({ email }).select('+password');

    // Check if user exists AND if the password was actually retrieved
    if (!user || !user.password) {
       return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare the provided password with the retrieved hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      // Password matches - generate token and send response (excluding password)
      res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      // Password does not match
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(`Error logging in user: ${error.message}`);
    console.error(error); // Log the full error object
    res.status(500).json({ message: 'Server Error during login' });
  }
};


// @desc    Forgot Password - Generate token and send email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Please provide an email address' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      // IMPORTANT: Don't reveal if the user exists for security reasons
      console.log(`Password reset requested for non-existent email: ${email}`);
      return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // 1. Generate Reset Token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 2. Hash token and set expiry (e.g., 10 minutes)
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    await user.save({ validateBeforeSave: false }); // Skip validation for reset fields

    // 3. Create Reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`; // Use env var for frontend URL

    // 4. Send Email
    const message = `You are receiving this email because you (or someone else) have requested the reset of a password for your account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\nThis link is valid for 10 minutes.`;

    await sendPasswordResetEmail({
      email: user.email,
      subject: 'Password Reset Request - Sparkle Crackers',
      message,
    });

    console.log(`Password reset email sent to ${user.email}`);
    res.status(200).json({ message: 'Password reset link sent successfully. Please check your email.' });

  } catch (error) {
    console.error(`Error in forgotPassword: ${error.message}`);
    // If sending email failed, reset the token fields so user can try again
    if (user) { // Ensure user was found before trying to modify
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
    }
    res.status(500).json({ message: 'Error sending password reset email. Please try again later.' });
  }
};


// @desc    Reset Password using token
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    // 1. Get user based on the hashed token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }, // Check if token is not expired
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
    }

    // 2. Set new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // 3. Clear reset token fields
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save(); // This will trigger pre-save hook for updatedAt

    // Optional: Log the user in directly after reset
    const jwtToken = generateToken(user._id);

    res.status(200).json({
        message: 'Password reset successfully.',
        // Optionally return login details
         token: jwtToken,
         user: { // Send back basic user info needed by frontend
             _id: user._id,
             firstName: user.firstName,
             lastName: user.lastName,
             email: user.email,
             phone: user.phone,
             role: user.role,
         }
    });

  } catch (error) {
    console.error(`Error resetting password: ${error.message}`);
     if (error.name === 'ValidationError') { // Catch validation errors during save (unlikely here)
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server Error resetting password' });
  }
};


module.exports = {
  registerUser,
  loginUser,
  forgotPassword, // Export new controller
  resetPassword,  // Export new controller
};