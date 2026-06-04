import Product from '../product/ProductModel.js';
import asyncHandler from 'express-async-handler';
import Sale from '../sales/SaleModel.js';
import { checkEntity, isEmpty, isNumber, sendError, sendSuccess, validateNumber } from './functions.js';




const processItems = (products, mode) => {
    const valid = [];
    const needsReview = [];
    const failed = [];

    products.forEach((item, index) => {
        let issues = [];
        let isInvalid = false;

        if (isEmpty(item.name)) { issues.push("الاسم مطلوب"); isInvalid = true; }
        
        let p = validateNumber(item.price);
        let s = validateNumber(item.stock);

        if (p === null) {
            if (mode === 'smart') { p = 0; issues.push("تصحيح سعر لـ 0"); }
            else { issues.push("سعر غير صالح"); isInvalid = true; }
        }
        if (s === null) {
            if (mode === 'smart') { s = 0; issues.push("تصحيح مخزن لـ 0"); }
            else { issues.push("مخزن غير صالح"); isInvalid = true; }
        }

        const data = { ...item, price: p, stock: s };
        if (isInvalid) {
            mode === 'strict' ? failed.push({ index, issues }) : needsReview.push({ originalData: item, issues });
        } else {
            (mode === 'smart' && issues.length > 0) ? needsReview.push({ originalData: item, issues }) : valid.push(data);
        }
    });
    return { valid, failed, needsReview };
};

const ITEMS_PER_PAGE = 2;

const switchStatus = async (status, page = 1) => {
    let query = {};
    let count;
        if (status === 'active') query.isActive = true;
    if (status === 'disActive') query.isActive = false;
    
  count = await Product.countDocuments(query);

const products=await Product.find(query)
.select("name price _id barcode costPrice image stock isSync category")
.skip((page-1)*ITEMS_PER_PAGE)
.limit(page*2)
.sort({ createdAt: -1 });
    return {data:products,hasMore:count>page*ITEMS_PER_PAGE}
};

const getProducts = asyncHandler(async (req, res) => {
       
    const {  page,status} = req.query;
    
    const vPage = validateNumber(page) || 1;

   
    const data=await switchStatus(status,vPage)
    return res.json(data);
});

const createProduct = asyncHandler(async (req, res) => {
    const { name, barcode, price, costPrice, stock, category, image } = req.body;
    if (isEmpty(name) || isEmpty(category)) return sendError(res, "EMPTY_FIELDS", "الاسم والتصنيف مطلوبان");

    const vPrice = validateNumber(price);
    const vStock = validateNumber(stock);
    const vCost = validateNumber(costPrice ?? 0);

    if (vPrice === null || vStock === null) return sendError(res, "INVALID_NUMBERS", "السعر والمخزن يجب أن تكون أرقاماً موجبة");

    if (barcode && await Product.findOne({ barcode })) {
        return sendError(res, "DUPLICATE_BARCODE", "الباركود مستخدم مسبقاً");
    }

    const product = await Product.create({
        name,
        barcode: barcode || Date.now(), // استخدام الوقت كباركود عشوائي أكثر دقة
        price: vPrice, costPrice: vCost, stock: vStock, category, image,
    });

    return sendSuccess(res, product, "تم إنشاء المنتج بنجاح", 201);
});

export const bulkImportProducts = asyncHandler(async (req, res) => {
    const { products, mode } = req.body;
    if (!Array.isArray(products) || products.length === 0) return sendError(res, "INVALID_DATA", "المصفوفة فارغة");

    const { valid, failed, needsReview } = processItems(products, mode);
    
    let successCount = 0;
    let duplicates = [];

    if (valid.length > 0) {
        try {
            const result = await Product.insertMany(valid, { ordered: false });
            successCount = result.length;
        } catch (error) {
            if (error.writeErrors) {
                duplicates = error.writeErrors.filter(e => e.code === 11000).map(e => ({ barcode: e.keyValue.barcode, issue: "مكرر" }));
                successCount = error.insertedDocs.length;
            }
        }
    }


    const totalFailed = (mode === 'strict' ? failed.length : 0) + duplicates.length;
    const msg = `نجاح: ${successCount}, فشل: ${totalFailed}, مراجعة: ${needsReview.length}`;

    return sendSuccess(res, { successCount, totalFailed, reviewItems: needsReview }, msg);
});

const updateProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!checkEntity(res, product, "المنتج")) return;

    const fields = req.body;
    if (fields.name !== undefined && isEmpty(fields.name)) return sendError(res, "NAME_REQUIRED", "الاسم لا يمكن أن يكون فارغاً");

    const numFields = ['price', 'stock', 'costPrice'];
    for (const key of numFields) {
        if (fields[key] !== undefined) {
            const v = validateNumber(fields[key]);
            if (v === null) return sendError(res, `INVALID_${key.toUpperCase()}`, `قيمة ${key} غير صالحة`);
            product[key] = v;
        }
    }

    Object.assign(product, {
        name: fields.name ?? product.name,
        barcode: fields.barcode ?? product.barcode,
        category: fields.category ?? product.category,
        unit: fields.unit ?? product.unit,
        unitPrice: fields.unitPrice ?? product.unitPrice,
        image: fields.image ?? product.image
    });

    await product.save();
    return sendSuccess(res, product, "تم التحديث بنجاح");
});

