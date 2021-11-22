import clone from 'lodash.clonedeep';
import to from 'to-case';
import {
  getUrl,
  performSafeRequestREST,
  performSafeRequestGraphql,
  config,
  getSchemaTypeFields,
} from '../utils';
import Collection from './Collection';
import { KeyValueUnknown, ResolvingRESTOptions } from '../typings';
import EventEmitter from '../EventEmitter';
import { DocumentNode, GraphQLError } from 'graphql';
import { v4 } from "uuid";

export default abstract class Model extends EventEmitter {
  public providerName = 'default';

  public id: string;

  public uuid: string;

  public loading = false;

  public createMutation?: string | CallableFunction | DocumentNode; // NOSONAR

  public updateMutation?: string | CallableFunction | DocumentNode;

  public deleteMutation?: string | CallableFunction | DocumentNode;

  protected submittableProps = [];

  protected __typename: string | undefined;

  protected performSafeRequestGraphql = performSafeRequestGraphql;

  protected performSafeRequestREST = performSafeRequestREST;

  protected lastError: Error | GraphQLError = null;

  private _exists = false;

  //noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
  public constructor(props = {}) {
    super();
    Object.assign(this, this.defaults(), props);
    Object.assign(this, props);

    //@ts-ignore
    // istanbul ignore else
    if (typeof this.hydrateProps === 'function') {
      console.warn('Deprecated: Use property variables or constructor instead. `hydrateProps` will be removed in the next versions.');
      //@ts-ignore
      this.hydrateProps(props);
    }
  }

  generateUuid() {
    this.uuid = v4();
  }

  /**
   * Request helper
   *
   * @type {() => void}
   */
  get doRequest() {
    return config(this.providerName).graphql ? performSafeRequestGraphql : performSafeRequestREST;
  }

  get className() {
    return this.constructor.name;
  }

  get displayClassName() {
    return this.className.toLowerCase();
  }

  get defaultMethod() {
    return 'post';
  }

  get identifier(): string {
    return config(this.providerName).graphql ? 'uuid' : 'id';
  }

  public exists(): boolean {
    return this._exists || Boolean(this.__typename) || Boolean(this.id);
  }

  protected defaults(): KeyValueUnknown {
    return {};
  }

