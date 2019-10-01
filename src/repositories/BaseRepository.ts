import {GraphQLError} from 'graphql';
import InvalidArgumentException from '../models/Exceptions/InvalidArgumentException';
import Collection from '../models/Collection';
import {config, performSafeRequestREST, performSafeRequestGraphql} from '@/utils';
import UnexpectedException from '@/models/Exceptions/UnexpectedException';
import ValidationException from '@/models/Exceptions/ValidationException';
import UnauthorizedException from '@/models/Exceptions/UnauthorizedException';

type KeyValueString = { [key: string]: string };

type UrlResolver = (params?: KeyValueString, collection?: boolean) => string;

type ResolvingRESTOptions = {
  method: string;
  url: string | UrlResolver;
  params: unknown;
}

type PropertyFunction<T> = () => T;

type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

type GraphQLErrorType = {
  extensions: {
    errorCode: number,
    message: string,
  },
}

type GraphQLErrorBag = {
  graphQLErrors: GraphQLErrorType[];
}

export type EventType = {
  type: string;
  target: unknown;
  payload?: unknown;
};

type EventSubscriber = {
  fired?: boolean;
  immediate: boolean;
  callback: (event: EventType) => void;
};

type EventListeners = {
  [key: string]: EventSubscriber[];
}

export default abstract class BaseRepository<M = unknown> {
  /**
   * Existing/Loading flag
   *
   * @type {boolean}
   * @private
   */
  private _exists = false;

  private _eventListeners: EventListeners = {};

  private _firedEvents: EventType[] = [];

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
  public queryParams: KeyValueString = {};

  public subscriptions() {
  }

  /**
   * Defines a model which the repository items to be hydrated by
   *
   * @type {BaseModel|function}
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
   * Constructs a repository with optionally predefined items.
   * It uses an async early binding concept to avoid blocking a thread.
   *
   * @param {object|array|Collection} array
   */
  protected constructor(array: Collection<M> | M[] = null) {
    if (array instanceof Collection) {
      this.dataset = array;
    } else if (Array.isArray(array)) {
      this.dataset = this.fromArray(array);
    }

    this.dispatchEvent('construct');
  }

  get className() {
    return this.constructor.name;
  }

  get displayClassName() {
    return this.className.toLowerCase();
  }

  get exists() {
    return this._exists;
  }

  get defaultMethod() {
    return config().graphql ? 'post' : 'get';
  }

  //@ts-ignore
  public getMethod(opts: ResolvingRESTOptions): string {
    return null;
  }

  protected async getUrl(_opts: ResolvingRESTOptions) {
    const {url, params} = _opts;
    let resolvedUrl = url;

    if (typeof url === 'function') {
      resolvedUrl = await url();
    } else {
      resolvedUrl = (resolvedUrl as string).replace(
        /:([^\s\/]+)/gi,
        (_, m) => {
          const param = params[m];
          const hasParam = param !== undefined;

          if (hasParam) {
            delete params[m];
            return param;
          }

          return m;
        },
      );
    }

    return resolvedUrl;
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

    this.dispatchEvent('onError');

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
   * @returns {Promise<Collection|BaseModel>}
   */
  public async query(queryOrUrl: string | UrlResolver, params: KeyValueString = {}, collection = false, method: HttpMethod = this.defaultMethod) {
    if (config().graphql) {
      let doc = queryOrUrl;

      if (typeof queryOrUrl === 'function') {
        doc = await queryOrUrl();
      }

      return this.beforeQuery()
        .then(this.performSafeRequestGraphql.bind(this, doc, params, this.subscriptions()))
        .then(this.processResponse.bind(this, collection))
        .catch(this.onError)
        .finally(this.afterQuery.bind(this));
    }

    this.method = method;

    const resolvedUrl = await this.getUrl({method, url: queryOrUrl, params});
    const resolvedMethod = await this.getMethod({method, url: resolvedUrl, params});

    return this.beforeQuery()
      .then(this.performSafeRequestREST.bind(this, resolvedUrl, params || this.queryParams, resolvedMethod || method))
      .then(this.processResponse.bind(this, collection))
      .catch(this.onError.bind(this))
      .finally(this.afterQuery.bind(this));
  }

  public async beforeQuery() {
    this.loading = true;

    this.dispatchEvent('beforeQuery');
  }

  public async processResponse(collection, data) {
    return collection ? this.fromArray(data) : data;
  }

  public async afterQuery() {
    this.loading = false;

    this.dispatchEvent('afterQuery');
  }

  public on(type, callback: (event: EventType) => void, {immediate = false}) {
    if (!(type in this._eventListeners)) {
      this._eventListeners[type] = [];
    }
    this._eventListeners[type].push({
      callback,
      immediate,
    });

    const event = this.createEvent(type);

    if (this._firedEvents[type]) {
      callback(this._firedEvents[type]);
      return;
    }

    this._eventListeners[type]
      .slice()
      .filter(subscriber => subscriber.fired && subscriber.immediate)
      .forEach((subscriber) => subscriber.callback(event))
    ;
  }

  private createEvent(type, payload?): EventType {
    return {
      type,
      target: this,
      payload,
    };
  }

  private dispatchEvent(type: string, payload?: unknown) {
    const event = this.createEvent(type, payload);

    this._firedEvents[type] = event;

    if (!(event.type in this._eventListeners)) {
      return true;
    }
    const subscribers = this._eventListeners[event.type].slice();

    for (let i = 0, l = subscribers.length; i < l; i++) {
      const subscriber = subscribers[i];
      subscriber.fired = true;
      subscriber.callback.call(this, event);
    }
    return true;
  };

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
   * @returns {Promise<BaseModel>}
   */
  public async one(id) {
    const params = config().graphql ? {uuid: id} : {id};
    const data = await this.query(this.fetchOneQuery, params);
    //@ts-ignore
    let Model = this.model;
    if (typeof Model === 'function') {
      Model = Model(data);
    }

    //@ts-ignore
    return new Model(data);
  }

  public static one(params) {
    return Reflect.construct(this, []).one(params);
  }
}
