import { createApolloClient } from 'vue-cli-plugin-apollo/graphql-client';

const AUTH_TOKEN = 'accessToken';
const httpEndpoint = process.env.VUE_APP_GRAPHQL_HTTP;
const wsEndpoint = process.env.VUE_APP_GRAPHQL_WS;
let apolloClient;
let wsClient;

if (httpEndpoint) {
  ({apolloClient, wsClient} = createApolloClient({
    httpEndpoint,
    ...(wsEndpoint ? {
      wsEndpoint,
    } : {}),
    websocketsOnly: false,
    tokenName: AUTH_TOKEN,
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
  }));

  if (wsClient) {
    apolloClient.wsClient = wsClient;
  }
}

export {
  apolloClient,
  wsClient,
}
