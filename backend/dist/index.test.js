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
const console_1 = require("console");
const connectDB_1 = require("./config/connectDB");
const VideoProfile_1 = __importDefault(require("./models/VideoProfile"));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, connectDB_1.connectDB)();
            let updated = yield VideoProfile_1.default.updateMany({}, {
                "profileImage.url": "https://placehold.co/600x400/png",
                "profileImage.id": "9a9a8b74-f286-4e4d-a54c-bcde5feeb2fb",
                "coverImage.url": "https://placehold.co/600x400/png",
                "coverImage.id": "9a9a8b74-f286-4e4d-a54c-bcde5feeb2fb"
            });
            (0, console_1.log)(updated);
        }
        catch (error) {
            console.error(error);
        }
    });
}
main();
