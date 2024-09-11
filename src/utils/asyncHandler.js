//****PROMISE METHOD
const asyncHandler =(requestHandler)=>{
    (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    } 
}

export { asyncHandler }

















//****TRY CATCH METHOD 
//How to use high order function
// const asyncHandler = () => {}
// const asyncHandler = (function) => {() => {}}
// const asyncHandler = (function) => async () => {}

// const asyncHandler = (function) => async (req, res, next) => {
//     try {
//         await function (req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }