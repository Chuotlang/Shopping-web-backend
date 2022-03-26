const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendMail = require('./sendMail');
const Product = require('../models/productModel');
const {google} = require('googleapis');
const {OAuth2} = google.auth;


const client = new OAuth2(process.env.MAILING_CLIENT_ID);

const url = "https://testingone.netlify.app"
class authController{
    async register(req,res){
        try{
            const {email,name,password} = req.body;
            if(!name || !email || !password){
                return res.status(400).json({msg:"Please fill in all fields."});
            }
            const user = await User.findOne({email});
            if(user){
                return res.status(400).json({msg:"Account is exist now."});
            }
            if(!validateEmail(email)){
                return res.status(400).json({msg:"Email is not valid form."});
            }
            const hashedPassword = await bcrypt.hash(password,10);
            const newUser = new User({
                email,
                name,
                password:hashedPassword
            });
            const activityToken = createActivityToken({newUser});
            const newUrl = `${url}/user/active/${activityToken}`;
            sendMail(email,newUrl,"Active email.");
            res.status(200).json({msg:"Please, check your email."});
        }
        catch(err){
            return res.status(500).json({msg:err.message});
        }
    }

    activeAccount(req,res){
        try{
            const {activetoken} = req.params;
            jwt.verify(activetoken,process.env.ACTIVE_TOKEN,async (err,user)=>{
                if(err) 
                {
                    return res.status(400).json({msg:"Please register."});
                }    
                const newUser = await User({
                    name:user.newUser.name,
                    email:user.newUser.email,
                    password:user.newUser.password
                });
                await newUser.save();
                res.status(200).json({msg:"Active success."});
            })
        }
        catch(err){
            return res.status(500).json({msg:err.message});
        }
    }

    async login(req,res){
        try{
            const {email,password} = req.body;
            const user = await User.findOne({email});
            if(!user){
                return res.status(400).json({msg:"Account is not exist."});
            }
            const validPassword = await bcrypt.compare(password,user.password);
            if(!validPassword){
                return res.status(400).json({msg:"Password is not correct."});
            }

            const accessToken = createAccessToken(user);
            const refreshToken = createRefreshToken(user);
            res.cookie("refreshToken",refreshToken,{
                httpOnly:true,
                secure:true,
                path:"/",
                sameSite:"Strict"
            });
            res.status(200).json({accessToken,msg:"Login Success."});
        }
        catch(err){
            return res.status(500).json({msg:err.message});
        }
    }

    async logOut(req,res){
        try{
            res.clearCookie("refreshToken");
            res.status(200).json({msg:"Log out success."});
        }
        catch(err){
            return res.status(500).json({msg:err.message});
        }
    }

    refresh(req,res){
        try{
            const refreshToken = req.cookies.refreshToken;
            if(!refreshToken){
                return res.status(400).json({msg:"You need to login."});
            }
            jwt.verify(refreshToken,process.env.REFRESH_TOKEN,async (err,user)=>{
                if(err){
                    res.status(400).json({msg:"Token is not valid."});
                }
                const newUser = await User.findById(user.id);
                if(!newUser){
                    return res.status(400).json({msg:"Account is not exist."});
                }
                const accessToken = createAccessToken(newUser);
                const newRefreshToken = createRefreshToken(newUser);
                res.cookie("refreshToken",newRefreshToken,{
                    httpOnly:true,
                    secure:true,
                    path:"/",
                    sameSite:"Strict"
                });
                res.status(200).json({accessToken});
            })

        }
        catch(err){
            return res.status(500).json({msg:err.message});
        }
    }

    async getUser(req,res){
        try{
            const user = await User.findById(req.user.id).select("-password");
            if(!user){
                return res.status(400).json({msg:"Account is not exist."});
            }
            return res.status(200).json({user});
        }
        catch(err){
            return res.status(500).json({msg:err.message});
        }
    }
    
