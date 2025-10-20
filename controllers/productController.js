// controllers/productController.js
const Product = require('../models/Product'); // Import the model
const Category = require('../models/Category'); // May need for validation

// @desc    Fetch all products (with filtering/pagination)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    // Basic filtering (extend as needed based on frontend filters)
    const query = {};
    if (req.query.categoryId) {
      query.categoryId = req.query.categoryId;
    }
    // Add more filters: price range, sound level, search term (using $text index)

    // Basic Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12; // Products per page
    const skip = (page - 1) * limit;

    const products = await Product.find(query)
      .populate('categoryId', 'name') // Optionally populate category name
      .sort({ createdAt: -1 }) // Sort by newest first (example)
      .skip(skip)
      .limit(limit);

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    res.json({
        products,
        page,
        totalPages,
        totalProducts
    });
  } catch (error) {
    console.error(`Error getting products: ${error.message}`);
    res.status(500).json({ message: 'Server Error fetching products' });
    // Or use error handling middleware: next(error);
  }
};

// @desc    Fetch single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('categoryId', 'name');

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error(`Error getting product by ID: ${error.message}`);
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Product not found (invalid ID format)' });
    }
    res.status(500).json({ message: 'Server Error fetching product' });
  }
};

// @desc    Get products by category ID
// @route   GET /api/products/category/:categoryId
// @access  Public
const getProductsByCategory = async (req, res) => {
    try {
        const categoryExists = await Category.findById(req.params.categoryId);
        if (!categoryExists) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const products = await Product.find({ categoryId: req.params.categoryId })
                                      .populate('categoryId', 'name');
        res.json(products);
    } catch (error) {
        console.error(`Error getting products by category: ${error.message}`);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Category not found (invalid ID format)' });
        }
        res.status(500).json({ message: 'Server Error fetching products by category' });
    }
};


// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  // Destructure required fields from req.body
  const {
      name, categoryId, description, shortDescription, mrp, price,
      soundLevel, stock, images, features, specifications, tags,
      burnTime, isNewArrival, isBestSeller, isOnSale // Add optional fields
  } = req.body;

  try {
     // Basic Validation (Add more robust validation)
     if (!name || !categoryId || !description || !shortDescription || !mrp || !price || !soundLevel || stock === undefined || !images || images.length === 0) {
        return res.status(400).json({ message: 'Please provide all required product fields' });
    }

    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
        return res.status(400).json({ message: 'Invalid category ID' });
    }

    const product = new Product({
      name, categoryId, description, shortDescription, mrp, price,
      soundLevel, stock, images, features, specifications, tags,
      burnTime, isNewArrival, isBestSeller, isOnSale
      // Mongoose defaults will handle rating, reviewCount, createdAt, updatedAt
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error(`Error creating product: ${error.message}`);
    // Check for Mongoose validation errors
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server Error creating product' });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  const {
      name, categoryId, description, shortDescription, mrp, price,
      soundLevel, stock, images, features, specifications, tags,
      burnTime, isNewArrival, isBestSeller, isOnSale
  } = req.body;

  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      // Update fields selectively
      product.name = name ?? product.name;
      product.categoryId = categoryId ?? product.categoryId;
      product.description = description ?? product.description;
      product.shortDescription = shortDescription ?? product.shortDescription;
      product.mrp = mrp ?? product.mrp;
      product.price = price ?? product.price;
      product.soundLevel = soundLevel ?? product.soundLevel;
      product.stock = stock ?? product.stock;
      product.images = images ?? product.images;
      product.features = features ?? product.features;
      product.specifications = specifications ?? product.specifications;
      product.tags = tags ?? product.tags;
      product.burnTime = burnTime ?? product.burnTime;
      product.isNewArrival = isNewArrival ?? product.isNewArrival;
      product.isBestSeller = isBestSeller ?? product.isBestSeller;
      product.isOnSale = isOnSale ?? product.isOnSale;
      // updatedAt is handled by pre-save middleware

      if (product.price > product.mrp) {
          return res.status(400).json({ message: 'Price cannot be greater than MRP' });
      }

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error(`Error updating product: ${error.message}`);
     if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(', ') });
    }
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Product not found (invalid ID format)' });
    }
    res.status(500).json({ message: 'Server Error updating product' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      // await product.remove(); // .remove() is deprecated, use deleteOne or deleteMany
      await Product.deleteOne({ _id: req.params.id });
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error(`Error deleting product: ${error.message}`);
     if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Product not found (invalid ID format)' });
    }
    res.status(500).json({ message: 'Server Error deleting product' });
  }
};


module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory
};