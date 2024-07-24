import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cookie-parser'

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))

app.use(express.json({ limit: '16kb' }))

app.use(express.urlencoded({ extended: true, limit: '16kb' }))

app.use(express.static('public'))

app.use(cookieParser())

// Routes import 
import userRouter from "./routes/user.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import videoRouter from "./routes/video.routes.js"

// Routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/playlists", playlistRouter)
app.use("api/v1/videos", videoRouter)


// http://localhost:8000/api/v1/users/register


export { app }