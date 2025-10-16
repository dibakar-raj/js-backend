import {v2 as cloudinary} from  "cloudinary"
import fs from "fs"

    cloudinary.config({ 
        cloud_name: "dgmy4ren9" ,
        api_key: 473141645515214 ,
        api_secret: "oDd2zkW85AWED6R225r9Oirk3tw"
    });

    const uploadOncloudinary = async (localFilePath) => {
        try {
            if(!localFilePath) return null

            const response = await cloudinary.uploader.upload(localFilePath,{
                resource_type:"auto"
            })

            console.log("file is uploaded on cloudinary", response.url);
            fs.unlinkSync(localFilePath)
            return response;
            
        } catch (error) {
            if(fs.existsSync(localFilePath)){
            fs.unlinkSync(localFilePath) // remove the local saved 
            return null  
            }
        }
    }

    export {uploadOncloudinary}
    
     