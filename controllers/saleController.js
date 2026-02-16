import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import asyncHandler from 'express-async-handler';

// @desc    Create new sale
// @route   POST /api/sales
// @access  Public
const createSale = asyncHandler(async (req, res) => {
    const { items, paymentMethod } = req.body;

    if (items && items.length === 0) {
        res.status(400);
        throw new Error('No items in sale');
    } else {
        let totalAmount = 0;

        // Calculate total and verify stock
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                res.status(404);
                throw new Error(`Product not found: ${item.product}`);
            }
            if (product.stock < item.quantity) {
                res.status(400);
                throw new Error(`Insufficient stock for product: ${product.name}`);
            }
            totalAmount += item.price * item.quantity;
        }

        // Create sale and update stock
        const sale = new Sale({
            items,
            totalAmount,
            paymentMethod,
        });

        const createdSale = await sale.save();

        // Decrement stock
        for (const item of items) {
            const product = await Product.findById(item.product);
            product.stock = product.stock - item.quantity;
            await product.save();
        }

        res.status(201).json(createdSale);
    }
});

// @desc    Get all sales
// @route   GET /api/sales
// @access  Public
const getSales = asyncHandler(async (req, res) => {
    const sales = await Sale.find({}).populate('items.product', 'name barcode');
    res.json(sales);
});

export { createSale, getSales };
