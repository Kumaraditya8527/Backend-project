import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
//conneectionInstance is an object that contains the connection details of the database. It is returned by the mongoose.connect() method. We can use this object to get the host name of the database and log it to the console.
const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log(`MONGO DB connected:${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("Error connecting to database:", error);
        process.exit(1); // Exit the process with an error code
    }
};

export default connectDB;