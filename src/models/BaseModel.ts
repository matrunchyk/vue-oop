import clone from 'clone';
import uuid from 'uuid';
import {performSafeRequest} from '@/utils';
import Collection from './Collection';

type KeyValueString = { [key: string]: string };

type UrlResolver = (params: KeyValueString, collection: boolean) => string;

type ResolvingOptions = {
  method: string;
  url: string | UrlResolver;
  params: unknown;
}

export default abstract class BaseModel {
  id: string = uuid.v4();

  __typename: string | undefined;

  loading = false;

  submittableProps = [];

  children: unknown;

  protected constructor() {
  }

  get className() {
    return this.constructor.name;
  }

  get displayClassName() {
    return this.className.toLowerCase();
  }

  get data(): BaseModel {
    return this;
  }

  get exists() {
    // If id exists, it means it came from the backend
    return !!this.id || !!this.__typename;
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

  protected getMethod(_opts: ResolvingOptions) {
    return null;
  }

  public toCollection(skipEmpty = false) {
    return (new Collection(this)).filter(i => !!i || !skipEmpty);
  }

  public toArray(skipEmpty = false) {
    return this.toCollection(skipEmpty).all();
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
    return this.hydrate(
      await this.mutate(mutation, params),
    );
  }

  public delete(deleteMutation) {
    return this.mutate(deleteMutation, {
      id: this.id,
    }, 'delete');
  }

  // METHODS
  /**
   * Performs a GQL mutation
   *
   * @param {string|function} url
   * @param {object} params
   * @param {string} method
   * @returns {*|Promise<Array<any>>|void}
   */
  public async mutate(url, params, method = 'post') {
    let resolvedUrl = url;

    if (typeof url === 'function') {
      resolvedUrl = await url();
    } else {
      resolvedUrl = resolvedUrl.replace(
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

    const resolvedMethod = this.getMethod({method, url, params});

    return this.beforeMutate()
      .then(performSafeRequest.bind(this, resolvedUrl, params, resolvedMethod || method))
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
