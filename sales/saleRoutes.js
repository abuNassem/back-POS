import express from 'express';
import { createSale, getSales, deleteSale, updateSale, updateProductStock, syncSale } from './saleController.js';

const router = express.Router();

router.route('/').get(getSales).post(createSale)
router.route('/:id').delete(deleteSale).put(updateSale)
router.route('/product/updateStock').put(updateProductStock)
router.route('/sync').post(syncSale)


export default router;
