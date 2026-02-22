"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.verifyAccessToken = exports.signRefreshToken = exports.signAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("./config");
const errors_1 = require("./errors");
const signAccessToken = (payload) => jsonwebtoken_1.default.sign(payload, (0, config_1.getSharedConfig)().JWT_ACCESS_SECRET, {
    expiresIn: (0, config_1.getSharedConfig)().ACCESS_TOKEN_TTL,
});
exports.signAccessToken = signAccessToken;
const signRefreshToken = (payload) => jsonwebtoken_1.default.sign(payload, (0, config_1.getSharedConfig)().JWT_REFRESH_SECRET, {
    expiresIn: (0, config_1.getSharedConfig)().REFRESH_TOKEN_TTL,
});
exports.signRefreshToken = signRefreshToken;
const verifyAccessToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, (0, config_1.getSharedConfig)().JWT_ACCESS_SECRET);
    }
    catch {
        throw new errors_1.UnauthorizedError('Invalid access token');
    }
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, (0, config_1.getSharedConfig)().JWT_REFRESH_SECRET);
    }
    catch {
        throw new errors_1.UnauthorizedError('Invalid refresh token');
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
