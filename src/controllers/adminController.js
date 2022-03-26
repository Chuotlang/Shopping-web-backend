const User = require('../models/userModel');

class ApiRequest{
    constructor(query,queryString){
        this.query = query;
        this.queryString = queryString;
    }

    sorting(){
        const sort = this.queryString.sort || '-createdAt';
        this.query = this.query.sort(sort);
        return this;
    }

    paginating(){
        const page = this.queryString.page*1 || 1;
        const limit = this.queryString.limit*1 || 9 ;
        const skip = limit*(page-1);
        this.query = this.query.limit(limit).skip(skip);
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

    filtering(){
        const Obj = {...this.queryString};
        const exclueFields = ['sort','limit','page','search'];
        exclueFields.forEach(el => delete(Obj[el]));

        let ObjStr = JSON.stringify(Obj);
        ObjStr = ObjStr.replace(/\b(gte|gt|lt|lte|regex)\b/g,match => '$' + match);

        this.query = this.query.find(JSON.parse(ObjStr));
        return this;
    }

}

class adminController{
    async getAllUser(req,res){
        try{
            const apiRequest = new ApiRequest(User.find(),req.query).filtering().paginating().sorting().searching();

            const result = await Promise.allSettled([
                apiRequest.query,
                User.countDocuments()
            ]);

            const user = result[0].status === "fulfilled" ? result[0].value : [];
            const count = result[1].status == "fulfilled" ? result[1].value : 0;
            return res.status(200).json({user,count});
        }
        catch(err){
            return res.status(500).json({msg:err.message});
        }
    }
}

module.exports = new adminController;