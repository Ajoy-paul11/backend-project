import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet

    const { content } = req.body

    if (!content?.trim()) {
        throw new ApiError(400, "Tweet field can't be empty!")
    }

    const tweet = await Tweet.create(
        {
            content,
            owner: req.user?._id,
        }
    )

    if (!tweet) {
        throw new ApiError(500, "Something went wrong while creating the tweet")
    }

    return res
        .status(201)
        .json(
            new ApiResponse(200, tweet, "tweet is created successfully")
        )

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    const { userId } = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "User id is not appropriate")
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $project: {
                content: 1
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(200, tweets[0], "All tweets are fetched successfully")
        )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    const { tweetId } = req.params
    const { content } = req.body

    if (!content?.trim()) {
        throw new ApiError(400, "Content field can't be empty!")
    }

    const getTweet = await Tweet.findById(tweetId)

    if (getTweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(401, "Only owner of this tweet can update the tweet")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            content
        },
        {
            new: true
        }

    )

    if (!updatedTweet) {
        throw new ApiError(500, "Something went wrong while updating the tweet")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedTweet, "Tweet updated successfully")
        )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId to delete")
    }

    const getTweet = await Tweet.findById(tweetId)

    if (!getTweet) {
        throw new ApiError(400, "Tweet is not found")
    }

    if (getTweet?.owner !== req.user?._id) {
        throw new ApiError(401, "Only owner of this tweet can delete the tweet")
    }

    await Tweet.findByIdAndDelete(tweetId)

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Tweet is deleted successfully")
        )

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}