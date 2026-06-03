import asyncHandler from 'express-async-handler';
import Sale from './SaleModel.js';
import Product from '../product/ProductModel.js';
import {
    restoreStockAfterDelete,
    validateAndPrepareProducts,
    updateStockAfterSale,
    updateStockAfterEdit,
    isEmptyArray,
    sendSuccess
} from './functions.js';
import { withTransaction } from '../function/withTransaction.js';
import { isNumber, sendError, validateNumber } from '../product/functions.js';

// --- دوال التحقق المساعدة ---


// ====================== CREATE SALE ======================
const createSale = asyncHandler(async (req, res) => {
    const { items, paymentMethod, total } = req.body;

    if (isEmptyArray(items)) {
        return res.status(400).json({
            status: "fail",
            errorCode: "EMPTY_SALE_ITEMS",
            message: "لا يمكن إنشاء فاتورة بدون منتجات"
        });
    }

    if(!isNumber(total) && !validateNumber(total))  return sendError(res, `INVAL_TOTAL`, `قيمة غير صالحة`);
    

    const result = await withTransaction(async (session) => {
        // التحقق من المخزن وصلاحية المنتجات (تأكد أن validateAndPrepareProducts ترمي Error واضح عند نقص المخزن)
        const products = await validateAndPrepareProducts(items, session);

        const sale = await Sale.create([{
            items,
            total: Number(total),
            paymentMethod,
        }], { session });

        await updateStockAfterSale(products, session);

        return sale[0];
    });

    return sendSuccess(res, result, "تم إنشاء الفاتورة بنجاح", 201);
});

// ====================== GET SALES ======================
const getSales = asyncHandler(async (req, res) => {
    const sales = await Sale.find({}).sort({ createdAt: -1 });
    res.status(200).json(sales);
});

// ====================== DELETE SALE ======================
const deleteSale = asyncHandler(async (req, res) => {
    const result = await withTransaction(async (session) => {
        const sale = await Sale.findById(req.params.id).session(session);

        if (!sale) {
            const error = new Error('الفاتورة غير موجودة');
            error.statusCode = 404;
            error.errorCode = "SALE_NOT_FOUND";
            throw error;
        }

        await restoreStockAfterDelete(sale.items, session);
        await Sale.deleteOne({ _id: sale._id }, { session });

        return { id: sale._id };
    });

    return sendSuccess(res, result, "تم حذف الفاتورة وإرجاع الكميات للمخزن");
});

// ====================== UPDATE SALE ======================
const updateSale = asyncHandler(async (req, res) => {
    const { items: newItems, total, paymentMethod } = req.body;

    if (isEmptyArray(newItems)) {
        return res.status(400).json({
            status: "fail",
            errorCode: "EMPTY_SALE_ITEMS",
            message: "لا يمكن ترك الفاتورة فارغة"
        });
    }

    const result = await withTransaction(async (session) => {
        const sale = await Sale.findById(req.params.id).session(session);

        if (!sale) {
            const error = new Error('الفاتورة غير موجودة');
            error.statusCode = 404;
            error.errorCode = "SALE_NOT_FOUND";
            throw error;
        }

        await updateStockAfterEdit(sale.items, newItems, session);

        sale.items = newItems;
        sale.total = Number(total);
        sale.paymentMethod = paymentMethod;

        const updatedSale = await sale.save({ session });
        return updatedSale;
    });

    return sendSuccess(res, result, "تم تحديث الفاتورة بنجاح");
});

// ====================== UPDATE PRODUCT STOCK (Manual) ======================
const updateProductStock = asyncHandler(async (req, res) => {
    const data = req.body;

    if (isEmptyArray(data)) {
        return res.status(400).json({
            status: "fail",
            errorCode: "NO_DATA_PROVIDED",
            message: "لا توجد بيانات لتحديثها"
        });
    }

    const result = await withTransaction(async (session) => {
        for (const element of data) {
            const product = await Product.findById(element.idProduct).session(session);
            if (!product) continue;

            const qty = Number(element.quantity);
            if (isNaN(qty)) continue;

            product.stock += qty;
            product.totalSales -= qty;

            await product.save({ session });
        }
        return { count: data.length };
    });

    return sendSuccess(res, result, "تم تحديث كميات المنتجات يدوياً بنجاح");
});


const syncSale=asyncHandler(async(req,res)=>{
    try{
        const sales=req.body.sales
    await Sale.insertMany(sales, { ordered: false })
     return sendSuccess(res, sales, "تم تحديث كميات المنتجات يدوياً بنجاح")
    }catch(err){
        console.log(err)
return  res.status(400).json({
            status: "fail",
            errorCode: "failed sync",
            message:"فشل مزامنة الفواتير"
        });
    }
    
})
export {
    createSale,
    getSales,
    deleteSale,
    updateSale,
    updateProductStock,
    syncSale
};