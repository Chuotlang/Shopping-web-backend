const Product = require('../models/productModel');

class productApi{
    constructor(query,queryString){
        this.query = query;
        this.queryString = queryString;
    }

    paginating(){
        const page = this.queryString.page*1 || 1;
        const limit = this.queryString.limit*1 || 12;
        const skip = limit*(page-1);
        this.query = this.query.limit(limit).skip(skip);
        return this;
    }

    sorting(){
        const sort = this.queryString.sort || '-createdAt';
        this.query = this.query.sort(sort);
        return this;
    }

    searching(){
        const search = this.queryString.search;
        if(search){
            this.query = this.query.find({
                $text:{
                    $search:search
                }
            })
        }
        else{
            this.query = this.query.find();
        }
        return this;
    }

    fiflering(){
        const obj = {...this.queryString};
        const exclueFields = ['sort','page','limit','search'];
        exclueFields.forEach(el => delete(obj[el]));
        
        let objStr = JSON.stringify(obj);

        objStr = objStr.replace(/\b(gte|gt|lte|lt|regex)\b/g,match => '$' + match);

        this.query = this.query.find(JSON.parse(objStr));
        return this;
    }
}
class productController{
    async getAll(req,res){
        try{
            const api = new productApi(Product.find(),req.query).sorting().fiflering().searching().paginating();

            const result = await Promise.allSettled([
                api.query,
                Product.countDocuments()
            ]);

            const product = result[0].status === "fulfilled" ? result[0].value : [];
            const count = result[1].status === 'fulfilled' ? result[1].value : 0;
            res.status(200).json({product,count});
        }
        catch(err){
            return res.status(500).json({msg:err.message});
        }
    }

    async createProduct(req,res){
        try{
            const {title,description,categary,image,price,sold} = req.body;

            const product = new Product({
                title,description,categary,image,price,sold
            });
            await product.save();
            return res.status(200).json({msg:"Create Product successful."});
        }  
        catch(err){
            return res.status(500).json({msg:err.message});
        }
    }
    async deleteProduct(req,res){
        try{
            await Product.findByIdAndDelete(req.params.id);
            return res.status(200).json({msg:"delete successfully."});
        }
        catch(err){
            return res.status(500).json({msg:err.message});
        }
    }
    async updateProduct(req,res){
        try{
            const {title,description,categary,image,price,sold} = req.body;

            await Product.findOneAndUpdate({slug:req.params.slug},{
                title,description,categary,image,price,sold
            });
            return res.status(200).json({msg:"Update successfully."});
        }
        catch(err){
            return res.status(500).json({msg:err.message});
        }
    }
    async getOneProduct(req,res){
        try{
            const {slug} = req.params;
            const product = await Product.findOne({slug});
            if(!product){
                return res.status(400).json({msg:"Product is not exist."});
            }
            return res.status(200).json(product);
        }
        catch(err){
            return res.status(500).json({msg:err.message});
        }
    }
}

module.exports = new productController;