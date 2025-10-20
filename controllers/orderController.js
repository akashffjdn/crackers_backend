// controllers/orderController.js
const Order = require('../models/Order');
const Product = require('../models/Product'); // Needed to check stock, maybe get product details

// Helper function to calculate total (or get from frontend if trusted)
// This is a basic example; consider edge cases like discounts, taxes, shipping rules
const calculateOrderAmount = async (items) => {
    let total = 0;
    for (const item of items) {
        const product = await Product.findById(item.product.productId);
        if (!product) {
            throw new Error(`Product not found: ${item.product.productId}`);
        }
        if (product.stock < item.quantity) {
             throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
        }
        total += product.price * item.quantity;
    }

    // Add Shipping (Example logic)
    const shipping = total > (process.env.FREE_SHIPPING_THRESHOLD || 2000) ? 0 : (process.env.STANDARD_SHIPPING_COST || 99);
    total += shipping;

    return total;
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
    const { orderItems, shippingAddress, paymentMethod, paymentResult } = req.body; // paymentResult from payment gateway

    if (!orderItems || orderItems.length === 0) {
        return res.status(400).json({ message: 'No order items' });
    }
    if (!shippingAddress) {
         return res.status(400).json({ message: 'Shipping address is required' });
    }
     if (!paymentMethod) {
         return res.status(400).json({ message: 'Payment method is required' });
    }

    try {
        // 1. Prepare items with current data (optional but safer)
        const itemsWithDetails = await Promise.all(orderItems.map(async (item) => {
            const product = await Product.findById(item.product.id); // Assuming frontend sends product.id
            if (!product) throw new Error(`Product not found: ${item.product.name}`);
             if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);
            return {
                product: { // Store details needed for the order summary
                    productId: product._id,
                    name: product.name,
                    price: product.price, // Price at time of order
                    image: product.images[0] || '',
                },
                quantity: item.quantity,
            };
        }));

        // 2. Calculate total server-side for accuracy
        const calculatedTotal = await calculateOrderAmount(itemsWithDetails);
        // Add more robust check against frontend total if needed

        // 3. Create the order document
        const order = new Order({
            userId: req.user._id, // From protect middleware
            items: itemsWithDetails,
            shippingAddress,
            paymentMethod,
            paymentStatus: paymentMethod === 'cod' ? 'pending' : (paymentResult && paymentResult.status === 'COMPLETED' ? 'paid' : 'pending'), // Example logic
            total: calculatedTotal,
            // Add paymentResult details if available: paymentResult: { id: paymentResult.id, status: paymentResult.status, ... },
        });

        // 4. Save the order
        const createdOrder = await order.save();

        // 5. Update product stock (Important!)
        for (const item of createdOrder.items) {
            await Product.findByIdAndUpdate(item.product.productId, {
                $inc: { stock: -item.quantity } // Decrement stock
            });
        }

        res.status(201).json(createdOrder);

    } catch (error) {
        console.error(`Error creating order: ${error.message}`);
        res.status(400).json({ message: error.message || 'Error creating order' }); // Send specific error back
    }
};

// @desc    Get logged in user's orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error(`Error getting user orders: ${error.message}`);
        res.status(500).json({ message: 'Server Error fetching orders' });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('userId', 'firstName lastName email'); // Populate user details

        if (order) {
            // Check if the order belongs to the user OR if the user is an admin
            if (order.userId._id.toString() === req.user._id.toString() || req.user.role === 'admin') {
                res.json(order);
            } else {
                res.status(403).json({ message: 'Not authorized to view this order' });
            }
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error(`Error getting order by ID: ${error.message}`);
         if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Order not found (invalid ID format)' });
        }
        res.status(500).json({ message: 'Server Error fetching order' });
    }
};

// --- Admin Only ---

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
     try {
        // Add filtering/pagination similar to getProducts
        const orders = await Order.find({})
            .populate('userId', 'firstName lastName email') // Populate user details
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error(`Error getting all orders: ${error.message}`);
        res.status(500).json({ message: 'Server Error fetching all orders' });
    }
};

// @desc    Update order status (and potentially tracking)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
    const { status, trackingNumber } = req.body;
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
         return res.status(400).json({ message: 'Invalid status provided' });
    }

    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            const previousStatus = order.status;
            order.status = status;
            if (status === 'shipped' && trackingNumber) {
                order.trackingNumber = trackingNumber;
                // Maybe set estimated delivery based on shipping
            }
             if (status === 'delivered') {
                 // Set paymentStatus to 'paid' for COD orders on delivery
                 if (order.paymentMethod === 'cod') {
                    order.paymentStatus = 'paid';
                 }
                 // Could set a deliveredAt timestamp
            }
             if (status === 'cancelled' && previousStatus !== 'cancelled') {
                 // If cancelling, potentially restore stock (complex logic - handle carefully)
                 // For simplicity here, we won't restore stock automatically
                 // Add notification logic here if needed
                 console.warn(`Order ${order._id} cancelled. Stock NOT automatically restored.`);
             }

            const updatedOrder = await order.save();

            // TODO: Add logic here to send email/SMS notification to the user about status change

            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error(`Error updating order status: ${error.message}`);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Order not found (invalid ID format)' });
        }
        res.status(500).json({ message: 'Server Error updating order status' });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
};