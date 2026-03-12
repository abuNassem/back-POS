import Product from '../models/Product.js';
import asyncHandler from 'express-async-handler';
import Sale from '../models/Sale.js';

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
    const idProduct = req.query.id
    if (idProduct) {
        const product = await Product.findOne({ _id: idProduct });
        return res.json(product);
    } else {
        const products = await Product.find();
        return res.json(products);
    }
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        res.json(product);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Public
const createProduct = asyncHandler(async (req, res) => {
    const { name, barcode, price, costPrice, stock, category } = req.body;
    // 1. التحقق من وجود جميع الحقول المطلوبة
    if (!name || !barcode || price === undefined || costPrice === undefined || stock === undefined || !category) {
        return res.status(400).json({
            status: "fail",
            errorCode: "DUPLICATE_BARCODE", // هنا "تخترع" الكلمات التي تريدها
            message: "هذا الباركود مسجل لمنتج آخر"
        });
    }

    // 2. التحقق مما إذا كان المنتج موجوداً مسبقاً (عن طريق الباركود)
    const productExists = await Product.findOne({ barcode });

    if (productExists) {
        res.status(400);
        throw new Error('المنتج موجود بالفعل بهذا الباركود');
    }

    // 3. إنشاء المنتج
    const product = await Product.create({
        name,
        barcode,
        price: Number(price),
        costPrice: Number(costPrice),
        stock: Number(stock),
        category,
    });

    if (product) {
        res.status(201).json(product);
    } else {
        res.status(400);
        throw new Error('بيانات المنتج غير صحيحة');
    }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Public
const updateProduct = asyncHandler(async (req, res) => {
    const { name, barcode, price, costPrice, stock, category } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
        product.name = name || product.name;
        product.barcode = barcode || product.barcode;
        product.price = Number(price) || product.price;
        product.costPrice = Number(costPrice) || product.costPrice;
        product.stock = Number(stock) || product.stock;
        product.category = category || product.category;

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Public
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        await product.deleteOne();
        res.json({ message: 'Product removed' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Search products by name or barcode
// @route   GET /api/products/search
// @access  Public
const searchProducts = asyncHandler(async (req, res) => {
    const keyword = req.query.q
        ? {
            $or: [
                { name: { $regex: req.query.q, $options: 'i' } },
                { barcode: { $regex: req.query.q, $options: 'i' } },
                { category: { $regex: req.query.q, $options: 'i' } },

            ],
        }
        : {};

    const products = await Product.find({ ...keyword }).select('name _id price stock');

    res.json(products);
});


const getPopulated = asyncHandler(async (req, res) => {
    try {

        const popularProducts = await Sale.aggregate([
            // 1. تفكيك مصفوفة المنتجات داخل كل طلب (إذا كنت تخزن المنتجات داخل مصفوفة في الطلب)
            { $unwind: "$items" },

            // 2. تجميع المنتجات بناءً على الـ ID الخاص بها وحساب الكمية المباعة
            {
                $group: {
                    _id: "$items.idProduct",
                    name: { $first: "$items.name" },       // أخذ الاسم (للعرض السريع)
                    price: { $first: "$items.price" },
                    stock: { $first: "$items.stock" }     // أخذ السعر
                }
            },

            // 3. ترتيب النتائج من الأكثر مبيعاً إلى الأقل
            { $sort: { totalSold: -1 } },

            // 4. أخذ أول 10 نتائج فقط
            { $limit: 10 }
        ]);

        const ids = popularProducts.map(ele => ele._id)
        const popProduct = await Product.find({ _id: { $in: ids } }).select('name _id price stock')
        res.status(200).json(popProduct);
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ أثناء جلب البيانات", error });
    }
}
)

export {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    getPopulated
};
