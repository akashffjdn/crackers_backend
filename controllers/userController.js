// controllers/userController.js
const User = require('../models/User');
const Product = require('../models/Product'); // Needed for wishlist validation
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose'); // Import mongoose

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        // req.user is set by the protect middleware
        // Fetch user again, excluding password but including addresses and wishlist
        const user = await User.findById(req.user._id)
                               .select('-password')
                               .populate('wishlist'); // Populate wishlist products

        if (user) {
            res.json({
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                addresses: user.addresses, // Include addresses
                wishlist: user.wishlist, // Include populated wishlist
                createdAt: user.createdAt,
                isActive: user.isActive,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(`Error getting user profile: ${error.message}`);
        res.status(500).json({ message: 'Server Error getting profile' });
    }
};

// @desc    Update user profile (excluding addresses & wishlist)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.firstName = req.body.firstName || user.firstName;
            user.lastName = req.body.lastName || user.lastName;
            // Add validation if email changes (check uniqueness)
            if (req.body.email && req.body.email !== user.email) {
                 const emailExists = await User.findOne({ email: req.body.email });
                 if (emailExists) {
                     return res.status(400).json({ message: 'Email already in use' });
                 }
                 user.email = req.body.email;
            }
            user.phone = req.body.phone || user.phone;
            // DO NOT update address array or wishlist here, use dedicated routes

            if (req.body.password) {
                 if (req.body.password.length < 6) {
                    return res.status(400).json({ message: 'Password must be at least 6 characters' });
                 }
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(req.body.password, salt);
            }

            const updatedUser = await user.save();
            // Fetch again to populate wishlist for the response
            const userForResponse = await User.findById(updatedUser._id)
                                              .select('-password')
                                              .populate('wishlist');

            res.json({
                _id: userForResponse._id,
                firstName: userForResponse.firstName,
                lastName: userForResponse.lastName,
                email: userForResponse.email,
                phone: userForResponse.phone,
                role: userForResponse.role,
                addresses: userForResponse.addresses, // Include addresses
                wishlist: userForResponse.wishlist, // Include wishlist
                createdAt: userForResponse.createdAt,
                isActive: userForResponse.isActive,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(`Error updating user profile: ${error.message}`);
        if (error.code === 11000) { return res.status(400).json({ message: 'Email already in use' }); }
        res.status(500).json({ message: 'Server Error updating profile' });
    }
};


// --- Admin Only Controllers ---

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 }); // Exclude passwords
        res.json(users);
    } catch (error) {
        console.error(`Error getting all users: ${error.message}`);
        res.status(500).json({ message: 'Server Error getting users' });
    }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password').populate('wishlist'); // Exclude password, populate wishlist
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(`Error getting user by ID: ${error.message}`);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'User not found (invalid ID format)' });
        }
        res.status(500).json({ message: 'Server Error getting user' });
    }
 };

// @desc    Update user (by Admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.firstName = req.body.firstName || user.firstName;
            user.lastName = req.body.lastName || user.lastName;
             // Add validation if email changes (check uniqueness)
            if (req.body.email && req.body.email !== user.email) {
                 const emailExists = await User.findOne({ email: req.body.email, _id: { $ne: req.params.id } }); // Check other users
                 if (emailExists) {
                     return res.status(400).json({ message: 'Email already in use by another user' });
                 }
                 user.email = req.body.email;
            }
            user.phone = req.body.phone || user.phone;
            // Admin might update addresses too - handle carefully if needed
            // If updating addresses, ensure validation
            if (req.body.addresses && Array.isArray(req.body.addresses)) {
                 // You might need validation logic for each address here
                 user.addresses = req.body.addresses;
            }
            user.role = req.body.role || user.role;
            user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;
            // Admin should generally NOT update wishlist directly here
            // Admin CANNOT update password via this route

            const updatedUser = await user.save();
            const userForResponse = await User.findById(updatedUser._id).select('-password').populate('wishlist'); // Fetch again without password
            res.json(userForResponse);
        } else {
             res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(`Error updating user (admin): ${error.message}`);
        if (error.code === 11000) { return res.status(400).json({ message: 'Email already in use' }); }
        if (error.kind === 'ObjectId') { return res.status(404).json({ message: 'User not found (invalid ID format)' }); }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server Error updating user' });
    }
 };

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            if (user.role === 'admin') { return res.status(400).json({ message: 'Cannot delete admin users' }); }
            await User.deleteOne({ _id: req.params.id });
            res.json({ message: 'User removed' });
        } else { res.status(404).json({ message: 'User not found' }); }
    } catch (error) {
        console.error(`Error deleting user: ${error.message}`);
        if (error.kind === 'ObjectId') { return res.status(404).json({ message: 'User not found (invalid ID format)' }); }
        res.status(500).json({ message: 'Server Error deleting user' });
    }
 };

