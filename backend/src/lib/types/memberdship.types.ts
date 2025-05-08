/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import mongoose from "mongoose";

// Enum for membership types
export enum MembershipTier {
    GOLD = 'GOLD',
    DIAMOND = 'DIAMOND',
    PLATINUM = 'PLATINUM'
}

// Enum for membership durations
export enum MembershipDuration {
    THREE_MONTHS = 3,
    SIX_MONTHS = 6,
    TWELVE_MONTHS = 12
}

// Interface for membership
export interface IMembership {
    userId: mongoose.Types.ObjectId;
    tier: MembershipTier;
    duration: MembershipDuration;
    startDate: Date;
    endDate: Date;
    verifiedMailsLimit: number;
    verifiedMailsViewed: number;
    hasProfileHighlighter: boolean;
    isActive: boolean;
    paymentInfo: {
        transactionId: string;
        amount: number;
        currency: string;
        paymentMethod: string;
        paymentDate: Date;
    };
    createdAt: Date;
    updatedAt: Date;
}
