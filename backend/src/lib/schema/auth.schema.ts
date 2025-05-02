/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { z } from "zod";
import { ProfileCreatedBy, Gender } from "../types/user.types";

export const registrationUserSchema = z.object({
    profileCreatedBy: z.nativeEnum(ProfileCreatedBy),
    gender: z.nativeEnum(Gender, { message: "Gender of the user must be male of " }),
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must not exceed 50 characters')
});