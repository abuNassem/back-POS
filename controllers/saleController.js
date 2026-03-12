import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import asyncHandler from 'express-async-handler';
import mongoose, { Error } from 'mongoose';
const createSale = asyncHandler(async (req, res) => {
    try {
        const { items, paymentMethod, total } = req.body;
        if (!items || items.length === 0) {
            res.status(400);
            throw new Error('لا توجد منتجات في الفاتورة');
        }
        const productsToUpdate = [];

        // المرحلة 1: التحقق من وجود المنتجات والمخزون
        for (const item of items) {
            // تأكد من استخدام اسم الحقل الصحيح القادم من الـ Body (idProduct)
            const product = await Product.findById(item.idProduct);

            if (!product) {
                res.status(404);
                throw new Error(`المنتج غير موجود: ${item.idProduct}`);
            }

            if (product.stock < item.quantity) {
                res.status(400);
                throw new Error(`not enough: ${product.name}`);
            }


            // نحفظ المرجع لتحديثه لاحقاً بدلاً من إعادة البحث في قاعدة البيانات
            productsToUpdate.push({ product, quantity: item.quantity });
        }

        // المرحلة 2: إنشاء الفاتورة
        const sale = new Sale({
            items,
            total,
            paymentMethod,
        });

        const createdSale = await sale.save();

        // المرحلة 3: خصم المخزون (استخدام المراجع التي حفظناها لتقليل الضغط على السيرفر)
        for (const entry of productsToUpdate) {
            entry.product.stock -= entry.quantity;
            await entry.product.save();
        }

        res.status(201).json(createdSale);
    } catch (error) {
        console.log(error)
    }

});
const getSales = asyncHandler(async (req, res) => {
    const sales = await Sale.find({})
    res.status(200).json(sales)
});

const deleteSale = asyncHandler(async (req, res) => {
    const sale = await Sale.findById(req.params.id);
    sale.items.map(async (item) => {
        const product = await Product.findById(item.idProduct);
        if (product) {
            product.stock = product.stock + item.quantity;
            await product.save();
        }

    })
    if (sale) {
        await sale.deleteOne();
        res.json({ message: 'Sale removed' });
    } else {
        res.status(404);
        throw new Error('Sale not found');
    }
});

const updateSale = asyncHandler(async (req, res) => {
    const saleFound = req.body
    await Sale.findByIdAndUpdate(req.params.id, { items: saleFound.items, total: saleFound.total, paymentMethod: saleFound.paymentMethod });
    res.json({ message: 'Sale updated' });

});

const updateProductStock = asyncHandler(async (req, res) => {
    // افترضنا أن data هي المصفوفة التي وصلت من Postman
    const data = req.body;
    console.log(data)
    try {
        for (const element of data) {
            // تأكد من تحويل الكمية إلى رقم لتجنب مشاكل النوع
            const qty = Number(element.quantity);

            const product = await Product.findByIdAndUpdate(
                new mongoose.Types.ObjectId(element.idProduct),
                { $inc: { stock: qty } },
                { new: true, runValidators: true }
            );

            if (!product) {
                console.log(`المنتج ذو الرقم ${element.idProduct} غير موجود`);
                continue; // تخطي للعنصر التالي
            }

            console.log("تم التحديث بنجاح:", product);
        }

        res.status(200).json({ message: "تم تحديث جميع المنتجات بنجاح" });

    } catch (error) {
        console.error("خطأ أثناء التحديث:", error);
        res.status(500).json({ error: "حدث خطأ في السيرفر" });
    }
});
export { createSale, getSales, deleteSale, updateSale, updateProductStock };
