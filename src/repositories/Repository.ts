import {GraphQLError, DocumentNode} from 'graphql';
import InvalidArgumentException from '../models/Exceptions/InvalidArgumentException';
import Collection from '../models/Collection';
import {getUrl, config, performSafeRequestREST, performSafeRequestGraphql} from '../utils';
import UnexpectedException from '../models/Exceptions/UnexpectedException';
import ValidationException from '../models/Exceptions/ValidationException';
import UnauthorizedException from '../models/Exceptions/UnauthorizedException';
import Model from '../models/Model';
import EventEmitter from '../EventEmitter';
import {
  GraphQLErrorBag,
  KeyValueString,
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
  protected constructor(array: Collection<M> | M[] = null) {
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

  get displayClassName() {
    return this.className.toLowerCase();
  }

  get defaultMethod() {
    return config().graphql ? 'post' : 'get';
  }

  public exists() {
    return this._exists;
  }

  //@ts-ignore
  public getMethod(opts: ResolvingRESTOptions): string {
    return null;
  }

  public fromArray(array: unknown[], skipEmpty = true) {
    //@ts-ignore
    return new Collection(array.filter(i => i || !skipEmpty).map(i => new this.model(i)));
  }

  /**
   * Handles an error
   *
   * @param {Error | GraphQLErrorBag} e
   */
  protected onError(e: Error | GraphQLErrorBag) {
    this.lastError = e;

    this.emit('onError');

    if (config().graphql && (e instanceof GraphQLError)) {
      const {
        graphQLErrors: [{extensions: {errorCode, message}}] = [
          {
            extensions: {
              errorCode: 500,
              message: 'Server Error',
            },
          },
        ],
      } = (e as unknown) as GraphQLErrorBag;

      if (errorCode === 401) {
        throw new UnauthorizedException(message);
      }

      if (errorCode === 422) {
        throw new ValidationException(message);
      }

      console.log('ERROR', errorCode, e);
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
  public async query(queryOrUrl: string | UrlResolver | DocumentNode, params: KeyValueString = {}, collection = false, method: HttpMethod = this.defaultMethod) {
    if (config().graphql) {
      let doc = queryOrUrl as unknown as DocumentNode;

      if (typeof queryOrUrl === 'function') {
        doc = await queryOrUrl() as unknown as DocumentNode;
      }

      return this.beforeQuery()
        .then(this.performSafeRequestGraphql.bind(this, doc, params, this.subscriptions()))
        .then(this.processResponse.bind(this, collection))
        .catch(this.onError)
        .finally(this.afterQuery.bind(this));
    }

    this.method = method;

    const resolvedUrl = await getUrl({method, url: queryOrUrl as string, params});
    const resolvedMethod = await this.getMethod({method, url: resolvedUrl, params});

    return this.beforeQuery()
      .then(this.performSafeRequestREST.bind(this, resolvedUrl, params || this.queryParams, resolvedMethod || method))
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
   * @param {number|string} id
   * @returns {Promise<Model>}
   */
  public async one(id) {
    const params = config().graphql ? {uuid: id} : {id};
    const data = await this.query(this.fetchOneQuery, params);
    //@ts-ignore
    let ModelFactory = this.model;
    // Check if ModelFactory is NOT inherit Model
    if (typeof ModelFactory === 'function' && !(ModelFactory.prototype instanceof Model)) {
      ModelFactory = ModelFactory(data);
    }

    //@ts-ignore
    return new ModelFactory(data);
  }

  public static one(params) {
    return Reflect.construct(this, []).one(params);
  }
}
