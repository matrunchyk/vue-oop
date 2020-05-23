import clone from 'lodash.clonedeep';
import to from 'to-case';
import {
  getUrl,
  performSafeRequestREST,
  performSafeRequestGraphql,
  config,
  getSchemaTypeFields,
  stripObject
} from '../utils';
import Collection from './Collection';
import { KeyValueUnknown, ResolvingRESTOptions } from '../typings';
import EventEmitter from '../EventEmitter';
import { DocumentNode } from 'graphql';
import { v4 } from "uuid";

export default abstract class Model extends EventEmitter {
  public id: string;

  public uuid: string;

  public loading = false;

  public children: unknown;

  public createMutation?: string | Function | DocumentNode;

  public updateMutation?: string | Function | DocumentNode;

  public deleteMutation?: string | Function | DocumentNode;

  protected submittableProps = [];

  protected __typename: string | undefined;

  protected performSafeRequestGraphql = performSafeRequestGraphql;

  protected performSafeRequestREST = performSafeRequestREST;

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
    return config().graphql ? performSafeRequestGraphql : performSafeRequestREST;
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

  public exists(): boolean {
    return this._exists;
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

  protected getInputFields() {
    return getSchemaTypeFields(`${this.getClassName()}Input`);
  }

  public getUpdateVariables() {
    return stripObject(this.toCollection()
      .only(this.getInputFields())
      .map(field => {
        if (Array.isArray(field)) {
          return field.map(model => ((model instanceof Model) ? model.getUpdateVariables() : model));
        }
        if (field instanceof Model) {
          return field.getUpdateVariables();
        }

        return field;
      })
      .all());
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

  public async save() {
    return this.exists() ? this.update() : this.create();
  }

  public async create(params?: unknown, mutation?: string | DocumentNode) {
    const resolvedRequest = this.resolveRequest(mutation, this.createMutation);
    const resolvedParams = this.resolveParams(params);

    // istanbul ignore else
    if (config().graphql) {
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
    const resolvedParams = this.resolveParams(params);

    // istanbul ignore else
    if (config().graphql) {
      return this.hydrate(
        await this.mutate(resolvedRequest, resolvedParams),
      );
    }

    return this.hydrate(
      await this.mutate(resolvedRequest, resolvedParams),
    );
  }

  public async delete(params?: unknown, mutation?: string | DocumentNode) {
    const resolvedRequest = this.resolveRequest(mutation, this.deleteMutation);

    // Marks as not exists and returns a mutation result
    const forget = result => this.markNotExists() && result;

    // istanbul ignore else
    if (config().graphql) {
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
  public async mutate(mutationOrUrl, params, method = this.defaultMethod) {
    // istanbul ignore else
    if (config().graphql) {
      return this.beforeMutate()
        .then(this.performSafeRequestGraphql.bind(this, mutationOrUrl, params, null))
        .finally(this.afterMutate.bind(this))
        .finally(this.markExists.bind(this));
    }

    const resolvedUrl = await getUrl({ method, url: mutationOrUrl, params });
    const resolvedMethod = await this.getMethod({ method, url: resolvedUrl, params });

    return this.beforeMutate()
      .then(this.performSafeRequestREST.bind(this, resolvedUrl, params, resolvedMethod || method, null))
      .finally(this.afterMutate.bind(this))
      .finally(this.markExists.bind(this));
  }

  public clone() {
    return clone(this).markNotExists();
  }

  public markExists() {
    this._exists = true;

    return this;
  }

  public markNotExists() {
    this._exists = false;

    return this;
  }

  protected async beforeMutate() {
    this.loading = true;

    return this;
  }

  protected afterMutate() {
    this.loading = false;

    return this;
  }

  protected resolveRequest(request: string | DocumentNode, defaultRequest: string | Function | DocumentNode): string | DocumentNode {
    if (request) return request;

    return typeof defaultRequest === 'function' ? defaultRequest() : defaultRequest;
  }

  protected resolveParams(params: Object): Object {
    if (config().graphql) {
      const model = this.getUpdateVariables();

      return {
        [to.camel(this.className)]: model,
      };
    }

    return params;
  }
}
