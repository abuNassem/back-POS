import express from 'express';
import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    getPopulated,
} from '../controllers/productController.js';

const router = express.Router();

router.get('/search', searchProducts);
router.get('/', getProducts);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.get('/populated', getPopulated);


export default router;
