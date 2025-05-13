/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import express, { Router, Request, Response } from "express";
import TemporarySession, { TemporarySessionNames } from "../models/temporarySession";
import { registrationUserSchema, LoginEnum, LoginSchema, tempSessionValidation, VerifyOtpSchema, ResetPasswordSchema, VerifyForgotPasswordOtpSchema, authSessionValidation } from "../lib/schema/auth.schema";
import { comparePasswords, GenerateOtp, giveAuthSessionId, generateSalt, hashPassword, giveAuthSession, giveAuthSessionValue, validatePhoneNumber } from "../controllers/auth.controller";
import crypto from 'crypto';
import { User } from "../models/user";
import { authEmails } from "../lib/mails/auth.emails";
import AuthSession, { IAuthSession } from "../models/AuthSession";
import rateLimiter from "../config/rateRimiter";
import { IUser } from "../lib/types/user.types";
import { _idValidator, emailValidatior } from "../lib/schema/schemaComponents";
import { AuthenticatedRequest, validateUser } from "../lib/middlewares/auth.middleware";
import { NODE_ENV } from "../config/env";
import { CountryNamesEnum } from "../lib/types/country_names.enum";
import generateMatrimonyId from "../lib/core/mid-geneator";
import { z, ZodError } from "zod";

const router: Router = express.Router();
declare global {
    namespace Express {
        interface Request {
            authSession: IAuthSession;
            bearerAccessToken?: string;
        }
    }
}


router.use(rateLimiter(600 * 100, 100));
// Create registration session endpoint

router.post("/create-registration-session", async function (req: Request, res: Response): Promise<Response | any> {
    try {
        const validationResult = await registrationUserSchema.safeParseAsync(req.body);

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
                hasOtpRequest: 10, // this is the limit of requesting otp 
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

        let validationResult = await tempSessionValidation.safeParseAsync(req.body.sessionKey)

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: validationResult.error.errors[0].message,
                data: null,
                errors: validationResult.error
            });
        }

        let sessionKey = validationResult.data;

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
        const otp = NODE_ENV === 'developement' ? 123456 : GenerateOtp() // 6-digit OTPc
        // NODE_ENV === 'developement' && console.log(`otp is ${otp}`);

        // Now User Has less request left
        userData.hasOtpRequest -= 1;

        // Store OTP in session
        session.value = JSON.stringify({
            ...userData,
            otp,
            otpExpiry: Date.now() + 70 * 1000 // OTP valid for 1 minutes 25 seconds
        });

        switch (userData.hasOtpRequest < 1) {
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
        let validationResult = await VerifyOtpSchema.safeParseAsync(req.body);

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
        if (!sessionData.otp || sessionData.otp != otp) {
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
        const newUser = new User({
            mid: generateMatrimonyId(sessionData.address.country),
            profileCreatedBy: sessionData.profileCreatedBy,
            name: sessionData.name,
            gender: sessionData.gender,
            dateOfBirth: sessionData.dateOfBirth,
            email: sessionData.email,
            height: sessionData.height,
            weight: sessionData.weight,
            isEducated: sessionData.isEducated,
            education: sessionData.education,
            address: sessionData.address,
            phoneInfo: sessionData.phoneInfo,
            languages: sessionData.languages,
            religion: sessionData.religion,
            password: {
                hashed: passwordHash,
                salt: passwordSalt
            },
            createdAt: new Date(),
            age: sessionData.age,
            enhancedSettings: {
                blocked: [],
                privacy: {},
                notifications: {}
            }
        });

        newUser.createPreference();


        await newUser.save();

        // Send registration success email
        authEmails.registrationSuccessEmail(newUser.email)
            .catch(error => console.error('registration Success Email sending Error'));


        // Delete the registration session
        await session.deleteOne();


        // Create auth token for successful verification
        const authToken = giveAuthSession();

        // Create auth session
        await AuthSession.create({
            key: authToken,
            value: giveAuthSessionValue(newUser)
        });

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

router.post('/is-registration-successfull', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        let schema = z.object({
            userId: z.optional(_idValidator),
            authToken: z.optional(authSessionValidation)
        })
            .refine(data => {
                return !!data.userId || !!data.authToken
            },
                {
                    message: "User Id or User Auth session is required",
                    path: ['userId', 'authToken']
                });
        let { userId, authToken } = schema.parse(req.body);
        let user;
        if (userId) {
            user = await User.findById(userId);
            if (!user) {
                res.status(400).json({
                    success: false,
                    message: 'No User is registered with this data ',
                    data: null
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: {
                    name: user.name,
                    _id: user._id
                },
                error: null,
                message: 'User is registered'
            })
            return;
        }
        if (authToken) {
            let session = await AuthSession.findOne({ key: authToken });
            if (session) {
                let userId = session?.value.userId;
                user = await User.findById(userId);
            }
            if (!user) {
                res.status(400).json({
                    success: false,
                    message: 'No User is registered with this data ',
                    data: null
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: {
                    name: user.name,
                    _id: user._id
                },
                error: null,
                message: 'User is registered'
            })
            return;
        }

    } catch (error) {
        console.error('[is-registration-successful api error]', error);

        if (error instanceof ZodError) {
            res.status(400).json({
                success: false,
                message: 'Invalid request parameters',
                error: error.errors,
                data: null
            });
            return;
        }
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
})


router.post('/login', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        let { credential, password } = req.body;

        if (!credential || !password) {
            return res.status(400).json({
                success: false,
                message: "Credential and password are required",
                data: null
            });
        }

         if (typeof credential !== 'string' || typeof password !== 'string') {
            return res.status(400).json({
                success: false,
                message: "Credential and password are not string",
                data: null
            });
        }
        [credential, password] = [credential, password].map(el => el.trim());

        // Email regex remains the same as it's already robust
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        let existingUser: IUser | null = null;
        let loginType: LoginEnum;
        const phoneRegex = /^\d{10,15}$/;

        if (emailRegex.test(credential)) {
            // Handle email login
            loginType = LoginEnum.withEmail;
            const validateEmail = await emailValidatior.safeParseAsync(credential);
            
            if (!validateEmail.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid email format",
                    data: null
                });
            }

            existingUser = await User.findOne({ email: credential });
        } else {
            if (phoneRegex.test(credential) === false) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid credential format. Please provide a valid email or phone number",
                    data: null
                });
            }


            loginType = LoginEnum.withPhone;
            
            existingUser = await User.findOne({
                'phoneInfo.number': credential
            });
        }

        // Rest of the login logic remains the same
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "No account found with these credentials",
                data: null
            });
        }

      
        const isPasswordValid = await comparePasswords({
            password: password,
            hashedPassword: existingUser.password.hashed,
            salt: existingUser.password.salt
        });

        if (!isPasswordValid) {

            
            // Log failed attempts
            console.warn(`[Failed Login] ${new Date().toISOString()} - Invalid password for user: ${existingUser._id}`);
            return res.status(401).json({
                success: false,
                message: "Invalid password",
                data: null
            });
        }

       
        const authToken = giveAuthSession();

        // Remove any previous auth session for the user
        await AuthSession.deleteOne({ 'value.email': existingUser.email });

        // Create a new auth session for the user
        await AuthSession.create({
            key: authToken,
            value: giveAuthSessionValue(existingUser)
        });

        // Return the response with the new auth token
        return res.status(200).json({
            success: true,
            message: "Login successful.",
            value: {
                email: existingUser.email,
                userId: existingUser._id,
                authToken: authToken
            }
        });

    } catch (error) {
        console.error('[Login API Error]:', error);
        return res.status(500).json({
            success: false,
            message: "An error occurred during login. Please try again.",
            data: null
        });
    }
});



