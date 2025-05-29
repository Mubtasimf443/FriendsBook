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
exports.randomVideoCallSocketService = exports.roomIdSchema = void 0;
require("../lib/types/socket.decralation");
const RandomVideoCall_1 = require("../models/RandomVideoCall");
const zod_1 = require("zod");
const crypto_1 = require("crypto");
const VideoProfile_1 = __importDefault(require("../models/VideoProfile"));
const auth_schema_1 = require("../lib/schema/auth.schema");
const VIDEO_CALL_DURATION = 20 * 1000; // 20 seconds in milliseconds
exports.roomIdSchema = zod_1.z.string().uuid();
class randomVideoCallSocketService {
    constructor(io) {
        this.activeCallTimers = new Map();
        this.io = io;
        this.io.use(function (socket, next) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    let { token, profileType } = yield socket.handshake.auth;
                    token = auth_schema_1.authSessionValidation.parse(token);
                    if (profileType === 'video_calling_member') {
                        let videoCallingMember = yield VideoProfile_1.default.findOne({ 'auth.authSession': token });
                        if (videoCallingMember) {
                            socket.user_id = videoCallingMember._id.toString();
                            socket.userProfileType = 'videoProfile';
                            socket.user = videoCallingMember;
                            videoCallingMember.socket_ids.video_calling_socket = socket.id;
                            yield videoCallingMember.save();
                            return next();
                        }
                        else
                            return next(new Error('Failed To Authenticate the User'));
                    }
                    else
                        return next(new Error('Failed To Authenticate the User'));
                }
                catch (error) {
                    next(new Error('Failed to Authenticate User'));
                }
            });
        });
        this.initializeListeners();
    }
    initializeListeners() {
        return __awaiter(this, void 0, void 0, function* () {
            this.io.on('connection', (socket) => {
                var _a;
                this.cleanupUserSessions((_a = socket.user) === null || _a === void 0 ? void 0 : _a._id);
                socket.emit('connected', { data: null });
                socket.on('init-video-call', () => __awaiter(this, void 0, void 0, function* () {
                    try {
                        let roomId = (0, crypto_1.randomUUID)();
                        const randomVideoCall = new RandomVideoCall_1.RandomVideoCall({
                            userId: socket.user._id,
                            status: 'searching',
                            roomId: roomId,
                            gender: socket.user.gender
                        });
                        socket.join(roomId);
                        yield randomVideoCall.save();
                        socket.emit('video-call-initialized', { data: { roomId } });
                    }
                    catch (error) {
                        console.error('Error creating video request:', error);
                        socket.emit('call-initialization-error', { message: 'Failed to create video call request' });
                    }
                }));
                socket.on('connect-video-call', (roomId) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        let randomVideoCall = yield RandomVideoCall_1.RandomVideoCall.findOne({ roomId: exports.roomIdSchema.parse(roomId) });
                        if (!randomVideoCall)
                            throw new Error("Cannot find Random video call created in the database");
                        socket.emit('connecting', { data: null });
                        let arr = [1, 2, 1, 2];
                        let startSearchNow = ((arr) => {
                            let randomNum = Math.floor(arr.length * Math.random());
                            return arr[randomNum] === 1;
                        })(arr);
                        if (startSearchNow) {
                            let request2 = yield this.searchUser(socket.user._id, socket.user.gender);
                            if (request2)
                                this.connectUser(randomVideoCall, request2, socket);
                            else
                                socket.emit('not-connected', { data: null });
                        }
                        else {
                            let timeOut = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                                let isConnected = yield RandomVideoCall_1.RandomVideoCall.exists({
                                    roomId: randomVideoCall.roomId,
                                    status: 'connected'
                                });
                                if (!isConnected) {
                                    let request2 = yield this.searchUser(socket.user._id, socket.user.gender);
                                    if (request2)
                                        this.connectUser(randomVideoCall, request2, socket);
                                    else
                                        socket.emit('not-connected', { data: null });
                                }
                                clearTimeout(timeOut);
                            }), 5000);
                        }
                    }
                    catch (error) {
                        if (error instanceof zod_1.ZodError === false)
                            console.error(error);
                        socket.emit('connection-creation-failed', { message: 'Failed to connect User in 20s video call' });
                    }
                }));
                socket.on('peer-details', (signal, userBRoomId) => {
                    try {
                        this.io.to(exports.roomIdSchema.parse(userBRoomId)).emit('call-user', signal);
                        let timeOut;
                        const endCall = (room1, room2) => __awaiter(this, void 0, void 0, function* () {
                            try {
                                this.io.to(room1.roomId).emit('end-call', room1.roomId);
                                this.io.to(room2.roomId).emit('end-call', room2.roomId);
                                yield RandomVideoCall_1.RandomVideoCall.updateMany({
                                    status: 'connected',
                                    roomId: {
                                        $in: [room1.roomId, room2.roomId]
                                    },
                                    connectedWith: {
                                        $in: [room1.userId, room2.userId]
                                    }
                                }, {
                                    status: 'ended'
                                });
                                clearTimeout(timeOut);
                            }
                            catch (error) {
                                console.error(error);
                            }
                        });
                        timeOut = setTimeout(function () {
                            return __awaiter(this, void 0, void 0, function* () {
                                let request1 = yield RandomVideoCall_1.RandomVideoCall.findOne({ roomId: userBRoomId });
                                let request2 = yield RandomVideoCall_1.RandomVideoCall.findOne({ userId: socket.user_id });
                                if (request1 && request2)
                                    endCall(request1, request2);
                            });
                        }, VIDEO_CALL_DURATION + 2500);
                    }
                    catch (error) {
                        console.error(error);
                        socket.emit('invalid-peer-details', { data: null });
                    }
                });
                socket.on('caller-details-request', () => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    try {
                        let call2 = yield RandomVideoCall_1.RandomVideoCall.findOne({ connectedWith: socket.user._id, status: 'connected' });
                        if (!call2) {
                            return socket.emit('caller-details-error', { message: 'can not find Caller Details' });
                        }
                        let caller = yield VideoProfile_1.default.findById(call2.connectedWith);
                        if (!caller) {
                            return socket.emit('caller-details-error', { message: 'can not find Caller Details' });
                        }
                        socket.emit('caller-details', {
                            name: caller.name,
                            photo: (_a = caller.profileImage) === null || _a === void 0 ? void 0 : _a.url,
                            email: caller.email
                        });
                    }
                    catch (error) {
                        console.error(error);
                        return socket.emit('caller-details-error', { message: 'can not find Caller Details' });
                    }
                }));
                socket.on('leave-call-room', (roomId) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        roomId = exports.roomIdSchema.parse(roomId);
                        socket.leave(roomId);
                    }
                    catch (error) {
                        console.error('[Leave calling Room Error]', error);
                        socket.emit('leave-calling-room-error', { data: null });
                    }
                }));
                socket.on('stop-video-call', (roomId) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        let call2 = yield RandomVideoCall_1.RandomVideoCall.findOne({ connectedWith: socket.user._id, status: 'connected' });
                        if (call2) {
                            this.io.to(call2.roomId).emit('end-call', call2.roomId);
                            socket.leave(roomId);
                        }
                    }
                    catch (error) {
                        console.error(error);
                    }
                }));
                socket.on('disconnect', () => __awaiter(this, void 0, void 0, function* () { }));
            });
        });
    }
    searchUser(id, gender) {
        return __awaiter(this, void 0, void 0, function* () {
            // Fixed query to properly search for users of opposite gender
            const matchingUser = yield RandomVideoCall_1.RandomVideoCall.findOne({
                userId: { $ne: id },
                status: 'searching',
                gender: { $ne: gender }
            })
                .populate({
                path: 'userId',
            });
            // If userId doesn't match our criteria after population, return null
            if (!matchingUser || !matchingUser.userId) {
                return null;
            }
            return matchingUser;
        });
    }
    connectUser(request1, request2, socket) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                request1.status = 'connected';
                request1.connectedWith = request2.userId;
                yield request1.save();
                request2.status = 'connected';
                request2.connectedWith = request1.userId;
                yield request2.save();
                // Notify both users about the connection
                this.io.to(request2.roomId).emit('give-peer-details', request1.roomId); // User B Room Id
                socket.emit('connection-created', { data: null });
                let timeOut;
            }
            catch (error) {
                console.error('Error connecting users:', error);
                socket.emit('connection-creation-failed', { message: 'Failed to establish connection' });
            }
        });
    }
    // Helper method to clean up existing sessions for a user
    cleanupUserSessions(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!userId)
                    return;
                yield RandomVideoCall_1.RandomVideoCall.deleteMany({
                    userId: userId,
                    status: { $in: ['connected', "searching"] }
                });
            }
            catch (error) {
                console.error('Error cleaning up user sessions:', error);
            }
        });
    }
    // Static method to get instance
    static getInstance(io) {
        return new randomVideoCallSocketService(io);
    }
}
exports.randomVideoCallSocketService = randomVideoCallSocketService;
