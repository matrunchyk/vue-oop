import { ApolloLink } from 'apollo-link';
import { defaultDataIdFromObject } from 'apollo-cache-inmemory';
import { InStorageCache, PersistLink } from 'apollo-cache-instorage';
import { persistCache } from 'apollo-cache-persist';
import { createApolloClient } from 'vue-cli-plugin-apollo/graphql-client';
import Pusher from 'pusher-js';
import CustomHeuristicFragmentMatcher from './CustomHeuristicFragmentMatcher';
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

function shouldPersist(_, dataId, data) {
  console.log(_, dataId, data);
  return dataId === 'ROOT_QUERY' || (!data || !!data.__persist)
}

const cache = new InStorageCache({
  // @ts-ignore
  dataIdFromObject: result => (result.__typename && result.uuid ? `${result.__typename}:${result.uuid}` : defaultDataIdFromObject(result)),
  fragmentMatcher: new CustomHeuristicFragmentMatcher(),
  addPersistField: true,
  shouldPersist,
})

// noinspection JSIgnoredPromiseFromCall
persistCache({
  cache,
  // @ts-ignore
  storage: window.localStorage,
  debug: true,
});

const link = ApolloLink.from([
  persistLink,
  pusherLink,
])

const { apolloClient, wsClient } = createApolloClient({
  httpEndpoint,
  tokenName: AUTH_TOKEN,
  link,
  connectToDevTools: process.env.NODE_ENV !== 'production',
  cache,
});

export {
  apolloClient,
  wsClient,
}
