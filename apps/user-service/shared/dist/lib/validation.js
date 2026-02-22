"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuery = exports.validateBody = void 0;
const errors_1 = require("./errors");
const validateBody = (schema) => (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        throw new errors_1.BadRequestError(parsed.error.issues.map((v) => v.message).join(', '));
    }
    req.body = parsed.data;
    next();
};
exports.validateBody = validateBody;
const validateQuery = (schema) => (req, _res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
        throw new errors_1.BadRequestError(parsed.error.issues.map((v) => v.message).join(', '));
    }
    req.query = parsed.data;
    next();
};
exports.validateQuery = validateQuery;
