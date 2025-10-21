// sparkle-crackers-backend/controllers/cartController.js
const User = require('../models/User');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// Helper to validate and get product details
const getProductDetails = async (productId) => {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new Error(`Invalid Product ID format: ${productId}`);
    }
    const product = await Product.findById(productId);
    if (!product) {
        throw new Error(`Product not found: ${productId}`);
    }
    return product;
};


// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('cart.product'); // Populate product details within the cart

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Map cart items to include full product details if needed by frontend
        // (Adjust structure based on what CartContext expects)
        const populatedCartItems = user.cart.map(item => {
             if (!item.product) {
                 console.warn(`Product data missing for cart item productId: ${item.productId}. It might have been deleted.`);
                 return null; // Handle cases where a product might have been deleted
             }
            return {
                // Ensure the structure matches CartItem in frontend/types.ts
                product: {
                    id: item.product._id, // Use _id from populated product
                    categoryId: item.product.categoryId,
                    name: item.product.name,
                    images: item.product.images,
                    description: item.product.description,
                    shortDescription: item.product.shortDescription,
                    mrp: item.product.mrp,
                    price: item.product.price,
                    rating: item.product.rating,
                    reviewCount: item.product.reviewCount,
                    soundLevel: item.product.soundLevel,
                    burnTime: item.product.burnTime,
                    stock: item.product.stock,
                    features: item.product.features,
                    specifications: item.product.specifications,
                    tags: item.product.tags,
                },
                quantity: item.quantity
            };
        }).filter(item => item !== null); // Filter out items whose products were deleted


        res.json(populatedCartItems); // Send the structured cart items
    } catch (error) {
        console.error(`Error getting cart: ${error.message}`);
        res.status(500).json({ message: 'Server Error fetching cart' });
    }
};

// @desc    Add item to cart or update quantity
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res) => {
    const { productId, quantity = 1 } = req.body; // Default quantity to 1 if not provided
    const numQuantity = Number(quantity);

    if (!productId || numQuantity <= 0) {
        return res.status(400).json({ message: 'Valid Product ID and positive quantity required' });
    }

    try {
        const user = await User.findById(req.user._id);
        if (!user) { return res.status(404).json({ message: 'User not found' }); }

        const product = await getProductDetails(productId); // Validate product exists

        if (product.stock < numQuantity) {
            return res.status(400).json({ message: `Insufficient stock for ${product.name}. Only ${product.stock} available.` });
        }

        const existingCartItemIndex = user.cart.findIndex(item => item.product.equals(productId));

        if (existingCartItemIndex > -1) {
            // Update quantity if item exists
            const newQuantity = user.cart[existingCartItemIndex].quantity + numQuantity;
             if (product.stock < newQuantity) {
                return res.status(400).json({ message: `Cannot add ${numQuantity}. Insufficient stock for ${product.name}. Only ${product.stock} available in total.` });
             }
            user.cart[existingCartItemIndex].quantity = newQuantity;
        } else {
            // Add new item if it doesn't exist
            user.cart.push({ product: productId, quantity: numQuantity });
        }

        await user.save();
        // Fetch and return the updated cart
        const updatedUser = await User.findById(req.user._id).populate('cart.product');
        const populatedCartItems = updatedUser.cart.map(item => ({
             // Re-map structure as in getCart
             product: {
                 id: item.product._id,
                 categoryId: item.product.categoryId,
                 name: item.product.name, images: item.product.images, description: item.product.description, shortDescription: item.product.shortDescription,
                 mrp: item.product.mrp, price: item.product.price, rating: item.product.rating, reviewCount: item.product.reviewCount,
                 soundLevel: item.product.soundLevel, burnTime: item.product.burnTime, stock: item.product.stock,
                 features: item.product.features, specifications: item.product.specifications, tags: item.product.tags,
             },
             quantity: item.quantity
         }));
        res.status(200).json(populatedCartItems);

    } catch (error) {
        console.error(`Error adding to cart: ${error.message}`);
         if (error.message.startsWith('Invalid Product ID') || error.message.startsWith('Product not found')) {
            return res.status(404).json({ message: error.message });
         }
        res.status(500).json({ message: 'Server Error adding to cart' });
    }
};

// @desc    Update item quantity in cart
// @route   PUT /api/cart/:productId
// @access  Private
const updateCartItemQuantity = async (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body;
    const numQuantity = Number(quantity);

    if (numQuantity <= 0) {
        // If quantity is 0 or less, treat it as removal
        return removeFromCart(req, res); // Reuse the remove logic
    }
     if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: 'Invalid Product ID format' });
    }

    try {
        const user = await User.findById(req.user._id);
        if (!user) { return res.status(404).json({ message: 'User not found' }); }

        const product = await getProductDetails(productId); // Validate product

        if (product.stock < numQuantity) {
            return res.status(400).json({ message: `Insufficient stock for ${product.name}. Only ${product.stock} available.` });
        }

        const cartItemIndex = user.cart.findIndex(item => item.product.equals(productId));

        if (cartItemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        user.cart[cartItemIndex].quantity = numQuantity;
        await user.save();

        // Fetch and return the updated cart
         const updatedUser = await User.findById(req.user._id).populate('cart.product');
         const populatedCartItems = updatedUser.cart.map(item => ({ /* Map structure */
              product: { id: item.product._id, /* ... other product fields ... */ name: item.product.name, price: item.product.price, images: item.product.images, stock: item.product.stock },
              quantity: item.quantity
         }));
        res.status(200).json(populatedCartItems);

    } catch (error) {
        console.error(`Error updating cart quantity: ${error.message}`);
        if (error.message.startsWith('Invalid Product ID') || error.message.startsWith('Product not found')) { return res.status(404).json({ message: error.message }); }
        res.status(500).json({ message: 'Server Error updating cart quantity' });
    }
};


// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
const removeFromCart = async (req, res) => {
    const { productId } = req.params;

     if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: 'Invalid Product ID format' });
    }

    try {
        const user = await User.findById(req.user._id);
        if (!user) { return res.status(404).json({ message: 'User not found' }); }

        const initialLength = user.cart.length;
        user.cart = user.cart.filter(item => !item.product.equals(productId));

        if (user.cart.length === initialLength) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        await user.save();
        // Fetch and return the updated cart
         const updatedUser = await User.findById(req.user._id).populate('cart.product');
         const populatedCartItems = updatedUser.cart.map(item => ({ /* Map structure */
              product: { id: item.product._id, /* ... other product fields ... */ name: item.product.name, price: item.product.price, images: item.product.images, stock: item.product.stock },
              quantity: item.quantity
         }));
        res.status(200).json(populatedCartItems);

    } catch (error) {
        console.error(`Error removing from cart: ${error.message}`);
        res.status(500).json({ message: 'Server Error removing from cart' });
    }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) { return res.status(404).json({ message: 'User not found' }); }

        user.cart = []; // Empty the cart array
        await user.save();
        res.status(200).json([]); // Return empty cart

    } catch (error) {
        console.error(`Error clearing cart: ${error.message}`);
        res.status(500).json({ message: 'Server Error clearing cart' });
    }
};


module.exports = {
    getCart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
};