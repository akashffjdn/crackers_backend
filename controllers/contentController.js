// controllers/contentController.js
const Content = require('../models/Content');
const defaultContentData = require('../data/defaultContentData'); // Assuming this exists

// @desc    Get all content sections
// @route   GET /api/content
// @access  Public
const getAllContent = async (req, res) => {
    try {
        const count = await Content.countDocuments();
        if (count === 0) {
            console.log('No content found, seeding database...');
            await Content.insertMany(defaultContentData);
            console.log('Default content seeded successfully.');
        }
        const contentSections = await Content.find({});
        res.json(contentSections);
    } catch (error) {
        console.error(`Error getting content: ${error.message}`);
        res.status(500).json({ message: 'Server Error fetching content' });
    }
};

// @desc    Update multiple content sections (bulk update)
// @route   PUT /api/content
// @access  Private/Admin
const updateContentSections = async (req, res) => {
    const sectionsToUpdate = req.body;

    if (!Array.isArray(sectionsToUpdate)) {
        return res.status(400).json({ message: 'Request body must be an array of content sections' });
    }

    try {
        const bulkOps = sectionsToUpdate.map(section => {
            if (!section.contentId) {
                console.warn('Skipping update for section without contentId:', section.title);
                return null;
            }
            // *** FIXED HERE: Exclude contentId from updateData for $set ***
            const { _id, id, isEditing, contentId, ...updateData } = section;

            return {
                updateOne: {
                    filter: { contentId: section.contentId }, // Find by contentId
                    update: {
                         // Only set fields that should actually be updated
                         $set: { ...updateData, lastUpdatedAt: new Date() },
                         // Set contentId only if inserting a new document
                         $setOnInsert: { contentId: section.contentId }
                    },
                    upsert: true // Create if it doesn't exist
                }
            };
        }).filter(op => op !== null);

        if (bulkOps.length === 0 && sectionsToUpdate.length > 0) {
             return res.status(400).json({ message: 'No valid sections provided for update.' });
        }
         if (bulkOps.length === 0) {
             const currentContent = await Content.find({});
             return res.json(currentContent); // Nothing to update
        }

        const result = await Content.bulkWrite(bulkOps);
        console.log('Bulk update result:', result);

        // Fetch the updated content to send back
        const updatedContent = await Content.find({});
        res.json(updatedContent);

    } catch (error) {
        // Log the specific error for debugging
        console.error(`Error updating content sections: ${error.message}`);
         if (error.name === 'ValidationError') {
             return res.status(400).json({ message: 'Validation failed for one or more sections.' });
         }
         // Handle potential bulk write errors more granularly if needed
         if (error.code === 11000) { // Example: Duplicate key error during upsert
             return res.status(400).json({ message: `Duplicate key error: ${error.message}` });
         }
        res.status(500).json({ message: 'Server Error updating content' });
    }
};

// @desc    Seed default content (Admin only utility)
// @route   POST /api/content/seed
// @access  Private/Admin
const seedDefaultContent = async (req, res) => {
    try {
        await Content.deleteMany({});
        await Content.insertMany(defaultContentData);
        res.status(201).json({ message: 'Default content seeded successfully.' });
    } catch (error) {
         console.error(`Error seeding content: ${error.message}`);
         res.status(500).json({ message: 'Server Error seeding content' });
    }
};


module.exports = {
    getAllContent,
    updateContentSections,
    seedDefaultContent,
};