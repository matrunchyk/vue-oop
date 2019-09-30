"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Container {
    constructor() {
        this.entries = new Map();
    }
    static getInstance() {
        if (!Container.instance) {
            Container.instance = new Container();
        }
        return Container.instance;
    }
    set(entry, value) {
        const entries = Array.isArray(entry) ? entry : [{ [entry]: value }];
        Object.entries(entries).forEach(entry => Container.instance.entries.set(entry[0], entry[1]));
    }
    get(key) {
        if (!Container.instance.entries.has(key)) {
            throw new Error(`Registry Error: ${key} is not available in the registry.`);
        }
        return Container.instance.entries.get(key);
    }
}
exports.default = Container;
//# sourceMappingURL=Container.js.map