  // METHODS
  /**
   * Hydrates object to model
   *
   * @param item
   * @returns {Model}
   */
  protected hydrate(item) {
    //@ts-ignore
    return new this.constructor(item);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getMethod(_opts: ResolvingRESTOptions) {
    return null;
  }

  public toCollection(skipEmpty = false) {
    return (new Collection(this)).filter(i => !!i || !skipEmpty);
  }

  public toArray(skipEmpty = false) {
    return this.toCollection(skipEmpty).all();
  }

  public getClassName() {
    return this.constructor.name;
  }

  protected async getInputFields(inputTypeName = `${this.getClassName()}Input`) {
    return getSchemaTypeFields(inputTypeName, this.providerName);
  }

  public async getUpdateVariables(inputTypeName?: string): Promise<unknown> {
    const keys = await this.getInputFields(inputTypeName);
    const result = {};

    for (const key of keys) {
      let value = this[key];

      if (value instanceof Collection) {
        value = value.all();
      }

      if (Array.isArray(value)) {
        result[key] = await Promise.all(value.map(async model => ((model instanceof Model) ? await model.getUpdateVariables() : await model))); // NOSONAR
        continue;
      }

      if (value instanceof Model) {
        result[key] = await value.getUpdateVariables();
        continue;
      }

      result[key] = await value;
    }

    return result;
  }

  /**
   * Returns an array of properties to be submitted based on `submittableProps`
   *
   * @param {array<string>} props
   * @return {array<string>}
   */
  public toSubmittable(props = this.submittableProps): unknown {
    // istanbul ignore else
    if (!props) return [];
    // istanbul ignore else
    if (Array.isArray(props) && !props.length) return [];

    return this.toCollection().only(props).all();
  }

  /**
   * Returns an FormData of properties to be submitted based on `submittableProps`
   *
   * @param {array<string>} props
   * @return {FormData}
   */
  toSubmittableFormData(props = this.submittableProps): FormData {
    const fd = new FormData();

    if (!props || (Array.isArray(props) && !props.length)) return fd;

    // @ts-ignore
    this.toCollection().only(props).each((item: any, index: string) => {
      fd.append(index, item);
    });

    return fd;
  }

  public async save() {
    return this.exists() ? this.update() : this.create();
  }

  public async create(params?: unknown, mutation?: string | DocumentNode) {
    const resolvedRequest = this.resolveRequest(mutation, this.createMutation);
    const resolvedParams = await this.resolveParams(params);

    // istanbul ignore else
    if (config(this.providerName).graphql) {
      return this.hydrate(
        await this.mutate(resolvedRequest, resolvedParams),
      );
    }

    return this.hydrate(
      await this.mutate(resolvedRequest, resolvedParams),
    );
  }

  public async update(params?: unknown, mutation?: string | DocumentNode) {
    const resolvedRequest = this.resolveRequest(mutation, this.updateMutation);
    const resolvedParams = await this.resolveParams(params);

    // istanbul ignore else
    if (config(this.providerName).graphql) {
      return this.hydrate(
        await this.mutate(resolvedRequest, resolvedParams),
      );
    }

    return this.hydrate(
      await this.mutate(resolvedRequest, resolvedParams),
    );
  }

  public async delete(mutation?: string | DocumentNode, params?: unknown) {
    const resolvedRequest = this.resolveRequest(mutation, this.deleteMutation);

    // Marks as not exists and returns a mutation result
    const forget = result => this.markNotExists() && result;

    // istanbul ignore else
    if (config(this.providerName).graphql) {
      return this.mutate(resolvedRequest, params || {
        uuid: this.uuid,
      }).then(forget);
    }

    return this.mutate(resolvedRequest, params || {
      id: this.id,
    }, 'delete').then(forget);
  }

  // METHODS
  /**
   * Performs a GQL mutation
   *
   * @param {string|function} mutationOrUrl
   * @param {object} params
   * @param {string} method
   * @returns {*|Promise<Array<any>>|void}
   */
  public async mutate(mutationOrUrl, params, method = this.defaultMethod): Promise<unknown> {
    // istanbul ignore else
    if (config(this.providerName).graphql) {
      return this.beforeMutate()
        .then(this.performSafeRequestGraphql.bind(this, mutationOrUrl, params, this.providerName, null))
        .catch(this.onError.bind(this))
        .finally(this.afterMutate.bind(this))
        .finally(this.markExists.bind(this));
    }

    const resolvedUrl = await getUrl({ method, url: mutationOrUrl, params });
    const resolvedMethod = await this.getMethod({ method, url: resolvedUrl, params });

    return this.beforeMutate()
      .then(this.performSafeRequestREST.bind(this, resolvedUrl, params, resolvedMethod || method, null))
      .catch(this.onError.bind(this))
      .finally(this.afterMutate.bind(this))
      .finally(this.markExists.bind(this));
  }

  public clone(): this {
    return clone(this).markNotExists();
  }

  public markExists(): this {
    this._exists = true;

    return this;
  }

  public markNotExists(): this {
    this._exists = false;

    return this;
  }

  protected async beforeMutate(): Promise<this> {
    this.loading = true;

    return this;
  }

  protected afterMutate(): this {
    this.loading = false;

    return this;
  }

  protected resolveRequest(request: string | DocumentNode, defaultRequest: string | CallableFunction | DocumentNode): string | DocumentNode {
    if (request) return request;

    return typeof defaultRequest === 'function' ? defaultRequest() : defaultRequest;
  }

  protected async resolveParams(params: unknown): Promise<unknown> {
    if (config(this.providerName).graphql) {
      const model = await this.getUpdateVariables();

      return {
        [to.camel(this.className)]: model,
      };
    }

    return params;
  }

  /**
   * Handles an error
   *
   * @param {Error | GraphQLError} e
   */
  protected onError(e: Error | GraphQLError) {
    this.lastError = e;

    this.emit('onError', e);

    throw e;
  }
}
