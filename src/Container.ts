type Entry = {
  [key: string]: unknown;
}

export default class Container {
  private entries = new Map();

  private static instance: Container;

  private constructor() {
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }

    return Container.instance;
  }

  public set(key: string, value: unknown): void {
    const entries: Entry[] = Array.isArray(key) ? key : [{[key]: value}];
    entries.forEach((entry) => {
      Object.entries(entry).forEach(([key, value]) => Container.instance.entries.set(key, value));
    });
  }

  public get(key: string): unknown {
    if (!Container.instance.entries.has(key)) {
      throw new Error(`Registry Error: ${key} is not available in the registry.`);
    }
    return Container.instance.entries.get(key);
  }

  public has(key: string): unknown {
    return Container.instance.entries.has(key);
  }
}
