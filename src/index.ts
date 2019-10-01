import _Vue from 'vue';
import BaseModel from './models/BaseModel';
import BaseRepository from './repositories/BaseRepository';
import Container from './Container';
import * as Utils from './utils';

const container = Container.getInstance();

container.set('BaseModel', BaseModel);
container.set('BaseRepository', BaseRepository);

export class VueModelOptions {
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

function VueModel<VueModelOptions>(Vue: typeof _Vue, options?: VueModelOptions): void {
  const config = {
    rest: true,
    graphql: false,
    schema: null,
    debug: false,
    ...options,
  };

  container.set('Vue', Vue);
  container.set('Config', config);

  Vue.prototype.$container = container;
}

export default VueModel;
export {default as Container} from './Container';
export {default as BaseRepository} from './repositories/BaseRepository';
export {default as BaseModel} from './models/BaseModel';
export {default as Collection} from './models/Collection';
export {default as BaseException} from './models/Exceptions/BaseException';
export {default as InvalidArgumentException} from './models/Exceptions/InvalidArgumentException';
export {default as UnexpectedException} from './models/Exceptions/UnexpectedException';
export {default as UnauthorizedException} from './models/Exceptions/UnauthorizedException';
export {default as ValidationException} from './models/Exceptions/ValidationException';
export {Utils, VueModel};

