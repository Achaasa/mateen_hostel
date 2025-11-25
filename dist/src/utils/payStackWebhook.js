"use strict";
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
exports.handlePaystackWebhook = void 0;
const paymentHelper_1 = require("../helper/paymentHelper");
const paystack_1 = __importDefault(require("./paystack"));
const prisma_1 = __importDefault(require("./prisma"));
const handlePaystackWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const signature = req.headers["x-paystack-signature"];
    const rawBody = req.rawBody;
    // Verify signature first
    if (!paystack_1.default.verifyWebhookSignature(rawBody, signature)) {
        res.status(401).send("Unauthorized");
        return;
    }
    try {
        const body = JSON.parse(rawBody);
        if (body.event === "charge.success") {
            const reference = body.data.reference;
            const payment = yield prisma_1.default.payment.findUnique({
                where: { reference },
                include: { residentProfile: true },
            });
            if (!payment) {
                res.status(404).send("Payment not found");
                return;
            }
            // All payments are now full payments - no more top-ups
            yield (0, paymentHelper_1.confirmPayment)(reference);
            res.sendStatus(200);
            return;
        }
        // Handle other events
        res.sendStatus(200);
    }
    catch (error) {
        console.error("Webhook error:", error);
        res.status(400).send("Payment confirmation failed");
    }
});
exports.handlePaystackWebhook = handlePaystackWebhook;
