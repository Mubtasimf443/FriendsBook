/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { log } from "console";
import { connectDB } from "./config/connectDB"
import { User } from "./models/user";
import { giveAuthSessionId } from "./controllers/auth.controller";


async function main() {
    log(giveAuthSessionId())
  
}
main()