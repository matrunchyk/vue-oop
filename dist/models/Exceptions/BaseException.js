"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BaseException extends Error {
    constructor(payload = '') {
        super(typeof payload === 'string' ? payload : payload.data.message);
        this.response = {};
        this.response = payload;
        this.stack = (new Error()).stack;
    }
}
exports.default = BaseException;
//# sourceMappingURL=BaseException.js.map