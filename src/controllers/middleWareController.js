const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

class middlewareController{
    verifyToken(req,res,next){
        try{
            const token = req.headers.token;
            if(!token){
                return res.status(400).json({msg:"Please login or register."});
            }
            const accessToken = token.split(" ")[1];
            
            jwt.verify(accessToken,process.env.ACCESS_TOKEN,(err,user)=>{
                if(err){
                    return res.status(400).json({msg:"Please login or register."});
                }
                req.user = user;
                next();
            })
        }
        catch(err){
            return res.status(500).json({msg:err.message});
        }
    }
    verifyAdmin(req,res,next){
        try{
            const token = req.headers.token;
            if(!token){
                return res.status(400).json({msg:"Please login or register."});
            }
            const accessToken = token.split(" ")[1];
            
            jwt.verify(accessToken,process.env.ACCESS_TOKEN,async (err,user)=>{
                if(err){
                    return res.status(400).json({msg:"Please login or register."});
                }
                
                const newUser = await User.findById(user.id);
                if(!newUser){
                    return res.status(400).json({msg:"Token is not valid."});
                }
                if(!newUser.rule === 1){
                    return res.status(400).json({msg:"Admin resouces."});
                }
                next();
            })
        }
        catch(err){
            return res.status(500).json({msg:err.message});
        }
    }
}

module.exports = new middlewareController;