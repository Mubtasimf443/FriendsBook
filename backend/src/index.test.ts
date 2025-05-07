/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import mongoose from "mongoose";
import { connectDB } from "./config/connectDB"
import { User } from "./models/user";
import { Occupation } from "./lib/types/user.types";
import { log } from "console";
import { randomUUID } from "crypto";


async function main() {
    let arr: string[] = [];
    for (let i = 0; i < 100000; i++) {
        let id = randomUUID();
        if (arr.includes(id)) throw 'UUID EXIST';
        else arr.push(id);
        if (i %1000 ===0) console.log(i);
    }
}
main();


