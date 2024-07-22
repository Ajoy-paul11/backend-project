import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    //TODO: create playlist

    if ([name, description].some((field) => field.trim() === "")) {
        throw new ApiError(400, "Fields can't be empty. All fields are required")
    }

    const playlist = await Playlist.create(
        {
            name,
            description,
            owner: req.user?.id
        }
    )

    if (!playlist) {
        throw new ApiError(500, "Something occurred, Playlist can't be created.")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Playlist is created successfully")
        )

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "It's not a valid userId to get playlists")
    }

    const playlists = await Playlist.find({ owner: userId })

    if (!playlists) {
        throw new ApiError(500, "May be User has not made any playlists")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlists, "User playlists are fetched successfully")
        )

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "This is not a valid playlistId to fetch a playlist")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(500, "Something occurred, Can't get the playlist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Playlist fetched successfully")
        )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!playlistId) {
        throw new ApiError(400, "This is not a valid playlistId to Add video")
    }

    if (!videoId) {
        throw new ApiError(400, "This is not a valid videoId to add in the playlist")
    }

    const addVideoToPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $push: { videos: videoId } },
        { new: true }
    )

    if (!addVideoToPlaylist) {
        throw new ApiError(500, "Something occurred while adding the video into the playlist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, addVideoToPlaylist, "Video added successfully")
        )

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist

    if (!playlistId) {
        throw new ApiError(400, "This is not a valid playlistId to remove video")
    }

    if (!videoId) {
        throw new ApiError(400, "This is not a valid videoId to remove from playlist")
    }

    const removeVideoFromPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $pull: { videos: videoId } },
        { new: true }
    )

    if (!removeVideoFromPlaylist) {
        throw new ApiError(500, "Something occurred while removing video from playlist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, removeVideoFromPlaylist, "Removed video from playlist successfully")
        )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist

    if (!playlistId) {
        throw new ApiError(400, "This is not a valid playlistId to delete a playlist")
    }

    const deletePlaylist = await Playlist.findByIdAndDelete(playlistId)

    if (!deletePlaylist) {
        throw new ApiError(500, "Something went wrong while deleting the playlist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Playlist deleted successfully")
        )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "This is not a valid playlistId to update a playlist")
    }

    if (!name?.trim() || !description.trim()) {
        throw new ApiError(400, "All fields are required or fields can't be empty")
    }

    const updatePlaylistDetails = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description
            }
        },
        { new: true }
    )

    if (!updatePlaylistDetails) {
        throw new ApiError(500, "Something occurred while updating the details of the playlist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatePlaylistDetails, "Update the details of the playlist")
        )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}