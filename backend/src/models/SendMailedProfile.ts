/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import mongoose, { Schema, Document } from 'mongoose';

export interface ISendMailedProfile extends Document {
    senderId: mongoose.Types.ObjectId;
    receiverId: mongoose.Types.ObjectId;
    emailedAt: Date[];
    emailType: string;
    emailStatus: string;
}

const sendMailedProfileSchema = new Schema<ISendMailedProfile>({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    emailedAt: [{
        type: Date,
        required: true,
        default: Date.now
    }],
    emailType: {
        type: String,
        required: true,
        enum: ['INTEREST', 'INTRODUCTION', 'CUSTOM'],
        default: 'INTEREST'
    },
    emailStatus: {
        type: String,
        required: true,
        enum: ['SENT', 'FAILED', 'PENDING'],
        default: 'PENDING'
    }
}, {
    timestamps: false // We'll use emailedAt array
});

// Indexes for efficient querying
sendMailedProfileSchema.index({ senderId: 1, receiverId: 1 });
sendMailedProfileSchema.index({ emailedAt: -1 });
sendMailedProfileSchema.index({ emailStatus: 1 });

export const SendMailedProfile = mongoose.model<ISendMailedProfile>('SendMailedProfile', sendMailedProfileSchema);