// controllers/categoryController.js
const Category = require('../models/Category');
const Product = require('../models/Product');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({}).sort({ name: 1 }); // Sort alphabetically
        res.json(categories);
    } catch (error) {
        console.error(`Error getting categories: ${error.message}`);
        res.status(500).json({ message: 'Server Error getting categories' });
    }
};

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (category) {
            res.json(category);
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        console.error(`Error getting category by ID: ${error.message}`);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Category not found (invalid ID format)' });
        }
        res.status(500).json({ message: 'Server Error getting category' });
    }
};

// --- Admin Only ---

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
    const { name, description, heroImage, icon } = req.body;
    try {
        const categoryExists = await Category.findOne({ name });
        if (categoryExists) {
            return res.status(400).json({ message: 'Category name already exists' });
        }

        const category = new Category({ name, description, heroImage, icon });
        const createdCategory = await category.save();
        res.status(201).json(createdCategory);
    } catch (error) {
        console.error(`Error creating category: ${error.message}`);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server Error creating category' });
    }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
    const { name, description, heroImage, icon } = req.body;
    try {
        const category = await Category.findById(req.params.id);
        if (category) {
            category.name = name || category.name;
            category.description = description || category.description;
            category.heroImage = heroImage || category.heroImage;
            category.icon = icon || category.icon;

            const updatedCategory = await category.save();
            res.json(updatedCategory);
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        console.error(`Error updating category: ${error.message}`);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
         if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Category not found (invalid ID format)' });
        }
        res.status(500).json({ message: 'Server Error updating category' });
    }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (category) {
            // Optional: Check if products exist in this category before deleting
            const productCount = await Product.countDocuments({ categoryId: req.params.id });
            if (productCount > 0) {
                 return res.status(400).json({
                    message: `Cannot delete category with ${productCount} associated products. Reassign products first.`
                 });
                // Or you could allow deletion and leave products without a category,
                // depending on your desired logic.
            }

            await Category.deleteOne({ _id: req.params.id });
            res.json({ message: 'Category removed' });
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        console.error(`Error deleting category: ${error.message}`);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Category not found (invalid ID format)' });
        }
        res.status(500).json({ message: 'Server Error deleting category' });
    }
};


module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
};