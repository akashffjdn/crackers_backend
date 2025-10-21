// controllers/paymentController.js
const razorpay = require('../config/razorpay'); // Your initialized instance
const Order = require('../models/Order');
const Product = require('../models/Product');
const crypto = require('crypto'); // Built-in Node module for verification
const mongoose = require('mongoose'); // Import mongoose for ObjectId validation

// Helper - Calculate Shipping Cost (Ensure env vars are numbers)
const calculateShipping = (subtotal) => {
    // Default values if environment variables are not set or invalid
    const freeShippingThreshold = parseInt(process.env.FREE_SHIPPING_THRESHOLD || '2000', 10);
    const standardShippingCost = parseInt(process.env.STANDARD_SHIPPING_COST || '99', 10);

    // Check if parsing resulted in valid numbers
    if (isNaN(freeShippingThreshold) || isNaN(standardShippingCost)) {
        console.error("CRITICAL: Invalid FREE_SHIPPING_THRESHOLD or STANDARD_SHIPPING_COST in .env");
        // Fallback to a default or throw an error
        return isNaN(standardShippingCost) ? 99 : standardShippingCost; // Example fallback
    }

    return subtotal > freeShippingThreshold ? 0 : standardShippingCost;
};


// --- Calculate Amount Server-Side (More Robust) ---
const calculateOrderAmount = async (items) => {
    // Ensure items have productId and valid quantity
    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error("Invalid items array provided for amount calculation.");
    }

    let subtotalInCurrencyUnits = 0; // Calculate subtotal in INR first

    for (const item of items) {
         // Validate productId format and quantity
         if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) {
            throw new Error(`Invalid Product ID format in items: ${item.productId}`);
         }
         if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity) ) {
             throw new Error(`Invalid quantity for product ${item.productId}: ${item.quantity}`);
         }

        // Use lean() for performance when just reading price/stock
        const product = await Product.findById(item.productId).select('price stock name').lean();
        if (!product) {
            // Log warning, but maybe allow order creation if product was removed? Or throw error.
            console.warn(`Product not found during amount calculation: ${item.productId}. Skipping item.`);
            // throw new Error(`Product not found during amount calculation: ${item.productId}`); // Stricter: throw error
            continue; // Lenient: skip this item
        }
         // Optional: Add a stock check here as well (createOrder will do it again)
         if (product.stock < item.quantity) {
             throw new Error(`Insufficient stock for ${product.name}. Only ${product.stock} available.`);
         }
         // Ensure price is a valid number
         if (typeof product.price !== 'number' || product.price < 0) {
            console.error(`Invalid price found for product ${item.productId}: ${product.price}`);
            throw new Error(`Invalid price configured for product ${product.name}.`);
         }

        subtotalInCurrencyUnits += product.price * item.quantity;
    }

    if (subtotalInCurrencyUnits <= 0 && items.length > 0) {
        // This might happen if skipped items resulted in zero total
        throw new Error("Calculated subtotal is zero despite having items. Check product prices or skipped items.");
    }

     // Add Shipping (in currency units)
     const shippingCostInCurrencyUnits = calculateShipping(subtotalInCurrencyUnits);
     const totalInCurrencyUnits = subtotalInCurrencyUnits + shippingCostInCurrencyUnits;

     // Convert final total to paise and ensure it's an integer
     const amountInPaise = Math.round(totalInCurrencyUnits * 100);

     if (isNaN(amountInPaise) || amountInPaise <= 0) {
         console.error(`Calculated invalid final amount in paise: ${amountInPaise} from total ${totalInCurrencyUnits}`);
         throw new Error("Failed to calculate a valid order amount.");
     }

    console.log(`Calculated Amount: Subtotal=₹${subtotalInCurrencyUnits}, Shipping=₹${shippingCostInCurrencyUnits}, Total=₹${totalInCurrencyUnits}, AmountInPaise=${amountInPaise}`);
    return amountInPaise;
};

