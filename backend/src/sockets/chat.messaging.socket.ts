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
import { newSocketMiddleware } from "../lib/middlewares/socket.middleware";
import { SOCKET_USER_TYPE } from "../lib/types/socket.types";
import mongoose from "mongoose";



export default async function configureChatMessagingSocket(io: Namespace) {
    io.use(newSocketMiddleware(SOCKET_USER_TYPE.ALL));

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
                            $or: [
                                {
                                    memberType: 'matrimony_member',
                                    members: { $all: [messengerId , socket.user_id] }
                                },
                                {
                                    memberType: 'matrimony_member',
                                    members: { $all: [socket.user_id, messengerId] }
                                }
                            ],
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
                            $or: [
                                {
                                    members: { $all: [messengerId, socket.user_id] }
                                },
                                {
                                    members: { $all: [socket.user_id, messengerId] }
                                }
                            ],
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


        socket.on('join-room', async (uuid : string) => {
            try {
                const validatedRoomId = roomIdSchema.parse(uuid);
                const room = await MessagingRoom.findById(validatedRoomId);

                if (!room) {
                    throw new Error('Room not found');
                }

                if (!room.members.includes(new mongoose.Types.ObjectId(socket.user_id))) {
                    throw new Error('Not authorized to join this room');
                }

                await socket.join(validatedRoomId);
                socket.emit('joined-room', { roomId: validatedRoomId });
            } catch (error :any) {
                console.error(error);
                socket.emit('join-room-error', { message: error instanceof Error ? error.message : "Unknown Error" });
            }
        });


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


                if (!room.members.includes(new mongoose.Types.ObjectId(socket.user_id))) {
                    throw new Error('Not authorized to message in this room');
                }
           

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


        socket.on('send-gift-event', async (gift_id, roomId) => {
            try {
                if (socket.userProfileType !== 'videoProfile') {
                    socket.emit('sent-gift-failed', { message: "Sending Gifts is for Video calling User" });
                    return;
                }

                roomId = roomIdSchema.parse(roomId);
                gift_id = _idValidator.parse(gift_id);

                let room = await MessagingRoom.findOne({
                    _id: roomId,
                    memberType: "video_calling_member"
                })
                .populate('members');

                if (!room) {
                    throw new Error("Message Room Is not valid");
                }

                // 4. Get sender's profile and gift details
                let sender = await VideoProfile.findById(socket.user_id);
                let gift = await Gifts.findById(gift_id);

                if (!sender || !gift) {
                    throw new Error("Failed to load sender or gift details");
                }

                // 5. Check if sender has enough coins
                if (sender.video_calling_coins < gift.coins) {
                    socket.emit('sent-gift-failed', {
                        message: "Insufficient coins to send this gift"
                    });
                    return;
                }

                // 6. Get receiver's profile (the other member in the room)
                let receiver = room.members.find(
                    member => member._id.toString() !== socket.user_id
                );

                if (!receiver) {
                    throw new Error("Failed to find gift receiver");
                }

                // 7. Transfer coins and update both profiles
                await VideoProfile.findByIdAndUpdate(sender._id, {
                    $inc: { video_calling_coins: -gift.coins }
                });

                await VideoProfile.findByIdAndUpdate(receiver._id, {
                    $inc: { video_calling_coins: gift.coins }
                });

                // 8. Create a gift message in the chat
                let message = await Message.create({
                    room: room._id,
                    sender: socket.user_id,
                    type: 'gift',
                    content: JSON.stringify({
                        gift_id: gift._id,
                        gift_name: gift.name,
                        gift_image: gift.image,
                        coins: gift.coins
                    })
                });

                // 9. Emit events to both sender and receiver
                // To receiver
                socket.broadcast.to(roomId).emit('received-gift', {
                    gift_id: gift._id,
                    gift_name: gift.name,
                    gift_image: gift.image,
                    coins: gift.coins,
                    msg_id: message._id,
                    sender: socket.user_id,
                    senderName: sender.name,
                    roomId
                });

                // To sender
                socket.emit('gift-send-successful', {
                    msg_id: message._id,
                    roomId,
                    remaining_coins: sender.video_calling_coins - gift.coins
                });

            } catch (error) {
                console.error(error);
                socket.emit('sent-gift-failed', { message: "Failed to send gift" });
            }
        });
 

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


        socket.on('disconnect', async () => {
            try {
                switch (socket.userProfileType) {
                    case 'matrimonyProfile':
                        await User.findByIdAndUpdate(socket.user_id, {
                            'socket_ids.messaging_socket': null
                        });
                        break;
                    case 'videoProfile':
                        await VideoProfile.findByIdAndUpdate(socket.user_id, {
                            'socket_ids.messaging_socket': null
                        });
                        break;
                }
            } catch (error) {
                console.error('Error handling disconnect:', error);
            }
        });

    });



    return io;
}