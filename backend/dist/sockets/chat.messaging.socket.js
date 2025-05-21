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
function configureChatMessagingSocket(io) {
    return __awaiter(this, void 0, void 0, function* () {
        io.use(function (socket, next) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    let { token, profileType } = yield socket.handshake.auth;
                    token = auth_schema_1.authSessionValidation.parse(token);
                    if (profileType === 'video_calling_member') {
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
                    }
                    else {
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
                                if (!otherUser) {
                                    return socket.emit('message-room-opening-error', { message: "Failed Open The message room" });
                                }
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
                                if (existingRoom) {
                                    room_id = existingRoom._id;
                                }
                                let otherUser = yield VideoProfile_1.default.findById(messengerId, 'name profileImage _id socket_ids.messaging_socket');
                                if (!otherUser) {
                                    return socket.emit('message-room-opening-error', { message: "Failed Open The message room" });
                                }
                                if (otherUser && room_id) {
                                    socket.emit('messaging-room-opened', room_id, otherUser);
                                    return;
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
            socket.on("join-msg-room", (roomId) => {
                try {
                    roomId = schemaComponents_1._idValidator.parse(roomId);
                    socket.join(roomId);
                }
                catch (error) {
                    console.error(`[join msg room error]`, error);
                    socket.emit('join-msg-room-error', { data: null });
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
                        if (!room) {
                            throw new Error("Message Room Is not valid");
                        }
                        let message = yield Message_1.Message.create({
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
                    }
                    catch (error) {
                        console.error(error);
                        socket.emit('sent-message-failed', { message: "Failed To send Message" });
                    }
                });
            });
            socket.on('send-image-event', function (img_id, roomId) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                    }
                    catch (error) {
                        console.error(error);
                        socket.emit('sent-message-failed', { message: "Failed To send Message" });
                    }
                });
            });
            socket.on('send-pdf-event', function (msg, roomId) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                    }
                    catch (error) {
                        console.error(error);
                        socket.emit('sent-message-failed', { message: "Failed To send Message" });
                    }
                });
            });
            socket.on('send-pdf-event', function (msg, roomId) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                    }
                    catch (error) {
                        console.error(error);
                        socket.emit('sent-message-failed', { message: "Failed To send Message" });
                    }
                });
            });
        }));
        return io;
    });
}
