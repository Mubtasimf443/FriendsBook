"use strict";
/*
بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ  ﷺ InshaAllah
*/
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
const express_1 = require("express");
const zod_1 = require("zod");
const unions_1 = require("../lib/data/unions");
const upazilas_1 = require("../lib/data/upazilas");
const districts_1 = require("../lib/data/districts");
const divisions_1 = require("../lib/data/divisions");
const countryNames_1 = __importDefault(require("../lib/data/countryNames"));
const currencyCodes_enum_1 = require("../lib/types/currencyCodes.enum");
const userEducation_types_1 = require("../lib/types/userEducation.types");
const user_types_1 = require("../lib/types/user.types");
const rateRimiter_1 = __importDefault(require("../config/rateRimiter"));
const getEducationCertificates_1 = __importDefault(require("../lib/core/getEducationCertificates"));
const userProfile_types_1 = require("../lib/types/userProfile.types");
const router = (0, express_1.Router)();
router.use((0, rateRimiter_1.default)(30 * 1000, 100));
router.use(function (req, res, next) {
    res.set("cache-control", "max-age=3600, public");
    next();
    return;
});
router.get("/location/country-names", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        return res.status(200).json({ success: true, message: "ok", data: { names: countryNames_1.default } });
    });
});
router.get("/location/divisions", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        return res.status(200).json({ success: true, message: "ok", data: divisions_1.Divisions });
    });
});
router.get("/location/districts", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let divisionSchema = zod_1.z.number().gte(1).lte(8);
            let { success, error, data } = yield divisionSchema.safeParseAsync(Number(req.query.division_id));
            if (error) {
                res.status(400).json({
                    success: false,
                    error: error.errors[0].message,
                    errorDetails: error
                });
                return;
            }
            if (success && data) {
                let districts = districts_1.Districts.filter(function (element) {
                    if (element.division_id === String(data)) {
                        return element;
                    }
                });
                res.status(200).json({
                    success: true,
                    data: districts
                });
                return;
            }
        }
        catch (error) {
            console.error("district location data error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                data: null
            });
            return;
            ;
        }
    });
});
router.get("/location/upazilas", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let districtSchema = zod_1.z.number().positive().gte(1).lte(64);
            let { success, error, data } = yield districtSchema.safeParseAsync(Number(req.query.district_id));
            if (error) {
                res.status(400).json({
                    success: false,
                    error: error.errors[0].message
                });
                return;
            }
            if (success && data) {
                let upazilas = upazilas_1.Upazilas.filter(function (element) {
                    if (element.district_id === String(data)) {
                        return element;
                    }
                });
                res.status(200).json({
                    success: true,
                    data: upazilas
                });
                return;
            }
        }
        catch (error) {
            console.error("upazila location data error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                data: null
            });
            return;
        }
    });
});
router.get("/location/unions", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let upazilaSchema = zod_1.z.number().positive().gte(1).lte(494);
            let { success, error, data } = yield upazilaSchema.safeParseAsync(Number(req.query.upazila_id));
            if (error) {
                res.status(400).json({
                    success: false,
                    error: error.errors[0].message
                });
                return;
            }
            if (success && data) {
                let cities = unions_1.Unions.filter(function (element) {
                    if (element.upazilla_id === String(data)) {
                        return element;
                    }
                });
                res.status(200).json({
                    success: true,
                    data: cities
                });
                return;
            }
        }
        catch (error) {
            console.error("city location data error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                data: null
            });
            return;
        }
    });
});
router.get('/currency', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        return res.status(200).json({
            success: true,
            data: { countryAndCurrency: currencyCodes_enum_1.countryAndCurrency }
        });
    });
});
router.get('/languages', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        return res.status(200).json({
            success: true,
            data: {
                levels: Object.values(user_types_1.Language)
            }
        });
    });
});
router.get('/education', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        return res.status(200).json({
            success: true,
            data: {
                levels: Object.values(userEducation_types_1.EducationLevel)
            }
        });
    });
});
router.get('/marital-status', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        return res.status(200).json({
            success: true,
            data: {
                marital_statuses: Object.values(user_types_1.MaritalStatus)
            }
        });
    });
});
router.get('/certificates', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const educationLevelValidator = zod_1.z.nativeEnum(userEducation_types_1.EducationLevel);
            const validationResult = yield educationLevelValidator.safeParseAsync(req.query.education_level);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid education level provided",
                    errors: validationResult.error
                });
            }
            const educationLevel = validationResult.data;
            const certificates = (0, getEducationCertificates_1.default)(educationLevel);
            return res.status(200).json({
                success: true,
                message: `Certificates for ${educationLevel}`,
                data: { certificates }
            });
        }
        catch (error) {
            console.error('/data/certificate api error ', error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                data: null
            });
        }
    });
});
router.get('/religions', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        return res.status(200).json({
            success: true,
            data: {
                marital_statuses: Object.values(user_types_1.Religion)
            }
        });
    });
});
router.get('/religional-branch', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let regionalBranches = {};
            regionalBranches[user_types_1.Religion.ISLAM] = Object.values(userProfile_types_1.ReligiousBranch).slice(0, 4);
            regionalBranches[user_types_1.Religion.HINDUISM] = Object.values(userProfile_types_1.ReligiousBranch).slice(4, 9);
            regionalBranches[user_types_1.Religion.BUDDHISM] = Object.values(userProfile_types_1.ReligiousBranch).slice(9, 11);
            regionalBranches[user_types_1.Religion.CHRISTIANITY] = Object.values(userProfile_types_1.ReligiousBranch).slice(11, 13);
            regionalBranches["OHTERS"] = Object.values(userProfile_types_1.ReligiousBranch).slice(13, 15);
            let schema = zod_1.z.enum([user_types_1.Religion.ISLAM, user_types_1.Religion.HINDUISM, user_types_1.Religion.BUDDHISM, user_types_1.Religion.CHRISTIANITY, "OHTERS"]);
            let religion = schema.parse(req.query.religion);
            return res.status(200).json({
                success: true,
                data: {
                    branches: regionalBranches[religion]
                }
            });
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid request parameters',
                    error: error,
                    data: null
                });
                return;
            }
            console.error('[religional Branch error]', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
exports.default = router;
