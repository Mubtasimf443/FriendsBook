"use strict";
/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */
/*
بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ  ﷺ
InshaAllah, By his marcy I will Gain Success
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
const stripe_1 = __importDefault(require("stripe"));
/**
 * StripePay - Handles Stripe payment processing
 */
class StripePay {
    constructor(options) {
        this.stripe = new stripe_1.default(options.key);
        this.success_url = options.success_url;
        this.cancel_url = options.cancel_url;
    }
    checkOut(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { line_items } = options;
                const sessionParams = {
                    payment_method_types: ['card'],
                    mode: 'payment',
                    success_url: this.success_url,
                    cancel_url: this.cancel_url,
                    line_items: line_items
                };
                // Create checkout session
                const session = yield this.stripe.checkout.sessions.create(sessionParams);
                if (!session.url || !session.id) {
                    throw new Error('Failed to create a valid checkout session');
                }
                return {
                    url: session.url,
                    id: session.id
                };
            }
            catch (error) {
                console.error(error);
                if (error instanceof Error) {
                    throw new Error(`Stripe checkout failed: ${error.message}`);
                }
                else {
                    throw new Error('Sorry, failed to create stripe payment');
                }
            }
        });
    }
    retrieveSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.stripe.checkout.sessions.retrieve(sessionId);
        });
    }
}
exports.default = StripePay;
