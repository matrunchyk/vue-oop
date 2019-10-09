export default class RepositoryProvider {
  /**
   * Constructs a collection based on the array of items
   */
  constructor() {
    return new Proxy(this, {
      get: RepositoryProvider.__get,
    });
  }

  public static provide() {
    return new RepositoryProvider();
  }

  /**
   * Proxy getter which does the proxying job for the RepositoryProvider
   */
  private static __get(target, prop) {
    if (Reflect.has(target, prop)) {
      return Reflect.get(target, prop);
    }

    return undefined;
  }
}
