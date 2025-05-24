/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { ExtendedError, Namespace, Socket } from "socket.io";
import { MessagingMemberType, MessagingRoom } from "../models/MessagingRooms";
import { NextFunction } from "express";
import VideoProfile from "../models/VideoProfile";
import AuthSession from "../models/AuthSession";
import { authSessionValidation } from "../lib/schema/auth.schema";
import { User } from "../models/user";
import { _idValidator, uuidValidator } from "../lib/schema/schemaComponents";
import { z } from "zod";
import { Message } from "../models/Message";
import { roomIdSchema } from "./randomVideoCall.socket";
import { isBefore } from "date-fns";
import Gifts from "../models/Gifts";



export default async function configureChatMessagingSocket(io: Namespace) {
    io.use(async function (socket, next: (error?: ExtendedError | undefined) => void): Promise<any> {
        try {
            let { token, profileType } = await socket.handshake.auth;
            token = authSessionValidation.parse(token);

            switch (profileType) {
                case 'video_calling_member':
                    let videoCallingMember = await VideoProfile.findOne({ 'auth.authSession': token });
                    if (videoCallingMember) {
                        socket.user_id = videoCallingMember._id.toString();
                        socket.userProfileType = 'videoProfile';
                        videoCallingMember.socket_ids.messaging_socket = socket.id;
                        await videoCallingMember.save();
                        return next();
                    } else return next(new Error('Failed To Authenticate the User'));
                    break;
                default:
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
                            members: { $all: [messengerId, socket.user_id] }
                        });
                        if (existingRoom) {
                            room_id = existingRoom._id;
                        }
                        let otherUser = await User.findById(messengerId, 'name profileImage _id socket_ids.messaging_socket');
                        if (!otherUser) return socket.emit('message-room-opening-error', { message: "Failed Open The message room" });
                        
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
                        if (otherUser.socket_ids?.messaging_socket) io.to(otherUser.socket_ids.messaging_socket).emit('messaging-room-opened', room_id, userA);

                        return
                    };
                    case 'videoProfile': {
                        let existingRoom = await MessagingRoom.findOne({
                            memberType: 'video_calling_member',
                            members: { $all: [messengerId, socket.user_id] }
                        });

                        if (existingRoom) room_id = existingRoom._id;
                        
                        let otherUser = await VideoProfile.findById(messengerId, 'name profileImage _id socket_ids.messaging_socket');
                        if (!otherUser) return socket.emit('message-room-opening-error', { message: "Failed Open The message room" })
                        
                        if (otherUser && room_id) {
    
                            return socket.emit('messaging-room-opened', room_id, otherUser);
                        }
                            
                        let room = await MessagingRoom.create({
                            members: [socket.user_id, otherUser._id],
                            memberType: 'video_calling_member'
                        });

                        await VideoProfile.findByIdAndUpdate(socket.user_id, { $addToSet: { 'messagingRooms.connectedRooms': room._id } });
                        await VideoProfile.findByIdAndUpdate(otherUser._id, { $addToSet: { 'messagingRooms.connectedRooms': room._id } });
                        let userA = await User.findById(socket.user_id);
                        if (otherUser.socket_ids?.messaging_socket) io.to(otherUser.socket_ids.messaging_socket).emit('messaging-room-opened', room_id, userA);

                        return socket.emit('messaging-room-opened', room_id, otherUser);
                    };
                }
            } catch (error) {
                console.error(error);
                socket.emit('message-room-opening-error', { message: "Failed Open The message room" })
            }
        });


        socket.on('join-room', (uuid) => {
            try {
                socket.join(roomIdSchema.parse(uuid));
                socket.emit('joined-room')
            } catch (error) {
                console.error(error);
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
                
                if (!room) throw new Error("Message Room Is not valid");

                let message = await Message.create({
                    room: room._id,
                    sender: socket.user_id,
                    type: 'text',
                    content: msg
                });

                socket.broadcast.to(roomId).emit('unseen-message', {
                    message: msg,
                    msg_id: message._id,
                    sender: socket.user_id,
                    roomId
                });

                socket.emit('message-send-successful', { msg_id: message._id , roomId });
                return;
            } catch (error) {
                console.error(error);
                socket.emit('sent-message-failed', { msg, roomId });
            }
        });


        socket.on('send-image-event', async function ( url, roomId) {
            try {
                z.object({ url: z.string().url(), roomId: z.string().uuid() }).parse({  url, roomId });
                roomId = _idValidator.parse(roomId);
                let room = await MessagingRoom.findOne({ _id: roomId });
                if (!room)   throw new Error("Message Room Is not valid");
                

                let message = await Message.create({
                    room: room._id,
                    sender: socket.user_id,
                    type:'image',
                    content : url
                });

                socket.broadcast.to(roomId).emit('unseen-image', {
                    image: url,
                    msg_id: message._id,
                    sender: socket.user_id,
                    roomId
                });

                socket.emit('image-send-successful', { msg_id: message._id , roomId});

                return;
            } catch (error) {
                console.error(error);
                socket.emit('sent-image-failed', { message: "Failed To send Message" });
            }
        });


        socket.on('send-pdf-event', async function (pdf_id , pdfName , roomId) {
            try {
                [pdf_id, pdfName, roomId] = [uuidValidator.parse(pdf_id), z.string().trim().min(1).max(120).parse(pdfName), uuidValidator.parse(roomId)];

                let room = await MessagingRoom.findOne({ _id: roomId });
                if (!room) throw new Error("Message Room Is not valid");

                let message = await Message.create({
                    room: room._id,
                    sender: socket.user_id,
                    type:'pdf',
                    content : pdf_id
                });

                socket.broadcast.to(roomId).emit('unseen-image', {
                    pdf_id, 
                    pdfName,
                    msg_id: message._id,
                    sender: socket.user_id,
                    roomId
                });

                socket.emit('image-send-successful', { msg_id: message._id , roomId});

            } catch (error) {
                console.error(error);
                socket.emit('sent-pdf-failed', { message: "Failed To send Message" });
            }
        });


        socket.on('send-gift-event', async function (gift_id, roomId) {
            try {
                if (socket.userProfileType === 'matrimonyProfile') {
                    socket.emit('sent-gift-failed', { message: "Sending Gift is for Video calling User" });
                    return ;
                }
                gift_id =_idValidator.parse(gift_id);
                roomId = roomIdSchema.parse(roomId);
                let room = await MessagingRoom.findOne({ _id: roomId , memberType : "video_calling_member"}).populate('members');
                if (!room) throw new Error("Message Room Is not valid");
                
                let userA = await VideoProfile.findById(socket.user_id);
                
                if (!userA) { 
                    throw new Error("Video calling User Does not exist ");
                } else if (userA.video_calling_coins >= coins ) {
                    let userB = await room.members.find(element => element._id.toString() !== socket.user_id.toString() );
                    if (!userB) throw new Error("Failed to load User B");
                    
                    await VideoProfile.findByIdAndUpdate( userB._id ,{
                        $inc : {  video_calling_coins : coins   }
                    });

                    await Message.create({
                        sender : socket.user_id ,
                        type : 'coin',
                        content : coins ,
                        room : room._id ,
                    });

                    socket.broadcast.to(roomId).emit('recieved-coins' , { coins , roomId , senderName : userA.name });
                    socket.emit('coins-send' , { coins , roomId });

                } else {
                    socket.emit('sent-gift-failed', { message: "User Does not have sufficient Coins To send" });
                    return;
                }
            } catch (error) {
                console.error(error);
                socket.emit('sent-gift-failed', { message: "Unknown Error" });
            }
        });

        // socket.on('send-gift-event', async function (gift_id, roomId) {
        //     try {
        //         if (socket.userProfileType === 'matrimonyProfile') {
        //             socket.emit('sent-gift-failed', { message: "Sending Gifts is for Video calling User" });
        //             return;
        //         }

        //         roomId = roomIdSchema.parse(roomId);
        //         let room = await MessagingRoom.findOne({ _id: roomId , memberType : "video_calling_member"}).populate('members');
        //         if (!room) throw new Error("Message Room Is not valid");

        //         let userA = await VideoProfile.findById(socket.user_id);
        //         if (!userA) { 
        //             throw new Error("Video calling User Does not exist");
        //         }

        //         let gift = await Gifts.findById(_idValidator.parse(gift_id ));

        //         if (!gift) return socket.emit('sent-gift-failed', { message: "Sending Gifts is for Video calling User" });
 

        //     } catch (error) {
        //         console.error(error);
        //         socket.emit('sent-gift-failed', { message: "Unknown Error" });
        //     }
        // });



        socket.on('check-msg' , async (fromDate, roomId ) => {
            try {
                roomId = roomIdSchema.parse(roomId);
                fromDate = z.string().transform(str => new Date(str)).pipe(z.date());
                
                if (!isBefore(fromDate , new Date())) {
                    throw new Error("Invalid Message Date");
                }
                
                let room = await MessagingRoom.findOne({ _id: roomId , memberType : "video_calling_member"}).populate('members');
                if (!room) throw new Error("Message Room Is not valid");

                let messages = await Message.find(
                    {
                        createdAt: { $gte: fromDate },
                        room: room._id,
                        sender: { $ne: socket.user_id }
                    },
                    "type content"
                )

                socket.emit('found-prev-message' , { roomId , messages });
                return;
            } catch (error) {
                console.error(error);
                socket.emit('check-msg-error' , { message : null});
            }
        });

    });



    return io;
}