// --- Address Management Functions ---

// @desc    Get all addresses for logged-in user
// @route   GET /api/users/addresses
// @access  Private
const getUserAddresses = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('addresses'); // Select only addresses
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.addresses || []);
    } catch (error) {
        console.error(`Error getting user addresses: ${error.message}`);
        res.status(500).json({ message: 'Server Error getting addresses' });
    }
};

// @desc    Add a new address for logged-in user
// @route   POST /api/users/addresses
// @access  Private
const addUserAddress = async (req, res) => {
    const { label, name, street, city, state, pincode, phone, isDefault } = req.body;
    if (!label || !name || !street || !city || !state || !pincode || !phone) {
        return res.status(400).json({ message: 'Missing required address fields' });
    }
    // Add validation for pincode and phone format if needed
    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
        return res.status(400).json({ message: 'Invalid Pincode format' });
    }
     // Basic phone validation (adjust regex as needed for your specific format)
    if (!/^[+]?[1-9][\d\s\-\(\)]{8,15}$/.test(phone)) {
        return res.status(400).json({ message: 'Invalid Phone Number format' });
    }

    try {
        const user = await User.findById(req.user._id);
        if (!user) { return res.status(404).json({ message: 'User not found' }); }

        const newAddress = { // No _id needed here, Mongoose adds it
            label, name, street, city, state, pincode, phone, isDefault: isDefault || false
        };

        // If the new address is set as default, unset all others
        if (newAddress.isDefault) {
            user.addresses.forEach(addr => { if (addr) addr.isDefault = false; });
        }
        // If it's the very first address, make it default automatically
        else if (!user.addresses || user.addresses.length === 0) {
            newAddress.isDefault = true;
        }

        user.addresses.push(newAddress);
        await user.save();

        // Find the added address to return it with the generated _id
        const addedAddress = user.addresses[user.addresses.length - 1];
        res.status(201).json(addedAddress);

    } catch (error) {
        console.error(`Error adding address: ${error.message}`);
        if (error.name === 'ValidationError') { const msgs = Object.values(error.errors).map(val => val.message); return res.status(400).json({ message: msgs.join(', ') }); }
        res.status(500).json({ message: 'Server Error adding address' });
    }
};

