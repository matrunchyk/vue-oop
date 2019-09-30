"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const InvalidArgumentException_1 = tslib_1.__importDefault(require("../models/Exceptions/InvalidArgumentException"));
const Collection_1 = tslib_1.__importDefault(require("../models/Collection"));
const utils_1 = require("@/utils");
class BaseRepository {
    /**
     * Constructs a repository with optionally predefined items.
     * It uses an async early binding concept to avoid blocking a thread.
     *
     * @param {object|array|Collection} options
     */
    constructor(options = null) {
        /**
         * Existing/Loading flag
         *
         * @type {boolean}
         * @private
         */
        this._exists = false;
        this._eventListeners = {};
        this._firedEvents = [];
        /**
         * Request helper
         *
         * @type {() => void}
         */
        this.doRequest = utils_1.performSafeRequest;
        /**
         * Repository loading flag
         *
         * @type {boolean}
         */
        this.loading = true;
        this.lastError = null;
        /**
         * Query method
         *
         * @type {string}
         */
        this.method = '';
        /**
         * Hold the collection of the items retrieved from the backend
         *
         * @type {Collection}
         */
        this.dataset = new Collection_1.default();
        /**
         * Hold query parameters to be used by .many() call
         *
         * @type {object}
         */
        this.queryParams = {};
        /**
         * Defines a model which the repository items to be hydrated by
         *
         * @type {BaseModel|function}
         * @throws {InvalidArgumentException}
         */
        this.model = function undefinedMethod(data) {
            return Object(data);
        };
        if (options instanceof Collection_1.default) {
            this.dataset = options;
        }
        else if (Array.isArray(options)) {
            this.dataset = this.fromArray(options);
        }
        this.dispatchEvent('construct');
    }
    get className() {
        return this.constructor.name;
    }
    get displayClassName() {
        return this.className.toLowerCase();
    }
    get exists() {
        return this._exists;
    }
    //@ts-ignore
    getMethod(opts) {
        return null;
    }
    fromArray(array, skipEmpty = true) {
        //@ts-ignore
        return new Collection_1.default(array.filter(i => i || !skipEmpty).map(i => new this.model(i)));
    }
    /**
     * Handles an error
     *
     * @param {Error} e
     */
    onError(e) {
        this.lastError = e;
        this.dispatchEvent('onError');
    }
    ;
    /**
     * Performs an XMLHttpRequest query
     *
     * @param {string|function} url
     * @param {object} params
     * @param {boolean} collection
     * @param {string} method
     * @returns {Promise<Collection|BaseModel>}
     */
    async query(url, params = {}, collection = false, method = 'get') {
        let resolvedUrl = url;
        this.method = method;
        if (typeof url === 'function') {
            resolvedUrl = await url(params, collection);
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
        return this.beforeQuery()
            .then(this.doRequest.bind(this, resolvedUrl, params || this.queryParams, resolvedMethod || method))
            .then(this.processResponse.bind(this, collection))
            .catch(this.onError.bind(this))
            .finally(this.afterQuery.bind(this));
    }
    async beforeQuery() {
        this.loading = true;
        this.dispatchEvent('beforeQuery');
    }
    async processResponse(collection, data) {
        return collection ? this.fromArray(data) : data;
    }
    async afterQuery() {
        this.loading = false;
        this.dispatchEvent('afterQuery');
    }
    on(type, callback, { immediate = false }) {
        if (!(type in this._eventListeners)) {
            this._eventListeners[type] = [];
        }
        this._eventListeners[type].push({
            callback,
            immediate,
        });
        const event = this.createEvent(type);
        if (this._firedEvents[type]) {
            callback(this._firedEvents[type]);
            return;
        }
        this._eventListeners[type]
            .slice()
            .filter(subscriber => subscriber.fired && subscriber.immediate)
            .forEach((subscriber) => subscriber.callback(event));
    }
    createEvent(type, payload) {
        return {
            type,
            target: this,
            payload,
        };
    }
    dispatchEvent(type, payload) {
        const event = this.createEvent(type, payload);
        this._firedEvents[type] = event;
        if (!(event.type in this._eventListeners)) {
            return true;
        }
        const subscribers = this._eventListeners[event.type].slice();
        for (let i = 0, l = subscribers.length; i < l; i++) {
            const subscriber = subscribers[i];
            subscriber.fired = true;
            subscriber.callback.call(this, event);
        }
        return true;
    }
    ;
    /**
     * Fetches multiple models
     *
     * @param params
     * @returns {Promise<Collection>}
     */
    async many(params = null) {
        if (!this.fetchManyQuery) {
            throw new InvalidArgumentException_1.default('fetchAllQuery is not set for this repository.');
        }
        this.dataset = await this.query(this.fetchManyQuery, params || this.queryParams, true);
        this._exists = true;
        return this.dataset;
    }
    /**
     * Fetches a single model
     *
     * @param {number|string} id
     * @returns {Promise<BaseModel>}
     */
    async one(id) {
        const data = await this.query(this.fetchOneQuery, { id });
        //@ts-ignore
        return new this.model(data);
    }
    static one(params) {
        return Reflect.construct(this, []).one(params);
    }
}
exports.default = BaseRepository;
//# sourceMappingURL=BaseRepository.js.map