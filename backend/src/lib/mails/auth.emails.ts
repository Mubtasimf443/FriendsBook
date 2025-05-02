/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { COMPANY_MAIL ,COMPANY_CONTACT_ADDRESS , COMPANY_CONTACT_EMAIL , COMPANY_CONTACT_PHONE , COMPANY_LOGO ,COMPANY_NAME } from "../../config/env";
import transporter from "../../config/transporter";


// Add this function to your existing authEmails object
async function loginOtpVerificationEmail(otp: number, email: string): Promise<boolean> {
    try {
        const info = await transporter.sendMail({
            from: COMPANY_MAIL,
            to: email,
            subject: `Login Verification - ${COMPANY_NAME}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="${COMPANY_LOGO}" alt="${COMPANY_NAME} Logo" style="max-width: 200px;">
                    </div>
                    <h2 style="color: #333;">Login Verification</h2>
                    <p>You are attempting to log in to your ${COMPANY_NAME} account. Please use the following verification code:</p>
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #4CAF50; margin: 0;">${otp}</h1>
                    </div>
                    <p>This code will expire in 10 minutes.</p>
                    <p>If you didn't request this login, please contact us immediately at ${COMPANY_CONTACT_EMAIL}.</p>
                    <hr style="border: 1px solid #eee; margin: 20px 0;">
                    <div style="font-size: 12px; color: #666;">
                        <p>${COMPANY_NAME}</p>
                        <p>${COMPANY_CONTACT_ADDRESS}</p>
                        <p>Email: ${COMPANY_CONTACT_EMAIL}</p>
                        <p>Phone: ${COMPANY_CONTACT_PHONE}</p>
                    </div>
                </div>
            `
        });
        console.log('Login verification email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending login verification email:', error);
        return false;
    }
}

// Add to exports
export const authEmails = {
    loginOtpVerificationEmail
};