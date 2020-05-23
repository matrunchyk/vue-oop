/*!
 * VueOOP
 * (c) 2017-2020 Serhii Matrunchyk
 * Released under the MIT License.
 */
import _Vue from 'vue';
import Model from './models/Model';
import Repository from './repositories/Repository';
import Registry from './Registry';
import * as Utils from './utils';
import { DocumentNode, buildClientSchema, printSchema } from 'graphql';
import { parse } from 'graphql/language/parser';
import { fetchIntrospectionSchema } from './utils';

const registry = Registry.getInstance();

registry.set('Model', Model);
registry.set('Repository', Repository);

export interface IVueOOPOptions {
  rest?: boolean;
  graphql?: boolean;
  schema?: DocumentNode;
  schemaUrl?: string;
  debug?: boolean;
}

// istanbul ignore next
export class VueOOPOptions implements IVueOOPOptions {
  /**
   * Use REST plugin.
   *
   * @type {boolean}
   */
  rest = true;

  /**
   * Use GraphQL plugin
   *
   * @type {boolean}
   */
  graphql = false;

  /**
   * GraphQL Schema to parse for update variables guesser.
   *
   * @type {null}
   */
  schema: DocumentNode = null;

  /**
   * URL to fetch introspection GraphQL Schema from.
   *
   * @type {null|string}
   */
  schemaUrl: string = null;

  /**
   * Debug mode
   *
   * @type {boolean}
   */
  debug = false;
}

async function VueOOP<VueOOPOptions>(Vue: typeof _Vue, options?: VueOOPOptions): Promise<void> {
  const config = {
    rest: true,
    graphql: false,
    schema: null,
    schemaUrl: null,
    debug: false,
    ...options,
  } as IVueOOPOptions;

  if (config.schemaUrl && config.debug) {
    config.schema = await fetchIntrospectionSchema(config.schemaUrl)
      .then(buildClientSchema.bind(null))
      .then(printSchema.bind(null))
      .then(parse.bind(null));
  }

  registry.set('Config', config);

  Vue.prototype.$registry = registry;

  Vue.mixin({
    beforeCreate() {
      // istanbul ignore else
      // If a non-root component, or there's already the Vue instance set in Registry,
      // return, as we do need a Vue instance with $apollo in it.
      if (this.$parent || registry.has('Vue')) return;

      registry.set('Vue', this);
    },
  });
}

export default VueOOP;
export { default as Registry } from './Registry';
export { default as Repository } from './repositories/Repository';
export { default as Model } from './models/Model';
export { default as Collection } from './models/Collection';
export { default as BaseException } from './models/Exceptions/BaseException';
export { default as InvalidArgumentException } from './models/Exceptions/InvalidArgumentException';
export { default as UnexpectedException } from './models/Exceptions/UnexpectedException';
export { default as UnauthorizedException } from './models/Exceptions/UnauthorizedException';
export { default as ValidationException } from './models/Exceptions/ValidationException';
export { Utils, VueOOP };

