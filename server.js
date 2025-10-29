// server.js
require('dotenv').config(); // Load environment variables first
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // We'll create this next

// Initialize Express app
const app = express();

// Connect to Database
connectDB();

const corsOptions = {
  origin: process.env.FRONTEND_URL, // Your Netlify frontend URL
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};
// Middleware
app.use(cors(corsOptions)); // Enable CORS for all origins (adjust for production)
app.use(express.json()); // Allow app to accept JSON data

// Basic Route (Test Route)
app.get('/', (req, res) => {
  res.send('Sparkle Crackers API Running! ✨');
});

// --- API Routes ---
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/collections', require('./routes/collectionRoutes'));
app.use('/api/content', require('./routes/contentRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
// app.use('/api/content', require('./routes/contentRoutes')); // Keep commented until created

// --- Error Handling Middleware --- (Optional but recommended)
// app.use(require('./middleware/errorHandler')); // Keep commented until created

// Define Port
const PORT = process.env.PORT || 5001; // Use environment variable or default

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
