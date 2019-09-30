declare type Entry = {
    [key: string]: unknown;
};
declare type Entries = Entry[];
export default class Container {
    private entries;
    private static instance;
    private constructor();
    static getInstance(): Container;
    set(entry: string | Entries, value?: unknown): void;
    get(key: string): any;
}
export {};
//# sourceMappingURL=Container.d.ts.map