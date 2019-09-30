import Container from './Container';
export declare type VueModelConfig = {
    graphql?: boolean;
    rest?: boolean;
};
declare const VueModel: {
    install(Vue: any, defaultConfig?: VueModelConfig): Container;
};
export default VueModel;
export { default as Container } from './Container';
export { default as BaseRepository } from './repositories/BaseRepository';
export { default as BaseModel } from './models/BaseModel';
export { default as Collection } from './models/Collection';
export { default as BaseException } from './models/Exceptions/BaseException';
export { default as InvalidArgumentException } from './models/Exceptions/InvalidArgumentException';
export { default as UnexpectedException } from './models/Exceptions/UnexpectedException';
//# sourceMappingURL=index.d.ts.map