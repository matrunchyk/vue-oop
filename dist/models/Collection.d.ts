import BaseModel from '@/models/BaseModel';
/**
 * This is a proxy class-wrapper for collect.js
 * to allow its extending in OOP manner.
 *
 * Use .macro() for non-OOP extension
 *
 * @url https://github.com/ecrmnn/collect.js
 */
declare class Collection<Item = unknown> {
    all: () => Item[];
    map: (fn: (item: Item, index: unknown) => unknown) => Collection<Item>;
    filter: (fn: (item: Item, key?: unknown) => boolean) => Collection<Item>;
    some: <K, V>(key: K | Function, value?: V) => boolean;
    flatten: (depth?: number) => unknown;
    only: <K>(properties: K[]) => Collection<Item>;
    count: () => number;
    isEmpty: () => boolean;
    intersect: (values: Item[] | Collection<Item> | Collection<unknown>) => Collection<Item>;
    reduce: <T>(fn: (_carry: T | null, item: Item) => T, carry?: T) => unknown;
    first: <V>(fn?: (item: Item) => boolean, defaultValue?: (...any: unknown[]) => V | Item) => Item;
    collection: Collection<Item>;
    /**
     * Constructs a collection based on the array of items
     *
     * @param {array} items
     * @returns {Collection|Proxy}
     */
    constructor(items?: Item[] | BaseModel);
    /**
     * Proxy getter which does the proxying job for the Collection
     *
     * @param {object} target
     * @param {string} prop
     * @returns {*}
     * @private
     */
    static __get(target: any, prop: any): any;
    static fromArray(array: any, skipEmpty?: boolean): Collection<unknown>;
}
export default Collection;
//# sourceMappingURL=Collection.d.ts.map