// @desc    Update an existing address for logged-in user
// @route   PUT /api/users/addresses/:addressId
// @access  Private
const updateUserAddress = async (req, res) => {
    const { addressId } = req.params;
    const { label, name, street, city, state, pincode, phone, isDefault } = req.body;

    // Validate incoming data
    if (!label || !name || !street || !city || !state || !pincode || !phone) {
        return res.status(400).json({ message: 'Missing required address fields' });
    }
     if (!/^[1-9][0-9]{5}$/.test(pincode)) {
        return res.status(400).json({ message: 'Invalid Pincode format' });
    }
    if (!/^[+]?[1-9][\d\s\-\(\)]{8,15}$/.test(phone)) {
        return res.status(400).json({ message: 'Invalid Phone Number format' });
    }

    try {
        const user = await User.findById(req.user._id);
        if (!user) { return res.status(404).json({ message: 'User not found' }); }

        const addressIndex = user.addresses.findIndex(addr => addr?._id.toString() === addressId);
        if (addressIndex === -1) { return res.status(404).json({ message: 'Address not found' }); }

        const currentAddress = user.addresses[addressIndex];
        if (!currentAddress) { return res.status(404).json({ message: 'Address data corrupted' }); } // Safety check

        let defaultStatusChanged = false;

        // Handle default status logic
        if (isDefault === true && !currentAddress.isDefault) {
            // Setting this one as default, unset others
            user.addresses.forEach((addr, idx) => {
                if (addr) addr.isDefault = (idx === addressIndex);
            });
            defaultStatusChanged = true;
        } else if (isDefault === false && currentAddress.isDefault && user.addresses.length > 1) {
            // Trying to unset the *only* default address when others exist
            const otherDefaultsExist = user.addresses.some((addr, idx) => idx !== addressIndex && addr?.isDefault);
            if (!otherDefaultsExist) {
                // Find the first *other* address and make it default
                const firstOtherIndex = user.addresses.findIndex((addr, idx) => idx !== addressIndex && addr);
                if (firstOtherIndex !== -1 && user.addresses[firstOtherIndex]) {
                    user.addresses[firstOtherIndex].isDefault = true;
                    console.warn(`User ${user._id} unset only default address ${addressId}, making ${user.addresses[firstOtherIndex]._id} default.`);
                    defaultStatusChanged = true;
                } else {
                     // Should not happen if length > 1, but handle defensively
                     console.error(`Could not find another address to set as default for user ${user._id}`);
                     // Keep the current one default in this edge case? Or return error?
                     // Let's keep it default to avoid having no default.
                     // isDefault will remain true in the update below.
                }
            } else {
                defaultStatusChanged = true; // We are unsetting a default, but others exist
            }
        } else if (isDefault === false && currentAddress.isDefault && user.addresses.length === 1) {
            // Cannot unset the default if it's the only address
            return res.status(400).json({ message: 'Cannot unset the default status of the only address.' });
        }


        // Update fields using subdocument modification
        user.addresses[addressIndex].set({
            label, name, street, city, state, pincode, phone,
            isDefault: (isDefault !== undefined ? isDefault : currentAddress.isDefault) // Use new value if provided, else keep old
        });


        await user.save();
        res.json(user.addresses[addressIndex]); // Return the updated address

    } catch (error) {
        console.error(`Error updating address: ${error.message}`);
        if (error.name === 'ValidationError') { const msgs = Object.values(error.errors).map(val => val.message); return res.status(400).json({ message: msgs.join(', ') }); }
        res.status(500).json({ message: 'Server Error updating address' });
    }
};

// @desc    Delete an address for logged-in user
// @route   DELETE /api/users/addresses/:addressId
// @access  Private
const deleteUserAddress = async (req, res) => {
    const { addressId } = req.params;
    try {
        const user = await User.findById(req.user._id);
        if (!user) { return res.status(404).json({ message: 'User not found' }); }

        const addressIndex = user.addresses.findIndex(addr => addr?._id.toString() === addressId);
        if (addressIndex === -1) { return res.status(404).json({ message: 'Address not found' }); }

        const addressToDelete = user.addresses[addressIndex];
        const wasDefault = addressToDelete?.isDefault;

        // Remove the address using Mongoose's subdocument removal
        user.addresses.pull({ _id: addressId });

        // If the default address was deleted and other addresses exist, make the new first one default
        if (wasDefault && user.addresses.length > 0) {
            const anyDefaultExists = user.addresses.some(addr => addr?.isDefault);
            if (!anyDefaultExists && user.addresses[0]) {
                 user.addresses[0].isDefault = true;
            }
        }

        await user.save();
        res.json({ message: 'Address removed' });

    } catch (error) {
        console.error(`Error deleting address: ${error.message}`);
        res.status(500).json({ message: 'Server Error deleting address' });
    }
};

