// controllers/orderController.js
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// Helper - Recalculate based on items with priceAtOrder (or pass pre-calculated total)
const calculateShipping = (subtotal) => {
    // Default values if environment variables are not set
    const freeShippingThreshold = parseInt(process.env.FREE_SHIPPING_THRESHOLD || '2000', 10);
    const standardShippingCost = parseInt(process.env.STANDARD_SHIPPING_COST || '99', 10);
    // Ensure calculation results in a number
    return !isNaN(freeShippingThreshold) && !isNaN(standardShippingCost) && subtotal > freeShippingThreshold ? 0 : standardShippingCost;
};

// @desc    Create new order (Adjusted for new Item Schema)
// This is typically called *after* payment verification or for COD
const createOrder = async (req, res) => {
    // Assuming req contains verified data: req.user, req.body.orderItems, req.body.shippingAddress, req.body.paymentMethod
    const { orderItems, shippingAddress, paymentMethod } = req.body;

    // --- Input Validation ---
    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
        return res.status(400).json({ message: 'Order items are required and must be an array.' });
    }
    if (!shippingAddress || typeof shippingAddress !== 'object') {
        return res.status(400).json({ message: 'Shipping address object is required.' });
    }
    const requiredAddressFields = ['firstName', 'lastName', 'email', 'phone', 'street', 'city', 'state', 'pincode'];
    for (const field of requiredAddressFields) {
        // Allow optional fields like email/lastName if your frontend handles it
        // if (!shippingAddress[field] && ['firstName', 'phone', 'street', 'city', 'state', 'pincode'].includes(field)) {
        if (!shippingAddress[field]) { // Stricter check
            return res.status(400).json({ message: `Missing required shipping address field: ${field}` });
        }
    }
    if (!paymentMethod || !['cod', 'card', 'upi', 'online'].includes(paymentMethod)) {
        return res.status(400).json({ message: 'Valid payment method required. Received: ' + paymentMethod });
    }

    try {
        let detailedItems = [];
        let calculatedSubtotal = 0;

        // 1. Verify products and stock, prepare items array for saving
        // Use lean() for performance boost when just reading data
        for (const item of orderItems) {
            if (!item.productId || !item.quantity || item.quantity <= 0) {
                 throw new Error(`Invalid item data provided: ${JSON.stringify(item)}`);
            }
            // Select only necessary fields + use lean()
            const product = await Product.findById(item.productId).select('name price images stock').lean();
            if (!product) {
                throw new Error(`Product not found: ${item.productId}`);
            }
            if (product.stock < item.quantity) {
                // Check stock again right before saving for better accuracy
                throw new Error(`Insufficient stock for ${product.name}. Only ${product.stock} available.`);
            }
            detailedItems.push({
                product: product._id, // Store ObjectId reference
                quantity: item.quantity,
                // *** Ensure these details from the current product state are saved ***
                priceAtOrder: product.price,
                nameAtOrder: product.name,
                imageAtOrder: product.images && product.images.length > 0 ? product.images[0] : '/placeholder.png',
            });
            calculatedSubtotal += product.price * item.quantity;
        }

        // 2. Calculate Shipping and Final Total
        const shippingCost = calculateShipping(calculatedSubtotal);
        const finalTotal = calculatedSubtotal + shippingCost;

        // 3. Create the order object
        const order = new Order({
            userId: req.user._id, // From protect middleware
            items: detailedItems, // Use new structure with ...AtOrder fields
            shippingAddress,
            paymentMethod,
            // If called after online payment verification, set to 'paid'
            paymentStatus: paymentMethod === 'cod' ? 'pending' : (req.body.paymentStatus || 'paid'), // Allow passing paymentStatus for online
            total: finalTotal, // Use server-calculated final total
            status: 'pending', // Start all orders as pending for admin review/confirmation
            // Include paymentResult if it comes from online payment verification
            ...(req.body.paymentResult && { paymentResult: req.body.paymentResult })
        });

        // 4. Save the order
        const createdOrder = await order.save();

        // 5. Update stock for each product (use transaction for safety in production)
        const stockUpdatePromises = createdOrder.items.map(item =>
            Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })
        );
        await Promise.all(stockUpdatePromises);

        console.log(`Order ${createdOrder._id} created successfully for user ${req.user._id}`);

        // Populate user details for the response IF needed by frontend immediately after creation
        // await createdOrder.populate('userId', 'firstName lastName email'); // Often not needed right after creation

        res.status(201).json(createdOrder); // Send back the created order

    } catch (error) {
        console.error(`Error creating order: ${error.message}`);
        console.error(error.stack);
        // Provide specific error message back to frontend
        res.status(400).json({ message: error.message || 'Error creating order' });
    }
};


