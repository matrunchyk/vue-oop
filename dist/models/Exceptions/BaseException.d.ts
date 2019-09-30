declare type ExceptionPayload = {
    data: {
        message: string;
    };
};
export default class BaseException extends Error {
    response: {};
    constructor(payload?: ExceptionPayload | string);
}
export {};
//# sourceMappingURL=BaseException.d.ts.map