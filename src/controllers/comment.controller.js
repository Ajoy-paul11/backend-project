import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId to fetch comments!")
    }

    const getVideo = await Video.findById(videoId)

    if (!getVideo) {
        throw new ApiError(400, "Video not found to fetch the all the comments")
    }

    try {

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            paginate: true
        }

        const allComments = Comment.aggregate(
            [
                {
                    $match: {
                        video: new mongoose.Types.ObjectId(videoId)
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner"
                    }
                },
                {
                    $lookup: {
                        from: "likes",
                        localField: "_id",
                        foreignField: "comment",
                        as: "likes"
                    }
                },
                {
                    $addFields: {
                        likesCount: {
                            $size: "$likes"
                        },
                        owner: {
                            // $arrayElemAt: ["$owner", 0]
                            $first: "$owner"
                        },
                        isLiked: {
                            $cond: {
                                if: {
                                    $in: [req.user._id, "$likes.likedBy"]
                                },
                                then: true,
                                else: false
                            }
                        }

                    }
                },
                {
                    $project: {
                        content: 1,
                        likesCount: 1,
                        owner: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        },
                        isLiked: 1
                    }
                }
            ]
        )

        const comments = await Comment.aggregatePaginate(
            allComments,
            options
        )

        return res
            .status(200)
            .json(
                new ApiResponse(200, comments.docs, "Comments fetched successfully")
            )

    } catch (error) {
        throw new ApiError(501, error.message || "Error occurred while fetching the comments from the video ")
    }

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    const { videoId } = req.params
    const { content } = req.body

    if (!content?.trim()) {
        throw new ApiError(400, "Content field of comment can't be empty")
    }

    const getVideo = await Video.findById(videoId)

    if (!getVideo) {
        throw new ApiError(400, "Video not found to add any comment")
    }

    const comment = await Video.create(
        {
            content,
            video: videoId,
            owner: req.user?._id
        }
    )

    if (!comment) {
        throw new ApiError(500, "Something occurred while adding a comment")
    }

    return res
        .status(201)
        .json(
            new ApiResponse(200, comment, "Comment added successfully")
        )

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const { commentId } = req.params
    const { content } = req.body

    if (!isValidObjectId(commentId)) {
        throw new ApiResponse(400, "This is not a valid commentId")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(400, "Comment not found to update")
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Content field of comment can't be empty")
    }

    if (comment?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not the owner to update this comment")
    }

    const commentUpdate = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content
            }
        },
        {
            new: true
        }
    )

    if (!commentUpdate) {
        throw new ApiError(500, "Something went wrong while updating the comment")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, commentUpdate, "Comment updated successfully")
        )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "This is not a valid commentId to delete the comment")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(400, "Comment not found to delete")
    }

    if (comment?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "You are not the owner to delete this comment")
    }

    const commentDeleted = await Comment.findByIdAndDelete(
        commentId
    )

    if (!commentDeleted) {
        throw new ApiError(500, "Something went wrong while updating the comment")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Comment deleted successfully")
        )
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}