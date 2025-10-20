// models/Order.js
const mongoose = require('mongoose');

// Embedded Schemas
const CartItemSchema = new mongoose.Schema({
    product: { // Store essential product info or just the ID and fetch later
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true }, // Price *at the time of order*
        image: String, // Store one image URL for reference
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
}, { _id: false });

const ShippingAddressSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
}, { _id: false });

// Main Order Schema
const OrderSchema = new mongoose.Schema({
    // Based on src/data/types.ts Order
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    items: [CartItemSchema], // Array of embedded cart items
    total: { // Total amount paid
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    },
    shippingAddress: {
        type: ShippingAddressSchema, // Embed shipping address
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'upi', 'cod'],
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending',
    },
    trackingNumber: String,
    estimatedDelivery: Date,
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Middleware to update `updatedAt`
OrderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes
OrderSchema.index({ userId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', OrderSchema); // Collection name will be 'orders'