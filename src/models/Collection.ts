import { Collection as BaseCollection } from 'collect.js';

export default class Collection<T> extends BaseCollection<T> {
  constructor(items?: T[] | T) {
    // @ts-ignore
    super(items);
  }
}
