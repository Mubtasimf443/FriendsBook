/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { z } from "zod";
import { EducationLevel } from "../types/userEducation.types";


export const educationLevelValidator = z.nativeEnum(EducationLevel , { message :"Not a Education level"});