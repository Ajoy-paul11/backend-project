import mongoose from "mongoose";


const subscriptionSchema = mongoose.Schema({
    subscriber: {
        // One who is subscribing
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    channel: {
        // One to whom 'subscriber' is subscribing
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true })


export const Subscription = mongoose.model("Subscription", subscriptionSchema)