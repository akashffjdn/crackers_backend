// controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
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
      // role defaults to 'user' in the User model
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
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(`Error registering user: ${error.message}`);
     if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server Error during registration' });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
     if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
    }
    // Find user by email AND explicitly select the password field
    const user = await User.findOne({ email }).select('+password'); // <--- ADDED .select('+password') HERE

    // Check if user exists AND if the password was actually retrieved
    if (!user || !user.password) {
       // If no user OR somehow the password wasn't retrieved, return unauthorized
       return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Now compare the provided password with the retrieved hashed password
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
        token: generateToken(user._id), // Assuming generateToken is defined elsewhere
      });
    } else {
      // Password does not match
      res.status(401).json({ message: 'Invalid email or password' }); // 401 Unauthorized
    }
  } catch (error) {
    // Log the actual error for debugging on the server
    console.error(`Error logging in user: ${error.message}`);
    console.error(error); // Log the full error object
    // Send a generic error message to the client
    res.status(500).json({ message: 'Server Error during login' });
  }
};

module.exports = {
  registerUser,
  loginUser,
};