/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import express, { Router, Request, Response } from "express";
import TemporarySession, { TemporarySessionNames } from "../models/temporarySession";
import { registrationUserSchema, LoginEnum, LoginSchema ,tempSessionValidation , zodOTPValidation , VerifyOtpSchema, ResetPasswordSchema, VerifyForgotPasswordOtpSchema } from "../lib/schema/auth.schema";
import { generateAuthToken, sendRegistrationOTP, comparePasswords, GenerateOtp, giveAuthSessionId, generateSalt, hashPassword } from "../controllers/auth.controller";
import crypto from 'crypto';
import { catchError } from "../lib/core/catchError";
import { User } from "../models/user";
import { format } from 'date-fns';
import { authEmails } from "../lib/mails/auth.emails";
import morgan from 'morgan'
import AuthSession from "../models/AuthSession";
import rateLimiter from "../config/rateRimiter";
import { IUser } from "../lib/types/user.types";
import { emailValidatior } from "../lib/schema/schemaComponents";

const router: Router = express.Router();

router.use(rateLimiter(600 * 100, 100));
// Create registration session endpoint

router.post("/create-registration-session", async function (req: Request, res: Response): Promise<Response | any> {
    try {
        const validationResult =await registrationUserSchema.safeParseAsync(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: validationResult.error.errors[0].message,
                data: null,
                errors: validationResult.error
            });
        }

        const userData = validationResult.data;


        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email is already registered",
                data: null
            });
        }

        const sessionKey = crypto.randomBytes(32).toString('hex').normalize();

        // Create a new session
        const session = await TemporarySession.create({
            name: TemporarySessionNames.REGISTRATION_SESSION,
            key: sessionKey,
            value: JSON.stringify({
                hasOtpRequest : 10, // this is the limit of requesting otp 
                ...userData
            })
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

        let validationResult =await tempSessionValidation.safeParseAsync(req.body.sessionKey)
        
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: validationResult.error.errors[0].message,
                data: null,
                errors: validationResult.error
            });
        }

        let sessionKey =validationResult.data;

        if (!sessionKey) {
            return res.status(400).json({
                success: false,
                message: "Session key is required",
                data: null
            });
        }

        // Find the session
        const session = await TemporarySession.findOne()
            .where('key').equals(sessionKey);

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

        // Now User Has less request left
        userData.hasOtpRequest -= 1;

        // Store OTP in session
        session.value = JSON.stringify({
            ...userData,
            otp,
            otpExpiry: Date.now() + 70 * 1000 // OTP valid for 1 minutes 25 seconds
        });
        
        switch (userData.hasOtpRequest  < 1) {
            case true:
                await session.deleteOne()
                break;

            case false:
                await session.save();
                break;
        }
       

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

        let validationResult =await VerifyOtpSchema.safeParseAsync(req.body)
        
        
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: validationResult.error.errors[0].message,
                data: null,
                errors: validationResult.error
            });
        }


        const { sessionKey, otp } = validationResult.data;

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
        if (!sessionData.otp || sessionData.otp !== otp) {
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

        let passwordSalt = generateSalt();
        let passwordHash = await hashPassword(sessionData.password, passwordSalt)

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
                hashed: passwordHash, // Ensure password is hashed before saving
                salt: passwordSalt// Generate a random salt
            },
            createdAt: new Date(),
            age: sessionData.age
        });


        // Send registration success email
        authEmails.registrationSuccessEmail(newUser.email)
            .catch(error => console.error('registration Success Email sending Error'));


        // Delete the registration session
        await session.deleteOne();


        // Create auth token for successful verification
        const authToken = giveAuthSessionId();

        // Create auth session
        await AuthSession.create({
            key: authToken,
            value: {
                email: newUser.email,
                userId: newUser._id
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

router.post('/login', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        // Validate the request body using Zod schema
        const loginValidationResult = LoginSchema.safeParse(req.body);

        if (!loginValidationResult.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid input data. Please check your email, phone, or password format.",
                data: null
            });
        }

        const loginData = loginValidationResult.data;
        let existingUser: null | IUser = null;

        // Check for user based on login type
        if (loginData.loginType === LoginEnum.withEmail) {
            existingUser = await User.findOne({ email: loginData.email });
        } else if (loginData.loginType === LoginEnum.withPhone) {
            existingUser = await User.findOne({})
                .where("phoneInfo.number").equals(loginData.phoneInfo?.number)
                .where("phoneInfo.country.phone_code").equals(loginData.phoneInfo?.phone_code);
        }

        // If user doesn't exist, return an error
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found. Please check your login credentials.",
                data: null
            });
        }

        // Verify the password
        const isPasswordEqual = await comparePasswords({
            password: loginData.password,
            hashedPassword: existingUser.password.hashed,
            salt: existingUser.password.salt
        });

        if (!isPasswordEqual) {
            return res.status(401).json({
                success: false,
                message: "Invalid password. Please try again.",
                data: null
            });
        }

        // Generate an authentication token
        const authToken = giveAuthSessionId();

        // Remove any previous auth session for the user
        await AuthSession.deleteOne({ 'value.email': existingUser.email });

        // Create a new auth session for the user
        await AuthSession.create({
            key: authToken,
            value: {
                email: existingUser.email,
                userId: existingUser._id
            }
        });

        // Return the response with the new auth token
        return res.status(200).json({
            success: true,
            message: "Login successful.",
            data: {
                authToken: authToken
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error. Please try again later.",
            data: null
        });
    }
});



