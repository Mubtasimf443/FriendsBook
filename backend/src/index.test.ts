/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { log } from "console";
import { connectDB } from "./config/connectDB"
import { User } from "./models/user";
import { giveAuthSessionId } from "./controllers/auth.controller";
import generateMatrimonyId from "./lib/core/mid-geneator";



async function main() {
    await connectDB()
    let array = await User.find({}, 'address _id');
    for (let index = 0; index < array.length; index++) {
        const element = array[index];
        let id = generateMatrimonyId(element.address.country);
        User.findByIdAndUpdate(element._id, { $set: { 'mid': id } })
        if (index % 100 === 0) log(index);
    }
}
main()