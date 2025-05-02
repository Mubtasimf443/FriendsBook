/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import mongoose, { Document, Schema } from 'mongoose';

enum SessionNames {
    AUTH_SESSION = "auth_session",
    REGISTRATION_SESSION = 'registration_session'

}


interface ISession extends Document {
    name: SessionNames;
    value: string;
    key?: string;
    created_at: Date;
    updated_at?: Date;
}

let sessionSchema = new Schema<ISession>(
    {
        name: {
            type: String,
            required: true,
            enum: Object.values(SessionNames)
        },
        key: {
            type: String,
            required: false,

        },
        value: {
            type: String,
            required: true,
        }

    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    }
);

export const Session = mongoose.model<ISession>('Session', sessionSchema);
export default Session;