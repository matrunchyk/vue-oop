import VueApollo from 'vue-apollo';
import BaseModel from './models/BaseModel';
import BaseRepository from './repositories/BaseRepository';
import Container from './Container';
import {Config} from '@/typings';

const container = Container.getInstance();

container.set('BaseModel', BaseModel);
container.set('BaseRepository', BaseRepository);

const VueModel = {
  install(Vue, defaultConfig: Config = {}) {
    const apollo = new DollarApollo(this);
    const config = {
      rest: true,
      graphql: false,
      apollo,
      ...defaultConfig,
    };

    container.set('Vue', Vue);
    container.set('Config', config);

    Vue.prototype.container = container;
    return container;
  },
};

export default VueModel;
export {default as Container} from './Container';
export {default as BaseRepository} from './repositories/BaseRepository';
export {default as BaseModel} from './models/BaseModel';
export {default as Collection} from './models/Collection';
export {default as BaseException} from './models/Exceptions/BaseException';
export {default as InvalidArgumentException} from './models/Exceptions/InvalidArgumentException';
export {default as UnexpectedException} from './models/Exceptions/UnexpectedException';
