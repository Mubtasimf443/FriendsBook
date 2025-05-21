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
exports.sendNotification = sendNotification;
exports.sendNotifications = sendNotifications;
function sendNotification(token_1, _a) {
    return __awaiter(this, arguments, void 0, function* (token, { data, title, body }) {
        try {
            // let getFireBaseAdmin = require("../../config/firebase.config");
            // let firebaseAdmin = getFireBaseAdmin()
            // const message = {
            //     token,
            //     notification: { title , body },
            //     data,
            //   };
            // await firebaseAdmin.getMessaging().send(message);
            return true;
        }
        catch (error) {
            console.error(`[Firebase Messaging error]`, error);
            return false;
        }
    });
}
function sendNotifications(tokens_1, _a) {
    return __awaiter(this, arguments, void 0, function* (tokens, { data, title, body }) {
        // try {
        //     let getFireBaseAdmin = require("../../config/firebase.config");
        //     let firebaseAdmin = getFireBaseAdmin();
        //     const message = {
        //         tokens,
        //         notification: { title, body },
        //         data,
        //     };
        //     const response = await firebaseAdmin.getMessaging().sendEachForMulticast(message);
        //     return [true, response];
        // } catch (error) {
        // console.error(`[Firebase Messaging error]`, error);
        return [false, undefined];
        // }
    });
}
