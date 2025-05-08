/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { log } from "console";
import cloudinary from "./config/cloudinary";
import { dirname, resolve } from "path";
import { randomUUID } from "crypto";

// let __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
    try {
        let p = resolve(__dirname, '../uploads/image-1746675284950-941515612.png');

        let res = await cloudinary.uploader.upload(p, {
            public_id: randomUUID(),
            unique_filename: true,
            transformation: ["media_lib_thumb"]
        });
        log(res)
    } catch (error) {
        console.error(error);

    }

}
main();


