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
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomVideoCallSocketService = void 0;
require("../lib/types/socket.decralation");
const socket_middleware_1 = require("../lib/middlewares/socket.middleware");
const RandomVideoCall_1 = require("../models/RandomVideoCall");
const zod_1 = require("zod");
const crypto_1 = require("crypto");
// Constants
const VIDEO_CALL_DURATION = 20 * 1000; // 20 seconds in milliseconds
class randomVideoCallSocketService {
    constructor(io) {
        this.activeCallTimers = new Map();
        this.io = io;
        this.io.use(socket_middleware_1.socketMiddlewaresVideoProfile);
        this.initializeListeners();
    }
    initializeListeners() {
        return __awaiter(this, void 0, void 0, function* () {
            this.io.on('connection', (socket) => {
                var _a, _b;
                console.log('User connected to random video call socket', (_a = socket.user) === null || _a === void 0 ? void 0 : _a._id);
                this.cleanupUserSessions((_b = socket.user) === null || _b === void 0 ? void 0 : _b._id);
                socket.on('create-video-call', (peerId) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        let peerIdSchema = zod_1.z.string().min(10).max(512);
                        if (!peerIdSchema.safeParse(peerId).success) {
                            return socket.emit('error', { text: 'Failed to validate' });
                        }
                        peerId = peerIdSchema.parse(peerId);
                        let roomId = (0, crypto_1.randomUUID)();
                        const randomVideoCall = new RandomVideoCall_1.RandomVideoCall({
                            userId: socket.user._id,
                            status: 'searching',
                            peerId: peerId,
                            roomId: roomId,
                            gender: socket.user.gender
                        });
                        socket.join(roomId);
                        yield randomVideoCall.save();
                        socket.emit('room-created', roomId); // Fixed event name (removed leading slash)
                    }
                    catch (error) {
                        console.error('Error creating video request:', error);
                        socket.emit('error', { message: 'Failed to create video call request' });
                    }
                }));
                socket.on('connect-video-call', (roomId) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        let roomIdSchema = zod_1.z.string().uuid();
                        if (!roomIdSchema.safeParse(roomId).success) {
                            return socket.emit('error', { text: 'Invalid room ID' });
                        }
                        let randomVideoCall = yield RandomVideoCall_1.RandomVideoCall.findOne({ roomId: roomIdSchema.parse(roomId) });
                        if (!randomVideoCall) {
                            throw new Error("Cannot find Random video call created in the database");
                        }
                        socket.emit('started', true);
                        let arr = [1, 2, 1, 2];
                        let startSearchNow = ((arr) => {
                            let randomNum = Math.floor(arr.length * Math.random());
                            return arr[randomNum] === 1;
                        })(arr);
                        if (startSearchNow) {
                            let request2 = yield this.searchUser(socket.user._id, socket.user.gender);
                            if (request2) {
                                this.connectUser(randomVideoCall, request2, socket);
                            }
                            else {
                                socket.emit('searching', { message: 'Looking for a match...' });
                            }
                        }
                        else {
                            let timeOut = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                                let request2 = yield this.searchUser(socket.user._id, socket.user.gender);
                                if (request2) {
                                    this.connectUser(randomVideoCall, request2, socket);
                                }
                                else {
                                    socket.emit('searching', { message: 'Looking for a match...' });
                                }
                                clearTimeout(timeOut);
                            }), 1500);
                        }
                    }
                    catch (error) {
                        console.error(error);
                        socket.emit('error', {
                            type: 'video-connection-failed',
                            message: 'Failed to connect User in 20s video call'
                        });
                    }
                }));
                socket.on('stop-video-call', function () {
                    return __awaiter(this, void 0, void 0, function* () {
                        let call2 = yield RandomVideoCall_1.RandomVideoCall.findOne({ connectedWith: socket.user._id, status: 'connected' });
                        if (call2) {
                            socket.to(call2.roomId).emit('call-cancelled');
                        }
                    });
                });
                socket.on('disconnect', () => __awaiter(this, void 0, void 0, function* () {
                    try {
                        yield RandomVideoCall_1.RandomVideoCall.deleteOne({
                            userId: socket.user._id
                        });
                    }
                    catch (error) {
                        console.error('Error handling disconnect:', error);
                    }
                }));
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
                socket.emit('call-user', request2.peerId);
                let timeOut = setTimeout(() => {
                    try {
                        socket.to(request1.roomId).emit('end-call');
                        socket.to(request2.roomId).emit('end-call');
                        clearTimeout(timeOut);
                    }
                    catch (error) {
                        console.error(error);
                    }
                }, VIDEO_CALL_DURATION + 2500);
                // Join both users to the same room for easier communication
                socket.join(request1.roomId);
            }
            catch (error) {
                console.error('Error connecting users:', error);
                socket.emit('error', { message: 'Failed to establish connection' });
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
                    status: { $in: ['searching', 'connected'] }
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
