import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video

    const userId = req.user?._id

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "The videoId is not appropriate")
    }

    const alreadyLiked = await Like.findOne(
        {
            video: videoId,
            likedBy: userId
        }
    )

    if (alreadyLiked) {
        await Like.findByIdAndDelete(alreadyLiked?._id)

        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, "Like remove from the video successfully")
            )
    }

    await Like.create(
        {
            video: videoId,
            likedBy: userId
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, { isLiked: true }, "Video is liked successfully")
        )

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment

    const userId = req.user?._id

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "CommentId is not valid!")
    }

    const likedTheComment = await Like.findOne(
        {
            comment: commentId,
            likedBy: userId
        }
    )

    if (likedTheComment) {
        await Like.findByIdAndDelete(likedTheComment?._id)

        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, "Removed the Like from comment")
            )
    }

    await Like.create(
        {
            comment: commentId,
            likedBy: userId
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, { isLiked: true }, "Like is added to the comment successfully")
        )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet

    const userId = req.user?._id

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(200, "TweetId is not valid")
    }

    const likedTheTweet = await Like.findOne(
        {
            tweet: tweetId,
            likedBy: userId
        }
    )

    if (likedTheTweet) {
        await Like.findByIdAndDelete(likedTheTweet?._id)

        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, "Remove like from the Tweet")
            )
    }

    await Like.create(
        {
            tweet: tweetId,
            likedBy: userId
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, { isLiked: true }, "Like the tweet successfully")
        )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user?._id

    const totalLikedVideos = await Like.aggregate([
        {
            $match: { likedBy: new mongoose.Types.ObjectId(userId) }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        avatar: 1,
                                        username: 1,
                                        fullName: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: { $arrayElemAt: ["$owner", 0] }
                        }
                    }
                ]
            }
        },

    ])

    console.log(totalLikedVideos);
    console.log(totalLikedVideos.likedVideos[0]);

    return res
        .status(200)
        .json(
            new ApiResponse(200, totalLikedVideos.likedVideos[0], "Liked videos fetched successfully")
        )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}