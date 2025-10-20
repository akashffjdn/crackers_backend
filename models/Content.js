// models/Content.js
const mongoose = require('mongoose');

// Define embedded schemas for complex types if needed (optional for flexibility)
const TestimonialSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: String,
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    image: String,
}, { _id: false }); // No separate IDs for embedded docs unless needed

const FeatureSchema = new mongoose.Schema({
    icon: { type: String, required: true }, // Store icon identifier (e.g., 'FaShieldAlt')
    title: { type: String, required: true },
    description: { type: String, required: true },
}, { _id: false });

const StepSchema = new mongoose.Schema({
    icon: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
}, { _id: false });

const ContentSchema = new mongoose.Schema({
    // Use 'contentId' as a unique, non-mongo ID string for easy frontend reference
    contentId: {
        type: String,
        required: true,
        unique: true,
        index: true, // Index for faster lookups
    },
    title: { // User-friendly title for the admin panel
        type: String,
        required: true,
    },
    content: { // Main text content or description (for images/videos)
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['text', 'image', 'video', 'testimonials', 'features', 'steps'],
    },
    // Store metadata in a flexible Mixed type or specific subdocuments
    metadata: {
        imageUrl: String,
        videoUrl: String,
        altText: String,
        testimonials: [TestimonialSchema],
        features: [FeatureSchema],
        steps: [StepSchema],
    },
    // No need for isEditing in the database
    lastUpdatedAt: { // Track when it was last changed
        type: Date,
        default: Date.now
    }
});

// Update timestamp before saving
ContentSchema.pre('save', function(next) {
    this.lastUpdatedAt = Date.now();
    next();
});
 // Ensure updates also modify the timestamp
 ContentSchema.pre('findOneAndUpdate', function(next) {
    this.set({ lastUpdatedAt: Date.now() });
    next();
});
 ContentSchema.pre('updateOne', function(next) {
    this.set({ lastUpdatedAt: Date.now() });
    next();
});


module.exports = mongoose.model('Content', ContentSchema);