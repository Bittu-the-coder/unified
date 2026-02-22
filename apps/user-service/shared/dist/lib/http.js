"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.ok = void 0;
const errors_1 = require("./errors");
const logger_1 = require("./logger");
const ok = (res, data, message = 'OK', status = 200) => {
    return res.status(status).json({ success: true, message, data });
};
exports.ok = ok;
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof errors_1.AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
            },
        });
    }
    logger_1.logger.error({ err }, 'Unhandled error');
    return res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'Something went wrong',
        },
    });
};
exports.errorHandler = errorHandler;
