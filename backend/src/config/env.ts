/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import dotenv from 'dotenv';

dotenv.config();

type ENV_VALUE=string | undefined

// SERVER
export const PORT : ENV_VALUE =process.env.PORT ;
export const NODE_ENV : ENV_VALUE =process.env.NODE_ENV ;

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



// SMTP Configuration
export const SMTP_HOST: ENV_VALUE = process.env.SMTP_HOST;
export const SMTP_PORT: ENV_VALUE = process.env.SMTP_PORT;
export const SMTP_USERNAME: ENV_VALUE = process.env.SMTP_USERNAME;
export const SMTP_PASSWORD: ENV_VALUE = process.env.SMTP_PASSWORD;
export const SMTP_API_KEY: ENV_VALUE = process.env.SMTP_API_KEY;

// Email Accent Colors
export const EMAIL_PRIMARY_COLOR: ENV_VALUE = process.env.EMAIL_PRIMARY_COLOR || '#4CAF50'; // Green
export const EMAIL_SECONDARY_COLOR: ENV_VALUE = process.env.EMAIL_SECONDARY_COLOR || '#FFC0CB'; // Pink

// Cron-Jobs 
export const JOB_SECRET: ENV_VALUE = process.env.JOB_SECRET;