const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!checkEntity(res, product, "المنتج")) return;
    await product.deleteOne();
    return sendSuccess(res, { id: req.params.id }, "تم الحذف بنجاح");
});

export const deleteManyProducts = asyncHandler(async (req, res) => {

    const { ids } = req.body;



    // 1. التحقق من وجود الحقول (Validation)

    if (!ids || !Array.isArray(ids) || ids.length === 0) {

        return res.status(400).json({

            status: "fail",

            errorCode: "EMPTY_SELECTION",

            message: "يجب تحديد منتج واحد على الأقل للحذف"

        });

    }



    // 2. التحقق من صحة التنسيق (اختياري: إذا كنت تستخدم MongoDB وتريد التأكد من الـ IDs)

    // يمكنك إضافة check هنا إذا كانت الـ IDs غير صالحة كتنسيق ObjectId



    // 3. تنفيذ عملية الحذف الجماعي

    const result = await Product.deleteMany({

        _id: { $in: ids }

    });



    // 4. التحقق مما إذا تم حذف أي سجلات فعلياً

    if (result.deletedCount === 0) {

        return res.status(404).json({

            status: "fail",

            errorCode: "NOT_FOUND",

            message: "لم يتم العثور على المنتجات المحددة، ربما تم حذفها مسبقاً"

        });

    }



    // 5. إرسال استجابة النجاح بنفس نمط مشروعك

    return sendSuccess(

        res,

        { deletedCount: result.deletedCount },

        `تم حذف ${result.deletedCount} منتج بنجاح`,

        200

    );

});

const searchProducts = asyncHandler(async (req, res) => {
    const keySearch = req.query.q;
    if (!keySearch) return res.json([]);

    const barcode=isNumber(Number(keySearch))?Number(keySearch):0
    const regexSearch = new RegExp(keySearch, 'i');
    const products = await Product.find({
        $or: [{ name: { $regex: regexSearch } }, { category: { $regex: regexSearch } }, { barcode:barcode}]
    })
    .select("name price _id barcode costPrice image stock category")

    res.json(products);
});




const getPopulated = asyncHandler(async (req, res) => {
    try {
        const popularProducts = await Sale.aggregate([
            { $unwind: "$items" },
            { $group: { _id: "$items.idProduct", totalSold: { $sum: "$items.qty" } } },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);

        const ids = popularProducts.map(ele => ele._id);
        const popProduct = await Product.find({ _id: { $in: ids } }).select('name _id price stock barcode');

        const result = popProduct.length > 0 ? popProduct : await Product.find().limit(10).select('name _id price stock barcode');
        return res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ status: "error", errorCode: "SERVER_ERROR", message: "خطأ في معالجة البيانات" });
    }
});

import mongoose from "mongoose";

const syncProductsStatus = asyncHandler(async (req, res) => {
    const products = req.body;

    // التحقق من أن البيانات مصفوفة
    if (!Array.isArray(products) || products.length === 0) {
        return sendError(
            res,
            "INVALID_DATA",
            "مصفوفة المنتجات مطلوبة"
        );
    }

    const operations = [];
    const invalidItems = [];

    products.forEach((item, index) => {

        // التحقق من البيانات
        if (
            !item?._id ||
            typeof item.isSync !== "boolean" ||
            !mongoose.Types.ObjectId.isValid(item._id)
        ) {
            invalidItems.push({
                index,
                item,
                issue: "بيانات غير صالحة"
            });

            return;
        }

        operations.push({
            updateOne: {
                filter: {
                    _id: item._id
                },
                update: {
                    $set: {
                        isSync: item.isSync
                    }
                }
            }
        });
    });

    // لا توجد عمليات صالحة
    if (operations.length === 0) {
        return sendError(
            res,
            "NO_VALID_OPERATIONS",
            "لا توجد عمليات صالحة للتنفيذ"
        );
    }

    // تنفيذ العمليات دفعة واحدة
    const result = await Product.bulkWrite(operations);

    return sendSuccess(
        res,
        {
            matched: result.matchedCount,
            modified: result.modifiedCount,
            invalidItems
        },
        `تمت مزامنة ${result.modifiedCount} منتج بنجاح`
    );
});

export const getSyncProduct=asyncHandler(async(req,res)=>{
    const syncProduct=await Product.find({isSync:true}).select('_id isSync')
    return res.status(200).json(syncProduct)
})


const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return sendError(
            res,
            "PRODUCT_NOT_FOUND",
            "المنتج غير موجود",
            404
        );
    }

    return sendSuccess(
        res,
        product,
        "تم جلب المنتج بنجاح"
    );
});


export { getProducts,getProductById,  createProduct, updateProduct, deleteProduct, searchProducts, getPopulated,syncProductsStatus};