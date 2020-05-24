import { ApolloLink, FetchResult, Observable, Operation } from 'apollo-link';
import Pusher from 'pusher-js';

class PusherLink extends ApolloLink {
  private pusher: Pusher;

  constructor(options: any) {
    super();
    // Retain a handle to the Pusher client
    this.pusher = options.pusher;
  }

  request(operation: Operation, forward: (operation: Operation) => Observable<FetchResult>) {
    return new Observable(observer => {
      // Check the result of the operation
      forward(operation).subscribe({
        next: data => {
          // If the operation has the subscription extension, it's a subscription
          const subscriptionChannel = this._getChannel(
            { data, operation },
          );

          if (subscriptionChannel) {
            this._createSubscription(subscriptionChannel, observer);
          } else {
            // No subscription found in the response, pipe data through
            observer.next(data);
            observer.complete();
          }
        },
      });
    });
  }

  _getChannel({ data, operation }: { data: any, operation: any }) {
    return !!data.extensions
    && !!data.extensions.lighthouse_subscriptions
    && !!data.extensions.lighthouse_subscriptions.channels
      ? data.extensions.lighthouse_subscriptions.channels[operation.operationName]
      : null;
  }

  _createSubscription(subscriptionChannel: string, observer: any) {
    const pusherChannel = this.pusher.subscribe(subscriptionChannel);
    // Subscribe for more update

    pusherChannel.bind('lighthouse-subscription', (payload: any) => {
      if (!payload.more) {
        // This is the end, the server says to unsubscribe
        this.pusher.unsubscribe(subscriptionChannel);
        observer.complete();
      }
      const { result } = payload;

      if (result) {
        // Send the new response to listeners
        observer.next(result);
      }
    });
  }
}

export default PusherLink;
