import express from 'express';
import { createSale, getSales } from '../controllers/saleController.js';

const router = express.Router();

router.route('/').post(createSale).get(getSales);

export default router;
