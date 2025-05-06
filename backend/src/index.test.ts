/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { log } from "console";
import { connectDB } from "./config/connectDB"
import { User } from "./models/user";
import { giveAuthSessionId } from "./controllers/auth.controller";
import generateMatrimonyId from "./lib/core/mid-geneator";



async function main() {
    await connectDB()
    let users =await User.find({} );
    for (let i = 0; i < users.length; i++) {
        const element = users[i];
        element.mid = generateMatrimonyId(element.address.country);
        await element.save();
        if (i % 100 === 0) {
            log('User updated ' + i)
        }
    }
}
main()