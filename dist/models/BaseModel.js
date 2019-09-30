"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const clone_1 = tslib_1.__importDefault(require("clone"));
const uuidv4_1 = tslib_1.__importDefault(require("uuidv4"));
const utils_1 = require("@/utils");
const Collection_1 = tslib_1.__importDefault(require("./Collection"));
class BaseModel {
    constructor() {
        this.id = uuidv4_1.default();
        this.loading = false;
        this.submittableProps = [];
    }
    get className() {
        return this.constructor.name;
    }
    get displayClassName() {
        return this.className.toLowerCase();
    }
    get data() {
        return this;
    }
    get exists() {
        // If id exists, it means it came from the backend
        return !!this.id || !!this.__typename;
    }
    // METHODS
    /**
     * Hydrates object to model
     *
     * @param item
     * @returns {BaseModel}
     */
    hydrate(item) {
        //@ts-ignore
        return new this.constructor(item);
    }
    getMethod(_opts) {
        return null;
    }
    toCollection(skipEmpty = false) {
        return (new Collection_1.default(this)).filter(i => !!i || !skipEmpty);
    }
    toArray(skipEmpty = false) {
        return this.toCollection(skipEmpty).all();
    }
    /**
     * Returns an array of properties to be submitted based on `submittableProps`
     *
     * @param {array<string>} props
     * @return {array<string>}
     */
    toSubmittable(props = this.submittableProps) {
        if (!props)
            return [];
        if (Array.isArray(props) && !props.length)
            return [];
        return this.toCollection().only(props).all();
    }
    async create(mutation, params) {
        return this.hydrate(await this.mutate(mutation, params));
    }
    delete(deleteMutation) {
        return this.mutate(deleteMutation, {
            id: this.id,
        }, 'delete');
    }
    // METHODS
    /**
     * Performs a GQL mutation
     *
     * @param {string|function} url
     * @param {object} params
     * @param {string} method
     * @returns {*|Promise<Array<any>>|void}
     */
    async mutate(url, params, method = 'post') {
        let resolvedUrl = url;
        if (typeof url === 'function') {
            resolvedUrl = await url();
        }
        else {
            resolvedUrl = resolvedUrl.replace(/:([^\s\/]+)/gi, (_, m) => {
                const param = params[m];
                const hasParam = param !== undefined;
                if (hasParam) {
                    delete params[m];
                    return param;
                }
                return m;
            });
        }
        const resolvedMethod = this.getMethod({ method, url, params });
        return this.beforeMutate()
            .then(utils_1.performSafeRequest.bind(this, resolvedUrl, params, resolvedMethod || method))
            .finally(this.afterMutate.bind(this));
    }
    clone() {
        return clone_1.default(this);
    }
    async beforeMutate() {
        this.loading = true;
    }
    afterMutate() {
        this.loading = false;
    }
}
exports.default = BaseModel;
//# sourceMappingURL=BaseModel.js.map