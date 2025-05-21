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
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const console_1 = require("console");
const env_1 = require("./env");
function connectDB() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!env_1.MONGO_DB_URL2)
            throw new Error("You have not added mongo db url in env files error as geting Undefined in MONGO_DB_URL");
        yield mongoose_1.default.connect(env_1.MONGO_DB_URL2)
            .then(e => (0, console_1.log)('Database Connected Alhamdulillah....'))
            .catch(error => console.error(error));
    });
}
