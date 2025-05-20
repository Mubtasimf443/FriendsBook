/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { log } from "console";
import { connectDB } from "./config/connectDB";
import VideoProfile from "./models/VideoProfile";

async function main() {
    try {
        await connectDB();
       

    } catch (error) {
        console.error(error);
    }
}
main()