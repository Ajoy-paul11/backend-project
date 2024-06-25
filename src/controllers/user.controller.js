import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"


const generateAccessAndFreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Failed to generate access and refresh token")
    }
}


const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation -- not empty
    // check if user is already exist - username, email
    // check for images, check for avatar
    // upload them to cloudinary, check successfully upload avatar 
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return the response

    const { username, email, fullName, password } = req.body
    // console.log("Email: ", email);
    // console.log("Password: ", password);
    // console.log(req.body);

    if ([username, email, fullName, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    // console.log(existedUser); --> It returns the user object that match

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    // console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }


    // console.log(avatarLocalPath);

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required for to server")
    }

    const user = await User.create(
        {
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        }
    )

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user !!!")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User register successfully")
    )

})


const loginUser = asyncHandler(async (req, res) => {
    // Get data from req.body
    // check if the user exists
    // password check
    // access and refresh token generate
    // send tokens in the cookie

    const { email, username, password } = req.body

    if (!(email || username)) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndFreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken,
                    // Here pass both tokens again because of that user 
                    // may store them in the localStorage or if you are building
                    // a mobile application where cookies are not available. 
                },
                "User logged In Successfully"
            )
        )
})


const logoutUser = asyncHandler(async (req, res) => {
    // Remove refreshToken
    // Clear cookies

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200, {}, "User logged Out"
            )
        )
})


const refreshAccessToken = asyncHandler(async (req, res) => {
    // Get the refreshToken from cookies or body
    // Verify the refreshToken and store the decoded token
    // Make a database call to find the user with token info
    // Throw error if User is not found
    // Compare the both cookie's and User's refreshToken token 
    // Call the Token generate function and hold the value
    // At last, return the response and create an endpoint in 
    // `user.routes` file

    const incomingRefreshToken = req.cookies.refreshToken ||
        req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh Token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is expired or used")
        }

        options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndFreshToken(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "AccessToken Refreshed Successfully"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message ||
            "Invalid Refresh Token")
    }
})


const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Old Password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password has changed Successfully"))
})


const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(200, req.user, "Current User fetched Successfully")
})


const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {
            new: true,
        }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Account details updated Successfully"
            )
        )
})


const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Error while updating on Avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Avatar image file updated successfully")
        )
})


const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage) {
        throw new ApiError(400, "Error while updating on Cover Image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Cover image file updated successfully")
        )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
}