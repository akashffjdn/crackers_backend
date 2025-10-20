// controllers/collectionController.js
const FestivalCollection = require('../models/FestivalCollection');
const Product = require('../models/Product');

// @desc    Get active collections (sorted)
// @route   GET /api/collections
// @access  Public
const getActiveCollections = async (req, res) => {
    try {
        const collections = await FestivalCollection.find({ isActive: true })
            .sort({ sortOrder: 1 }); // Sort by defined order
        res.json(collections);
    } catch (error) {
        console.error(`Error getting active collections: ${error.message}`);
        res.status(500).json({ message: 'Server Error fetching collections' });
    }
};

// @desc    Get a single collection by slug (including products)
// @route   GET /api/collections/:slug
// @access  Public
const getCollectionBySlug = async (req, res) => {
    try {
        const collection = await FestivalCollection.findOne({ slug: req.params.slug, isActive: true })
            .populate('assignedProducts'); // Populate the manually assigned products

        if (!collection) {
            return res.status(404).json({ message: 'Collection not found' });
        }

        let products = collection.assignedProducts || []; // Start with assigned products

        // If configured, add products matching tags
        if (collection.showAllTaggedProducts && collection.tags && collection.tags.length > 0) {
            const taggedProducts = await Product.find({
                tags: { $in: collection.tags }, // Find products where tags array contains any of the collection tags
                _id: { $nin: collection.assignedProducts.map(p => p._id) } // Exclude already assigned products
            });
            products = [...products, ...taggedProducts];
        }

        // You might want to remove duplicates if a product is both assigned and tagged
        // This simple approach keeps assigned first, then adds tagged
        const uniqueProductIds = new Set();
        const uniqueProducts = products.filter(p => {
            const isDuplicate = uniqueProductIds.has(p._id.toString());
            uniqueProductIds.add(p._id.toString());
            return !isDuplicate;
        });


        res.json({
            collection: collection, // Send collection details
            products: uniqueProducts,    // Send associated products
            packs: collection.customPacks.filter(p => p.isActive) // Send active packs
        });

    } catch (error) {
        console.error(`Error getting collection by slug: ${error.message}`);
        res.status(500).json({ message: 'Server Error fetching collection details' });
    }
};


// --- Admin Routes ---

// @desc    Get ALL collections (active and inactive)
// @route   GET /api/collections/admin/all
// @access  Private/Admin
const getAllCollections = async (req, res) => {
     try {
        const collections = await FestivalCollection.find({})
            .sort({ sortOrder: 1 });
        res.json(collections);
    } catch (error) {
        console.error(`Error getting all collections (admin): ${error.message}`);
        res.status(500).json({ message: 'Server Error fetching all collections' });
    }
};

// @desc    Create a new collection
// @route   POST /api/collections
// @access  Private/Admin
const createCollection = async (req, res) => {
    // Extract data from req.body based on FestivalCollectionSchema
    const { title, description, slug, color, image, isActive, sortOrder, tags, seoTitle, seoDescription, showAllTaggedProducts } = req.body;

    try {
         if (!title || !description || !slug || !color) {
            return res.status(400).json({ message: 'Title, description, slug, and color are required' });
        }

        const slugExists = await FestivalCollection.findOne({ slug });
        if (slugExists) {
             return res.status(400).json({ message: 'Slug already exists, please choose a unique one' });
        }
        const titleExists = await FestivalCollection.findOne({ title });
        if (titleExists) {
             return res.status(400).json({ message: 'Collection title already exists' });
        }

        const newCollection = new FestivalCollection({
             title, description, slug, color, image, isActive, sortOrder, tags, seoTitle, seoDescription, showAllTaggedProducts,
             // assignedProducts and customPacks are initially empty
             assignedProducts: [],
             customPacks: []
        });

        const createdCollection = await newCollection.save();
        res.status(201).json(createdCollection);

    } catch (error) {
        console.error(`Error creating collection: ${error.message}`);
         if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server Error creating collection' });
    }
};

