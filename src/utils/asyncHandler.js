//****PROMISE METHOD
const asyncHandler =(requestHandler)=>{
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }  
}

export { asyncHandler }
//this method will take a async function resolve it and return it

















//****TRY CATCH METHOD 
//How to use high order function -> wo functions jo parameters bhi functions lete he aur return bhi function hi karte he
// const asyncHandler = () => {}
// const asyncHandler = (function) => {() => {}}
// const asyncHandler = (function) => async () => {}

// const asyncHandler = (function) => async (req, res, next) => {
//     try {
            // jo function pass karwaya he use execute karwa do
//         await function (req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }