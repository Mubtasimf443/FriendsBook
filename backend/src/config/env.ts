/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import dotenv from 'dotenv';

dotenv.config();

type ENV_VALUE=string | undefined

// SERVER
export const PORT : ENV_VALUE =process.env.PORT ;
// Database
export const MONGO_DB_URL:ENV_VALUE=process.env.MONGO_DB_URL ;
// FILE STORAGE
export const ClOUDINARY_CLOUD_NAME:ENV_VALUE=process.env.ClOUDINARY_CLOUD_NAME ;
export const ClOUDINARY_API_KEY:ENV_VALUE=process.env.ClOUDINARY_API_KEY ;
export const ClOUDINARY_API_SECRET:ENV_VALUE=process.env.ClOUDINARY_API_SECRET ;



// COMPANY DETAILS
export const COMPANY_NAME: ENV_VALUE = process.env.COMPANY_NAME;
export const COMPANY_MAIL: ENV_VALUE = process.env.COMPANY_MAIL;
export const COMPANY_LOGO: ENV_VALUE = process.env.COMPANY_LOGO;
export const COMPANY_CONTACT_EMAIL: ENV_VALUE = process.env.COMPANY_CONTACT_EMAIL;
export const COMPANY_CONTACT_ADDRESS: ENV_VALUE = process.env.COMPANY_CONTACT_ADDRESS;
export const COMPANY_CONTACT_PHONE: ENV_VALUE = process.env.COMPANY_CONTACT_PHONE;

