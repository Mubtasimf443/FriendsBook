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



export enum MembershipRequestStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    CANCELLED = 'cancelled'
}

export interface IMembershipRequest {
    requestStatus: MembershipRequestStatus;
    paymentInfo: {
        transactionId: string;
        amount: number;
        currency: string;
        paymentMethod: string;
        paymentDate: Date;
        verificationImage?: {
            url: string;
            id: string;
        };
    };
    verifiedPhoneLimit: number;
    verifiedPhoneViewed: number;
    hasProfileHighlighter: boolean;
    tier: MembershipTier;
    duration: MembershipDuration;
    startDate: Date;
    endDate: Date;
    adminNote?: string;
    requestDate: Date;
    processedDate?: Date;
    processedBy?: mongoose.Types.ObjectId;
    requesterID: mongoose.Types.ObjectId;
}
