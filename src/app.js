import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
const app=express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true 
}))

app.use(express.json({limit: '16kb'}))// For parsing application/json with a size limit of 16kb
app.use(express.urlencoded({extended: true, limit: '16kb'}))// For parsing application/x-www-form-urlencoded
app.use(express.static('public'))// For serving static files from the 'public' directory(store data on the server)
app.use(cookieParser())// For parsing cookies

//import routes
import userRoutes from './routes/user.routes.js';

//user routes
app.use("/api/v1/users", userRoutes);

export default app;