import { InMemoryCache, defaultDataIdFromObject } from 'apollo-cache-inmemory';
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

const cache = new InMemoryCache({
  // @ts-ignore
  dataIdFromObject: result => (result.__typename && result.uuid ? `${result.__typename}:${result.uuid}` : defaultDataIdFromObject(result)),
  fragmentMatcher: new CustomHeuristicFragmentMatcher(),
});

// noinspection JSIgnoredPromiseFromCall
persistCache({
  cache,
  // @ts-ignore
  storage: window.localStorage,
  debug: true,
});

const { apolloClient, wsClient } = createApolloClient({
  httpEndpoint,
  tokenName: AUTH_TOKEN,
  link: pusherLink,
  connectToDevTools: process.env.NODE_ENV !== 'production',
  cache,
});

export {
  apolloClient,
  wsClient,
}