// @desc    Create Razorpay Order
// @route   POST /api/payments/create-order
// @access  Private
const createPaymentOrder = async (req, res) => {
    const { items } = req.body; // Expect cart items from frontend [{productId: "...", quantity: ...}]

    // Basic validation of incoming items structure
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'No items provided for order creation' });
    }
     try {
        // Validate items structure more thoroughly before calculation
        for (const item of items) {
             if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId) || !item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
                 console.error(`Invalid item data structure received: ${JSON.stringify(item)}`);
                 throw new Error(`Invalid item data structure received.`); // Throw specific error
             }
         }
     } catch(validationError) {
         return res.status(400).json({ message: validationError.message });
     }
     // --- End Item Validation ---

    try {
        const amount = await calculateOrderAmount(items); // Calculate amount in paise

        // Ensure amount is valid for Razorpay
        if (amount <= 0) {
            console.error(`Attempted to create Razorpay order with invalid amount: ${amount}`);
            return res.status(400).json({ message: "Calculated order amount must be positive." });
        }


        const options = {
            amount: amount, // Amount in paise (integer)
            currency: "INR",
            receipt: `rcpt_order_${Date.now()}_${req.user._id.toString().slice(-6)}`, // More unique receipt
        };

        console.log("Creating Razorpay order with options:", options);
        const razorpayOrder = await razorpay.orders.create(options);
        console.log("Razorpay Order created:", razorpayOrder.id);

        res.json({
            orderId: razorpayOrder.id, // ID generated by Razorpay
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            receipt: razorpayOrder.receipt // Send receipt back if needed
        });

    } catch (error) {
        // Log the detailed error
        console.error("Error creating Razorpay order:", error);
        console.error("Error Details:", error.stack || error); // Log stack trace if available

        // Check for specific known errors from calculateOrderAmount
         if (error.message.includes('Insufficient stock') || error.message.includes('Product not found') || error.message.includes('Invalid Product ID') || error.message.includes('Invalid items array') || error.message.includes('Invalid item data structure') || error.message.includes('Failed to calculate') || error.message.includes('Invalid price')) {
             return res.status(400).json({ message: error.message }); // Send specific calculation errors as 400
         }

         // Check for Razorpay specific errors (structure might vary)
         if (error.statusCode === 400 && error.error && error.error.description) {
             return res.status(400).json({ message: `Razorpay Error: ${error.error.description}` });
         }

        // Generic 500 for other unexpected server errors
        res.status(500).json({ message: "Internal Server Error creating payment order. Please check server logs." });
    }
};

