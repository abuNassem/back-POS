import dotenv from "dotenv";
dotenv.config();
import request from "supertest";
import mongoose from "mongoose";
import app from "../app.js"; // تأكد أنك مصدّر app
import Product from "../product/ProductModel.js";
import Sale from "../sale/SaleModel.js";

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterEach(async () => {
  await Product.deleteMany();
  await Sale.deleteMany();
});

afterAll(async () => {
  await mongoose.connection.close();
});

test("should restore stock after deleting sale", async () => {
  const product = await Product.create({
    name: "Test Product",
    stock: 10,
    totalSales: 0,
    price: 5
  });

  const sale = await Sale.create({
    items: [
      {
        idProduct: product._id,
        quantity: 2,
        price: 5,
        name: "Test Product"
      }
    ],
    total: 10
  });

  product.stock -= 2;
  product.totalSales += 2;
  await product.save();

  await request(app).delete(`/api/sales/${sale._id}`);

  const updatedProduct = await Product.findById(product._id);

  expect(updatedProduct.stock).toBe(10);
  expect(updatedProduct.totalSales).toBe(0);
});

// test("should not update stock if sale fails", async () => {
//   const product = await Product.create({
//     name: "Test Product",
//     stock: 5,
//     totalSales: 0,
//     price: 5
//   });

//   try {
//     await request(app)
//       .post("/api/sales")
//       .send({
//         items: [
//           {
//             idProduct: product._id,
//             quantity: 10, // أكثر من المخزون
//             price: 5,
//             name: "Test Product"
//           }
//         ],
//         total: 50
//       });
//   } catch (err) {}

//   const updatedProduct = await Product.findById(product._id);

//   expect(updatedProduct.stock).toBe(5); // لم يتغير 🔥
// });

// test("should throw error when total is invalid (e.g., string 'abc')", async () => {
//   const product = await Product.create({
//     name: "Test Product",
//     stock: 10,
//     totalSales: 0,
//     price: 5
//   });

//   const res = await request(app)
//     .post("/api/sales")
//     .send({
//       items: [
//         {
//           idProduct: product._id,
//           quantity: 2,
//           price: 5,
//           name: "Test Product"
//         }
//       ],
//       total: "abc" // قيمة غير صالحة
//     });

//   // التوقعات الجديدة:
//   expect(res.status).toBe(400); // نتوقع فشل الطلب
//   expect(res.body.message).toContain("قيمة غير صالحة");
  
//   // التأكد من أن المخزون لم ينقص (لأن العملية يجب أن تتوقف)
//   const productAfterFail = await Product.findById(product._id);
//   expect(productAfterFail.stock).toBe(10); 
// });

// test("should fail if not enough stock", async () => {
//   const product = await Product.create({
//     name: "Test Product",
//     stock: 1,
//     totalSales: 0,
//     price: 5
//   });

//   const res = await request(app)
//     .post("/api/sales")
//     .send({
//       items: [
//         {
//           idProduct: product._id,
//           quantity: 5,
//           price: 5,
//           name: "Test Product"
//         }
//       ],
//       total: 25
//     });

//   expect(res.status).toBe(500);
//   expect(res.body.message).toContain("not enough");
// });

// test("should create sale successfully", async () => {

//   const product = await Product.create({
//     name: "Test Product",
//     stock: 10,
//     totalSales: 0,
//     price: 5
//   });

//   const res = await request(app)
//     .post("/api/sales")
//     .send({
//       items: [
//         {
//           idProduct: product._id,
//           quantity: 2,
//           price: 5,
//           name: "Test Product"
//         }
//       ],
//       total: 10,
//       paymentMethod: "cash"
//     });

//   expect(res.status).toBe(201);
//   expect(res.body.status).toBe("success");

//   const updatedProduct = await Product.findById(product._id);

//   expect(updatedProduct.stock).toBe(8);
//   expect(updatedProduct.totalSales).toBe(2);
// });


// test("should fail if items are empty", async () => {
//   const res = await request(app)
//     .post("/api/sales")
//     .send({
//       items: [],
//       total: 0
//     });

//   expect(res.status).toBe(400);
//   expect(res.body.errorCode).toBe("EMPTY_SALE_ITEMS");
// });

// test("should fail if product does not exist", async () => {
//   const fakeId = new mongoose.Types.ObjectId();

//   const res = await request(app)
//     .post("/api/sales")
//     .send({
//       items: [
//         {
//           idProduct: fakeId,
//           quantity: 1,
//           price: 10,
//           name: "Fake"
//         }
//       ],
//       total: 10
//     });

//   expect(res.status).toBe(500); // لأنك ترمي Error
//   expect(res.body.message).toContain("المنتج غير موجود");
// });