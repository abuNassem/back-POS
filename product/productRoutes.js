import express from 'express';
import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    getPopulated,
    deleteManyProducts,
    bulkImportProducts,
    syncProductsStatus,
    getSyncProduct,
    getProductById,
} from './productController.js';

const router = express.Router();

router.get('/search', searchProducts);
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.get('/populated/get', getPopulated);
router.post('/import',bulkImportProducts);
router.post('/deleteMany',deleteManyProducts);
router.put('/sync/saveLocal',syncProductsStatus);
router.get('/sync/product', getSyncProduct);







export default router;
