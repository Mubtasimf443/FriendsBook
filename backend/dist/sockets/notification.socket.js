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
exports.NotificationSocketService = exports.Rooms = exports.NotificationType = exports.NotificationFor = void 0;
const zod_1 = require("zod");
const auth_schema_1 = require("../lib/schema/auth.schema");
const VideoProfile_1 = __importDefault(require("../models/VideoProfile"));
const AuthSession_1 = __importDefault(require("../models/AuthSession"));
const user_1 = require("../models/user");
var NotificationFor;
(function (NotificationFor) {
    NotificationFor["ALL"] = "all_users";
    NotificationFor["MATRIMONY_USERS"] = "matrimony_users";
    NotificationFor["VIDEO_USERS"] = "video_users";
})(NotificationFor || (exports.NotificationFor = NotificationFor = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["ADMIN"] = "admin_notification";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var Rooms;
(function (Rooms) {
    Rooms["VIDEO_ROOMS"] = "video_calling_members_room";
    Rooms["MATRIMONY_ROOMS"] = "matrimony_members_room";
    Rooms["ALL_USERS_ROOMS"] = "all_members_room";
})(Rooms || (exports.Rooms = Rooms = {}));
class NotificationSocketService {
    constructor(io) {
        this.io = io;
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
        this.initializeListeners();
    }
    initializeListeners() {
        return __awaiter(this, void 0, void 0, function* () {
            this.io.on('connection', (socket) => __awaiter(this, void 0, void 0, function* () {
                socket.emit('connection-success', null);
                socket.on('video-users-notification-request', (data) => {
                    socket.emit('notification-request-accepted', 'video_calling_members');
                });
                socket.on('matrimony-users-notification-request', (data) => {
                    socket.emit('notification-request-accepted', 'matrimony_members');
                });
                socket.on('all-users-notification-request', (data) => {
                    socket.emit('notification-request-accepted', 'all_members');
                });
                socket.on('admin_notification', (playload) => {
                    try {
                        let { type, title, message } = (zod_1.z.object({
                            title: zod_1.z.string().min(10).max(80),
                            message: zod_1.z.string().min(20).max(140),
                            type: zod_1.z.nativeEnum(NotificationFor)
                        })).parse(playload);
                        this.io.emit('notifcation', {
                            type: NotificationType.ADMIN,
                            for: type,
                            data: {
                                title,
                                message
                            }
                        });
                        socket.emit('notification_sent', null);
                    }
                    catch (error) {
                        console.error(error);
                        socket.emit('notification_error', null);
                    }
                });
                socket.on('disconnect', () => { });
            }));
        });
    }
    // public sendGlobalNotification(notification: any) {
    //     this.io.emit('notification', notification);
    // }
    // public sendProfileNotification(profileType: 'videoProfile' | 'matrimonyProfile', notification: any) {
    //     if (profileType === 'videoProfile') {
    //         this.io.to('videoProfileRoom').emit('notification', notification);
    //     } else if (profileType === 'matrimonyProfile') {
    //         this.io.to('matrimonyProfileRoom').emit('notification', notification);
    //     }
    // }
    static getInstance(io) {
        return new NotificationSocketService(io);
    }
}
exports.NotificationSocketService = NotificationSocketService;
