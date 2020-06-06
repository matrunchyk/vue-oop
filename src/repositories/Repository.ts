import { GraphQLError, DocumentNode } from 'graphql';
import InvalidArgumentException from '../models/Exceptions/InvalidArgumentException';
import Collection from '../models/Collection';
// noinspection ES6PreferShortImport
import { getUrl, config, performSafeRequestREST, performSafeRequestGraphql, isClass } from '../utils';
import UnexpectedException from '../models/Exceptions/UnexpectedException';
import ValidationException from '../models/Exceptions/ValidationException';
import UnauthorizedException from '../models/Exceptions/UnauthorizedException';
import Model from '../models/Model';
import EventEmitter from '../EventEmitter';
// noinspection ES6PreferShortImport
import {
  GraphQLErrorBag,
  PropertyFunction,
  ResolvingRESTOptions,
  UrlResolver,
  HttpMethod,
  KeyValueUnknown,
} from '../typings';

export default abstract class Repository<M = unknown> extends EventEmitter {
  /**
   * Existing/Loading flag
   *
   * @type {boolean}
   * @private
   */
  private _exists = false;

  protected performSafeRequestGraphql = performSafeRequestGraphql;

  protected performSafeRequestREST = performSafeRequestREST;

  /**
   * Repository loading flag
   *
   * @type {boolean}
   */
  public loading = true;

  public lastError: Error | GraphQLErrorBag = null;

  /**
   * Query method
   *
   * @type {string}
   */
  public method = '';

  /**
   * Hold the collection of the items retrieved from the backend
   *
   * @type {Collection}
   */
  public dataset: Collection<M> = new Collection();

  /**
   * Hold query parameters to be used by .many() call
   *
   * @type {object}
   */
  public queryParams: KeyValueUnknown = {};

  public subscriptions(): unknown[] {
    return [];
  }

  /**
   * Defines a model which the repository items to be hydrated by
   *
   * @type {Model|function}
   * @throws {InvalidArgumentException}
   */
  public model: M | unknown = function undefinedMethod(data) {
    return Object(data);
  };

  /**
   * Defines the 'Fetch One' query url
   *
   * @type {string|function}
   * @throws {InvalidArgumentException}
   */
  public abstract fetchOneQuery: string | PropertyFunction<string>;

  /**
   * Defines the 'fetch multiple items' query url
   *
   * @type {string|function}
   * @throws {InvalidArgumentException}
   */
  public abstract fetchManyQuery: string | PropertyFunction<string>;

  /**
   * Constructs a repository with optionally predefined dataset.
   *
   * @param {object|array|Collection} array
   */
  public constructor(array: Collection<M> | M[] = null) {
    super();
    if (array instanceof Collection) {
      this.dataset = array;
    } else if (Array.isArray(array)) {
      this.dataset = this.fromArray(array);
    }

    this.emit('construct');
  }

  get className() {
    return this.constructor.name;
  }

  // noinspection JSUnusedGlobalSymbols
  get displayClassName() {
    return this.className.toLowerCase();
  }

  get defaultMethod() {
    return config().graphql ? 'post' : 'get';
  }

  public exists() {
    return this._exists;
  }

  // @ts-ignore
  // noinspection JSUnusedLocalSymbols
  public getMethod(opts: ResolvingRESTOptions): string {
    return null;
  }

  public fromArray(array: unknown[], skipEmpty = true) {
    // return new Collection(array.filter(i => i || !skipEmpty).map(i => (<typeof M>(new this.model(i))).markExists()));
    const filtered = array.filter(i => i || !skipEmpty);
    const mapped = filtered.map((i) => {
      let model = this.model;

      if (typeof this.model === 'function' && !isClass(this.model as CallableFunction)) {
        model = this.model(i);
      }

      // @ts-ignore
      return new model(i);
    }) as M[];

    return new Collection<M>(mapped);
  }

  public static fromArray<T, R extends Repository>(array: T[], skipEmpty = true): R {
    // @ts-ignore
    return (<typeof Repository>(new this)).fromArray(array, skipEmpty);
  }

  /**
   * Handles an error
   *
   * @param {Error | GraphQLErrorBag} e
   */
  protected onError(e: Error | GraphQLErrorBag) {
    this.lastError = e;

    this.emit('onError');

    // istanbul ignore else
    if (config().graphql && (e instanceof GraphQLError)) {
      const {
        graphQLErrors: [{ extensions: { errorCode, message } }] = [
          {
            extensions: {
              errorCode: 500,
              message: 'Server Error',
            },
          },
        ],
      } = (e as unknown) as GraphQLErrorBag;

      // istanbul ignore else
      if (errorCode === 401) {
        throw new UnauthorizedException(message);
      }

      // istanbul ignore else
      if (errorCode === 422) {
        throw new ValidationException(message);
      }

      throw new UnexpectedException(e.message);
    }
  }

  /**
   * Performs an XMLHttpRequest query
   *
   * @param {string|function} queryOrUrl
   * @param {object} params
   * @param {boolean} collection
   * @param {string} method
   * @returns {Promise<Collection|Model>}
   */
  public async query(queryOrUrl: string | UrlResolver | DocumentNode, params: unknown = {}, collection = false, method: HttpMethod = this.defaultMethod) {
    // istanbul ignore else
    if (config().graphql) {
      let doc = queryOrUrl as unknown as DocumentNode;

      // istanbul ignore else
      if (typeof queryOrUrl === 'function') {
        doc = await queryOrUrl() as unknown as DocumentNode;
      }

      return this.beforeQuery()
        .then(this.performSafeRequestGraphql.bind(this, doc, params, this.subscriptions()))
        .then(this.processResponse.bind(this, collection))
        .catch(this.onError.bind(this))
        .finally(this.afterQuery.bind(this));
    }

    this.method = method;

    const resolvedUrl = await getUrl({ method, url: queryOrUrl as string, params });
    const resolvedMethod = await this.getMethod({ method, url: resolvedUrl, params });

    return this.beforeQuery()
      .then(this.performSafeRequestREST.bind(this, resolvedUrl, params || this.queryParams, resolvedMethod || method, null))
      .then(this.processResponse.bind(this, collection))
      .catch(this.onError.bind(this))
      .finally(this.afterQuery.bind(this));
  }

  public async beforeQuery() {
    this.loading = true;

    this.emit('beforeQuery');
  }

  public async processResponse(collection, data) {
    return collection ? this.fromArray(data) : data;
  }

  public async afterQuery() {
    this.loading = false;

    this.emit('afterQuery');
  }

  /**
   * Fetches multiple models
   *
   * @param params
   * @returns {Promise<Collection>}
   */
  public async many(params = null) {
    // istanbul ignore else
    if (!this.fetchManyQuery) {
      throw new InvalidArgumentException('fetchAllQuery is not set for this repository.');
    }
    this.dataset = await this.query(this.fetchManyQuery, params || this.queryParams, true);
    this._exists = true;
    return this.dataset;
  }

  /**
   * Fetches a single model
   *
   * @param {any} id
   * @returns {Promise<Model>}
   */
  public async one(id?: unknown) {
    const params = config().graphql ? { uuid: id } : { id };
    const data = await this.query(this.fetchOneQuery, params);
    //@ts-ignore
    let ModelFactory = this.model;
    // Check if ModelFactory is NOT inherit Model
    // istanbul ignore else
    if (typeof ModelFactory === 'function' && !(ModelFactory.prototype instanceof Model)) {
      ModelFactory = ModelFactory(data);
    }

    //@ts-ignore
    return new ModelFactory(data);
  }

  public static one(params?: unknown) {
    return Reflect.construct(this, []).one(params);
  }
}
