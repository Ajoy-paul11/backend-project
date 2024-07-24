import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    if (!userId) {
        throw new ApiError(400, "userId is not valid for query to get videos")
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: {}
    }

    if (sortBy && sortType) {
        options.sort[sortBy] = sortBy === "desc" ? -1 : 1
    }

    const pipeline = []

    if (query) {
        pipeline.push(
            {
                $match: {
                    $or: [
                        { title: { $regex: query, $options: "i" } },
                        { description: { $regex: query, $options: "i" } }
                    ]
                }
            }
        )
    }

    if (userId) {
        pipeline.push(
            {
                $match: {
                    owner: mongoose.Types.ObjectId(userId)
                }
            }
        )
    }

    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1,
                        }
                    }
                ]
            }
        }
    )

    pipeline.push(
        {
            $match: {
                isPublished: true
            }
        }
    )

    try {
        const allVideos = await Video.aggregatePaginate(
            Video.aggregate(pipeline),
            options
        )

        if (allVideos?.length === 0) {
            return res
                .status(200)
                .json(
                    new ApiResponse(200, {}, "User did not post a video yet")
                )
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, allVideos.docs, "All videos fetched successfully")
            )
    } catch (error) {
        throw new ApiError(500, "Something occurred while paginate the videos")
    }

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}