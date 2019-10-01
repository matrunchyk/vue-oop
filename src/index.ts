import Vue, {PluginObject} from 'vue';
import BaseModel from './models/BaseModel';
import BaseRepository from './repositories/BaseRepository';
import Container from './Container';
import {Config} from '@/typings';

const container = Container.getInstance();

container.set('BaseModel', BaseModel);
container.set('BaseRepository', BaseRepository);

export default class VueModel implements PluginObject<Config> {
  [key: string]: any;

  install(pVue: typeof Vue, defaultConfig: Config = {}) {
    const config = {
      rest: true,
      graphql: false,
      ...defaultConfig,
    };

    container.set('Vue', pVue);
    container.set('Config', config);

    pVue.prototype.$container = container;
  }
};

export {default as Container} from './Container';
export {default as BaseRepository} from './repositories/BaseRepository';
export {default as BaseModel} from './models/BaseModel';
export {default as Collection} from './models/Collection';
export {default as BaseException} from './models/Exceptions/BaseException';
export {default as InvalidArgumentException} from './models/Exceptions/InvalidArgumentException';
export {default as UnexpectedException} from './models/Exceptions/UnexpectedException';
