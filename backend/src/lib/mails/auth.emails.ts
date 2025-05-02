/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import {
    COMPANY_MAIL,
    COMPANY_CONTACT_ADDRESS,
    COMPANY_CONTACT_EMAIL,
    COMPANY_CONTACT_PHONE,
    COMPANY_LOGO,
    COMPANY_NAME,
    EMAIL_PRIMARY_COLOR,
    EMAIL_SECONDARY_COLOR,
} from '../../config/env';
import transporter from '../../config/transporter';

// Email templates
export default function generateEmailTemplate(content: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
              <img src="${COMPANY_LOGO}" alt="${COMPANY_NAME} Logo" style="max-width: 200px;">
          </div>
          <div style="background-color: ${EMAIL_PRIMARY_COLOR}; color: white; padding: 15px; text-align: center; border-radius: 8px;">
              <h1>${COMPANY_NAME}</h1>
          </div>
          <div style="padding: 20px; color: #333;">
              ${content}
          </div>
          <hr style="border: 1px solid ${EMAIL_SECONDARY_COLOR}; margin: 20px 0;">
          <div style="font-size: 12px; color: #666; text-align: center;">
              <p>${COMPANY_NAME}</p>
              <p>${COMPANY_CONTACT_ADDRESS}</p>
              <p>Email: ${COMPANY_CONTACT_EMAIL}</p>
              <p>Phone: ${COMPANY_CONTACT_PHONE}</p>
          </div>
      </div>
    `;
}

// Sign-Up OTP Email
async function signUpOtpEmail(otp: number, email: string): Promise<boolean> {
    try {
        const content = `
        <h2>Sign-Up Verification</h2>
        <p>Thank you for signing up for ${COMPANY_NAME}. Use the following OTP to complete your registration:</p>
        <div style="background-color: ${EMAIL_SECONDARY_COLOR}; padding: 15px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="margin: 0;">${otp}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
      `;
        const info = await transporter.sendMail({
            from: COMPANY_MAIL,
            to: email,
            subject: `Sign-Up Verification - ${COMPANY_NAME}`,
            html: generateEmailTemplate(content),
        });
        console.log('Sign-Up OTP email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending Sign-Up OTP email:', error);
        return false;
    }
}

// Registration Success Email
async function registrationSuccessEmail(email: string): Promise<boolean> {
    try {
        const content = `
        <h2>Registration Successful</h2>
        <p>Congratulations! You have successfully registered with ${COMPANY_NAME}. We wish you the best in finding your life partner.</p>
      `;
        const info = await transporter.sendMail({
            from: COMPANY_MAIL,
            to: email,
            subject: `Welcome to ${COMPANY_NAME}`,
            html: generateEmailTemplate(content),
        });
        console.log('Registration success email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending registration success email:', error);
        return false;
    }
}

// Forgot Password OTP Email
async function forgotPasswordOtpEmail(otp: number, email: string): Promise<boolean> {
    try {
        const content = `
        <h2>Password Reset</h2>
        <p>You requested to reset your password for ${COMPANY_NAME}. Use the following OTP to proceed:</p>
        <div style="background-color: ${EMAIL_SECONDARY_COLOR}; padding: 15px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="margin: 0;">${otp}</h1>
        </div>
        <p>This code will expire in 10 minutes. If you didn't request this, please contact support immediately.</p>
      `;
        const info = await transporter.sendMail({
            from: COMPANY_MAIL,
            to: email,
            subject: `Password Reset - ${COMPANY_NAME}`,
            html: generateEmailTemplate(content),
        });
        console.log('Forgot Password OTP email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending Forgot Password OTP email:', error);
        return false;
    }
}

// Export emails
export const authEmails = {
    signUpOtpEmail,
    registrationSuccessEmail,
    forgotPasswordOtpEmail,
};