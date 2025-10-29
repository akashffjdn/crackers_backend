// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// AddressSchema remains the same
const AddressSchema = new mongoose.Schema({
    label: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: {
        type: String,
        required: true,
        trim: true,
        match: [/^[1-9][0-9]{5}$/, 'Please add a valid pincode']
    },
    phone: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
});

const CartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    }
}, { _id: false });

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please add a valid email'],
        trim: true,
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false,
    },
    addresses: [AddressSchema],
    cart: [CartItemSchema],
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product' // Reference the Product model
    }],
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    // --- ADDED FOR PASSWORD RESET ---
    passwordResetToken: String,
    passwordResetExpires: Date,
    // --- END ADDED FIELDS ---
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Middleware and Indexes remain the same
UserSchema.pre('save', function(next) {
    // Only hash password if modified (or is new)
    // Removed password hashing here as it should ideally be in the controller
    // to avoid hashing again when only profile fields change.

    // Update 'updatedAt' timestamp
    if (this.isModified()) {
      this.updatedAt = Date.now();
    }
    next();
});
UserSchema.index({ email: 1 });

module.exports = mongoose.model('User', UserSchema);