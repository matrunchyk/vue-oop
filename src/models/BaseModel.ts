import camelCase from 'lodash.camelcase';
import clone from 'clone';
import uuid from 'uuid';
import {performSafeRequestREST, performSafeRequestGraphql, config, getSchemaTypeFields} from '@/utils';
import Collection from './Collection';

type KeyValueString = { [key: string]: string };

type UrlResolver = (params?: KeyValueString, collection?: boolean) => string;

type ResolvingRESTOptions = {
  method: string;
  url: string | UrlResolver;
  params: unknown;
}

export default abstract class BaseModel {
  public id: string;

  public uuid: string = uuid.v4();

  public loading = false;

  public children: unknown;

  protected submittableProps = [];

  protected __typename: string | undefined;

  private performSafeRequestGraphql = performSafeRequestGraphql;

  private performSafeRequestREST = performSafeRequestREST;

  protected constructor(props) {
    //@ts-ignore
    if (typeof this.defaults === 'function') {
      console.warn('Deprecated: Use property variables or constructor instead. `defaults` will be removed in the next versions.');
      //@ts-ignore
      Object.assign(this, this.defaults(), props);
    }

    Object.assign(this, props);

    //@ts-ignore
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

  get data(): BaseModel {
    return this;
  }

  public exists() {
    // REST: If id exists, it means it came from the backend
    // GraphQL: If __typename exists, it means it came from the backend
    return !!this.id || (config().graphql && !!this.__typename);
  }

  // METHODS
  /**
   * Hydrates object to model
   *
   * @param item
   * @returns {BaseModel}
   */
  protected hydrate(item) {
    //@ts-ignore
    return new this.constructor(item);
  }

  protected getMethod(_opts: ResolvingRESTOptions) {
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
    return this.toCollection().only(this.getInputFields()).all();
  }

  /**
   * Returns an array of properties to be submitted based on `submittableProps`
   *
   * @param {array<string>} props
   * @return {array<string>}
   */
  public toSubmittable(props = this.submittableProps): unknown {
    if (!props) return [];
    if (Array.isArray(props) && !props.length) return [];

    return this.toCollection().only(props).all();
  }

  public async create(mutation, params) {
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
  public async mutate(mutationOrUrl, params, method = 'post') {
    if (config().graphql) {
      return this.beforeMutate()
        .then(this.performSafeRequestGraphql.bind(this, mutationOrUrl, params))
        .finally(this.afterMutate.bind(this));
    }

    const resolvedUrl = this.getUrl({method, url: mutationOrUrl, params});
    const resolvedMethod = this.getMethod({method, url: mutationOrUrl, params});

    return this.beforeMutate()
      .then(this.performSafeRequestREST.bind(this, resolvedUrl, params, resolvedMethod || method))
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
