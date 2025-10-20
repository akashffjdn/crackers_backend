// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if MONGO_URI is loaded
    if (!process.env.MONGO_URI) {
      console.error('ERROR: MONGO_URI is not defined in .env file');
      process.exit(1); // Exit process with failure
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Options to avoid deprecation warnings (might vary based on mongoose version)
      // useNewUrlParser: true, // No longer needed in Mongoose 6+
      // useUnifiedTopology: true, // No longer needed in Mongoose 6+
      // useCreateIndex: true, // No longer supported
      // useFindAndModify: false, // No longer supported
    });

    console.log(`🔌 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;