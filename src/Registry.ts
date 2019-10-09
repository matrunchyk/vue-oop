type Entry = {
  [key: string]: unknown;
}

export default class Registry {
  private entries = new Map();

  private static instance: Registry;

  private constructor() {
    if (Registry.instance) {
      return Registry.instance;
    }

    Registry.instance = this;
    return this;
  }

  static getInstance(): Registry {
    if (!Registry.instance) {
      Registry.instance = new Registry();
    }

    return Registry.instance;
  }

  public set(key: string, value: unknown): void {
    const entries: Entry[] = Array.isArray(key) ? key : [{[key]: value}];
    entries.forEach((entry) => {
      Object.entries(entry).forEach(([key, value]) => Registry.instance.entries.set(key, value));
    });
  }

  public __jest__destroyInstance() {
    // istanbul ignore next
    if (process.env.NODE_ENV !== 'test') return;

    delete Registry.instance;
  }

  public get(key: string): unknown {
    if (!Registry.instance.entries.has(key)) {
      throw new Error(`Registry Error: ${key} is not available in the registry.`);
    }
    return Registry.instance.entries.get(key);
  }

  public has(key: string): unknown {
    return Registry.instance.entries.has(key);
  }
}
