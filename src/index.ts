/*!
 * VueOOP
 * (c) 2017-2020 Serhii Matrunchyk
 * Released under the MIT License.
 */
import _Vue from 'vue';
import Registry from './Registry';
import * as Utils from './utils';
import { DocumentNode } from 'graphql';

export interface IVueOOPOptions {
  rest?: boolean;
  graphql?: boolean;
  schema?: DocumentNode;
  schemaUrl?: string;
  debug?: boolean;
  createProvider?: () => unknown;
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

  createProvider?: () => unknown;
}

function VueOOP<VueOOPOptions>(Vue: typeof _Vue, options?: VueOOPOptions) {
  const config = {
    rest: true,
    graphql: false,
    schema: null,
    schemaUrl: null,
    debug: false,
    createProvider: null,
    ...options,
  } as IVueOOPOptions;

  const registry = Registry.getInstance();
  registry.set('Config', config);

  Vue.mixin({
    beforeCreate() {
      // istanbul ignore else
      // If there's already the Vue instance set in Registry,
      // return, as we do need a Vue instance with $apollo in it.
      if (registry.has('Vue')) return;

      registry.set('Vue', this.$root);
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

