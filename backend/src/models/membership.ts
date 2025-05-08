/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import mongoose, { Schema } from 'mongoose';
import { IMembership , MembershipTier , MembershipDuration} from '../lib/types/memberdship.types';


// Define membership schema
const membershipSchema = new Schema<IMembership>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    tier: {
        type: String,
        enum: Object.values(MembershipTier),
        required: true
    },
    duration: {
        type: Number,
        enum: Object.values(MembershipDuration),
        required: true
    },
    startDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    verifiedMailsLimit: {
        type: Number,
        required: true
    },
    verifiedMailsViewed: {
        type: Number,
        default: 0
    },
    hasProfileHighlighter: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    paymentInfo: {
        transactionId: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            required: true
        },
        paymentMethod: {
            type: String,
            required: true
        },
        paymentDate: {
            type: Date,
            default: Date.now
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save hook to update the updatedAt field
membershipSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Static method to get membership benefits based on tier and duration
membershipSchema.statics.getMembershipBenefits = function(tier: MembershipTier, duration: MembershipDuration) {
    const benefits = {
        verifiedMailsLimit: 0,
        hasProfileHighlighter: false
    };

    // Determine verified mails limit based on tier and duration
    if (tier === MembershipTier.GOLD) {
        if (duration === MembershipDuration.THREE_MONTHS) benefits.verifiedMailsLimit = 40;
        else if (duration === MembershipDuration.SIX_MONTHS) benefits.verifiedMailsLimit = 80;
        else if (duration === MembershipDuration.TWELVE_MONTHS) benefits.verifiedMailsLimit = 160;
    } else if (tier === MembershipTier.DIAMOND) {
        if (duration === MembershipDuration.THREE_MONTHS) benefits.verifiedMailsLimit = 55;
        else if (duration === MembershipDuration.SIX_MONTHS) benefits.verifiedMailsLimit = 110;
        else if (duration === MembershipDuration.TWELVE_MONTHS) benefits.verifiedMailsLimit = 220;
    } else if (tier === MembershipTier.PLATINUM) {
        if (duration === MembershipDuration.THREE_MONTHS) benefits.verifiedMailsLimit = 70;
        else if (duration === MembershipDuration.SIX_MONTHS) benefits.verifiedMailsLimit = 140;
        else if (duration === MembershipDuration.TWELVE_MONTHS) benefits.verifiedMailsLimit = 280;
        benefits.hasProfileHighlighter = true;
    }

    return benefits;
};

// Method to check if a user has verified mails available
membershipSchema.methods.hasVerifiedMailsRemaining = function() {
    return this.verifiedMailsViewed < this.verifiedMailsLimit;
};

// Method to use a verified mail
membershipSchema.methods.useVerifiedMail = function() {
    if (this.hasVerifiedMailsRemaining()) {
        this.verifiedMailsViewed += 1;
        return true;
    }
    return false;
};

// Method to check if membership is active
membershipSchema.methods.isActiveNow = function() {
    const now = new Date();
    return this.isActive && now >= this.startDate && now <= this.endDate;
};

// Create indexes
membershipSchema.index({ userId: 1, isActive: 1 });
membershipSchema.index({ endDate: 1 });
membershipSchema.index({ tier: 1, duration: 1 });

export const Membership = mongoose.model<IMembership>('Membership', membershipSchema);