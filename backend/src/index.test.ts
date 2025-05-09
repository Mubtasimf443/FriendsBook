/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */


import { connectDB } from "./config/connectDB";
import Awaiter from "./lib/core/Awaiter";
import { User } from "./models/user";


async function main() {
    try {
        await connectDB() ;
        await Awaiter(1000);
        let usersnames = await User.distinct('name', { gender: 'male' }).lean();
        console.log(usersnames.slice(0, 10))
    } catch (error) {
        console.error(error);

    }

}
main();


