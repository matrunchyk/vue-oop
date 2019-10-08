/*!
 * VueOOP.js v0.2.1
 * (c) 2017-2019 Serhii Matrunchyk
 * Released under the MIT License.
 */
import _Vue from 'vue';
import Model from './models/Model';
import Repository from './repositories/Repository';
import Container from './Container';
import * as Utils from './utils';

const container = Container.getInstance();

container.set('Model', Model);
container.set('Repository', Repository);

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
  schema: string = null;

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

  container.set('Config', config);

  Vue.prototype.$container = container;

  Vue.mixin({
    created() {
      if (container.has('Vue')) return;

      container.set('Vue', this);
    },
  });
}

export default VueOOP;
export {default as Container} from './Container';
export {default as Repository} from './repositories/Repository';
export {default as Model} from './models/Model';
export {default as Collection} from './models/Collection';
export {default as BaseException} from './models/Exceptions/BaseException';
export {default as InvalidArgumentException} from './models/Exceptions/InvalidArgumentException';
export {default as UnexpectedException} from './models/Exceptions/UnexpectedException';
export {default as UnauthorizedException} from './models/Exceptions/UnauthorizedException';
export {default as ValidationException} from './models/Exceptions/ValidationException';
export {Utils, VueOOP};

