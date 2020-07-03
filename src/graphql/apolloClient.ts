import { ApolloLink } from 'apollo-link';
import { PersistLink } from 'apollo-cache-instorage';
import { createApolloClient } from 'vue-cli-plugin-apollo/graphql-client';
import Pusher from 'pusher-js';
import PusherLink from './PusherLink';

Pusher.logToConsole = process.env.NODE_ENV !== 'production';

// Name of the localStorage item
const AUTH_TOKEN = 'accessToken';

// Http endpoint
const httpEndpoint = process.env.VUE_APP_GRAPHQL_HTTP || 'http://127.0.0.1:3000/graphql';

const pusherLink = new PusherLink({
  pusher: new Pusher(process.env.VUE_APP_PUSHER_KEY, {
    cluster: process.env.VUE_APP_PUSHER_CLUSTER,
    forceTLS: true,
    authEndpoint: `${process.env.VUE_APP_HTTP_ENDPOINT}/graphql/subscriptions/auth`,
    auth: {
      params: null,
      headers: {
        authorization: `Bearer ${localStorage.getItem(AUTH_TOKEN)}`,
      },
    },
  }),
});

const persistLink = new PersistLink();

// function shouldPersist(_, dataId, data?: { __persist: boolean } & IdValue) {
//   if (data?.id?.includes?.('password')) return false;
//
//   return dataId === 'ROOT_QUERY' || (!data || !!data.__persist)
// }

// const cache = new InStorageCache({
//   dataIdFromObject: result => (result.__typename && result.uuid ? `${result.__typename}:${result.uuid}` : defaultDataIdFromObject(result)),
//   fragmentMatcher: new CustomHeuristicFragmentMatcher(),
//   // addPersistField: true,
//   storage: window.localStorage,
//   prefix: 'vue-oop-apollo',
//   shouldPersist,
// });

const link = ApolloLink.from([
  persistLink,
  pusherLink,
])

const { apolloClient, wsClient } = createApolloClient({
  httpEndpoint,
  tokenName: AUTH_TOKEN,
  link,
  connectToDevTools: process.env.NODE_ENV !== 'production',
  apollo: {
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'ignore',
      },
      query: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all',
      },
    }
  }
  // cache,
});

export {
  apolloClient,
  wsClient,
}
