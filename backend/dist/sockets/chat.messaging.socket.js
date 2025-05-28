"use strict";
/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = configureChatMessagingSocket;
const MessagingRooms_1 = require("../models/MessagingRooms");
const VideoProfile_1 = __importDefault(require("../models/VideoProfile"));
const AuthSession_1 = __importDefault(require("../models/AuthSession"));
const auth_schema_1 = require("../lib/schema/auth.schema");
const user_1 = require("../models/user");
const schemaComponents_1 = require("../lib/schema/schemaComponents");
const zod_1 = require("zod");
const Message_1 = require("../models/Message");
const randomVideoCall_socket_1 = require("./randomVideoCall.socket");
const date_fns_1 = require("date-fns");
function configureChatMessagingSocket(io) {
    return __awaiter(this, void 0, void 0, function* () {
        io.use(function (socket, next) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    let { token, profileType } = yield socket.handshake.auth;
                    token = auth_schema_1.authSessionValidation.parse(token);
                    switch (profileType) {
                        case 'video_calling_member':
                            let videoCallingMember = yield VideoProfile_1.default.findOne({ 'auth.authSession': token });
                            if (videoCallingMember) {
                                socket.user_id = videoCallingMember._id.toString();
                                socket.userProfileType = 'videoProfile';
                                videoCallingMember.socket_ids.messaging_socket = socket.id;
                                yield videoCallingMember.save();
                                return next();
                            }
                            else
                                return next(new Error('Failed To Authenticate the User'));
                            break;
                        default:
                            let matrimonyProfile = yield AuthSession_1.default.findOne({ key: token }, 'value.userId');
                            if (matrimonyProfile) {
                                socket.user_id = matrimonyProfile.value.userId.toString();
                                socket.userProfileType = 'matrimonyProfile';
                                yield user_1.User.findByIdAndUpdate(socket.user_id, { 'socket_ids.messaging_socket': socket.id });
                                return next();
                            }
                            else
                                return next(new Error('Failed To Authenticate the User'));
                    }
                }
                catch (error) {
                    next(new Error('Failed to Authenticate User'));
                }
            });
        });
        io.on('connection', (socket) => __awaiter(this, void 0, void 0, function* () {
            socket.emit('connected', { message: 'connection SuccessFull' });
            socket.on('initialize-message', () => __awaiter(this, void 0, void 0, function* () {
                try {
                    switch (socket.userProfileType) {
                        case 'matrimonyProfile':
                            let user = yield user_1.User.findById(socket.user_id);
                            if (user) {
                                let rooms = yield user.messagingRooms.connectedRooms;
                                for (let i = 0; i < rooms.length; i++) {
                                    const element = rooms[i];
                                    socket.join(element.toString());
                                }
                                let db_rooms = (yield MessagingRooms_1.MessagingRoom.find({
                                    memberType: "matrimony_member",
                                    _id: {
                                        $in: [rooms]
                                    }
                                }))
                                    .map((element) => {
                                    return ({
                                        room_id: element._id,
                                        user2_id: element.members.filter(el => { var _a; return el.toString() != ((_a = user === null || user === void 0 ? void 0 : user._id) === null || _a === void 0 ? void 0 : _a.toString()); }).join(''),
                                    });
                                });
                                let user2_details = yield user_1.User.find({
                                    _id: { $in: db_rooms.map(el => el.user2_id) },
                                }, "name profileImage _id");
                                let activeRooms = [];
                                for (let i = 0; i < user2_details.length; i++) {
                                    const element = user2_details[i];
                                    let db_room = db_rooms.find((room) => {
                                        var _a;
                                        if (room.user2_id == ((_a = element._id) === null || _a === void 0 ? void 0 : _a.toString()))
                                            return room;
                                    });
                                    if (db_room) {
                                        activeRooms.push({
                                            userName: element.name,
                                            userId: element._id,
                                            room: db_room.room_id
                                        });
                                    }
                                }
                                socket.emit('message-initialization-completed', activeRooms);
                            }
                            break;
                        case 'videoProfile':
                            let videoUser = yield VideoProfile_1.default.findById(socket.user_id);
                            if (videoUser) {
                                let rooms = yield videoUser.messagingRooms.connectedRooms;
                                for (let i = 0; i < rooms.length; i++)
                                    socket.join(rooms[i].toString());
                                let db_rooms = (yield MessagingRooms_1.MessagingRoom.find({
                                    memberType: 'video_calling_member',
                                    _id: {
                                        $in: [rooms]
                                    }
                                }))
                                    .map((element) => {
                                    return ({
                                        room_id: element._id,
                                        user2_id: element.members.filter(el => el.toString() != videoUser._id.toString()).join(''),
                                    });
                                });
                                let user2_details = yield VideoProfile_1.default.find({
                                    _id: { $in: db_rooms.map(el => el.user2_id) },
                                }, "name profileImage _id");
                                let activeRooms = [];
                                for (let i = 0; i < user2_details.length; i++) {
                                    const element = user2_details[i];
                                    let db_room = db_rooms.find((room) => {
                                        var _a;
                                        if (room.user2_id == ((_a = element._id) === null || _a === void 0 ? void 0 : _a.toString()))
                                            return room;
                                    });
                                    if (db_room) {
                                        activeRooms.push({
                                            userName: element.name,
                                            userId: element._id,
                                            room: db_room.room_id
                                        });
                                    }
                                }
                                socket.emit('message-initialization-completed', activeRooms);
                            }
                            break;
                    }
                }
                catch (error) {
                    console.error(error);
                    socket.emit('initialize-message-error', { message: "Failed to initialize message" });
                }
            }));
            socket.on('open-message-room', (messengerId) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                try {
                    messengerId = schemaComponents_1._idValidator.parse(messengerId);
                    let room_id;
                    switch (socket.userProfileType) {
                        case 'matrimonyProfile':
                            {
                                let existingRoom = yield MessagingRooms_1.MessagingRoom.findOne({
                                    memberType: 'matrimony_member',
                                    members: { $all: [messengerId, socket.user_id] }
                                });
                                if (existingRoom) {
                                    room_id = existingRoom._id;
                                }
                                let otherUser = yield user_1.User.findById(messengerId, 'name profileImage _id socket_ids.messaging_socket');
                                if (!otherUser)
                                    return socket.emit('message-room-opening-error', { message: "Failed Open The message room" });
                                if (otherUser && room_id) {
                                    socket.emit('messaging-room-opened', room_id, otherUser);
                                    return;
                                }
                                let room = yield MessagingRooms_1.MessagingRoom.create({
                                    members: [socket.user_id, otherUser._id],
                                    memberType: 'matrimony_member'
                                });
                                yield user_1.User.findByIdAndUpdate(socket.user_id, { $addToSet: { 'messagingRooms.connectedRooms': room._id } });
                                yield user_1.User.findByIdAndUpdate(otherUser._id, { $addToSet: { 'messagingRooms.connectedRooms': room._id } });
                                socket.emit('messaging-room-opened', room_id, otherUser);
                                let userA = yield user_1.User.findById(socket.user_id, 'name profileImage _id').lean();
                                if ((_a = otherUser.socket_ids) === null || _a === void 0 ? void 0 : _a.messaging_socket)
                                    io.to(otherUser.socket_ids.messaging_socket).emit('messaging-room-opened', room_id, userA);
                                return;
                            }
                            ;
                        case 'videoProfile':
                            {
                                let existingRoom = yield MessagingRooms_1.MessagingRoom.findOne({
                                    memberType: 'video_calling_member',
                                    members: { $all: [messengerId, socket.user_id] }
                                });
                                if (existingRoom)
                                    room_id = existingRoom._id;
                                let otherUser = yield VideoProfile_1.default.findById(messengerId, 'name profileImage _id socket_ids.messaging_socket');
                                if (!otherUser)
                                    return socket.emit('message-room-opening-error', { message: "Failed Open The message room" });
                                if (otherUser && room_id) {
                                    return socket.emit('messaging-room-opened', room_id, otherUser);
                                }
                                let room = yield MessagingRooms_1.MessagingRoom.create({
                                    members: [socket.user_id, otherUser._id],
                                    memberType: 'video_calling_member'
                                });
                                yield VideoProfile_1.default.findByIdAndUpdate(socket.user_id, { $addToSet: { 'messagingRooms.connectedRooms': room._id } });
                                yield VideoProfile_1.default.findByIdAndUpdate(otherUser._id, { $addToSet: { 'messagingRooms.connectedRooms': room._id } });
                                let userA = yield user_1.User.findById(socket.user_id);
                                if ((_b = otherUser.socket_ids) === null || _b === void 0 ? void 0 : _b.messaging_socket)
                                    io.to(otherUser.socket_ids.messaging_socket).emit('messaging-room-opened', room_id, userA);
                                return socket.emit('messaging-room-opened', room_id, otherUser);
                            }
                            ;
                    }
                }
                catch (error) {
                    console.error(error);
                    socket.emit('message-room-opening-error', { message: "Failed Open The message room" });
                }
            }));
            socket.on('join-room', (uuid) => {
                try {
                    socket.join(randomVideoCall_socket_1.roomIdSchema.parse(uuid));
                    socket.emit('joined-room');
                }
                catch (error) {
                    console.error(error);
                }
            });
            socket.on('send-message-event', function (msg, roomId) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        msg = (zod_1.z.string().trim()
                            .min(1)
                            .max(1000)
                            .refine(val => !/(.)\1{6,}/g.test(val))
                            .refine(str => !/<script.*?>.*?<\/script>/gi.test(str), { message: "Scripts not allowed" })
                            .refine(str => !/\$|\{|\}|\b(?:\$ne|\$gt|\$lt|\$or|\$where)\b/gi.test(str), { message: "Possible injection detected" })
                            .refine(str => /^[\x00-\x7F]*$/.test(str), // ASCII filter (optional)
                        { message: "Unsupported characters" })).parse(msg);
                        roomId = schemaComponents_1._idValidator.parse(roomId);
                        let room = yield MessagingRooms_1.MessagingRoom.findOne({ _id: roomId });
                        if (!room)
                            throw new Error("Message Room Is not valid");
                        let message = yield Message_1.Message.create({
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
                        socket.emit('message-send-successful', { msg_id: message._id, roomId });
                        return;
                    }
                    catch (error) {
                        console.error(error);
                        socket.emit('sent-message-failed', { msg, roomId });
                    }
                });
            });
            socket.on('send-image-event', function (url, roomId) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        zod_1.z.object({ url: zod_1.z.string().url(), roomId: zod_1.z.string().uuid() }).parse({ url, roomId });
                        roomId = schemaComponents_1._idValidator.parse(roomId);
                        let room = yield MessagingRooms_1.MessagingRoom.findOne({ _id: roomId });
                        if (!room)
                            throw new Error("Message Room Is not valid");
                        let message = yield Message_1.Message.create({
                            room: room._id,
                            sender: socket.user_id,
                            type: 'image',
                            content: url
                        });
                        socket.broadcast.to(roomId).emit('unseen-image', {
                            image: url,
                            msg_id: message._id,
                            sender: socket.user_id,
                            roomId
                        });
                        socket.emit('image-send-successful', { msg_id: message._id, roomId });
                        return;
                    }
                    catch (error) {
                        console.error(error);
                        socket.emit('sent-image-failed', { message: "Failed To send Message" });
                    }
                });
            });
            socket.on('send-pdf-event', function (pdf_id, pdfName, roomId) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        [pdf_id, pdfName, roomId] = [schemaComponents_1.uuidValidator.parse(pdf_id), zod_1.z.string().trim().min(1).max(120).parse(pdfName), schemaComponents_1.uuidValidator.parse(roomId)];
                        let room = yield MessagingRooms_1.MessagingRoom.findOne({ _id: roomId });
                        if (!room)
                            throw new Error("Message Room Is not valid");
                        let message = yield Message_1.Message.create({
                            room: room._id,
                            sender: socket.user_id,
                            type: 'pdf',
                            content: pdf_id
                        });
                        socket.broadcast.to(roomId).emit('unseen-image', {
                            pdf_id,
                            pdfName,
                            msg_id: message._id,
                            sender: socket.user_id,
                            roomId
                        });
                        socket.emit('image-send-successful', { msg_id: message._id, roomId });
                    }
                    catch (error) {
                        console.error(error);
                        socket.emit('sent-pdf-failed', { message: "Failed To send Message" });
                    }
                });
            });
            // socket.on('send-gift-event', async (gift_id, roomId) => {
            //     try {
            //         if (socket.userProfileType !== 'videoProfile') {
            //             socket.emit('sent-gift-failed', { message: "Sending Gifts is for Video calling User" });
            //             return;
            //         }
            //         roomId = roomIdSchema.parse(roomId);
            //         gift_id = _idValidator.parse(gift_id);
            //         let room = await MessagingRoom.findOne({
            //             _id: roomId,
            //             memberType: "video_calling_member"
            //         })
            //         .populate('members');
            //         if (!room) {
            //             throw new Error("Message Room Is not valid");
            //         }
            //         // 4. Get sender's profile and gift details
            //         let sender = await VideoProfile.findById(socket.user_id);
            //         let gift = await Gifts.findById(gift_id);
            //         if (!sender || !gift) {
            //             throw new Error("Failed to load sender or gift details");
            //         }
            //         // 5. Check if sender has enough coins
            //         if (sender.video_calling_coins < gift.coins) {
            //             socket.emit('sent-gift-failed', {
            //                 message: "Insufficient coins to send this gift"
            //             });
            //             return;
            //         }
            //         // 6. Get receiver's profile (the other member in the room)
            //         let receiver = room.members.find(
            //             member => member._id.toString() !== socket.user_id
            //         );
            //         if (!receiver) {
            //             throw new Error("Failed to find gift receiver");
            //         }
            //         // 7. Transfer coins and update both profiles
            //         await VideoProfile.findByIdAndUpdate(sender._id, {
            //             $inc: { video_calling_coins: -gift.coins }
            //         });
            //         await VideoProfile.findByIdAndUpdate(receiver._id, {
            //             $inc: { video_calling_coins: gift.coins }
            //         });
            //         // 8. Create a gift message in the chat
            //         let message = await Message.create({
            //             room: room._id,
            //             sender: socket.user_id,
            //             type: 'gift',
            //             content: JSON.stringify({
            //                 gift_id: gift._id,
            //                 gift_name: gift.name,
            //                 gift_image: gift.image,
            //                 coins: gift.coins
            //             })
            //         });
            //         // 9. Emit events to both sender and receiver
            //         // To receiver
            //         socket.broadcast.to(roomId).emit('received-gift', {
            //             gift_id: gift._id,
            //             gift_name: gift.name,
            //             gift_image: gift.image,
            //             coins: gift.coins,
            //             msg_id: message._id,
            //             sender: socket.user_id,
            //             senderName: sender.name,
            //             roomId
            //         });
            //         // To sender
            //         socket.emit('gift-send-successful', {
            //             msg_id: message._id,
            //             roomId,
            //             remaining_coins: sender.video_calling_coins - gift.coins
            //         });
            //     } catch (error) {
            //         console.error(error);
            //         socket.emit('sent-gift-failed', { message: "Failed to send gift" });
            //     }
            // });
            // // socket.on('send-gift-event', async function (gift_id, roomId) {
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
            socket.on('check-msg', (fromDate, roomId) => __awaiter(this, void 0, void 0, function* () {
                try {
                    roomId = randomVideoCall_socket_1.roomIdSchema.parse(roomId);
                    fromDate = zod_1.z.string().transform(str => new Date(str)).pipe(zod_1.z.date());
                    if (!(0, date_fns_1.isBefore)(fromDate, new Date())) {
                        throw new Error("Invalid Message Date");
                    }
                    let room = yield MessagingRooms_1.MessagingRoom.findOne({ _id: roomId, memberType: "video_calling_member" }).populate('members');
                    if (!room)
                        throw new Error("Message Room Is not valid");
                    let messages = yield Message_1.Message.find({
                        createdAt: { $gte: fromDate },
                        room: room._id,
                        sender: { $ne: socket.user_id }
                    }, "type content");
                    socket.emit('found-prev-message', { roomId, messages });
                    return;
                }
                catch (error) {
                    console.error(error);
                    socket.emit('check-msg-error', { message: null });
                }
            }));
        }));
        return io;
    });
}
