/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */


import { connectDB } from "./config/connectDB";
import Awaiter from "./lib/core/Awaiter";
import { User } from "./models/user";


async function main() {
    try {
        await connectDB() ;
        await User.updateMany({} , { enhancedSettings : {
            blocked :[]
        }})
        
        return ;
    } catch (error) {
        console.error(error);

    }

}
main();


