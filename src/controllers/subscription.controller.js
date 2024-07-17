import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "It's not a valid channelId to subscribe")
    }

    const subscribed = await Subscription.findOne(
        {
            subscriber: req.user?._id,
            channel: channelId
        }
    )

    if (subscribed) {
        await Subscription.findByIdAndDelete(subscribed?._id)

        return res
            .status(200)
            .json(
                new ApiResponse(200, { isSubscribed: false }, "Unsubscribed the channel successfully")
            )
    }

    await Subscription.create(
        {
            subscriber: req.user?._id,
            channel: channelId
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, { isSubscribed: true }, "Channel subscribed successfully")
        )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "It's not a valid channelId to get Subscribers")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribersCount",
                pipeline: [
                    {
                        $lookup: "subscriptions",
                        localField: "_id",
                        foreignField: "channel",
                        as: "channelSubscriber"
                    },
                    {
                        $addFields: {
                            totalSubscribers: {
                                $size: "$channelSubscriber"
                            }
                        }
                    }
                ]
            }
        },
        {
            $project: {
                subscribers: {
                    totalSubscribed: 1
                }
            }
        }

    ])

    if (!subscribers?.length) {
        throw new ApiError(400, "No one has subscribed the channel yet")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, subscribers[0].subscribersCount, "Subscribers count fetched successfully")
        )

})



// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "It's not a valid subscriberId to get Channels")
    }

    const subscribedTo = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channels",

            }
        },
        {
            $addFields: {
                subscribedToChannels: {
                    $size: "$channels"
                }
            },
        },
        {
            $project: {
                subscribedToChannels: 1,
                username: 1,
                fullName: 1,
                avatar: 1
            }
        }
    ])

    if (!subscribedTo?.length) {
        throw new ApiError(400, "No channel has subscribedTo yet")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, subscribedTo[0], "All subscribedTo channels list fetched successfully")
        )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}