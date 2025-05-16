/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Socket } from "socket.io";
import { ExtendedError } from "socket.io";
import socketController from "../../controllers/socket.controller";
import VideoProfile from "../../models/VideoProfile";
import AuthSession from "../../models/AuthSession";
import { z } from "zod";
import { authSessionValidation } from "../schema/auth.schema";

export async function socketMiddlewares(socket :Socket, next : (error ?: ExtendedError | undefined  ) => void ) :Promise<any> {
    try {
   
        let profileType =socket.handshake.auth.profileType;
        const token = socket.handshake.auth.token;
        
        let verificationRasult = await verifiyToken({ profileType , token })
        if (verificationRasult === false) {
            next(new Error('Verification Error'));
            return;
        }
        socket.user = verificationRasult.user;
        socket.userProfileType =verificationRasult.profileType;
        next();
    } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Socket Io validation error'))
    }
}


export async function socketMiddlewaresVideoProfile(socket :Socket, next : (error ?: ExtendedError | undefined  ) => void ) :Promise<any> {
    try {
     
        const token = socket.handshake.auth.token;

        let user = await VideoProfile.findOne(
            {  
                'auth.authSession': token,    
                'auth.session_exp_date': { $gt: new Date() }  
            }, 
            'name email gender languages status languages lastActive profileImage coverImage' 
        )
            .lean();
    
        if (!user) {
            return next(new Error("Socket authentication Failed"))
        }

        socket.user= user;
        next();
    } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Socket Io validation error'))
    }
}

export async function verifiyToken(auth:{profileType :any, token :any}  ):Promise<any> {
    try {
        let Schema = z.object({
            profileType : z.enum(['videoProfile' , 'matrimonyProfile'] ),
            token : authSessionValidation
        })
        let { profileType, token } = Schema.parse({ profileType: auth.profileType, token: auth.token });

        if (profileType === 'matrimonyProfile') {
            let user = await AuthSession.findOne({ key: token , expiration_date: { $gt: new Date() } }, 'value').lean();
            if (!user) {
                throw new Error("User is completed successfully");
            }
            return { profileType, user };
        }

        let user = await VideoProfile.findOne({
            'auth.authSession': token,
  'auth.session_exp_date': { $gt: new Date() }
 }, 
 'name email gender languages status languages lastActive profileImage coverImage'
).lean();
        
        if (!user) {
            throw new Error("User is completed successfully");
        }
        
        return { profileType, user };

    } catch (error) {
        console.error('[Verfify Socket Token error]) ' , error );
        
        return false;
    }
};