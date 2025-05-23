/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { randomUUID } from "node:crypto";
import { connectDB } from "./config/connectDB";
import { User } from "./models/user";

async function main() {
    try {
        await connectDB();

       
    } catch (error) {
        console.error(error);
    }
}
main()