/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */


import { log } from "console";
import { connectDB } from "./config/connectDB";
import Awaiter from "./lib/core/Awaiter";
import { User } from "./models/user";


async function main() {
    try {
        await connectDB() ;
        let data=await User.updateMany({'isSuspended' : false  } , { 'isSuspended' : undefined  , "suspension.isSuspended" : false}) ;

log(data.modifiedCount)
        
        return ;
    } catch (error) {
        console.error(error);

    }

}
main();


