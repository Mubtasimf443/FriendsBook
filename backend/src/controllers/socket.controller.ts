/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { z } from "zod";
import { authSessionValidation } from "../lib/schema/auth.schema";
import AuthSession from "../models/AuthSession";
import VideoProfile from "../models/VideoProfile";


class SocketComtroller {
    constructor () {

    }

    public async verifiyToken(auth:{profileType :any, token :any}  ) {
        try {
            let Schema = z.object({
                profileType : z.enum(['videoProfile' , 'matrimonyProfile'] ),
                token : authSessionValidation
            })
            let { profileType, token } = Schema.parse({ profileType: auth.profileType, token: auth.token });

            if (profileType === 'matrimonyProfile') {
                let user = await AuthSession.findOne({ key: token }, 'value').lean();
                if (!user) {
                    throw new Error("User is completed successfully");
                }
                return { profileType, user };
            }


            let user = await VideoProfile.findOne({ authSession: token }, 'name email gender languages status languages lastActive profileImage coverImage').lean();
            if (!user) {
                throw new Error("User is completed successfully");
            }
            return { profileType, user };

        } catch (error) {
            console.error('[Verfify Socket Token error]) ' , error );
            
            return false;
        }
    }
}

const socketController=new SocketComtroller();


export default socketController;