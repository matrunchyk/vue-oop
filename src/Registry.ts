import { config } from './utils';

type Entry = {
  [key: string]: unknown;
}

export default class Registry {
  /**
   * Holds a Map of the registry values
   *
   * @type {Map<string, any>}
   */
  private entries = new Map();

  /**
   * Holds the singleton instance
   */
  private static instance: Registry;

  /**
   * Constructor of a singleton class
   *
   * @returns {Registry | this}
   */
  private constructor() {
    if (Registry.instance) {
      return Registry.instance;
    }

    Registry.instance = this;
    return this;
  }

  /**
   * Retrieves an existing singleton or creates one if no any.
   *
   * @returns {Registry}
   */
  static getInstance(): Registry {
    if (!Registry.instance) {
      Registry.instance = new Registry();
    }

    return Registry.instance;
  }

  /**
   * The size accessor property returns the number of elements in an entries object.
   *
   * @returns {number}
   */
  get size(): number {
    return Registry.instance.entries.size;
  }

  /**
   * The set() method adds or updates an element with a specified key and a value to an entries object.
   * If the first parameter is an array, the second one is ignored,
   *  and the elements will be set according to array's objects key pairs.
   *
   * @param {string | Entry[]} key
   * @param value
   */
  public set(key: string | Entry[], value?: unknown): void {
    const entries: Entry[] = Array.isArray(key) ? key : [{ [key]: value }];
    entries.forEach((entry) => {
      Object.entries(entry).forEach(([key, value]) => Registry.instance.entries.set(key, value));
    });
  }

  /**
   * The get() method returns a specified element from an entries object.
   *
   * @param {string} key
   * @returns {any}
   * @throws Error
   */
  public get(key: string): unknown {
    if (!Registry.instance.entries.has(key)) {
      if (config().debug) {
        console.warn(`Registry Error: ${key} is not available in the registry.`);
      }
      return null;
    }
    return Registry.instance.entries.get(key);
  }

  /**
   * The has() method returns a boolean indicating whether an element with the specified key exists or not.
   *
   * @param {string} key
   * @returns {boolean}
   */
  public has(key: string): boolean {
    return Registry.instance.entries.has(key);
  }

  /**
   * The clear() method removes all elements from an entries object.
   */
  public clear(): void {
    Registry.instance.entries.clear();
  }

  /**
   * The delete() method removes the specified element from an entries object by key.
   *
   * @param {string} key
   * @returns {boolean}
   */
  public delete(key: string): boolean {
    return Registry.instance.entries.delete(key);
  }

  /**
   * Used by Jest to be able to reset the singleton.
   *
   * @internal
   * @private
   */
  public __jest__destroyInstance() {
    // istanbul ignore next
    if (process.env.NODE_ENV !== 'test') return;

    delete Registry.instance;
  }
}
