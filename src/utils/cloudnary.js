import {v2 as cloudinary} from  "cloudinary"
import fs from "fs"

    cloudinary.config({ 
        cloud_name: 
        api_key: 
        api_secret:  

    });

    const uploadOncloudinary = async (localFilePath) => {
        try {
            if(!localFilePath) return null

            const response = await cloudinary.uploader.upload(localFilePath,{
                resource_type:"auto"
            })

            console.log("file is uploaded on cloudinary", response.url);
            fs.unlinkSync(localFilePath)
            return response
            
        } catch (error) {
            if(fs.existsSync(localFilePath)){
            fs.unlinkSync(localFilePath) // remove the local saved 
            return null  
            }
        }
    }

    export {uploadOncloudinary}
    
     