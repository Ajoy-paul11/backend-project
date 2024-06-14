// require('dotenv').config({path: './env'}) 

import { app } from './app.js';
import connectDB from './db/index.js';
import dotenv from 'dotenv'

dotenv.config({
    path: './.env'
})

connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log("ERROR: ", error);
            throw error
        })

        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running at port ${process.env.PORT}`);
        })
    })
    .catch((err) => {
        console.log("Mongo DB connection failed!! ", err)
    })




/*
import express from 'express';
const app = express();
; (async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

        app.on('error', (error) => {
            console.log("ERROR: ", error);
            throw error;
        })

        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.error("ERROR is: ", error);
        throw error;
    }
})()
*/