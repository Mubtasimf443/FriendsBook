/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId; // Reference to User
  amount: string;                  // Number of coins
  currency: string;                // e.g. 'USD', 'INR'
  package : string;
  paymentMethod?: string;          // e.g. 'stripe', 'paypal', 'wallet'
  transactionId?: string;          // External payment gateway ID
  status: 'pending' | 'success' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema<ITransaction> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'VideoProfile', required: true },
    amount: { type: String, required: true },
    currency: { type: String, default: 'USD' },
    paymentMethod: { type: String },
    transactionId: { type: String },
    package : {type : String , required : true , enum : ['package_1', 'package_2', 'package_3', 'package_4'] },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
