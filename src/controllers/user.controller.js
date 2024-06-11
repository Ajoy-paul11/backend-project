import { asyncHandler } from "../utils/asyncHandler.js";


const registerUser = asyncHandler(async (req, res) => {
    res.status(200).json({
        message: "Testing the user controller method"
    })
})


export { registerUser }