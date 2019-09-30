"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const BaseException_1 = tslib_1.__importDefault(require("./BaseException"));
class UnexpectedException extends BaseException_1.default {
    constructor() {
        super(...arguments);
        this.message = 'UnexpectedException';
    }
}
exports.default = UnexpectedException;
//# sourceMappingURL=UnexpectedException.js.map