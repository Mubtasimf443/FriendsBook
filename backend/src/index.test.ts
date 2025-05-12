/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */


import { log } from "console";
import { connectDB } from "./config/connectDB";
import Awaiter from "./lib/core/Awaiter";
import { User } from "./models/user";
import countryNames from "./lib/data/countryNames";
import { CountryNamesEnum } from "./lib/types/country_names.enum";


async function main() {
    try {
        await connectDB() ;
       
        let use =await User.updateMany(  {"address.country" :{$ne : "Bangladesh"} }, { $set: {
            //  "address.division": {}  
            //  "address.district": {} ,  
             "address.upazila": {} ,  
             "address.union": {} ,  
            }
        } ) ;

log(use) ;
        return ;
    } catch (error) {
        console.error(error);

    }

}
main();


