import mongoose from 'mongoose';

const saleSchema = mongoose.Schema({
    items: [{
        idProduct: {
            type: String,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        name: {
            type: String,
            required: true
        }
    }],
    total: {
        type: Number,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card'],
        default: 'cash',
    },
}, {
    timestamps: true,
});

const Sale = mongoose.model('Sale', saleSchema);

export default Sale;
