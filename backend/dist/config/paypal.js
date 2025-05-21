"use strict";
/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */
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
const node_fetch_1 = __importDefault(require("node-fetch"));
const env_1 = require("./env");
class PaypalPayment {
    constructor(options = { client_id: "", client_secret: "", currency_code: 'USD' }) {
        this.client_id = options.client_id;
        this.client_secret = options.client_secret;
        this.api_link = (env_1.PAYMENT_MODE === 'test' ? 'https://api-m.sandbox.paypal.com' : "https://api-m.paypal.com");
        if (options.success_url)
            this.success_url = options.success_url;
        if (options.cancel_url)
            this.cancel_url = options.cancel_url;
        this.currency_code = options.currency_code || 'USD';
        if (options.brand_name)
            this.brand_name = options.brand_name;
    }
    getAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield (0, node_fetch_1.default)(this.api_link + '/v1/oauth2/token', {
                headers: {
                    "Cache-Control": "no-cache",
                    'Authorization': 'Basic ' + Buffer.from(this.client_id + ':' + this.client_secret).toString('base64')
                },
                body: 'grant_type=client_credentials',
                method: 'POST'
            });
            const data = yield response.json();
            if (data.error) {
                console.error(data);
                throw new Error("Paypal Access Token Error");
            }
            return data.access_token;
        });
    }
    createPayment(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let items = [...options.items];
            const response = yield (0, node_fetch_1.default)(this.api_link + '/v2/checkout/orders', {
                method: 'POST',
                headers: {
                    "Cache-Control": "no-cache",
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${options.accessToken}`
                },
                body: JSON.stringify({
                    intent: 'CAPTURE',
                    purchase_units: [{
                            items: items,
                            amount: {
                                currency_code: env_1.PAYPAP_CURRENCY,
                                value: options.total,
                                breakdown: {
                                    item_total: {
                                        currency_code: env_1.PAYPAP_CURRENCY,
                                        value: options.productToatal, // Cost of items
                                    },
                                    shipping: {
                                        currency_code: env_1.PAYPAP_CURRENCY,
                                        value: options.shipping, // Shipping cost
                                    }
                                }
                            }
                        }],
                    application_context: {
                        return_url: options.success_url || this.success_url,
                        cancel_url: options.cancel_url || this.cancel_url,
                        user_action: 'PAY_NOW',
                        brand_name: this.brand_name ? this.brand_name : undefined,
                    }
                })
            });
            const data = yield response.json();
            const link = data.links.find((link) => link.rel === 'approve');
            return ({ link: link.href, token: data.id });
        });
    }
    captureDetails(orderID) {
        return __awaiter(this, void 0, void 0, function* () {
            let accessToken = yield this.getAccessToken();
            const response = yield (0, node_fetch_1.default)(`${this.api_link}/v2/checkout/orders/${orderID}/capture`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'PayPal-Request-Id': `capture-${orderID}-${Date.now()}`
                },
                body: JSON.stringify({}),
            });
            if (!response.ok) {
                let paymentDetails = yield response.json();
                throw new Error(`Failed to capture order: ${paymentDetails.message || JSON.stringify(paymentDetails)}`);
            }
            let paymentDetails = yield response.json();
            return paymentDetails;
        });
    }
    paypalError(type, description) {
        if (description === undefined)
            throw ({ paypalError: Object.assign({}, type) });
        else
            throw ({ paypalError: { type, description } });
    }
}
exports.default = PaypalPayment;
