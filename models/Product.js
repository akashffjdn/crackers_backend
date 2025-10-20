// models/Product.js
const mongoose = require('mongoose');

// SpecificationSchema remains the same
const SpecificationSchema = new mongoose.Schema({
  key: String,
  value: String,
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  // Based on your src/data/types.ts Product interface
  categoryId: {
    type: mongoose.Schema.Types.ObjectId, // Link to Category collection
    ref: 'Category', // The model name we'll define later
    required: [true, 'Category is required'],
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  images: [{
    type: String,
    required: [true, 'At least one image URL is required'],
  }],
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
  },
  mrp: { // Manufacturer's Recommended Price
    type: Number,
    required: [true, 'MRP is required'],
    min: [0, 'MRP cannot be negative'],
  },
  price: { // Selling Price
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    validate: { // Ensure price <= mrp
        validator: function(value) {
            // `this` refers to the document being validated
            return value <= this.mrp;
        },
        message: 'Price cannot be greater than MRP'
    }
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  soundLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Mixed'],
    required: true,
  },
  burnTime: String,
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Stock cannot be negative'],
  },
  features: [String],
  specifications: { // Using Map for flexible key-value pairs
    type: Map,
    of: String
  },
  tags: [String], // Array of strings for tags
  isNewArrival: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  isOnSale: { type: Boolean, default: false },
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

// Middleware to update `updatedAt` field before saving
ProductSchema.pre('save', function(next) {
  // Only update updatedAt if the document is being modified (excluding first save)
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// === CORRECTED INDEXES ===
// Separate text index for searchable string fields
ProductSchema.index({ name: 'text', description: 'text' });

// Separate regular index for filtering/sorting by tags array
ProductSchema.index({ tags: 1 });

// Other indexes remain
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ price: 1 });
// =========================

// Create and export the model
module.exports = mongoose.model('Product', ProductSchema); // 'Product' will be the collection name 'products'