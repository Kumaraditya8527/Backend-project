const asyncHandler=(requestHandler)=>{
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err));
    }
}

export default asyncHandler;

// const asyncHandler=()=>{}
// const asyncHandler=(fn)=>{()=>{}}
// const asyncHandler=(fn)=>()=>{} //higher order function that takes a function as an argument and returns a new function that wraps the original function in a try-catch block to handle errors in asynchronous code. This is commonly used in Express.js to handle errors in route handlers without having to write try-catch blocks in every route handler.

//using try catch 
// const asyncHandler=(fn)=>async (req,res,next)=>{
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         });
//     }
// }