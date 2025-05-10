/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */


import { connectDB } from "./config/connectDB";
import Awaiter from "./lib/core/Awaiter";
import { User } from "./models/user";


async function main() {
    try {
        await connectDB() ;
        let u = await User.findById(`681f479838324dad469d8a64`);
        if (u) { 
            console.log(u._id);
            u.createPreference();
            await u.save();
            console.log(u.partnerPreference);

            
        }
        return ;
    } catch (error) {
        console.error(error);

    }

}
main();


