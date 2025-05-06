/*
بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ  ﷺ InshaAllah
*/

import crypto from "crypto"
import { Gender, IUser } from "../lib/types/user.types"
import { CountryNamesEnum } from "../lib/types/country_names.enum"
import { IAuthSessionValue } from "../models/AuthSession"

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
  return ({
    email: user.email,
    userId: user._id,
    address: {
      country: user.address.country,
      lat: user.address.country === CountryNamesEnum.BANGLADESH ? user.address.district?.lat : undefined,
      long: user.address.country === CountryNamesEnum.BANGLADESH ? user.address.district?.long : undefined,
      division: user.address.country === CountryNamesEnum.BANGLADESH ? user.address.division?.name : undefined,
      district: user.address.country === CountryNamesEnum.BANGLADESH ? user.address.district?.name : undefined,
      upazilla: user.address.country === CountryNamesEnum.BANGLADESH ? user.address.upazila?.name : undefined,
      union: user.address.country === CountryNamesEnum.BANGLADESH ? user.address.union?.name : undefined,
    },
    phone: {
      number: user.phoneInfo.number,
      code: user.phoneInfo.country.phone_code,
    },
    gender: user.gender,
    preference: {
      gender: user.gender === Gender.MALE ? Gender.FEMALE : Gender.MALE
    }
  })
}