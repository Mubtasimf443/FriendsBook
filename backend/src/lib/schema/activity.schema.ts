/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { z } from "zod";
import { _idValidator } from "./schemaComponents";

export const shortListSchema = z.object({
    shortListedId: _idValidator
});   


export const likeProfileSchema = z.object({
    likedId: _idValidator
});

export const sendMailSchema = z.object({
    receiverId: _idValidator,
    message: z.string().optional()
});

export const sendSmsSchema = z.object({
    receiverId: _idValidator,
    message: z.string().optional()
});

export const requestMobileNumberSchema = z.object({
    requestedId: _idValidator
});