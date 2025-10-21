// models/Order.js
const mongoose = require('mongoose');

// Embedded Schemas
const OrderItemSchema = new mongoose.Schema({ // Renamed for clarity
    product: { // Store the ObjectId reference to the Product model
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    // *** ADDED FIELDS to store details at time of order ***
    priceAtOrder: {
        type: Number,
        required: true
    },
    nameAtOrder: {
        type: String,
        required: true
    },
    imageAtOrder: { // Store one image URL
        type: String,
        default: '/placeholder.png' // Add a default placeholder if needed
    },
    // *** END ADDED FIELDS ***
}, { _id: true }); // Enable _id for subdocuments if needed later

const ShippingAddressSchema = new mongoose.Schema({
    firstName: { type: String, required: [true, 'First name is required'] },
    lastName: { type: String, required: [true, 'Last name is required'] },
    email: { type: String, required: [true, 'Email is required'] },
    phone: { type: String, required: [true, 'Phone number is required'] },
    street: { type: String, required: [true, 'Street address is required'] },
    city: { type: String, required: [true, 'City is required'] },
    state: { type: String, required: [true, 'State is required'] },
    pincode: { type: String, required: [true, 'Pincode is required'] },
}, { _id: false });

// Main Order Schema
const OrderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    items: [OrderItemSchema], // Use the updated item schema
    total: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    },
    shippingAddress: {
        type: ShippingAddressSchema,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'upi', 'cod', 'online'], // Keep 'online' as added previously
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending',
    },
    trackingNumber: String,
    estimatedDelivery: Date, // Store as Date
}, {
    timestamps: true // Use mongoose timestamps (createdAt, updatedAt)
});

// Indexes - Ensure the compound index is present and correct
OrderSchema.index({ userId: 1, createdAt: -1 }); // Optimized for getMyOrders
OrderSchema.index({ status: 1 }); // If filtering by status is common
OrderSchema.index({ createdAt: -1 }); // Optimized for sorting getAllOrders

// Remove pre-save middleware if using timestamps: true
// OrderSchema.pre('save', function (next) {
//     this.updatedAt = Date.now(); // Handled by timestamps: true
//     next();
// });

module.exports = mongoose.model('Order', OrderSchema);