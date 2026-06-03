import mongoose from 'mongoose';
const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    barcode: {
        type: Number,
        required: true,
        unique: true,
    },
    price: {
        type: Number,
        required: true,
    },
    unit: {
        type: String,
        default:"منتج",
        required: true,
    },
    unitPrice: {
        type: String,
        default:'دينار',
        required: true,
    },
    totalSales: {
        type: Number,
        default: 0,
    },
    image: {
        type: String,
        default: null
    },
    costPrice: {
        type: Number,
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
    },
    category: {
        type: String,
        required: false,
    },
    isActive:{
        type:Boolean,
        required: true,
        default:true},
        isSync:{
        type:Boolean,
        required: true,
        default:false}
}, {
    timestamps: true,
});

const Product = mongoose.model('Product', productSchema);

export default Product;
