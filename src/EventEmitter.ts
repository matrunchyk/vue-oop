export type EventType = {
  type: string;
  target: unknown;
  payload?: unknown;
};

type EventSubscriber = {
  fired?: boolean;
  immediate: boolean;
  callback: (event: EventType) => void;
};

type EventListeners = {
  [key: string]: EventSubscriber[];
}

export default abstract class EventEmitter {
  private _eventListeners: EventListeners = {};

  private _firedEvents: EventType[] = [];

  public emit(type: string, payload?: unknown) {
    const event = this.createEvent(type, payload);

    this._firedEvents[type] = event;

    if (!(event.type in this._eventListeners)) {
      return true;
    }
    const subscribers = this._eventListeners[event.type].slice();

    for (let i = 0, l = subscribers.length; i < l; i++) {
      const subscriber = subscribers[i];
      subscriber.fired = true;
      subscriber.callback.call(this, event);
    }
    return true;
  };

  on(type, callback: (event: EventType) => void, config = {immediate: false}) {
    if (!(type in this._eventListeners)) {
      this._eventListeners[type] = [];
    }
    this._eventListeners[type].push({
      callback,
      immediate: config.immediate,
    });

    const event = this.createEvent(type);

    if (this._firedEvents[type]) {
      callback(this._firedEvents[type]);
      return;
    }

    this._eventListeners[type]
      .slice()
      .filter(subscriber => subscriber.fired && subscriber.immediate)
      .forEach((subscriber) => subscriber.callback(event))
    ;
  }

  /**
   * @todo Implement the ideas below from https://basarat.gitbooks.io/typescript/content/docs/tips/typed-event.html
   */
  once(): void {
  }

  off(): void {
  }

  pipe() {
  }

  private createEvent(type, payload?): EventType {
    return {
      type,
      target: this,
      payload,
    };
  }
}
