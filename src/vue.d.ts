import { ApolloProvider } from "vue-apollo/types/apollo-provider";
import { DollarApollo } from "vue-apollo/types/vue-apollo";
import Registry from './Registry';

declare module 'vue/types/vue' {
  interface Vue {
    $registry: Registry;
    $apolloProvider: ApolloProvider
    $apollo: DollarApollo<this>
  }
}
