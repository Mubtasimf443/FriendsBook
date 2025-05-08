/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { connectDB } from "./config/connectDB"
import { User } from "./models/user";
import { Occupation } from "./lib/types/user.types";
import { log } from "console";
import { randomUUID } from "crypto";

import { PhysicalStatus, ReligiousBranch, BadHabits, SettingsPermissionType } from './lib/types/userProfile.types';

const defaultAboutMe = {
    description: '',
    physicalStatus: PhysicalStatus.NORMAL,
    religiousBranch: ReligiousBranch.PREFER_NOT_TO_SAY,
    badHabits: [BadHabits.NONE],
    interestedSports: [],
    interestedHobbies: [],
    interestedFoodTypes: [],
    interestedMusicTypes: []
};

const defaultFamilyInfo = {
    aboutFamily: '',
    familyOrigin: '',
    numberOfBrothers: 0,
    numberOfSisters: 0,
    numberOfMarriedBrothers: 0,
    numberOfMarriedSisters: 0
};

const defaultEnhancedSettings = {
    blocked: [],
    privacy: {
        whoCanViewProfile: SettingsPermissionType.EVERYONE,
        whoCanContactMe: SettingsPermissionType.EVERYONE,
        showShortlistedNotification: true,
        showProfileViewNotification: true
    },
    notifications: {
        dailyRecommendations: true,
        todaysMatch: true,
        profileViews: true,
        shortlists: true,
        messages: true,
        connectionRequests: true
    }
};

async function main() {
    await connectDB();
    let unmigratedUsers = await User.countDocuments({
        $or: [
            { aboutMe: { $exists: false } },
            { familyInfo: { $exists: false } },
            { enhancedSettings: { $exists: false } }
        ]
    });

    if (unmigratedUsers > 0) {
        console.error(`Found ${unmigratedUsers} users that were not migrated properly`);
    } else {
        console.info('All users were migrated successfully');
    }

    await User.updateMany({
        $or: [
            { aboutMe: { $exists: false } },
            { familyInfo: { $exists: false } },
            { enhancedSettings: { $exists: false } }
        ]
    },
        {
            $set: {
                aboutMe: defaultAboutMe,
                familyInfo: defaultFamilyInfo,
                enhancedSettings: defaultEnhancedSettings
            }
        },
        {
            multi: true,
        }
    )

    unmigratedUsers = await User.countDocuments({
        $or: [
            { aboutMe: { $exists: false } },
            { familyInfo: { $exists: false } },
            { enhancedSettings: { $exists: false } }
        ]
    });

    if (unmigratedUsers > 0) {
        console.error(`Found ${unmigratedUsers} users that were not migrated properly`);
    } else {
        console.info('All users were migrated successfully');
    }
}
main();