// @desc    Get logged in user orders (Optimized Population)
const getMyOrders = async (req, res) => {
    try {
        console.time("getMyOrders Query");
        // Use lean() for performance if you only need plain JS objects
        const orders = await Order.find({ userId: req.user._id })
            // No product population needed - rely on ...AtOrder fields
            .select('-items.product') // Exclude the product ObjectId reference
            .sort({ createdAt: -1 })
            .lean(); // Use lean() for faster read-only queries
        console.timeEnd("getMyOrders Query");
        console.log(`getMyOrders: Found ${orders.length} orders for user ${req.user._id}`);
        // Frontend map function will use item.nameAtOrder, item.imageAtOrder, item.priceAtOrder
        res.json(orders);
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ message: 'Server error fetching orders' });
    }
};

// @desc    Get order by ID (Populate fully for details)
const getOrderById = async (req, res) => {
    try {
        console.time(`getOrderById ${req.params.id}`);
        // Need full details here, so populate fully
        const order = await Order.findById(req.params.id)
            .populate('userId', 'firstName lastName email phone') // Populate user
            .populate({
                 path: 'items.product', // Populates based on the ObjectId stored in item.product
                 // Select fields needed by the tracking page just in case ...AtOrder fails
                 select: 'name images price categoryId shortDescription' // Add more if needed
            });
        console.timeEnd(`getOrderById ${req.params.id}`);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Authorization check
        // Ensure userId might be populated or just an ID
        const ownerId = order.userId?._id?.toString() || order.userId?.toString();
        if (req.user.role !== 'admin' && ownerId !== req.user._id.toString()) {
            console.warn(`AuthZ failed: User ${req.user._id} tried to access order ${order._id} owned by ${ownerId}`);
            return res.status(403).json({ message: 'Not authorized to view this order' });
        }

        res.json(order); // Send the potentially populated order

    } catch (error) {
        console.error(`Error fetching order ${req.params.id}:`, error);
        if (error.name === 'CastError') {
             res.status(400).json({ message: 'Invalid Order ID format' });
        } else {
             res.status(500).json({ message: 'Server error fetching order' });
        }
    }
};


// @desc    Get all orders (Optimized Population, with Pagination)
const getAllOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = {}; // Add filters based on req.query if needed (e.g., status, date range)

        console.time("getAllOrders Count");
        const totalOrders = await Order.countDocuments(filter);
        console.timeEnd("getAllOrders Count");

        console.time("getAllOrders Query");
        // Use lean() for performance
        const orders = await Order.find(filter)
            .populate('userId', 'firstName lastName email') // Populate user for display name/email
            // No product population needed for list view - rely on ...AtOrder
            .select('-items.product') // Exclude product ObjectId reference
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(); // Use lean() for faster read-only queries
        console.timeEnd("getAllOrders Query");
        console.log(`getAllOrders: Found ${orders.length} orders for page ${page}`);

        res.json({
            orders,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit),
            totalOrders
        });

    } catch (error) {
        console.error('Error fetching all orders:', error);
        res.status(500).json({ message: 'Server error fetching all orders' });
    }
};

// @desc    Update order status - **CORRECTED**
const updateOrderStatus = async (req, res) => {
    const { status, trackingNumber } = req.body;
    const { id } = req.params;

    // Validation
    const allowedStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status provided' });
    }

    try {
        // Prepare the update object dynamically
        const updateData = {
            status: status,
            // Only include trackingNumber in update if it was provided in the request body
            ...(trackingNumber !== undefined && { trackingNumber: trackingNumber || undefined }), // Use || undefined to remove if empty string passed
        };

        // Conditionally set estimatedDelivery only when moving to 'shipped' *and* it's not already set
        if (status === 'shipped') {
            const currentOrder = await Order.findById(id).select('estimatedDelivery status').lean(); // Check current status and date
            // Only set estimatedDelivery if it doesn't exist already
            if (currentOrder && !currentOrder.estimatedDelivery) {
                 const estimatedDate = new Date();
                 estimatedDate.setDate(estimatedDate.getDate() + 5); // Example: 5 days from now
                 updateData.estimatedDelivery = estimatedDate;
            }
        }

        // Use findByIdAndUpdate to update only specified fields
        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { $set: updateData }, // Use $set to update only specified fields
            { new: true, runValidators: false } // `new: true` returns the updated doc. runValidators: false bypasses schema validation on update path (use carefully).
        )
        .populate('userId', 'firstName lastName email') // Populate user details for response consistency
        .lean(); // Use lean if you only need the plain JS object

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // No need to populate items.product, frontend should use stored details
        res.json(updatedOrder);

        // TODO: Implement sending notification (email/SMS) to the customer
        // E.g., sendOrderStatusUpdateNotification(updatedOrder);

    } catch (error) {
        console.error(`Error updating order status for ${id}:`, error);
        if (error.name === 'CastError') {
             res.status(400).json({ message: 'Invalid Order ID format' });
        } else {
            console.error(error.stack); // Log full stack
            // If validation error persists even with findByIdAndUpdate, it might be another schema issue
            res.status(500).json({ message: 'Server error updating order status' });
        }
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
};