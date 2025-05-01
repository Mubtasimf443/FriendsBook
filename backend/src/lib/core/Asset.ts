/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { destroyCloudinaryFile, uploadImagesToCloudinary, uploadVideoToCloudinary } from "../../config/cloudinary";


export async function UploadVideoAsset(path :string , folder : string ='') {
    let response =await uploadImagesToCloudinary({path , folder});
    return response;
}

export async function UploadImageAsset(path :string , folder : string ='') {
    let response =await uploadVideoToCloudinary({path , folder});
    return response;
}

export async function detroyAsset(id : string) {
    let response =await destroyCloudinaryFile(id);
    return response;
}