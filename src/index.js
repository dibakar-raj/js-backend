import dotenv from "dotenv"
import connectDB from "./db/connectDB.js";
//import mongoose from "mongoose";
//import { DB_NAME } from "./constants.js";

dotenv.config({
    path:'./env'
})

 
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 ,() => {
        console.log(`server is running at port :${process.env.PORT}`);     
    })
})
.catch((err)=>{
    console.log("mongodb connection failed",err);
})

/*;(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log("connected");
        
    } catch (error) {
        console.log("ERROR :",error);
        throw err
    }
})()*/