router.post('/reset-password' , async function (req: Request, res: Response): Promise<Response | any> {
    try {
        let validationResult =await ResetPasswordSchema.safeParseAsync(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message:validationResult.error.errors[0].message,
                data: null,
                error : validationResult.error
            });
        }

        let {userId  , password , newPassword } = validationResult.data;

        let existingUser =await User.findById(userId);

        if (!existingUser) {
            return res.status(401).json({
                success: false,
                message: "There is no user registered with this account",
                data: null
            });
        }

        const isPasswordEqual = await comparePasswords({
            password:password,
            hashedPassword: existingUser.password.hashed,
            salt: existingUser.password.salt
        });


        if (!isPasswordEqual) {
            return res.status(401).json({
                success: false,
                message: "Invalid password. Please try again.",
                data: null
            });
        }

        let newPasswordSalt = generateSalt();
        let newPasswordHash = await hashPassword(newPassword , newPasswordSalt);
      
        existingUser.password.salt =newPasswordSalt;
        existingUser.password.hashed =newPasswordHash;

        await existingUser.save();

        return res.status(200).json({
            success : true ,
            message : "Password reset successfull",
            data : null
        })


    } catch (error) {
        console.error("Reset Password error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error. Please try again later.",
            data: null
        });
    }
});
// Add these endpoints after existing routes

// Create forget password session
router.post("/create-forget-password-session", async function (req: Request, res: Response): Promise<Response | any> {
    try {
        // Validate email
        const validationResult = await emailValidatior.safeParseAsync(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: validationResult.error.errors[0].message,
                data: null,
                errors: validationResult.error
            });
        }

        const  email  = validationResult.data;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email",
                data: null
            });
        }

        const sessionKey = crypto.randomBytes(32).toString('hex').normalize();

        // Create a new session
        const session = await TemporarySession.create({
            name: TemporarySessionNames.FORGET_PASSWORD_SESSION,
            key: sessionKey,
            value: JSON.stringify({
                hasOtpRequest: 10, // OTP request limit
                email,
                userId: existingUser._id
            })
        });

        return res.status(200).json({
            success: true,
            message: "Forget password session created successfully",
            data: {
                sessionKey: session.key
            }
        });

    } catch (error) {
        console.error("Create forget password session error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            data: null
        });
    }
});

// Request forget password OTP
router.post("/request-forget-password-otp", async function (req: Request, res: Response): Promise<Response | any> {
    try {
        let validationResult = await tempSessionValidation.safeParseAsync(req.body.sessionKey);
        
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: validationResult.error.errors[0].message,
                data: null,
                errors: validationResult.error
            });
        }

        let sessionKey = validationResult.data;

        // Find the session
        const session = await TemporarySession.findOne({ })
            .where('key').equals(sessionKey)
            .where('name').equals(TemporarySessionNames.FORGET_PASSWORD_SESSION);

        if (!session) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired session",
                data: null
            });
        }

        // Parse session data
        const sessionData = JSON.parse(session.value);

        // Generate OTP
        const otp = GenerateOtp();

        // Update remaining OTP requests
        sessionData.hasOtpRequest -= 1;

        // Store OTP in session
        session.value = JSON.stringify({
            ...sessionData,
            otp,
            otpExpiry: Date.now() + 70 * 1000 // OTP valid for 1 minute 10 seconds
        });

        // Handle session based on remaining OTP requests
        if (sessionData.hasOtpRequest < 1) {
            await session.deleteOne();
        } else {
            await session.save();
        }

        // Send OTP via email
        const emailSent = await authEmails.forgotPasswordOtpEmail(otp, sessionData.email);

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
        console.error("Request forget password OTP error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            data: null
        });
    }
});

// Verify forget password OTP and reset password
router.post("/verify-forget-password-otp", async function (req: Request, res: Response): Promise<Response | any> {
    try {
        let validationResult = await VerifyForgotPasswordOtpSchema.safeParseAsync(req.body);
        
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: validationResult.error.errors[0].message,
                data: null,
                errors: validationResult.error
            });
        }

        const { sessionKey, otp, newPassword } = validationResult.data;

        // Find the session
        const session = await TemporarySession.findOne({ })
            .where('key').equals(sessionKey)
            .where('name').equals(TemporarySessionNames.FORGET_PASSWORD_SESSION);

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
        if (!sessionData.otp || sessionData.otp !== otp) {
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

        // Find user and update password
        const user = await User.findById(sessionData.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
                data: null
            });
        }

        // Generate new password hash and salt
        const passwordSalt = generateSalt();
        const passwordHash = await hashPassword(newPassword, passwordSalt);

        // Update user's password
        user.password = {
            hashed: passwordHash,
            salt: passwordSalt
        };
        
        await user.save();

        // Delete the session
        await session.deleteOne();

       
        return res.status(200).json({
            success: true,
            message: "Password reset successful",
            data: null
        });

    } catch (error) {
        console.error("Verify forget password OTP error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            data: null
        });
    }
});




export default router;