router.post('/reset-password', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        let validationResult = await ResetPasswordSchema.safeParseAsync(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: validationResult.error.errors[0].message,
                data: null,
                error: validationResult.error
            });
        }

        let { userId, password, newPassword } = validationResult.data;

        let existingUser = await User.findById(userId);

        if (!existingUser) {
            return res.status(401).json({
                success: false,
                message: "There is no user registered with this account",
                data: null
            });
        }

        const isPasswordEqual = await comparePasswords({
            password: password,
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
        let newPasswordHash = await hashPassword(newPassword, newPasswordSalt);

        existingUser.password.salt = newPasswordSalt;
        existingUser.password.hashed = newPasswordHash;

        await existingUser.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successfull",
            data: null
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

// Create forget password session
router.post("/create-forget-password-session", async function (req: Request, res: Response): Promise<Response | any> {
    try {
        // Validate email
        const validationResult = await emailValidatior.safeParseAsync(req.body.email || "");

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: validationResult.error.errors[0].message,
                data: null,
                errors: validationResult.error
            });
        }

        const email = validationResult.data;

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
        const session = await TemporarySession.findOne({})
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
        const session = await TemporarySession.findOne({})
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


// Verify forget password OTP and reset password
router.post("/log-out", validateUser, async function (req: Request, res: Response): Promise<Response | any> {
    try {
        await req.authSession?.deleteOne();
        res.status(200).json({
            success: true,
            message: "Logout completed successfully",
            data: null
        })
        return;
    } catch (error) {
        console.error("Log out error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            data: null
        });
    }
});



export default router;