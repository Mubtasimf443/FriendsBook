/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import express, { Router, Request, Response } from "express";
import TemporarySession, { TemporarySessionNames } from "../models/temporarySession";
import { registrationUserSchema, loginWithEmailSchema, loginWithPhoneSchema } from "../lib/schema/auth.schema";
import { generateAuthToken, sendRegistrationOTP, comparePasswords, GenerateOtp, giveAuthSessionId } from "../controllers/auth.controller";
import crypto from 'crypto';
import { catchError } from "../lib/core/catchError";
import { User } from "../models/user";
import { format } from 'date-fns';
import { authEmails } from "../lib/mails/auth.emails";
import morgan from 'morgan'
import AuthSession from "../models/AuthSession";
import rateLimiter from "../config/rateRimiter";

const router: Router = express.Router();

router.use(rateLimiter(600 * 100 , 100));
// Create registration session endpoint
router.post("/create-registration-session", async function (req: Request, res: Response): Promise<Response | any> {
    try {

        const validationResult = registrationUserSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: validationResult.error.errors[0].message,
                data: null,
                errors: validationResult.error
            });
        }

        const userData = validationResult.data;

        const sessionKey = crypto.randomBytes(32).toString('hex').normalize();

        // Create a new session
        const session = await TemporarySession.create({
            name: TemporarySessionNames.REGISTRATION_SESSION,
            key: sessionKey,
            value: JSON.stringify(userData)
        });

        // Return the session key to the client
        return res.status(200).json({
            success: true,
            message: "Registration session created successfully",
            data: {
                sessionKey: session.key
            }
        });

    } catch (error) {
        console.error("Create registration session error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            data: null
        });
    }
});

// Request registration OTP endpoint
router.post("/request-registration-otp", async function (req: Request, res: Response): Promise<Response | any> {
    try {
        const { sessionKey } = req.body;

        if (!sessionKey) {
            return res.status(400).json({
                success: false,
                message: "Session key is required",
                data: null
            });
        }

        // Find the session
        const session = await TemporarySession.findOne().where('key').equals(sessionKey);
            

        if (!session) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired session",
                data: null
            });
        }

        // Parse user data from session
        const userData = JSON.parse(session.value);

        // Generate OTP
        const otp = GenerateOtp(); // 6-digit OTP

        // Store OTP in session
        session.value = JSON.stringify({
            ...userData,
            otp,
            otpExpiry: Date.now() + 70 * 1000 // OTP valid for 1 minutes 25 seconds
        });

        await session.save();

        // Send OTP via email
        const emailSent = await authEmails.signUpOtpEmail(otp, userData.email)

        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: "Failed to send OTP",
                data: null
            });
        }

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            data: null
        });

    } catch (error) {
        console.error("Request registration OTP error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            data: null
        });
    }
});

// Verify registration OTP endpoint
router.post("/verify-registration-otp", async function (req: Request, res: Response): Promise<Response | any> {
    try {
        const { sessionKey, otp } = req.body;

        if (!sessionKey || !otp) {
            return res.status(400).json({
                success: false,
                message: "Session key and OTP are required",
                data: null
            });
        }

        // Find the session
        const session = await TemporarySession.findOne({
            key: sessionKey,
        });

        if (!session) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired session",
                data: null
            });
        }

        // Parse session data
        const sessionData = JSON.parse(session.value);

        // Verify OTP
        if (!sessionData.otp || sessionData.otp !== parseInt(otp)) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
                data: null
            });
        }

        // Check OTP expiry
        if (Date.now() > sessionData.otpExpiry) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired",
                data: null
            });
        }

        // Check if email is already registered
        const existingUser = await User.findOne({ email: sessionData.email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email is already registered",
                data: null
            });
        }

        // Save user data to the database
        const newUser = await User.create({
            profileCreatedBy: sessionData.profileCreatedBy,
            name: sessionData.name,
            gender: sessionData.gender,
            dateOfBirth: sessionData.dateOfBirth,
            email: sessionData.email,
            height: sessionData.height,
            weight: sessionData.weight,
            isEducated: sessionData.isEducated,
            education: sessionData.education,
            country: sessionData.country,
            address: sessionData.address,
            phoneInfo: sessionData.phoneInfo,
            languages: sessionData.languages,
            religion: sessionData.religion,
            password: {
                hashed: sessionData.password, // Ensure password is hashed before saving
                salt: crypto.randomBytes(16).toString('hex') // Generate a random salt
            },
            createdAt: new Date(),
            age : sessionData.age
        });
        

        // Send registration success email
        authEmails.registrationSuccessEmail(newUser.email)
            .catch(error => console.error('registration Success Email sending Error'));


        // Delete the registration session
        await session.deleteOne();


        // Create auth token for successful verification
        const authToken = generateAuthToken();

        // Create auth session
        await AuthSession.create({
            key : authToken,
            value : {
                email : newUser.email,
                userId : newUser._id
            }
        })

        // Return success response
        return res.status(200).json({
            success: true,
            message: "OTP verified and registration successful",
            data: {
                userId: newUser._id,
                authToken
            }
        });

    } catch (error) {
        console.error("Verify registration OTP error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            data: null
        });
    }
});







export default router;