// @desc    Verify Razorpay Payment and Create Order
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res) => {
     const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderDetails } = req.body;
     // orderDetails MUST contain { orderItems: [{productId: "...", quantity: ...}], shippingAddress: {...} }

     // --- Input Validation ---
     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
         return res.status(400).json({ message: 'Missing payment verification details (IDs/Signature)' });
     }
     if (!orderDetails || !orderDetails.orderItems || !Array.isArray(orderDetails.orderItems) || orderDetails.orderItems.length === 0 || !orderDetails.shippingAddress) {
         return res.status(400).json({ message: 'Missing valid orderDetails (orderItems array and shippingAddress object required)' });
     }
      const requiredAddressFields = ['firstName', 'lastName', 'email', 'phone', 'street', 'city', 'state', 'pincode'];
      for (const field of requiredAddressFields) {
          if (!orderDetails.shippingAddress[field]) {
              return res.status(400).json({ message: `Missing required shipping address field in orderDetails: ${field}` });
          }
      }
      for (const item of orderDetails.orderItems) {
            if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId) || !item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
                 console.error(`Invalid item data in orderDetails during verification: ${JSON.stringify(item)}`);
                return res.status(400).json({ message: `Invalid item data in orderDetails.` });
            }
       }
     // --- End Input Validation ---

     try {
         // --- Signature Verification ---
         const body = razorpay_order_id + "|" + razorpay_payment_id;
         const expectedSignature = crypto
             .createHmac('sha256', process.env.RAZORPAY_TEST_KEY_SECRET) // Ensure Key Secret is correct in .env
             .update(body.toString())
             .digest('hex');

         if (expectedSignature !== razorpay_signature) {
            console.warn(`Payment Signature Verification Failed for order ${razorpay_order_id}. Expected: ${expectedSignature}, Received: ${razorpay_signature}`);
            return res.status(400).json({ message: "Invalid payment signature" });
         }
         // --- Payment Verified ---
         console.log(`Payment Signature Verified Successfully for Razorpay Order ID: ${razorpay_order_id}`);

         // --- Create the Order in your DB ---
         // 1. Prepare items array matching OrderItemSchema
         let itemsForDb = [];
         let calculatedSubtotal = 0; // In currency units (e.g., INR)
         for (const item of orderDetails.orderItems) {
             // Fetch product details again to ensure consistency and get current info
             const product = await Product.findById(item.productId).select('name price images stock').lean();
             if (!product) {
                 // This should ideally not happen if createPaymentOrder succeeded, but check anyway
                 throw new Error(`Product ${item.productId} not found during order creation after payment.`);
             }
             // Double-check stock *again* right before creating the order
             if (product.stock < item.quantity) {
                 // !! This is a problem state - payment succeeded but stock ran out.
                 // Needs business logic decision: refund, backorder, notify admin etc.
                 // For now, we'll throw an error, preventing order creation.
                 console.error(`CRITICAL: Stock mismatch after payment for product ${item.productId}. Required: ${item.quantity}, Available: ${product.stock}. Payment ID: ${razorpay_payment_id}`);
                 throw new Error(`Insufficient stock for ${product.name} after payment processing. Please contact support.`);
             }
             // Validate price again
             if (typeof product.price !== 'number' || product.price < 0) {
                 throw new Error(`Invalid price found for product ${product.name} during final order creation.`);
             }
             itemsForDb.push({
                 product: product._id, // Store ObjectId reference
                 quantity: item.quantity,
                 priceAtOrder: product.price, // Store current price
                 nameAtOrder: product.name, // Store current name
                 imageAtOrder: product.images && product.images.length > 0 ? product.images[0] : '/placeholder.png', // Store current image
             });
             calculatedSubtotal += product.price * item.quantity;
         }

         // 2. Recalculate Shipping and Final Total server-side for accuracy
         const shippingCost = calculateShipping(calculatedSubtotal);
         const finalTotal = calculatedSubtotal + shippingCost;
         // Note: You could compare this finalTotal with the amount from Razorpay if needed

         // 3. Create Order document
         const newOrder = new Order({
             userId: req.user._id, // From protect middleware
             items: itemsForDb, // Use the correctly structured array
             shippingAddress: orderDetails.shippingAddress,
             paymentMethod: 'online', // Or derive if needed ('card', 'upi') - maybe from Razorpay webhook later
             paymentStatus: 'paid', // Mark as paid since verification succeeded
             total: finalTotal, // Use server-calculated final total
             status: 'pending', // Order starts as pending for processing
             // Store payment details
             paymentResult: { // Ensure your Order schema has 'paymentResult'
                razorpay_order_id: razorpay_order_id,
                razorpay_payment_id: razorpay_payment_id,
                razorpay_signature: razorpay_signature, // Optional to store signature
                status: 'paid', // Indicate payment success
                update_time: new Date().toISOString(), // Use current time
             }
         });

         // 4. Save order
         const createdOrder = await newOrder.save();

         // 5. Update stock (critical step)
         // Consider using MongoDB transactions here for atomicity in production
         const stockUpdatePromises = createdOrder.items.map(item =>
             Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })
         );
         await Promise.all(stockUpdatePromises);

         console.log(`Order ${createdOrder._id} created successfully after payment verification for Razorpay Order ID: ${razorpay_order_id}`);

         // Send success response with your DB order ID
         res.json({ message: "Payment successful and order created", orderId: createdOrder._id });

     } catch (error) {
         console.error("Error verifying payment or creating order:", error);
         console.error(error.stack); // Log full stack trace
         // Provide a more specific error message if stock issue occurred after payment
         if (error.message.includes('Insufficient stock after payment processing')) {
             // Log this critical error
             console.error(`CRITICAL FAILURE: Payment ${razorpay_payment_id} succeeded but order creation failed due to stock. MANUAL INTERVENTION NEEDED.`);
             // Respond to user - ask them to contact support
             return res.status(500).json({ message: "Order placement failed after payment due to unexpected stock issue. Please contact support with your Payment ID." });
         }
          if (error.message.includes('Product not found during order creation')) {
             // Log this critical error
             console.error(`CRITICAL FAILURE: Payment ${razorpay_payment_id} succeeded but order failed due to missing product. MANUAL INTERVENTION NEEDED.`);
             return res.status(500).json({ message: "Order placement failed after payment due to an issue with product data. Please contact support with your Payment ID." });
         }
         // Generic error for other issues during this critical phase
         res.status(500).json({ message: "Server error occurred after payment verification while creating the order. Please contact support if payment was debited." });
     }
};


module.exports = { createPaymentOrder, verifyPayment };