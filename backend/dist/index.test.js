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
const connectDB_1 = require("./config/connectDB");
const user_1 = require("./models/user");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, connectDB_1.connectDB)();
            let user = yield user_1.User.updateMany({}, { createdAt: Date.now() }).limit(1000);
        }
        catch (error) {
            console.error(error);
        }
    });
}
main();
