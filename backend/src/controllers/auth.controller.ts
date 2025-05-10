/*
بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ  ﷺ InshaAllah
*/

import crypto from "crypto"
import { EducationLevel, Gender, Height, IUser } from "../lib/types/user.types"
import { CountryNamesEnum } from "../lib/types/country_names.enum"
import { IAuthSessionValue } from "../models/AuthSession"
import mongoose from "mongoose"

export function hashPassword(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password.normalize(), salt, 64, (error, hash) => {
      if (error) reject('Error in hassing the password')

      resolve(hash.toString("hex").normalize())
    })
  })
}

export async function comparePasswords({
  password,
  salt,
  hashedPassword,
}: {
  password: string
  salt: string
  hashedPassword: string
}) {
  const inputHashedPassword = await hashPassword(password, salt)

  return crypto.timingSafeEqual(
    Buffer.from(inputHashedPassword, "hex"),
    Buffer.from(hashedPassword, "hex")
  )
}

export function generateSalt() {
  return crypto.randomBytes(16).toString("hex").normalize()
}

export function GenerateOtp() {
  function giveOtp() {
    return Math.floor(Math.random() * 999999)
  }
  let otp = giveOtp()
  for (let i = 0; true; i++) {
    if (otp > 99999 && otp < 1000000) {
      return otp;
    }
    else otp = giveOtp();
  }
}

export function giveAuthSessionId() {
  let token: string = crypto.randomBytes(512).toString("hex").normalize();
  return token;
}

export function giveAuthSession(): string {
  return crypto.randomBytes(32).toString("hex").normalize();
}


export async function sendRegistrationOTP(email: string, otp: number): Promise<boolean> {
  try {
    // TODO: Implement email sending logic here
    // This should use your email service to send the OTP
    // Return true if email sent successfully, false otherwise
    return true;
  } catch (error) {
    console.error("Send registration OTP error:", error);
    return false;
  }
}

export function generateAuthToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
export function giveAuthSessionValue(user: IUser): IAuthSessionValue {
  return {
    // Basic Info
    email: user.email,
    userId: user._id,

    // Location
    address: {
      country: user.address.country,
      lat: user.address.district?.lat,
      long: user.address.district?.long,
      division: user.address.division?.name,
      district: user.address.district?.name,
      upazila: user.address.upazila?.name,
      union: user.address.union?.name
    },

    // Contact
    phone: {
      number: user.phoneInfo.number,
      code: user.phoneInfo.country.phone_code,
    },

    // Personal Attributes
    gender: user.gender,
    height: user.height,
    weight: user.weight,
    religion: user.religion,
    languages: user.languages,
    maritalStatus: user.maritalStatus,

    // Education & Profession
    isEducated: user.isEducated,
    education: user.education,
    occupation: user.occupation,

    // Partner Preferences from new schema
    partnerPreferences: {
      ageRange: {
        min: user.partnerPreference.ageRange.min,
        max: user.partnerPreference.ageRange.max
      },
      heightRange: {
        min: Height[`FOOT_${user.partnerPreference.heightRange.min}_0`],
        max: Height[`FOOT_${user.partnerPreference.heightRange.max}_0`]
      },
      weightRange: {
        min: user.partnerPreference.weightRange.min,
        max:  user.partnerPreference.weightRange.max
      },
      maritalStatus: [MaritalStatus.NEVER_MARRIED],
      education: user.isEducated ? {
        minimumLevel: user.education[0]?.level || EducationLevel.HSC,
        mustBeEducated: user.isEducated,
        preferredLevels: user.partnerPreference.education?.map(e => e.level)
      } : undefined,
      religion: [user.religion],
      location: {
        preferredCountries: [user.address.country],
        preferredRegions: user.address.division ? [user.address.division.id] : undefined,
        preferredCities: user.address.district ? [user.address.district.id] : undefined
      }
    },

    // Security
    blockedProfiles: user.enhancedSettings.blocked.map(
      ({ userId }) => new mongoose.Types.ObjectId(userId)
    )
  };
}