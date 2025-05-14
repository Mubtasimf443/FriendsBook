/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Request, Response, NextFunction, } from 'express';
import { authSessionValidation } from '../schema/auth.schema';
import AuthSession, { IAuthSession } from '../../models/AuthSession';
import VideoProfile from '../../models/VideoProfile';

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

    let session = await AuthSession.findOne({ key: validationResult.data , expiration_date : { $gt :new Date()}  });

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

export async function validateVideoProfile(req: AuthenticatedRequest | any | Request, res: Response, next: NextFunction) :Promise<void | any> {
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

    let user :any= await VideoProfile.findOne({ 'auth.authSession' : token , "auth.session_exp_date" : { $gt : new Date()} });
 
    if (user) {
      user = user?.toObject();
      delete user.passwordDetails;
      req.videoProfileData =user;
      next();
    } else {
      res.status(400).json({
          success: false,
          message:  'Invalid authorization token',
          data: null
      });
      return;
    }
    
  } catch (error) {
    console.error('Bearer access Token Validation error' , error);

    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token'
    });

  }
};


export async function validateBothProfileType(req: AuthenticatedRequest | any | Request, res: Response, next: NextFunction) {
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

    let matrimonyUserAuthSession = await AuthSession.findOne({ key : token , expiration_date : { $gt :new Date()} }); 


    if (matrimonyUserAuthSession) {
      req.authSession = matrimonyUserAuthSession;
      req.bearerAccessToken = token;
      next()
    } else {
      let user :any= await VideoProfile.findOne({ 'auth.authSession' : token , "auth.session_exp_date" : { $gt : new Date()} });
 
      if (user) {
        user = user?.toObject();
        delete user.passwordDetails;
        req.videoProfileData =user;
        next()
      }
      res.status(400).json({
          success: false,
          message: 'Failed to find User Account',
          data: null
      });
      return;
    }
  } catch (error) {
    console.error(`[Bearer access Token Validation error]` , error);
    
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token'
    });
  }
}


