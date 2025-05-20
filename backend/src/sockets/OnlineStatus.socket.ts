/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Namespace } from "socket.io";
import { authSessionValidation } from "../lib/schema/auth.schema";
import VideoProfile from "../models/VideoProfile";
import AuthSession from "../models/AuthSession";
import { User } from "../models/user";

export async function configOnlineStatusSocket(io: Namespace,) {
    io.use(async (socket, next) => {
        try {
            let { token, profileType } = await socket.handshake.auth;
            token = authSessionValidation.parse(token);
            if (profileType === 'video_calling_member') {
                let videoCallingMember = await VideoProfile.findOne({ 'auth.authSession': token });
                if (videoCallingMember) {
                    socket.user_id = videoCallingMember._id.toString();
                    socket.userProfileType = 'videoProfile';
                    videoCallingMember.status = 'online';
                    videoCallingMember.lastActive = new Date(Date.now());
                    await videoCallingMember.save()
                    return next();
                }
                else next(new Error('Auth Error'))
            } else {
                let mAuthSession = await AuthSession.findOne({ key: token }, 'value.userId');
                if (mAuthSession) {
                    socket.user_id = mAuthSession.value.userId.toString();
                    socket.userProfileType = 'matrimonyProfile';

                    await User.findByIdAndUpdate(socket.user_id, {
                        "onlineStatus.isOnline": true,
                        "onlineStatus.lastSeen": Date.now(),
                        "onlineStatus.lastActive": Date.now(),
                    });
                    return next();
                } else return next(new Error('Auth Error'));
            }
        } catch (error) {
            next(new Error('Auth Error'))
        }
    });

    io.on('connection', (socket) => {
        socket.emit('connected', { data: null });


        socket.on('is-connected' , () =>   socket.emit('connected', { data: null }) )


        socket.on('disconnect', async function () {
            try {
                switch (socket.userProfileType) {
                    case 'matrimonyProfile':
                        await User.findByIdAndUpdate(socket.user_id, {
                            "onlineStatus.isOnline": true,
                            "onlineStatus.lastSeen": Date.now(),
                            "onlineStatus.lastActive": Date.now(),
                        });
                        return;
                    case "videoProfile":
                        await VideoProfile.findByIdAndUpdate(socket.user_id, {
                            status: 'offline',
                            lastActive: Date.now()
                        })
                        return;
                }
            } catch (error) {
                console.error("[Disconnection Socker Error ]", error);
            }
        })
    })
}