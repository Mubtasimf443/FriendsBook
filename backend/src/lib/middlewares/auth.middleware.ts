/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Request, Response, NextFunction, } from 'express';
import { authSessionValidation } from '../schema/auth.schema';
import AuthSession, { IAuthSession } from '../../models/AuthSession';

export interface AuthenticatedRequest extends Request {
  authSession: IAuthSession;
  bearerAccessToken: string
}

// Utility function to extract token
export const extractBearerToken = (header: string | undefined): string | null => {
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  // Remove 'Bearer ' from the header
  return header.slice(7);
};

// Middleware to extract and validate bearer token
export async function validateUser(req: AuthenticatedRequest | any | Request, res: Response, next: NextFunction) :Promise<void | any> {
  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token is required'
      });
    }

    let validationResult = await authSessionValidation.safeParseAsync(token);

    if (!validationResult.success) {
      return res.status(401).json({
        success: false,
        message: 'Bearer access token is failed to validate',
        error: validationResult.error
      });
    }

    let session = await AuthSession.findOne({ key: validationResult.data });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Bearer access token is failed to validate',
        error: validationResult.error
      });
    }

    req.authSession = session;
    req.bearerAccessToken = token;
  

    next();
    return;
  } catch (error) {
    console.error('Bearer access Token Validation error' , error);

    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token'
    });

  }
};