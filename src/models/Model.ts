import camelCase from 'lodash.camelcase';
import clone from 'lodash.clonedeep';
import uuid from 'uuid';
import {getUrl, performSafeRequestREST, performSafeRequestGraphql, config, getSchemaTypeFields, stripObject} from '../utils';
import Collection from './Collection';
import {KeyValueUnknown, ResolvingRESTOptions} from '../typings';
import EventEmitter from '../EventEmitter';

export default abstract class Model extends EventEmitter {
  public id: string;

  public uuid: string = uuid.v4();

  public loading = false;

  public children: unknown;

  protected submittableProps = [];

  protected __typename: string | undefined;

  protected performSafeRequestGraphql = performSafeRequestGraphql;

  protected performSafeRequestREST = performSafeRequestREST;

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
    console.warn('Deprecated: UUID is generated automatically. `generateUuid` will be removed in the next versions.');
    this.uuid = uuid.v4();
  }

  /**
   * Request helper
   *
   * @type {() => void}
   */
  get doRequest() {
    return config().graphql ? performSafeRequestGraphql : performSafeRequestREST;
  };

  get className() {
    return this.constructor.name;
  }

  get displayClassName() {
    return this.className.toLowerCase();
  }

  get defaultMethod() {
    return 'post';
  }

  public exists() {
    // REST: If id exists, it means it came from the backend
    // GraphQL: If __typename exists, it means it came from the backend
    return !!this.id || (config().graphql && !!this.__typename);
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

  protected getUpdateVariables() {
    return stripObject(this.toCollection().only(this.getInputFields()).all());
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

  public async create(mutation, params) {
    // istanbul ignore else
    if (config().graphql) {
      return this.hydrate(
        await this.mutate(mutation, {[camelCase(this.getClassName())]: params}),
      );
    }

    return this.hydrate(
      await this.mutate(mutation, params),
    );
  }

  public delete(deleteMutation) {
    // istanbul ignore else
    if (config().graphql) {
      return this.mutate(deleteMutation, {
        uuid: this.uuid,
      });
    }

    return this.mutate(deleteMutation, {
      id: this.id,
    }, 'delete');
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
        .finally(this.afterMutate.bind(this));
    }

    const resolvedUrl = await getUrl({method, url: mutationOrUrl, params});
    const resolvedMethod = await this.getMethod({method, url: resolvedUrl, params});

    return this.beforeMutate()
      .then(this.performSafeRequestREST.bind(this, resolvedUrl, params, resolvedMethod || method, null))
      .finally(this.afterMutate.bind(this));
  }

  public clone() {
    return clone(this);
  }

  protected async beforeMutate() {
    this.loading = true;
  }

  protected afterMutate() {
    this.loading = false;
  }
}
