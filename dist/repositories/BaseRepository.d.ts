import Collection from '../models/Collection';
import { performSafeRequest } from '@/utils';
declare type KeyValueString = {
    [key: string]: string;
};
declare type ResolvingOptions = {
    method: string;
    url: string | UrlResolver;
    params: unknown;
};
declare type PropertyFunction<T> = () => T;
declare type UrlResolver = (params: KeyValueString, collection: boolean) => string;
declare type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';
export declare type EventType = {
    type: string;
    target: unknown;
    payload?: unknown;
};
export default abstract class BaseRepository<M = unknown> {
    /**
     * Existing/Loading flag
     *
     * @type {boolean}
     * @private
     */
    private _exists;
    private _eventListeners;
    private _firedEvents;
    /**
     * Request helper
     *
     * @type {() => void}
     */
    protected doRequest: typeof performSafeRequest;
    /**
     * Repository loading flag
     *
     * @type {boolean}
     */
    loading: boolean;
    lastError: Error;
    /**
     * Query method
     *
     * @type {string}
     */
    method: string;
    /**
     * Hold the collection of the items retrieved from the backend
     *
     * @type {Collection}
     */
    dataset: Collection<M>;
    /**
     * Hold query parameters to be used by .many() call
     *
     * @type {object}
     */
    queryParams: KeyValueString;
    /**
     * Defines a model which the repository items to be hydrated by
     *
     * @type {BaseModel|function}
     * @throws {InvalidArgumentException}
     */
    model: M | unknown;
    /**
     * Defines the 'Fetch One' query url
     *
     * @type {string|function}
     * @throws {InvalidArgumentException}
     */
    abstract fetchOneQuery: string | PropertyFunction<string>;
    /**
     * Defines the 'fetch multiple items' query url
     *
     * @type {string|function}
     * @throws {InvalidArgumentException}
     */
    abstract fetchManyQuery: string | PropertyFunction<string>;
    /**
     * Constructs a repository with optionally predefined items.
     * It uses an async early binding concept to avoid blocking a thread.
     *
     * @param {object|array|Collection} options
     */
    protected constructor(options?: Collection<M> | M[]);
    readonly className: string;
    readonly displayClassName: string;
    readonly exists: boolean;
    getMethod(opts: ResolvingOptions): string;
    fromArray(array: unknown[], skipEmpty?: boolean): Collection<any>;
    /**
     * Handles an error
     *
     * @param {Error} e
     */
    protected onError(e: Error): void;
    /**
     * Performs an XMLHttpRequest query
     *
     * @param {string|function} url
     * @param {object} params
     * @param {boolean} collection
     * @param {string} method
     * @returns {Promise<Collection|BaseModel>}
     */
    query(url: string | UrlResolver, params?: KeyValueString, collection?: boolean, method?: HttpMethod): Promise<any>;
    beforeQuery(): Promise<void>;
    processResponse(collection: any, data: any): Promise<any>;
    afterQuery(): Promise<void>;
    on(type: any, callback: (event: EventType) => void, { immediate }: {
        immediate?: boolean;
    }): void;
    private createEvent;
    private dispatchEvent;
    /**
     * Fetches multiple models
     *
     * @param params
     * @returns {Promise<Collection>}
     */
    many(params?: any): Promise<Collection<M>>;
    /**
     * Fetches a single model
     *
     * @param {number|string} id
     * @returns {Promise<BaseModel>}
     */
    one(id: any): Promise<any>;
    static one(params: any): any;
}
export {};
//# sourceMappingURL=BaseRepository.d.ts.map