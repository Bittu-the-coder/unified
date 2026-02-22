"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const errors_1 = require("./errors");
const jwt_1 = require("./jwt");
const requireAuth = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
        throw new errors_1.UnauthorizedError('Missing access token');
    }
    const payload = (0, jwt_1.verifyAccessToken)(token);
    req.user = {
        id: payload.sub,
        email: payload.email,
        uniqueNumber: payload.uniqueNumber,
        username: payload.username,
        fullName: payload.fullName,
    };
    next();
};
exports.requireAuth = requireAuth;