    async changePassword(req,res){
        try{
            const {password} = req.body;
            const hashedPassword = await bcrypt.hash(password,10);
            await User.findByIdAndUpdate(req.user.id,{password:hashedPassword});
            return res.status(200).json({msg:"Change Password successfully."});

        }
        catch(err){
            return res.status(500).json({msg:err.message});
        }
    }

    async forgotPassword(req,res){
        try{
            const {email} = req.body;
            const user = await User.findOne({email});
            if(!user){
                return res.status(400).json({msg:"Account is not exist."});
            }
            const accessToken = createAccessToken(user);

            const newUrl = `${url}/forgot/${accessToken}`;

            sendMail(email,newUrl,"Forgot Password.");

            return res.status(200).json({msg:"please check your email."});
        }
        catch(err){
            return res.status(500).json({msg:err.message});
        }
    }

    async updateAvatar(req,res){
        try{
            const {avatar} = req.body;
            await User.findById(req.user.id,{avatar});
        }
        catch(err){
            return res.status(500).json({msg:err.message});
        }
    }

    async addCart(req,res){
        try{
            const {productId} = req.body;
            const user = await User.findById(req.user.id);
            const product = await Product.findById(productId);
            user.cart.push(product);
            await User.findByIdAndUpdate(user._id,user);
            return res.status(200).json({msg:"Add product successfully."});
        }
        catch(err){
            return res.status(500).json({msg:err.message});
        }
    }

    async unAddCart(req,res){
        try{
            const {productId} = req.body;
            const user = await User.findById(req.user.id);
            user.cart = user.cart.filter(items => items._id != productId);
            await User.findByIdAndUpdate(user._id,{
                cart:user.cart
            });
            return res.status(200).json({msg:"Move product out of your cart successfully."});
        }
        catch(err){
            return res.status(500).json({msg:err.message});
        }
    }

    async googleLogin(req,res){
        try{
            const {tokenId} = req.body;
            const verify = await client.verifyIdToken({idToken:tokenId,audience:process.env.MAILING_CLIENT_ID});
            
            const {email,email_verified,name,picture} = verify.payload;
            const password = email + process.env.GOOGLE_PASSWORD;

            const hashed = await bcrypt.hash(password,10);
            if(!email_verified){
                return res.status(400).json({msg:"Email verified fail."});
            }
            const user = await User.findOne({email});
            if(user){
                const isMatch = await bcrypt.compare(hashed,user.password);
                if(!isMatch){
                    return res.status(400).json({msg:"Password is not correct."});
                }
                const accessToken = createAccessToken(user);
                const refreshToken = createRefreshToken(user);
                res.cookie("refreshToken",refreshToken,{
                    httpOnly:true,
                    secure:true,
                    path:"/",
                    sameSite:"Strict"
                });
                res.status(200).json({accessToken,msg:"Login Success."});
            }
            else{
                const newUser = new User({email,password:hashed,avatar:picture,name});
                await newUser.save();
                const newaccessToken = createAccessToken(user);
                const newrefreshToken = createRefreshToken(user);
                res.cookie("refreshToken",newrefreshToken,{
                    httpOnly:true,
                    secure:true,
                    path:"/",
                    sameSite:"Strict"
                });
                res.status(200).json({newaccessToken,msg:"Login Success."});
            }

        }   
        catch(err){
            return res.status(500).json({msg:err.message});
        }
    }

}
const validateEmail = (email) => {
  return email.match(
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
};

function createActivityToken(user){
    return jwt.sign(user,process.env.ACTIVE_TOKEN,{expiresIn:"10m"});
}
function createAccessToken(user){
    return jwt.sign({id:user._id},process.env.ACCESS_TOKEN,{expiresIn:"1d"});
}
function createRefreshToken(user){
    return jwt.sign({id:user._id},process.env.REFRESH_TOKEN,{expiresIn:"7d"});
}
module.exports = new authController;