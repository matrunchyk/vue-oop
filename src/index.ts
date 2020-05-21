/*!
 * VueOOP.js v0.2.1
 * (c) 2017-2019 Serhii Matrunchyk
 * Released under the MIT License.
 */
import _Vue from 'vue';
import Model from './models/Model';
import Repository from './repositories/Repository';
import Registry from './Registry';
import * as Utils from './utils';
import { DocumentNode } from "graphql";

const registry = Registry.getInstance();

registry.set('Model', Model);
registry.set('Repository', Repository);

// istanbul ignore next
export class VueOOPOptions {
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
   * Debug mode
   *
   * @type {boolean}
   */
  debug = false;
}

function VueOOP<VueOOPOptions>(Vue: typeof _Vue, options?: VueOOPOptions): void {
  const config = {
    rest: true,
    graphql: false,
    schema: null,
    debug: false,
    ...options,
  };

  registry.set('Config', config);

  Vue.prototype.$registry = registry;

  Vue.mixin({
    beforeCreate() {
      // istanbul ignore else
      // If a non-root component, or there's already the Vue instance set in Registry, or there's no $apollo yet,
      // return, as we do need a Vue instance with $apollo in it.
      if (this.$parent || !this.$apollo || registry.has('Vue')) return;

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

