import Collection from './Collection';
declare type KeyValueString = {
    [key: string]: string;
};
declare type UrlResolver = (params: KeyValueString, collection: boolean) => string;
declare type ResolvingOptions = {
    method: string;
    url: string | UrlResolver;
    params: unknown;
};
export default abstract class BaseModel {
    id: string;
    __typename: string | undefined;
    loading: boolean;
    submittableProps: any[];
    children: unknown;
    protected constructor();
    readonly className: string;
    readonly displayClassName: string;
    readonly data: BaseModel;
    readonly exists: boolean;
    /**
     * Hydrates object to model
     *
     * @param item
     * @returns {BaseModel}
     */
    protected hydrate(item: any): any;
    protected getMethod(_opts: ResolvingOptions): any;
    toCollection(skipEmpty?: boolean): Collection<unknown>;
    toArray(skipEmpty?: boolean): unknown[];
    /**
     * Returns an array of properties to be submitted based on `submittableProps`
     *
     * @param {array<string>} props
     * @return {array<string>}
     */
    toSubmittable(props?: any[]): unknown;
    create(mutation: any, params: any): Promise<any>;
    delete(deleteMutation: any): Promise<any>;
    /**
     * Performs a GQL mutation
     *
     * @param {string|function} url
     * @param {object} params
     * @param {string} method
     * @returns {*|Promise<Array<any>>|void}
     */
    mutate(url: any, params: any, method?: string): Promise<any>;
    clone(): any;
    protected beforeMutate(): Promise<void>;
    protected afterMutate(): void;
}
export {};
//# sourceMappingURL=BaseModel.d.ts.map