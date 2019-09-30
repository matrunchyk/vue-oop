"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const axios_1 = tslib_1.__importDefault(require("axios"));
function camelToKebab(input) {
    return input.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
exports.camelToKebab = camelToKebab;
function queryParams(params, camelToKebabActive = true) {
    const str = [];
    for (const paramsKey in params)
        if (params.hasOwnProperty(paramsKey) && (params[paramsKey] || params[paramsKey] === 0)) {
            const normalized = camelToKebabActive ? camelToKebab(encodeURIComponent(paramsKey)) : encodeURIComponent(paramsKey);
            str.push(`${normalized}=${encodeURIComponent(params[paramsKey])}`);
        }
    return str.join('&');
}
exports.queryParams = queryParams;
function status(res) {
    const response = res.hasOwnProperty('status') ? res : res.response;
    if (response.status && response.status >= 200 && response.status < 300) {
        return Promise.resolve(response);
    }
    else {
        if (response.data && response.data.errors) {
            const errors = (response.data.errors || []).map((err) => err.defaultMessage).join(', ');
            return Promise.reject(new Error(errors));
        }
        return Promise.reject(new Error(response.data.message));
    }
}
exports.status = status;
function json(response) {
    if (response && response.data) {
        return response.data;
    }
    else {
        return null;
    }
}
exports.json = json;
async function performSafeRequest(url, params = {}, method = 'get') {
    let fullUrl = url;
    let body = {};
    if (method === 'get') {
        const queryEscaped = queryParams(params);
        if (queryEscaped) {
            fullUrl = `${fullUrl}?${queryEscaped}`;
        }
    }
    else {
        body = params;
    }
    return axios_1.default[method.toLowerCase()](fullUrl, body).then(status).then(json);
}
exports.performSafeRequest = performSafeRequest;
//# sourceMappingURL=utils.js.map