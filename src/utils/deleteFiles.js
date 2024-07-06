import fs from "fs"
import { ApiError } from "./ApiError.js"



const unLinkFile = async (localFile) => {
    try {
        fs.unlinkSync(localFile)
    } catch (error) {
        throw new ApiError(501, "Error while deleting the file from local DB")
    }
}


export { unLinkFile }