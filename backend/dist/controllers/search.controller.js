"use strict";
/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDistance = getDistance;
exports.findNearestDistricts = findNearestDistricts;
exports.searchHeightGenerator = searchHeightGenerator;
exports.getBaseSearchQuery = getBaseSearchQuery;
exports.getUserWithCountryFlagsEmoji = getUserWithCountryFlagsEmoji;
exports.getUserDataFromRequest = getUserDataFromRequest;
exports.shuffleArray = shuffleArray;
const districts_1 = require("../lib/data/districts");
const CountryAndFlags_1 = __importDefault(require("../lib/data/CountryAndFlags"));
const env_1 = require("../config/env");
// Haversine formula
function getDistance(lat1, lon1, lat2, lon2) {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Radius of the Earth in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
// Get nearest districts
function findNearestDistricts(lat, lon, count = 5) {
    return districts_1.Districts
        .map((district) => (Object.assign(Object.assign({}, district), { distance: getDistance(lat, lon, district.lat, district.long) })))
        .slice(0, count);
}
function searchHeightGenerator(min, max) {
    let heights = [];
    let d = max - min;
    for (let i = 0; i <= d; i++) {
        let foot = min + i;
        for (let inc = 0; inc <= 11; inc++) {
            heights.push(`${foot} foot ${inc} inch`);
        }
    }
    return heights;
}
// Add this at the top of search.ts
function getBaseSearchQuery(userData) {
    return {
        // 'suspension.isSuspended': false,
        '_id': { $ne: userData.userId },
        // 'enhancedSettings.blocked.userId': { $ne: userData.userId },
        'gender': { $ne: userData.gender },
        // religion: userData.religion
    };
}
function getUserWithCountryFlagsEmoji(UserList) {
    UserList = UserList.map(element => {
        var _a;
        element['lag'] = env_1.BASE_URL + (((_a = CountryAndFlags_1.default.find(country => country.name === element.location.country)) === null || _a === void 0 ? void 0 : _a.flag) || "/static/flags/other-country.png");
        return element;
    });
    return UserList;
}
function getUserDataFromRequest(req) {
    var _a;
    if (req.profileType === 'videoProfile' && req.videoProfile) {
        let user = req.videoProfile;
        return {
            gender: user.gender,
            languages: user.languages
        };
    }
    if (req.profileType === 'matrimony_profile' && ((_a = req.authSession) === null || _a === void 0 ? void 0 : _a.value)) {
        let user = req.authSession.value;
        return {
            gender: user.gender,
            languages: user.languages
        };
    }
    throw new Error("Failed to get User Data from Request");
}
function shuffleArray(array) {
    if (!array) {
        return []; // Return an empty array for null or undefined input
    }
    let currentIndex = array.length, randomIndex;
    let newArray = [];
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        newArray.push(array[randomIndex]);
        array = array.filter((e, i) => i !== randomIndex && e);
        currentIndex = array.length;
    }
    return newArray;
}
