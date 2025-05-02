/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import express, { Router, Request, Response } from "express";
import { Session, SessionNames } from "../models/session";
import { registrationUserSchema, loginWithEmailSchema, loginWithPhoneSchema } from "../lib/schema/auth.schema";
import { generateAuthToken, sendRegistrationOTP, comparePasswords, GenerateOtp, giveAuthSessionId } from "../controllers/auth.controller";
import crypto from 'crypto';
import { catchError } from "../lib/core/catchError";
import { User } from "../models/user";
import { format } from 'date-fns';
import { authEmails } from "../lib/mails/auth.emails";
import morgan from 'morgan'

const router: Router = express.Router();

router.use(morgan('dev'))

// Create registration session endpoint
router.post("/create-registration-session", async function (req: Request, res: Response): Promise<Response | any> {
    try {
        
        const validationResult = registrationUserSchema.safeParse(req.body);

        if (!validationResult.success) {
            console.error(validationResult.error.errors[0]);

            return res.status(400).json({
                success: false,
                message: validationResult.error.errors[0].message,
                data: null,
                errors : validationResult.error
            });
        }

        const userData = validationResult.data;

        const sessionKey = crypto.randomBytes(32).toString('hex').normalize();

        // Create a new session
        const session = await Session.create({
            name: SessionNames.REGISTRATION_SESSION,
            key: sessionKey,
            value: JSON.stringify(userData)
        },);

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
        const session = await Session.findOne()
            .where('name').equals(SessionNames.REGISTRATION_SESSION)
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

        // Store OTP in session
        session.value = JSON.stringify({
            ...userData,
            otp,
            otpExpiry: Date.now() + 1.25 * 60 * 1000 // OTP valid for 1 minutes 25 seconds
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
        const session = await Session.findOne({
            key: sessionKey,
            name: SessionNames.REGISTRATION_SESSION
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

        // Create auth token for successful verification
        const authToken = generateAuthToken();

        // Create auth session
        await Session.create({
            name: SessionNames.AUTH_SESSION,
            key: authToken,
            value: JSON.stringify({
                userId: sessionData.userId,
                email: sessionData.email
            })
        });

        // Delete the registration session
        await session.deleteOne();

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            data: {
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


// router.post('/create-login-session', async function (req: Request, res: Response) :Promise<Response | any> {
//     try {
//         // Determine login method based on payload
//         const isEmailLogin = 'email' in req.body;

//         // Validate input based on login method
//         const validationResult = isEmailLogin 
//             ? loginWithEmailSchema.safeParse(req.body)
//             : loginWithPhoneSchema.safeParse(req.body);

//         if (!validationResult.success) {
//             return res.status(400).json({
//                 success: false,
//                 message: validationResult.error.errors[0].message,
//                 data: null
//             });
//         }

//         const { password } = validationResult.data;

//         // Find user based on login method
//         const user = isEmailLogin 
//             ? await User.findOne({ email: (validationResult.data as any).email })
//             : await User.findOne({ 
//                 'phoneInfo.number': (validationResult.data as any).phoneInfo.number,
//                 'phoneInfo.phone_code': (validationResult.data as any).phoneInfo.phone_code
//             });

//         if (!user) {
//             return res.status(400).json({
//                 success: false,
//                 message: isEmailLogin 
//                     ? "No account found with this email" 
//                     : "No account found with this phone number",
//                 data: null
//             });
//         }

//         // Verify password
//         const isPasswordValid = await comparePasswords({
//             password,
//             salt: user.passwordSalt,
//             hashedPassword: user.password
//         });

//         if (!isPasswordValid) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid credentials",
//                 data: null
//             });
//         }

//         // Create login session
//         const sessionKey = giveAuthSessionId();

//         const session = await Session.create({
//             name: SessionNames.LOGIN_SESSION,
//             key: sessionKey,
//             value: JSON.stringify({
//                 userId: user._id,
//                 email: user.email,
//                 phoneInfo: user.phoneInfo,
//                 created_at: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
//                 loginMethod: isEmailLogin ? 'email' : 'phone'
//             })
//         });

//         return res.status(200).json({
//             success: true,
//             message: "Login session created successfully",
//             data: {
//                 sessionKey,
//                 loginMethod: isEmailLogin ? 'email' : 'phone'
//             }
//         });

//     } catch (error) {
//         catchError(error, res);
//     }
// });

// router.post('/request-login-otp', async function (req: Request, res: Response):Promise<Response | any>  {
//     try {
//         const { sessionKey } = req.body;

//         if (!sessionKey) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Session key is required",
//                 data: null
//             });
//         }

//         // Find the login session
//         const session = await Session.findOne({
//             key: sessionKey,
//             name: SessionNames.LOGIN_SESSION
//         });

//         if (!session) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid or expired session",
//                 data: null
//             });
//         }

//         const sessionData = JSON.parse(session.value);

//         // Generate 6-digit OTP
//         const otp = GenerateOtp();

//         // Update session with OTP info
//         const updatedSessionData = {
//             ...sessionData,
//             otp,
//             otpExpiry: format(new Date(Date.now() + 10 * 60 * 1000), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"), // 10 minutes expiry
//             otpAttempts: 0
//         };

//         session.value = JSON.stringify(updatedSessionData);
//         await session.save();

//         // Send OTP based on login method
//         let isOtpSent = false;

//         if (sessionData.loginMethod === 'email') {
//             isOtpSent = await authEmails.loginOtpVerificationEmail(otp, sessionData.email);
//         } else {
//             // Implement SMS OTP sending here
//             // isOtpSent = await smsService.sendLoginOtp(sessionData.phoneInfo.number, otp);
//             isOtpSent = true; // Temporary, replace with actual SMS implementation
//         }

//         if (!isOtpSent) {
//             return res.status(500).json({
//                 success: false,
//                 message: `Failed to send OTP to your ${sessionData.loginMethod}`,
//                 data: null
//             });
//         }

//         return res.status(200).json({
//             success: true,
//             message: `OTP sent to your ${sessionData.loginMethod}`,
//             data: null
//         });

//     } catch (error) {
//         catchError(error, res);
//     }
// });

// router.post('/verify-login-otp', async function (req: Request, res: Response):Promise<Response | any>  {
//     try {
//         const { sessionKey, otp } = req.body;

//         // Validate OTP format
//         const otpValidation = zodOTP.safeParse(otp);

//         if (!otpValidation.success) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid OTP format",
//                 data: null
//             });
//         }

//         if (!sessionKey) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Session key is required",
//                 data: null
//             });
//         }

//         // Find login session
//         const session = await Session.findOne({
//             key: sessionKey,
//             name: SessionNames.LOGIN_SESSION
//         });

//         if (!session) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid or expired session",
//                 data: null
//             });
//         }

//         const sessionData = JSON.parse(session.value);

//         // Check max attempts
//         if (sessionData.otpAttempts >= 3) {
//             await session.deleteOne();
//             return res.status(400).json({
//                 success: false,
//                 message: "Maximum OTP attempts exceeded. Please start a new login session.",
//                 data: null
//             });
//         }

//         // Update attempts
//         sessionData.otpAttempts = (sessionData.otpAttempts || 0) + 1;
//         session.value = JSON.stringify(sessionData);
//         await session.save();

//         // Validate OTP
//         if (sessionData.otp !== parseInt(otp)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid OTP",
//                 data: {
//                     remainingAttempts: 3 - sessionData.otpAttempts
//                 }
//             });
//         }

//         // Check OTP expiry
//         if (new Date() > new Date(sessionData.otpExpiry)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "OTP has expired",
//                 data: null
//             });
//         }

//         // Create auth session
//         const authToken = giveAuthSessionId();

//         await Session.create({
//             name: SessionNames.AUTH_SESSION,
//             key: authToken,
//             value: JSON.stringify({
//                 userId: sessionData.userId,
//                 email: sessionData.email,
//                 phoneInfo: sessionData.phoneInfo,
//                 created_at: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
//             })
//         });

//         // Delete login session after successful verification
//         await session.deleteOne();

//         // Set auth cookie with security options
//         res.cookie("matrimony_auth_session", authToken, {
//             expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
//             secure: process.env.NODE_ENV === 'production', // Only use HTTPS in production
//             httpOnly: true,
//             sameSite: 'strict',
//             path: '/'
//         });

//         return res.status(200).json({
//             success: true,
//             message: "Login successful",
//             data: null
//         });

//     } catch (error) {
//         catchError(error, res);
//     }
// });




export default router;