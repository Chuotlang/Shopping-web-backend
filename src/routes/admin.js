const router = require('express').Router();
const adminController = require('../controllers/adminController');
const middleWareController = require('../controllers/middleWareController');

router.get('/users',middleWareController.verifyAdmin,adminController.getAllUser);

module.exports = router;