/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
 




export async function giveLocationData(filename?: string): Promise<any[]> {
    let data: any[] = require(`../../data/${filename}.json`)
    return data;
}

export function giveLocationDataSync(filename?: string): any[] {
    let data: any[] = require(`../../data/${filename}.json`)
    return data;
}