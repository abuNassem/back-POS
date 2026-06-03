import Product from "../product/ProductModel.js";

// 🔥 التحقق من المنتجات + تجهيزها
export const validateAndPrepareProducts = async (items, session) => {
    const productsToUpdate = [];

    for (const item of items) {
        const product = await Product.findById(item.idProduct).session(session);

        if (!product) {
            throw new Error(`المنتج غير موجود: ${item.idProduct}`);
        }

        if (product.stock < item.quantity) {
            throw new Error(`not enough: ${product.name}`);
        }

        productsToUpdate.push({ product, quantity: item.quantity });
    }

    return productsToUpdate;
};

// 🔥 خصم المخزون بعد البيع
export const updateStockAfterSale = async (productsToUpdate, session) => {
    for (const entry of productsToUpdate) {
        entry.product.stock -= entry.quantity;
        entry.product.totalSales += entry.quantity;

        await entry.product.save({ session });
    }
};

// 🔥 استرجاع المخزون عند حذف البيع
export const restoreStockAfterDelete = async (items, session) => {
    for (const item of items) {
        const product = await Product.findById(item.idProduct).session(session);

        if (product) {
            product.stock += item.quantity;
            product.totalSales -= item.quantity;

            await product.save({ session });
        }
    }
};

// 🔥 تحديث المخزون (تعديل بيع)
export const updateStockAfterEdit = async (oldItems, newItems, session) => {

    // رجّع القديم
    for (const old of oldItems) {
        const product = await Product.findById(old.idProduct).session(session);

        if (product) {
           for (const items of newItems) {
            const diff=old.quantity-items.quantity
            console.log(diff)
            product.quantit+=diff
            product.totalSales-=diff
    }

        }
    }

   
};

export const isEmptyArray = (arr) => !arr || arr.length === 0;

export const sendSuccess = (res, data, message = "تمت العملية بنجاح", status = 200) => {
    return res.status(status).json({
        status: "success",
        message,
        data
    });
};