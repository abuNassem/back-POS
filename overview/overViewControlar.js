
import Product from "../product/ProductModel.js"
import Sale from "../sales/SaleModel.js"


export const getPublicInfo=async(req,res)=>{
try{
    console.log(public)
const allProducts = await Product.find();
const allSales = await Sale.find();

const totalStockQuantity = allProducts.reduce((total, product) => {
    return total + product.stock;
}, 0);

const totalRevenue = allSales.reduce((total, sale) => {
    return total + sale.total;
}, 0);

const potentialInventoryValue = allProducts.reduce((total, product) => {
    return total + (product.stock * product.price);
}, 0);

const uniqueProductsCount = allProducts.length;

res.status(200).json({
    totalStockQuantity,     
    totalRevenue,            
    potentialInventoryValue, 
    uniqueProductsCount      
});
    
    
}catch(err){
console.log(err)
}
}






export const getRepositryInfo=async(req,res)=>{
    try{
        const filterdLowProduct=await Product.find({stock:{$lte:10}}).select('name stock _id barcode ')
        res.status(200).json({filterdLowProduct})

    }catch(erro){
        console.log(erro)
    }
}

// overViewControlar.js

export const getTopSellingProducts = async (req, res) => {
    try {
        // ترتيب المنتجات حسب حقل المبيعات تنازلياً وجلب أول 5
        const topProducts = await Product.find()
            .sort({ totalSales: -1 })
            .limit(5)
            .select('name totalSales'); // جلب الحقول المهمة فقط

        res.status(200).json(topProducts);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "خطأ في جلب الأكثر مبيعاً" });
    }
}