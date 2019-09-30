import collect from 'collect.js';
import BaseModel from '@/models/BaseModel';

/**
 * This is a proxy class-wrapper for collect.js
 * to allow its extending in OOP manner.
 *
 * Use .macro() for non-OOP extension
 *
 * @url https://github.com/ecrmnn/collect.js
 */
class Collection<Item = unknown> {
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
  constructor(items: Item[] | BaseModel = []) {
    this.collection = (collect(items) as unknown) as this;

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

export default Collection;
