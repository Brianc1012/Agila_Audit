"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashValue = hashValue;
exports.compareHash = compareHash;
exports.generateApiKey = generateApiKey;
const crypto_1 = __importDefault(require("crypto"));
function hashValue(value) {
    return crypto_1.default.createHash('sha256').update(value).digest('hex');
}
function compareHash(rawValue, hashedValue) {
    const hashedInput = hashValue(rawValue);
    return hashedInput === hashedValue;
}
function generateApiKey(prefix) {
    const randomBytes = crypto_1.default.randomBytes(32).toString('hex');
    return prefix ? `${prefix}_${randomBytes}` : randomBytes;
}
