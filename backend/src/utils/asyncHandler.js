// const asynchandler = (handler) => {
//     return (req, res, next) => {
//         Promise.resolve(
//             handler(req, res, next)
//         ).
//             catch(
//                 (err) => next(err) // next isliye if error next work should continue
//             )
//     }
// }



const asynchandler = (handler) => async (req, res, next) => {
    try {
        await handler(req, res, next)
    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message
        })
    }
}

export { asynchandler }