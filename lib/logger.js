"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const json_stringify_safe_1 = __importDefault(require("json-stringify-safe"));
function logger(msg) {
    const msgOut = msg instanceof Object ? (0, json_stringify_safe_1.default)(msg, null, 2) : msg;
    console.log(`[${chalk_1.default.cyan("playwright-testrail-reporter")}] ${msgOut}`);
}
exports.default = logger;
//# sourceMappingURL=logger.js.map