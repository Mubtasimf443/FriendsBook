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
const RandomVideoCall_1 = require("../models/RandomVideoCall");
class RandomVideoController {
    constructor() {
    }
    CheckVideoCallsOfUsersActive(latitude, longitude, language) {
        return __awaiter(this, void 0, void 0, function* () {
            // Find users who are searching for a call, not connected yet, and within 2km distance
            // Also match at least one language preference
            let aggregation = [
                {
                    $match: {
                        status: 'searching',
                        connectedWith: { $exists: false },
                        location: {
                            $near: {
                                $geometry: {
                                    type: 'Point',
                                    coordinates: [longitude, latitude]
                                },
                                $minDistance: 2000,
                                $maxDistance: 100000 // 100km in meters
                            }
                        },
                        // Match at least one language from the provided array
                        $expr: {
                            $gt: [
                                { $size: { $setIntersection: ["$languages", language] } },
                                0
                            ]
                        }
                    }
                },
                {
                    $limit: 1
                }
            ];
            let videoCall = yield RandomVideoCall_1.RandomVideoCall.aggregate(aggregation);
            if (videoCall[0])
                return videoCall[0];
            else
                return null;
        });
    }
    static GetIntance() {
        return (new RandomVideoController());
    }
}
