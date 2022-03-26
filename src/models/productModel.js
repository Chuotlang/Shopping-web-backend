const mongoose = require('mongoose');
const schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

mongoose.plugin(slug);
const productSchema = new schema({
    title:{
        type:String,
        required:true,
        trim:true
    },
    description:{
        type:String,
    },
    categary:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    sold:{
        type:Number,
        required:true
    },
    slug:{
        type:String,
        slug:"title"
    }
},{
    timestamps:true
});
productSchema.index({categary:"text",title:"text"});

const product = mongoose.model("Products",productSchema);

product.createIndexes({categary:"text",title:"text"});

module.exports = product;