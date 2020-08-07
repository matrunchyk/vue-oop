import { ApolloLink } from 'apollo-link';
import { PersistLink } from 'apollo-cache-instorage';
import { createApolloClient } from 'vue-cli-plugin-apollo/graphql-client';
import Pusher from 'pusher-js';

Pusher.logToConsole = process.env.NODE_ENV !== 'production';

// Name of the localStorage item
const AUTH_TOKEN = 'accessToken';

// Http endpoint
const httpEndpoint = process.env.VUE_APP_GRAPHQL_HTTP || 'http://127.0.0.1:3000/graphql';

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
])

const { apolloClient, wsClient } = createApolloClient({
  httpEndpoint,
  tokenName: AUTH_TOKEN,
  link,
  connectToDevTools: process.env.NODE_ENV !== 'production',
  // cache,
});

export {
  apolloClient,
  wsClient,
}
