/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { ExtendedError, Namespace, Socket } from "socket.io";
import { MessagingMemberType, MessagingRoom } from "../models/MessagingRooms";
import { NextFunction } from "express";
import VideoProfile from "../models/VideoProfile";
import AuthSession from "../models/AuthSession";
import { authSessionValidation } from "../lib/schema/auth.schema";
import { User } from "../models/user";
import { _idValidator } from "../lib/schema/schemaComponents";
import { z } from "zod";
import { Message } from "../models/Message";

export default async function configureChatMessagingSocket(io: Namespace) {
    io.use(async function (socket, next: (error?: ExtendedError | undefined) => void): Promise<any> {
        try {
            let { token, profileType } = await socket.handshake.auth;
            token = authSessionValidation.parse(token);
            if (profileType === 'video_calling_member') {
                let videoCallingMember = await VideoProfile.findOne({ 'auth.authSession': token });
                if (videoCallingMember) {
                    socket.user_id = videoCallingMember._id.toString();
                    socket.userProfileType = 'videoProfile';
                    videoCallingMember.socket_ids.messaging_socket = socket.id;
                    await videoCallingMember.save();
                    return next();
                } else return next(new Error('Failed To Authenticate the User'));
            } else {
                let matrimonyProfile = await AuthSession.findOne({ key: token }, 'value.userId');
                if (matrimonyProfile) {
                    socket.user_id = matrimonyProfile.value.userId.toString();
                    socket.userProfileType = 'matrimonyProfile';
                    await User.findByIdAndUpdate(socket.user_id, { 'socket_ids.messaging_socket': socket.id })
                    return next();
                } else return next(new Error('Failed To Authenticate the User'));
            }
        } catch (error) {
            next(new Error('Failed to Authenticate User'));
        }
    });

    io.on('connection', async (socket: Socket) => {
        socket.emit('connected', { message: 'connection SuccessFull' });

        socket.on('initialize-message', async () => {
            try {
                switch (socket.userProfileType) {
                    case 'matrimonyProfile':
                        let user = await User.findById(socket.user_id);
                        if (user) {
                            let rooms = await user.messagingRooms.connectedRooms;
                            for (let i = 0; i < rooms.length; i++) {
                                const element = rooms[i];
                                socket.join(element.toString());
                            }
                            let db_rooms = (await MessagingRoom.find({
                                memberType: "matrimony_member",
                                _id: {
                                    $in: [rooms]
                                }
                            }))
                                .map((element) => {
                                    return ({
                                        room_id: element._id,
                                        user2_id: element.members.filter(el => el.toString() != user?._id?.toString()).join(''),
                                    })
                                });

                            let user2_details = await User.find({
                                _id: { $in: db_rooms.map(el => el.user2_id) },

                            }, "name profileImage _id");

                            let activeRooms: any[] = [];

                            for (let i = 0; i < user2_details.length; i++) {
                                const element = user2_details[i];
                                let db_room = db_rooms.find((room) => {
                                    if (room.user2_id == element._id?.toString()) return room;
                                });
                                if (db_room) {
                                    activeRooms.push({
                                        userName: element.name,
                                        userId: element._id,
                                        room: db_room.room_id
                                    })
                                }
                            }

                            socket.emit('message-initialization-completed', activeRooms)
                        }
                        break;
                    case 'videoProfile':
                        let videoUser = await VideoProfile.findById(socket.user_id);
                        if (videoUser) {
                            let rooms = await videoUser.messagingRooms.connectedRooms;
                            for (let i = 0; i < rooms.length; i++) socket.join(rooms[i].toString());

                            let db_rooms = (await MessagingRoom.find({
                                memberType: 'video_calling_member',
                                _id: {
                                    $in: [rooms]
                                }
                            }))
                                .map((element) => {
                                    return ({
                                        room_id: element._id,
                                        user2_id: element.members.filter(el => el.toString() != videoUser._id.toString()).join(''),
                                    })
                                });

                            let user2_details = await VideoProfile.find({
                                _id: { $in: db_rooms.map(el => el.user2_id) },

                            }, "name profileImage _id");

                            let activeRooms: any[] = [];

                            for (let i = 0; i < user2_details.length; i++) {
                                const element = user2_details[i];
                                let db_room = db_rooms.find((room) => {
                                    if (room.user2_id == element._id?.toString()) return room;
                                });
                                if (db_room) {
                                    activeRooms.push({
                                        userName: element.name,
                                        userId: element._id,
                                        room: db_room.room_id
                                    })
                                }
                            }

                            socket.emit('message-initialization-completed', activeRooms)
                        }
                        break;

                }
            } catch (error) {
                console.error(error);
                socket.emit('initialize-message-error', { message: "Failed to initialize message" })
            }
        });


        socket.on('open-message-room', async (messengerId) => {
            try {
                messengerId = _idValidator.parse(messengerId);
                let room_id;
                switch (socket.userProfileType) {
                    case 'matrimonyProfile': {
                        let existingRoom = await MessagingRoom.findOne({
                            memberType: 'matrimony_member',
                            members:{$all : [messengerId, socket.user_id]}
                        });
                        if (existingRoom) {
                            room_id = existingRoom._id;
                        }
                        let otherUser = await User.findById(messengerId, 'name profileImage _id socket_ids.messaging_socket');
                        if (!otherUser) {
                            return socket.emit('message-room-opening-error', { message: "Failed Open The message room" })
                        }
                        if (otherUser && room_id) {
                            
                            socket.emit('messaging-room-opened', room_id, otherUser);
                            return;
                        }
                        let room = await MessagingRoom.create({
                            members: [socket.user_id, otherUser._id],
                            memberType: 'matrimony_member'
                        });

                        await User.findByIdAndUpdate(socket.user_id, { $addToSet: { 'messagingRooms.connectedRooms': room._id } })
                        await User.findByIdAndUpdate(otherUser._id, { $addToSet: { 'messagingRooms.connectedRooms': room._id } })
                        socket.emit('messaging-room-opened', room_id, otherUser);
                        
                        let userA = await User.findById(socket.user_id, 'name profileImage _id').lean();
                        if (otherUser.socket_ids?.messaging_socket) io.to(otherUser.socket_ids.messaging_socket).emit('messaging-room-opened', room_id, userA)

                        return
                    };
                    case 'videoProfile': {
                        let existingRoom = await MessagingRoom.findOne({
                            memberType: 'video_calling_member',
                            members: {$all :[messengerId, socket.user_id]}
                        });

                        if (existingRoom) {
                            room_id = existingRoom._id;
                        }

                        let otherUser = await VideoProfile.findById(messengerId, 'name profileImage _id socket_ids.messaging_socket');
                        if (!otherUser) {
                            return socket.emit('message-room-opening-error', { message: "Failed Open The message room" })
                        }
                        if (otherUser && room_id) {
                            socket.emit('messaging-room-opened', room_id, otherUser);
                            return;
                        }
                        let room = await MessagingRoom.create({
                            members: [socket.user_id, otherUser._id],
                            memberType: 'video_calling_member'
                        });

                        await VideoProfile.findByIdAndUpdate(socket.user_id, { $addToSet: { 'messagingRooms.connectedRooms': room._id } })
                        await VideoProfile.findByIdAndUpdate(otherUser._id, { $addToSet: { 'messagingRooms.connectedRooms': room._id } })
                        let userA = await User.findById(socket.user_id)
                        if (otherUser.socket_ids?.messaging_socket) io.to(otherUser.socket_ids.messaging_socket).emit('messaging-room-opened', room_id, userA)

                        return socket.emit('messaging-room-opened', room_id, otherUser);
                    };
                }
            } catch (error) {
                console.error(error);
                socket.emit('message-room-opening-error', { message: "Failed Open The message room" })
            }
        });


        socket.on("join-msg-room" , (roomId) => {
            try {
                roomId = _idValidator.parse(roomId);
                socket.join(roomId)
            } catch (error) {
                console.error(`[join msg room error]` , error );
                socket.emit('join-msg-room-error', { data : null})
            }
        })



        socket.on('send-message-event', async function (msg, roomId) {
            try {
                msg = (z.string().trim()
                    .min(1)
                    .max(1000)
                    .refine(val => !/(.)\1{6,}/g.test(val))
                    .refine(
                        str => !/<script.*?>.*?<\/script>/gi.test(str),
                        { message: "Scripts not allowed" }
                    )
                    .refine(
                        str => !/\$|\{|\}|\b(?:\$ne|\$gt|\$lt|\$or|\$where)\b/gi.test(str),
                        { message: "Possible injection detected" }
                    )
                    .refine(
                        str => /^[\x00-\x7F]*$/.test(str), // ASCII filter (optional)
                        { message: "Unsupported characters" }
                    )
                ).parse(msg);
                roomId = _idValidator.parse(roomId);
                let room = await MessagingRoom.findOne({ _id: roomId });
                if (!room) {
                    throw new Error("Message Room Is not valid");
                }

                let message = await Message.create({
                    room: roomId,
                    sender: socket.user_id,
                    type: 'text',
                    content: msg
                });

                socket.broadcast.to(roomId).emit('unseen-message', {
                    message: msg,
                    msg_id: message._id,
                    sender: socket.user_id,
                });

                socket.emit('message-send-successful', { msg_id: message._id });
                return;
            } catch (error) {
                console.error(error);
                socket.emit('sent-message-failed', { message: "Failed To send Message" });
            }
        });


        socket.on('send-image-event', async function (img_id, roomId) {
            try {
                
            } catch (error) {
                console.error(error);
                socket.emit('sent-message-failed', { message: "Failed To send Message" });
            }
        });
        
        
        socket.on('send-pdf-event', async function (msg, roomId) {
            try {

            } catch (error) {
                console.error(error);
                socket.emit('sent-message-failed', { message: "Failed To send Message" });
            }
        });


        socket.on('send-pdf-event', async function (msg, roomId) {
            try {

            } catch (error) {
                console.error(error);
                socket.emit('sent-message-failed', { message: "Failed To send Message" });
            }
        });



    });



    return io;
}