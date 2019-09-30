"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const BaseModel_1 = tslib_1.__importDefault(require("./models/BaseModel"));
const BaseRepository_1 = tslib_1.__importDefault(require("./repositories/BaseRepository"));
const Container_1 = tslib_1.__importDefault(require("./Container"));
const container = Container_1.default.getInstance();
container.set('BaseModel', BaseModel_1.default);
container.set('BaseRepository', BaseRepository_1.default);
const VueModel = {
    install(Vue, defaultConfig = {}) {
        const config = {
            rest: true,
            graphql: false,
            ...defaultConfig,
        };
        container.set('Vue', Vue);
        container.set('Config', config);
        Vue.prototype.container = container;
        return container;
    },
};
exports.default = VueModel;
var Container_2 = require("./Container");
exports.Container = Container_2.default;
var BaseRepository_2 = require("./repositories/BaseRepository");
exports.BaseRepository = BaseRepository_2.default;
var BaseModel_2 = require("./models/BaseModel");
exports.BaseModel = BaseModel_2.default;
var Collection_1 = require("./models/Collection");
exports.Collection = Collection_1.default;
var BaseException_1 = require("./models/Exceptions/BaseException");
exports.BaseException = BaseException_1.default;
var InvalidArgumentException_1 = require("./models/Exceptions/InvalidArgumentException");
exports.InvalidArgumentException = InvalidArgumentException_1.default;
var UnexpectedException_1 = require("./models/Exceptions/UnexpectedException");
exports.UnexpectedException = UnexpectedException_1.default;
//# sourceMappingURL=index.js.map