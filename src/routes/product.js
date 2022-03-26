const router = require('express').Router();
const productController = require('../controllers/productController');
const middleWareControlller = require('../controllers/middleWareController');

router.get('/getall',productController.getAll);

router.get('/get/:slug',productController.getOneProduct);

router.post('/create',middleWareControlller.verifyAdmin,productController.createProduct);

router.put('/update/:slug',middleWareControlller.verifyAdmin,productController.updateProduct);

router.delete('/delete/:id',middleWareControlller.verifyAdmin,productController.deleteProduct);

module.exports = router;