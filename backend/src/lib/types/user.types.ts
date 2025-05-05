/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Document } from 'mongoose';
import { EducationLevel, Education ,EducationPreference , CertificateType } from './userEducation.types';
import { ICity, IDistrict, IDivision, IState, IUpazila } from './location.types';
import { CountryNamesEnum } from './country_names.enum';

export enum ProfileCreatedBy {
    SELF = 'self',
    PARENT = 'parent',
    SIBLINGS = 'siblings',
    RELATIVE = 'relative',
    FRIEND = 'friend'
}

interface IUserImage {
    url : String ,
    id : String 
}



export interface IAddress {
    state ?: IState;
    division ?: IDivision ;
    district ?: IDistrict;
    upazila ?: IUpazila ;
    union ?: ICity
}


/*-------------- Gender -------------*/
export enum Gender {
    MALE = 'male',
    FEMALE = 'female'
}
/*-------------- Height -------------*/

export enum Height {
    // 4 feet range
    FOOT_4_0 = "4 foot 0 inch",
    FOOT_4_1 = "4 foot 1 inch",
    FOOT_4_2 = "4 foot 2 inch",
    FOOT_4_3 = "4 foot 3 inch",
    FOOT_4_4 = "4 foot 4 inch",
    FOOT_4_5 = "4 foot 5 inch",
    FOOT_4_6 = "4 foot 6 inch",
    FOOT_4_7 = "4 foot 7 inch",
    FOOT_4_8 = "4 foot 8 inch",
    FOOT_4_9 = "4 foot 9 inch",
    FOOT_4_10 = "4 foot 10 inch",
    FOOT_4_11 = "4 foot 11 inch",

    // 5 feet range
    FOOT_5_0 = "5 foot 0 inch",
    FOOT_5_1 = "5 foot 1 inch",
    FOOT_5_2 = "5 foot 2 inch",
    FOOT_5_3 = "5 foot 3 inch",
    FOOT_5_4 = "5 foot 4 inch",
    FOOT_5_5 = "5 foot 5 inch",
    FOOT_5_6 = "5 foot 6 inch",
    FOOT_5_7 = "5 foot 7 inch",
    FOOT_5_8 = "5 foot 8 inch",
    FOOT_5_9 = "5 foot 9 inch",
    FOOT_5_10 = "5 foot 10 inch",
    FOOT_5_11 = "5 foot 11 inch",

    // 6 feet range
    FOOT_6_0 = "6 foot 0 inch",
    FOOT_6_1 = "6 foot 1 inch",
    FOOT_6_2 = "6 foot 2 inch",
    FOOT_6_3 = "6 foot 3 inch",
    FOOT_6_4 = "6 foot 4 inch",
    FOOT_6_5 = "6 foot 5 inch",
    FOOT_6_6 = "6 foot 6 inch",
    FOOT_6_7 = "6 foot 7 inch",
    FOOT_6_8 = "6 foot 8 inch",
    FOOT_6_9 = "6 foot 9 inch",
    FOOT_6_10 = "6 foot 10 inch",
    FOOT_6_11 = "6 foot 11 inch",

    // 7 feet range
    FOOT_7_0 = "7 foot 0 inch",
    FOOT_7_1 = "7 foot 1 inch",
    FOOT_7_2 = "7 foot 2 inch",
    FOOT_7_3 = "7 foot 3 inch",
    FOOT_7_4 = "7 foot 4 inch",
    FOOT_7_5 = "7 foot 5 inch",
    FOOT_7_6 = "7 foot 6 inch",
    FOOT_7_7 = "7 foot 7 inch",
    FOOT_7_8 = "7 foot 8 inch",
    FOOT_7_9 = "7 foot 9 inch",
    FOOT_7_10 = "7 foot 10 inch",
    FOOT_7_11 = "7 foot 11 inch",

    // 8 feet range
    FOOT_8_0 = "8 foot 0 inch",
    FOOT_8_1 = "8 foot 1 inch",
    FOOT_8_2 = "8 foot 2 inch",
    FOOT_8_3 = "8 foot 3 inch",
    FOOT_8_4 = "8 foot 4 inch",
    FOOT_8_5 = "8 foot 5 inch",
    FOOT_8_6 = "8 foot 6 inch",
    FOOT_8_7 = "8 foot 7 inch",
    FOOT_8_8 = "8 foot 8 inch",
    FOOT_8_9 = "8 foot 9 inch",
    FOOT_8_10 = "8 foot 10 inch",
    FOOT_8_11 = "8 foot 11 inch",

    // 9 feet range
    FOOT_9_0 = "9 foot 0 inch",
    FOOT_9_1 = "9 foot 1 inch",
    FOOT_9_2 = "9 foot 2 inch",
    FOOT_9_3 = "9 foot 3 inch",
    FOOT_9_4 = "9 foot 4 inch",
    FOOT_9_5 = "9 foot 5 inch",
    FOOT_9_6 = "9 foot 6 inch",
    FOOT_9_7 = "9 foot 7 inch",
    FOOT_9_8 = "9 foot 8 inch",
    FOOT_9_9 = "9 foot 9 inch",
    FOOT_9_10 = "9 foot 10 inch",
    FOOT_9_11 = "9 foot 11 inch"
}

export interface IUserPreferences {
    isEducated : boolean;
    education?: EducationPreference[];
    location?: string[];
    weight?: {
        min: number;
        max: number;
    };
}


/*-------------- Religion -------------*/

