/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */


import { log } from "console";
import { connectDB } from "./config/connectDB";
import Awaiter from "./lib/core/Awaiter";
import { User } from "./models/user";
import countryNames from "./lib/data/countryNames";
import { CountryNamesEnum } from "./lib/types/country_names.enum";
import { randomDataFromArray } from "./lib/core/randomInt";
import { randomUUID } from "crypto";


async function main() {
    try {
        await connectDB();

        // let users_idsa = await User.distinct('_id', {
        //     "address.country": { $ne: CountryNamesEnum.BANGLADESH }
        // });

        // let writeObject :any[] = []
        // for (let i = 0; i < users_idsa.length; i++) {
        //     let cname = randomDataFromArray(countryNames.slice(0, 10 ));
        //     cname = cname === 'Bangladesh' ? randomDataFromArray(countryNames.slice(0,10)) : cname;

        //     const _id = users_idsa[i];
        //     writeObject.push({
        //         updateOne: {
        //             filter: { _id },
        //             update: { "address.country": cname }
        //         }

        //     });


        // }
        // let u = await User.bulkWrite(writeObject);
        // log(u)

        await User.updateMany({} , {
            profileImage :{
                url : 'https://placehold.co/600x400/png',
                id : randomUUID()
            }
        })
    } catch (error) {
        console.error(error);

    }

}
main();


