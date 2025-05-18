/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Namespace, Socket } from "socket.io";
import { User } from "../models/user";
import AuthSession from "../models/AuthSession";
import VideoProfile from "../models/VideoProfile";
import { authSessionValidation } from "../lib/schema/auth.schema";
import { ExtendedError } from "socket.io";

export default async function configureVideoCallingSocket(io: Namespace) {
    try {
        io.use(async function (socket , next :  (error ?: ExtendedError | undefined  ) => void) :Promise<any>{
            try {
                let { token, profileType } = await socket.handshake.auth;
                token =authSessionValidation.parse(token);
                if (profileType === 'video_calling_member') {
                    let videoCallingMember = await VideoProfile.findOne({ 'auth.authSession' :token  });
                    if (videoCallingMember) {
                        socket.user_id =  videoCallingMember._id.toString();
                        socket.userProfileType = 'videoProfile';
                        videoCallingMember.socket_ids.messaging_socket = socket.id;
                        await videoCallingMember.save();
                        return next();
                    } else return next(new Error('Failed To Authenticate the User'));
                } else {
                    let matrimonyProfile = await AuthSession.findOne({ key : token } , 'value.userId');
                    if (matrimonyProfile) {
                        socket.user_id = matrimonyProfile.value.userId.toString();
                        socket.userProfileType = 'matrimonyProfile';
                        await User.findByIdAndUpdate( socket.user_id  , { 'socket_ids.messaging_socket' : socket.id })
                        return next();
                    } else return next(new Error('Failed To Authenticate the User'));
                }
            } catch (error) {
                next(new Error('Failed to Authenticate User'));
            }
        });
        io.on('connection', async (socket: Socket) => {
            socket.emit('connected', { message :'connection SuccessFull'});

            socket.on('request-video-call' , () => {})
            socket.on('request-video-call' , () => {})
            socket.on('request-video-call' , () => {})
            
        });
    } catch (error) {
        console.error(error);
    }
}