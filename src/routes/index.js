const auth = require('./auth');
const admin = require('./admin');
const product = require('./product');

function router(app){
    app.use('/auth',auth);
    app.use('/admin',admin);
    app.use('/product',product);
}

module.exports = router;