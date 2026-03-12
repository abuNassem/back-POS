import express from 'express';
import { createSale, getSales, deleteSale, updateSale, updateProductStock } from '../controllers/saleController.js';

const router = express.Router();

router.route('/').get(getSales).post(createSale)
router.route('/:id').delete(deleteSale).put(updateSale)
router.route('/product/updateStock').put(updateProductStock)

export default router;
