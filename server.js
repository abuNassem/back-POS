import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import productRoutes from './product/productRoutes.js';
import saleRoutes from './sales/saleRoutes.js';
import overviewRoutes from './overview/overViewRouter.js';
import userRoutes from './user/userRouter.js';
import { health } from './health/healthPing.js';



dotenv.config();

connectDB();

const app = express();

app.use(cors({
    origin: ['http://localhost:3000','https://sypos.netlify.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use('/api/product', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/overview', overviewRoutes);
app.use('/api/user',userRoutes);
app.use('/api/health',health);




app.use(notFound);
app.use(errorHandler);

const PORT =  5000;

app.listen(PORT, console.log(`Server running in ${PORT}mode on port `));
