"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = handler;
const app_1 = require("../src/app");
exports.config = {
    api: {
        bodyParser: false,
        externalResolver: true,
    },
};
async function handler(req, res) {
    return (0, app_1.app)(req, res);
}
