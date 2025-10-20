// models/FestivalCollection.js
const mongoose = require('mongoose');

const CollectionProductPackSchema = new mongoose.Schema({
    // Based on src/data/festivalCollections.ts CollectionProductPack
    // MongoDB will generate _id
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    image: String,
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
    }],
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
});

const FestivalCollectionSchema = new mongoose.Schema({
    // Based on src/data/festivalCollections.ts FestivalCollection
    // MongoDB will generate _id
    title: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    color: { type: String, required: true }, // Gradient classes
    image: String,
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    tags: [String],
    seoTitle: String,
    seoDescription: String,
    assignedProducts: [{ // Array of Product ObjectIds
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    customPacks: [CollectionProductPackSchema], // Array of embedded packs
    showAllTaggedProducts: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Middleware to update `updatedAt`
FestivalCollectionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes
FestivalCollectionSchema.index({ slug: 1 });
FestivalCollectionSchema.index({ isActive: 1, sortOrder: 1 });
FestivalCollectionSchema.index({ tags: 1 });

module.exports = mongoose.model('FestivalCollection', FestivalCollectionSchema);