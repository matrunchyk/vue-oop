"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const collect_js_1 = tslib_1.__importDefault(require("collect.js"));
/**
 * This is a proxy class-wrapper for collect.js
 * to allow its extending in OOP manner.
 *
 * Use .macro() for non-OOP extension
 *
 * @url https://github.com/ecrmnn/collect.js
 */
class Collection {
    /**
     * Constructs a collection based on the array of items
     *
     * @param {array} items
     * @returns {Collection|Proxy}
     */
    constructor(items = []) {
        this.collection = collect_js_1.default(items);
        return new Proxy(this, {
            get: Collection.__get,
        });
    }
    /**
     * Proxy getter which does the proxying job for the Collection
     *
     * @param {object} target
     * @param {string} prop
     * @returns {*}
     * @private
     */
    static __get(target, prop) {
        if (Reflect.has(target, prop)) {
            return Reflect.get(target, prop);
        }
        const collection = Reflect.get(target, 'collection');
        if (Reflect.has(collection, prop)) {
            return Reflect.get(collection, prop);
        }
        return undefined;
    }
    static fromArray(array, skipEmpty = true) {
        // eslint-disable-next-line new-cap
        return new Collection(array.filter(i => i || !skipEmpty));
    }
}
exports.default = Collection;
//# sourceMappingURL=Collection.js.map