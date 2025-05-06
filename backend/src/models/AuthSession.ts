/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import mongoose, { Document, Mongoose, ObjectId, Schema } from 'mongoose';

interface IAddress {
    lat ?: number;
    long  ?: number;
    division ?: string;
    district ?: string;
    upazilla ?: string;
    union ?: string;
    country ?: string;
}

interface IPhone {
    number ?: string;
    code ?: string;
}

export interface IAuthSessionValue {
    email: string;
    userId: ObjectId;
    address : IAddress;
    phone : IPhone
}




export interface IAuthSession extends Document {
    name: "auth_session"; // Fixed name to only handle "auth_session"
    value: IAuthSessionValue; // Structured value containing user data
    key?: string;
    expiration_date: Date;
    created_at: Date;
    updated_at?: Date;
}

const authSessionSchema = new Schema<IAuthSession>(
    {
        name: {
            type: String,
            required: true,
            enum: ["auth_session"],
            default: "auth_session"
        },
        key: {
            type: String,
            required: false,
            unique : true ,
        },
        value: {
            type: {
                email: {
                    type: String,
                    required: true,
                },
                userId: {
                    type: mongoose.SchemaTypes.ObjectId,
                    required: true,
                },
                address: {
                    type: {
                        lat: {
                            type: Number,
                            required: false
                        },
                        long: {
                            type: Number,
                            required: false
                        },
                        division: {
                            type: String,
                            required: false
                        },
                        district: {
                            type: String,
                            required: false
                        },
                        upazilla: {
                            type: String,
                            required: false
                        },
                        union: {
                            type: String,
                            required: false
                        },
                        country: {
                            type: String,
                            required: false
                        }
                    },
         
                    _id: false // Prevents MongoDB from creating an _id for this subdocument
                },
                phone: {
                    type: {
                        number: {
                            type: String,
                            required: false
                        },
                        code: {
                            type: String,
                            required: false
                        }
                    },
                  
                    _id: false // Prevents MongoDB from creating an _id for this subdocument
                }
            },
            required: true,
            _id: false 
        },
        expiration_date: {
            type: Date,
            required: true,
            default() {
                return new Date(Date.now() + 30 * 24 * 3600 * 1000); // Default expiration date is 30 days from now
            }
        }
    },
    {      
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    }
);




const AuthSession = mongoose.model<IAuthSession>('AuthSession', authSessionSchema);
export default AuthSession;