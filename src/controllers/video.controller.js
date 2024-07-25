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

        if (allVideos?.docs?.length === 0) {
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

    if (!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "All Fields are required or can't be empty")
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if (!videoFileLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "VideoFile and Thumbnail are required to process further")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoFile || !thumbnail) {
        throw new ApiError(400, "Both videoFile and thumbnail are required for server")
    }

    const video = await Video.create(
        {
            title,
            description,
            videoFile: videoFile.url,
            thumbnail: thumbnail.url,
            duration: videoFile.duration,
            owner: req.user?._id,
        }
    )

    if (video) {
        throw new ApiError(500, "Something occurred while uploading video and thumbnail")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "Video and Thumbnail published successfully")
        )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "This is not valid videoId to get video")
    }

    // await Video.findById(videoId).where("isPublished").equals(true)
    // const video = await Video.findById(videoId).populate("owner")
    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "video fetched successfully")
        )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const { title, description } = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "This is not a valid videoId to update details")
    }

    if (!(title && description)) {
        throw new ApiError(400, "Both Title and Description required to update")
    }

    const video = await Video.findById(videoId)

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Only owner of the video can able to update it's details")
    }

    const thumbnailLocalPath = req.file?.path

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail field is missing")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail failed to upload in cloudinary")
    }

    const videoUpdate = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: thumbnail.url
            }
        },
        { new: true }
    )

    if (!videoUpdate) {
        throw new ApiError(500, "Something occurred while updating the details of video")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, videoUpdate, "Video details updated successfully")
        )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "This is not a valid videoId to delete a video")
    }

    const getVideo = await Video.findById(videoId)

    if (!getVideo) {
        throw new ApiError(404, "Video not found")
    }

    if (getVideo?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Only owner of the video file can delete the video")
    }

    const deleteVideo = await Video.findByIdAndDelete(videoId)

    if (!deleteVideo) {
        throw new ApiError(500, "Something occurred while deleting the video")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Video file deleted successfully")
        )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (isValidObjectId(videoId)) {
        throw new ApiError(400, "This not a valid videoId to toggle publish")
    }

    const getVideo = await Video.findById(videoId)

    if (!getVideo) {
        throw new ApiError(404, "Video not found")
    }

    if (getVideo.owner.toString() !== req.user?._id) {
        throw new ApiError(400, "Only owner can toggle the video status")
    }

    getVideo.isPublished = !getVideo.isPublished

    await getVideo.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(200, { isPublished: getVideo.isPublished }, "Video toggle status changed")
        )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}