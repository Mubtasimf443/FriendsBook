/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { log } from "console";
import { connectDB } from "./config/connectDB";
import VideoProfile from "./models/VideoProfile";

async function main() {
    try {
        await connectDB();
        let updated= await VideoProfile.updateMany({} , { 
            "profileImage.url" :"https://placehold.co/600x400/png",
            "profileImage.id" : "9a9a8b74-f286-4e4d-a54c-bcde5feeb2fb",
            "coverImage.url" : "https://placehold.co/600x400/png",
            "coverImage.id" :"9a9a8b74-f286-4e4d-a54c-bcde5feeb2fb"
        });
        log(updated)
    } catch (error) {
        console.error(error);
    }
}
main()