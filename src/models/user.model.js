import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,//remove whitespace from both ends of the string
        index: true //for faster search and retrieval of users by username
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullname:{
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar:{
        type: String, //cloudinary url
        required:true
    },
    coverImage:{
        type: String, //cloudinary url
    },
    watchHistory:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password:{
        type: String,
        required: [true, "Password is required"],
    },
    refreshToken:{
        type: String
    }
},{timestamps: true})

userSchema.pre("save", async function(next){  //pre save hook to hash the password before saving the user document to the database
    if(!this.isModified("password")){
        return next()
    }
    this.password=await bcrypt.hash(this.password, 10) //hash the password with a salt round of 10, which adds an extra layer of security to the hashed password
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){ //compare the provided password with the hashed password stored in the database using bcrypt's compare method, which returns true if the passwords match and false otherwise
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){//generate a JWT access token containing the user's id, email, username, and fullname as the payload, signed with a secret key and an expiration time defined in the environment variables
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname,
        },
        process.env.ACCESS_TOKN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)