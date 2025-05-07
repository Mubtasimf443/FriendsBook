/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import mongoose from "mongoose";
import { connectDB } from "./config/connectDB"
import { User } from "./models/user";
import { Occupation } from "./lib/types/user.types";
import { log } from "console";


async function main() {
    await connectDB();
    const getRandomElement = (arr :string[]) => arr[Math.floor(Math.random() * arr.length)];
    let occupations = Object.values(Occupation).slice(0 , 10);
    let data:any[] = []
    let usersIds =await User.find({} , '_id');
    for (let i = 0; i < usersIds.length; i++) {
        const _id = usersIds[i];
        data.push({
                updateOne: {
                    filter: { _id },
                    update: { $set: { "occupation": getRandomElement(occupations) } }
                }
            })
    }

    await User.bulkWrite(data);
    log('User Updates')
}
main();


