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
exports.configOnlineStatusSocket = configOnlineStatusSocket;
const auth_schema_1 = require("../lib/schema/auth.schema");
const VideoProfile_1 = __importDefault(require("../models/VideoProfile"));
const AuthSession_1 = __importDefault(require("../models/AuthSession"));
const user_1 = require("../models/user");
function configOnlineStatusSocket(io) {
    return __awaiter(this, void 0, void 0, function* () {
        io.use((socket, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                let { token, profileType } = yield socket.handshake.auth;
                token = auth_schema_1.authSessionValidation.parse(token);
                if (profileType === 'video_calling_member') {
                    let videoCallingMember = yield VideoProfile_1.default.findOne({ 'auth.authSession': token });
                    if (videoCallingMember) {
                        socket.user_id = videoCallingMember._id.toString();
                        socket.userProfileType = 'videoProfile';
                        videoCallingMember.status = 'online';
                        videoCallingMember.lastActive = new Date(Date.now());
                        yield videoCallingMember.save();
                        return next();
                    }
                    else
                        next(new Error('Auth Error'));
                }
                else {
                    let mAuthSession = yield AuthSession_1.default.findOne({ key: token }, 'value.userId');
                    if (mAuthSession) {
                        socket.user_id = mAuthSession.value.userId.toString();
                        socket.userProfileType = 'matrimonyProfile';
                        yield user_1.User.findByIdAndUpdate(socket.user_id, {
                            "onlineStatus.isOnline": true,
                            "onlineStatus.lastSeen": Date.now(),
                            "onlineStatus.lastActive": Date.now(),
                        });
                        return next();
                    }
                    else
                        return next(new Error('Auth Error'));
                }
            }
            catch (error) {
                next(new Error('Auth Error'));
            }
        }));
        io.on('connection', (socket) => {
            socket.emit('connected', { data: null });
            socket.on('is-connected', () => socket.emit('connected', { data: null }));
            socket.on('disconnect', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        switch (socket.userProfileType) {
                            case 'matrimonyProfile':
                                yield user_1.User.findByIdAndUpdate(socket.user_id, {
                                    "onlineStatus.isOnline": true,
                                    "onlineStatus.lastSeen": Date.now(),
                                    "onlineStatus.lastActive": Date.now(),
                                });
                                return;
                            case "videoProfile":
                                yield VideoProfile_1.default.findByIdAndUpdate(socket.user_id, {
                                    status: 'offline',
                                    lastActive: Date.now()
                                });
                                return;
                        }
                    }
                    catch (error) {
                        console.error("[Disconnection Socker Error ]", error);
                    }
                });
            });
        });
    });
}
