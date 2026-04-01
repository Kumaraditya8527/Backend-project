// require("dotenv").config({path:"./.env"});
import {} from "dotenv/config";
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({path:"./.env"});

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
    });
})
.catch((error)=>{
    console.error("Error connecting to database:", error);
});


/*
import e from "express";

const app=e();
//connecting to database
(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        app.once("Error",(e)=>{
            console.log("Error:",e);
            throw e;
        });

        app.listen(process.env.PORT,()=>{
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    } catch (error) {
        console.log("Error connecting to database",error);
        throw error;
    }
})()
*/