// @desc    Set an address as default
// @route   PUT /api/users/addresses/:addressId/default
// @access  Private
const setDefaultUserAddress = async (req, res) => {
    const { addressId } = req.params;
    try {
        const user = await User.findById(req.user._id);
        if (!user) { return res.status(404).json({ message: 'User not found' }); }

        let found = false;
        user.addresses.forEach(addr => {
            if(addr) { // Check if addr exists
                if (addr._id.toString() === addressId) {
                    addr.isDefault = true;
                    found = true;
                } else {
                    addr.isDefault = false; // Unset others
                }
            }
        });

        if (!found) { return res.status(404).json({ message: 'Address not found' }); }

        await user.save();
        res.json(user.addresses); // Return updated full addresses array

    } catch (error) {
        console.error(`Error setting default address: ${error.message}`);
        res.status(500).json({ message: 'Server Error setting default address' });
    }
};


// --- NEW Wishlist Management Functions ---

// @desc    Get logged-in user's wishlist
// @route   GET /api/users/wishlist
// @access  Private
const getUserWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
                               .select('wishlist') // Select only the wishlist field
                               .populate('wishlist'); // Populate product details

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.wishlist || []);
    } catch (error) {
        console.error(`Error getting user wishlist: ${error.message}`);
        res.status(500).json({ message: 'Server Error getting wishlist' });
    }
};

// @desc    Add product to logged-in user's wishlist
// @route   POST /api/users/wishlist
// @access  Private
const addToWishlist = async (req, res) => {
    const { productId } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: 'Valid Product ID is required' });
    }

    try {
        const user = await User.findById(req.user._id);
        if (!user) { return res.status(404).json({ message: 'User not found' }); }

        // Check if product exists
        const productExists = await Product.findById(productId);
        if (!productExists) {
             return res.status(404).json({ message: 'Product not found' });
        }

        // Check if product is already in wishlist
        const alreadyInWishlist = user.wishlist.some(item => item.equals(productId));
        if (alreadyInWishlist) {
            // If already present, just return the current wishlist (populated)
            const currentUser = await User.findById(req.user._id).select('wishlist').populate('wishlist');
            return res.status(200).json(currentUser.wishlist || []);
        }

        // Add to wishlist using $addToSet to prevent duplicates
        await User.updateOne(
            { _id: req.user._id },
            { $addToSet: { wishlist: productId } }
        );

        // Fetch updated wishlist (populated) to return
        const updatedUser = await User.findById(req.user._id).select('wishlist').populate('wishlist');
        res.status(200).json(updatedUser.wishlist || []); // Use 200 OK as it modifies existing user

    } catch (error) {
        console.error(`Error adding to wishlist: ${error.message}`);
        res.status(500).json({ message: 'Server Error adding to wishlist' });
    }
};

// @desc    Remove product from logged-in user's wishlist
// @route   DELETE /api/users/wishlist/:productId
// @access  Private
const removeFromWishlist = async (req, res) => {
    const { productId } = req.params;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: 'Valid Product ID is required' });
    }

    try {
        const user = await User.findById(req.user._id);
        if (!user) { return res.status(404).json({ message: 'User not found' }); }

        // Remove from wishlist using $pull
        await User.updateOne(
            { _id: req.user._id },
            { $pull: { wishlist: productId } }
        );

        // Fetch updated wishlist (populated) to return
        const updatedUser = await User.findById(req.user._id).select('wishlist').populate('wishlist');
        res.status(200).json(updatedUser.wishlist || []);

    } catch (error) {
        console.error(`Error removing from wishlist: ${error.message}`);
        res.status(500).json({ message: 'Server Error removing from wishlist' });
    }
};
// --- End NEW Wishlist Functions ---


module.exports = {
    // Profile
    getUserProfile,
    updateUserProfile,
    // Admin User Management
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    // Address Management
    getUserAddresses,
    addUserAddress,
    updateUserAddress,
    deleteUserAddress,
    setDefaultUserAddress,
    // Wishlist Management
    getUserWishlist,
    addToWishlist,
    removeFromWishlist,
};