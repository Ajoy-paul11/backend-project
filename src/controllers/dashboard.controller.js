import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    try {
        const totalViews = await Video.aggregate([
            {
                $match: {
                    owner: mongoose.Types.ObjectId(req.user?._id)
                }
            },
            {
                $group: {
                    _id: null,
                    totalVideoViews: { $sum: "$views" },
                }
            },
            {
                $project: {
                    totalVideoViews: 1
                }
            }
        ])

        const subscribersCount = await Subscription.aggregate([
            {
                $match: {
                    channel: mongoose.Types.ObjectId(req.user?._id)
                }
            },
            {
                $group: {
                    _id: null,
                    totalSubscribers: { $sum: 1 },
                }
            },
            {
                $project: {
                    totalSubscribers: 1
                }
            }
        ])

        const totalVideosCount = await Video.aggregate([
            {
                $match: {
                    owner: mongoose.Types.ObjectId(req.user?._id)
                }
            },
            {
                $count: "totalVideos"
            }
        ])

        const totalLikesCount = await Like.aggregate([
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "allVideos"
                }
            },
            {
                $unwind: "$allVideos"
            },
            {
                $match: {
                    "videos.owner": mongoose.Types.ObjectId(req.user?._id)
                }
            },
            {
                $group: {
                    _id: null,
                    totalVideoLikes: { $sum: 1 },
                }
            },
            {
                $project: {
                    totalVideoLikes: 1
                }
            }
        ])

        const channelStatus = {
            totalViews: totalViews[0].totalVideoViews,
            subscribersCount: subscribersCount[0].totalSubscribers,
            totalVideosCount: totalVideosCount[0].totalVideos,
            totalLikesCount: totalLikesCount[0].totalVideoLikes
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, channelStatus, "Channel status fetched successfully")
            )
    } catch (error) {
        throw new ApiError(500, "Something occurred while fetching the channel status")
    }
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    try {
        const videos = await Video.find({ owner: req.user?._id })

        if (videos.length > 0) {
            return res
                .status(200)
                .json(new ApiResponse(200, videos, "All videos of the channel fetched successfully"))
        } else {
            return res
                .status(200)
                .json(new ApiResponse(200, {}, "No video has posted yet by the channel"))
        }
    } catch (error) {
        throw new ApiError(500, "Something occurred while fetching the videos")
    }



})

export {
    getChannelStats,
    getChannelVideos
}