/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import dotenv from 'dotenv';

dotenv.config();

type ENV_VALUE=string | undefined

export const PORT : ENV_VALUE =process.env.PORT ;
export const MONGO_DB_URL:ENV_VALUE=process.env.MONGO_DB_URL ;