export enum Religion {
    CHRISTIANITY = "Christianity",
    ISLAM = "Islam",
    HINDUISM = "Hinduism",
    BUDDHISM = "Buddhism",
    JUDAISM = "Judaism",
    SIKHISM = "Sikhism",
    BAHAI_FAITH = "Bahá'í Faith",
    JAINISM = "Jainism",
    SHINTO = "Shinto",
    TAOISM = "Taoism",
    CONFUCIANISM = "Confucianism",
    ZOROASTRIANISM = "Zoroastrianism",
    TRADITIONAL_AFRICAN = "Traditional African Religions",
    NATIVE_AMERICAN = "Native American Religions",
    RASTAFARIANISM = "Rastafarianism",
    WICCA = "Wicca",
    PAGANISM = "Paganism"
}


/*-------------- Language -------------*/

export enum Language {
    MANDARIN_CHINESE = "Mandarin Chinese",
    SPANISH = "Spanish",
    ENGLISH = "English",
    HINDI = "Hindi",
    ARABIC = "Arabic",
    BENGALI = "Bengali",
    PORTUGUESE = "Portuguese",
    RUSSIAN = "Russian",
    JAPANESE = "Japanese",
    PUNJABI = "Punjabi",
    GERMAN = "German",
    JAVANESE = "Javanese",
    WU_CHINESE = "Wu Chinese",
    TELUGU = "Telugu",
    VIETNAMESE = "Vietnamese",
    MARATHI = "Marathi",
    FRENCH = "French",
    KOREAN = "Korean",
    TAMIL = "Tamil",
    ITALIAN = "Italian",
    TURKISH = "Turkish",
    URDU = "Urdu",
    GUJARATI = "Gujarati",
    POLISH = "Polish",
    UKRAINIAN = "Ukrainian",
    PERSIAN = "Persian",
    MALAY = "Malay",
    KANNADA = "Kannada",
    XIANG_CHINESE = "Xiang Chinese",
    MALAYALAM = "Malayalam",
    SUNDANESE = "Sundanese",
    HAUSA = "Hausa",
    ODIA = "Odia",
    BURMESE = "Burmese",
    HAKKA_CHINESE = "Hakka Chinese",
    TAGALOG = "Tagalog/Filipino",
    CANTONESE = "Yue Chinese/Cantonese",
    THAI = "Thai",
    SWAHILI = "Swahili",
    ROMANIAN = "Romanian",
    DUTCH = "Dutch",
    KURDISH = "Kurdish",
    YORUBA = "Yoruba",
    AMHARIC = "Amharic",
    INDONESIAN = "Indonesian",
    GREEK = "Greek",
    CZECH = "Czech",
    SINDHI = "Sindhi",
    UZBEK = "Uzbek",
    HUNGARIAN = "Hungarian",
    BELARUSIAN = "Belarusian",
    HEBREW = "Hebrew",
    AZERBAIJANI = "Azerbaijani",
    SLOVAK = "Slovak",
    BULGARIAN = "Bulgarian",
    SERBIAN = "Serbian",
    DANISH = "Danish",
    FINNISH = "Finnish",
    NORWEGIAN = "Norwegian",
    SWEDISH = "Swedish",
    CROATIAN = "Croatian",
    LITHUANIAN = "Lithuanian",
    SLOVENIAN = "Slovenian",
    LATVIAN = "Latvian",
    ESTONIAN = "Estonian",
    GEORGIAN = "Georgian",
    ARMENIAN = "Armenian",
    ALBANIAN = "Albanian",
    MONGOLIAN = "Mongolian",
    KAZAKH = "Kazakh",
    NEPALI = "Nepali",
    ASSAMESE = "Assamese",
    TIBETAN = "Tibetan",
    KHMER = "Khmer",
    LAO = "Lao",
    PASHTO = "Pashto",
    ZULU = "Zulu",
    XHOSA = "Xhosa",
    IGBO = "Igbo"
}

interface IPhoneCountry {
    name : string ;
    phone_code :string;
}

interface IPhone {
    country: IPhoneCountry;  
    number: string;  
}

interface IPassword {
    hashed : string ,
    salt : string
}

export enum SettingsType {
    allowed = 'allowed',
    notAllowed = 'not_allowed'

}

interface NotificationSettings {
    dailyRecommendations : SettingsType,
    todaysMatch : SettingsType,
    viewedMyProfile : SettingsType
}

interface PrivacySettings {
    sendNotificationOnProfileView : SettingsType
}

interface UserSettings {
    privacy : PrivacySettings,
    notifications : NotificationSettings
}

export interface IUser extends Document {
    profileCreatedBy: ProfileCreatedBy;
    profileImage : IUserImage,
    userImages : IUserImage[],
    gender: Gender;
    name: CountryNamesEnum;
    dateOfBirth: Date;
    email: string;
    height: Height;
    age: number;
    weight: number;
    isEducated: boolean;
    education: Education[];
    country: string;
    address? : IAddress;
    phoneInfo: IPhone;
    password : IPassword,
    languages: Language[];
    religion: Religion;
    preferences: IUserPreferences;
    createdAt: Date;
    settings : UserSettings
    isSuspended : boolean,
    createPreference(): void
}

// export interface IUserWithMethods {
//     createPreference() : void
// }
export interface PresentAdress {
    division: string;
    district: string;
    upazila: string;
    city: string;
}


export { Education , EducationPreference, EducationLevel}