// @desc    Update a collection's details (not products/packs here)
// @route   PUT /api/collections/:id
// @access  Private/Admin
const updateCollection = async (req, res) => {
    // Extract fields that can be updated
    const { title, description, slug, color, image, isActive, sortOrder, tags, seoTitle, seoDescription, showAllTaggedProducts } = req.body;

    try {
        const collection = await FestivalCollection.findById(req.params.id);

        if (!collection) {
            return res.status(404).json({ message: 'Collection not found' });
        }

        // Check for slug/title uniqueness if changed
        if (slug && slug !== collection.slug) {
            const slugExists = await FestivalCollection.findOne({ slug: slug });
            if (slugExists) return res.status(400).json({ message: 'Slug already exists' });
            collection.slug = slug;
        }
         if (title && title !== collection.title) {
            const titleExists = await FestivalCollection.findOne({ title: title });
            if (titleExists) return res.status(400).json({ message: 'Title already exists' });
            collection.title = title;
        }

        // Update other fields
        collection.description = description ?? collection.description;
        collection.color = color ?? collection.color;
        collection.image = image ?? collection.image;
        collection.isActive = isActive !== undefined ? isActive : collection.isActive;
        collection.sortOrder = sortOrder ?? collection.sortOrder;
        collection.tags = tags ?? collection.tags;
        collection.seoTitle = seoTitle ?? collection.seoTitle;
        collection.seoDescription = seoDescription ?? collection.seoDescription;
        collection.showAllTaggedProducts = showAllTaggedProducts !== undefined ? showAllTaggedProducts : collection.showAllTaggedProducts;

        const updatedCollection = await collection.save();
        res.json(updatedCollection);

    } catch (error) {
        console.error(`Error updating collection: ${error.message}`);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Collection not found (invalid ID format)' });
        }
        res.status(500).json({ message: 'Server Error updating collection' });
    }
};

// @desc    Delete a collection
// @route   DELETE /api/collections/:id
// @access  Private/Admin
const deleteCollection = async (req, res) => {
     try {
        const collection = await FestivalCollection.findById(req.params.id);
        if (collection) {
            await FestivalCollection.deleteOne({ _id: req.params.id });
            res.json({ message: 'Collection removed' });
        } else {
            res.status(404).json({ message: 'Collection not found' });
        }
    } catch (error) {
        console.error(`Error deleting collection: ${error.message}`);
         if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Collection not found (invalid ID format)' });
        }
        res.status(500).json({ message: 'Server Error deleting collection' });
    }
};

// @desc    Update assigned products for a collection
// @route   PUT /api/collections/:id/products
// @access  Private/Admin
const updateCollectionProducts = async (req, res) => {
    const { productIds } = req.body; // Expecting an array of product ObjectIds

    if (!Array.isArray(productIds)) {
        return res.status(400).json({ message: 'productIds must be an array' });
    }

    try {
        const collection = await FestivalCollection.findById(req.params.id);
        if (!collection) {
            return res.status(404).json({ message: 'Collection not found' });
        }

        // Basic validation: Check if product IDs are valid ObjectIds (more thorough check possible)
        // const validProductIds = productIds.filter(id => mongoose.Types.ObjectId.isValid(id));

        collection.assignedProducts = productIds; // Directly set the array
        const updatedCollection = await collection.save();
        res.json(updatedCollection);

    } catch (error) {
         console.error(`Error updating collection products: ${error.message}`);
         if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Collection not found (invalid ID format)' });
        }
        res.status(500).json({ message: 'Server Error updating collection products' });
    }
};

// @desc    Update (add/edit/delete) custom packs for a collection
// @route   PUT /api/collections/:id/packs
// @access  Private/Admin
const updateCollectionPacks = async (req, res) => {
    // This is more complex. You might receive the entire new array of packs,
    // or instructions on which pack to add/update/delete.
    // Let's assume the frontend sends the *entire updated array* of custom packs.
    const { customPacks } = req.body; // Expecting the full array of pack objects

     if (!Array.isArray(customPacks)) {
        return res.status(400).json({ message: 'customPacks must be an array' });
    }

    try {
        const collection = await FestivalCollection.findById(req.params.id);
        if (!collection) {
            return res.status(404).json({ message: 'Collection not found' });
        }

        // Validate incoming pack structure (basic example)
        for (const pack of customPacks) {
            if (!pack.name || !pack.description || pack.price === undefined || pack.mrp === undefined || !pack.products || !Array.isArray(pack.products)) {
                 return res.status(400).json({ message: `Invalid structure for pack: ${pack.name || 'Unnamed Pack'}` });
            }
            // Add more validation: check productIds, quantities etc.
            pack.id = pack.id || `pack-${Date.now()}-${Math.random().toString(16).slice(2)}`; // Assign ID if missing
            pack.createdAt = pack.createdAt || new Date().toISOString(); // Assign createdAt if missing
        }

        collection.customPacks = customPacks; // Replace the existing array
        const updatedCollection = await collection.save();
        res.json(updatedCollection);

    } catch (error) {
        console.error(`Error updating collection packs: ${error.message}`);
         if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Collection not found (invalid ID format)' });
        }
        res.status(500).json({ message: 'Server Error updating collection packs' });
    }
};

module.exports = {
    getActiveCollections,
    getCollectionBySlug,
    getAllCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    updateCollectionProducts,
    updateCollectionPacks,
};