import request from 'supertest';
import dotenv from "dotenv";
dotenv.config();
import mongoose from 'mongoose';
import express from 'express';
// ملاحظة: تأكد من صحة المسارات النسبية (../) بناءً على مكان ملف التست
import productRoutes from '../product/productRoutes.js'; 
import Product from '../product/ProductModel.js';
import MongoMemoryServer from 'mongodb-memory-server-core';

const app = express();
app.use(express.json());
app.use('/api/products', productRoutes);

let mongoServer;

beforeAll(async () => {
   
    await mongoose.connect(process.env.MONGO_URI);
});

// إغلاق الاتصال بعد الانتهاء
afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
});

// تنظيف البيانات بين كل اختبار وآخر لضمان استقلالية الاختبارات
afterEach(async () => {
    await Product.deleteMany({});
});

describe('Advanced Product Tests', () => {

   test('Bulk Import - Should handle duplicate barcodes gracefully', async () => {
    // 1. إضافة منتج مسبقاً بنفس الباركود
    await Product.create({ name: "Original", barcode: 101, price: 10, stock: 10, category: "cat", isActive: true });

    const bulkData = {
        mode: 'strict',
        products: [
            { name: "New Item", price: 20, stock: 5, barcode: 101, category: "cat" } // باركود مكرر
        ]
    };

    const res = await request(app).post('/api/products/import').send(bulkData);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.successCount).toBe(0);
    expect(res.body.data.totalFailed).toBe(1); // يجب أن يتم احتسابه كفشل بسبب التكرار
});
});;