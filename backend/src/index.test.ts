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
        // let data=await User.updateMany({"address.country" : CountryNamesEnum.BANGLADESH } , { 
        //     "address.division.id" :1 ,
        //     "address.district.id" :1 ,
        //     "address.upazila.id" :1 ,
        //     "address.union.id" :1 ,
            
        // }) ;

        // log(data)

        let usersIDS = await User.find({},'_id').limit(3000)
  

        for (let i = 0; i < usersIDS.length; i++) {
            const element = usersIDS[i];
            let countryid = countryNames.length * Math.random()
            countryid = ~~countryid;
            await  User.findByIdAndUpdate(element , {
                'address.country' : countryNames[countryid], 
            });
            log('updated')
        }
        return ;
    } catch (error) {
        console.error(error);

    }

}
main();


