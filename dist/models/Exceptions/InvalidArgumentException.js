"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const BaseException_1 = tslib_1.__importDefault(require("./BaseException"));
class InvalidArgumentException extends BaseException_1.default {
    constructor() {
        super(...arguments);
        this.message = 'InvalidArgumentException';
    }
}
exports.default = InvalidArgumentException;
//# sourceMappingURL=InvalidArgumentException.js.map