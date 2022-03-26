const router = require('express').Router();
const authController = require('../controllers/authController');
const middleWareController = require('../controllers/middleWareController');

router.post('/register',authController.register);

router.post('/login',authController.login);

router.post('/google_login',authController.googleLogin);

router.put('/change_password',middleWareController.verifyToken,authController.changePassword);

router.put('/change_avatar',middleWareController.verifyToken,authController.updateAvatar);

router.post('/addcart',middleWareController.verifyToken,authController.addCart);

router.post('/unaddcart',middleWareController.verifyToken,authController.unAddCart);

router.post('/forgot_password',authController.forgotPassword);

router.post('/logout',middleWareController.verifyToken,authController.logOut);

router.post('/active/:activetoken',authController.activeAccount);

router.post('/refresh',authController.refresh);

router.get('/me',middleWareController.verifyToken,authController.getUser);

module.exports = router;