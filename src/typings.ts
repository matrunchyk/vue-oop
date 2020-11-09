import { DocumentNode } from "graphql";
import { ApolloClient } from 'vue-cli-plugin-apollo/graphql-client';

// eslint-disable-next-line @typescript-eslint/ban-types
export type Primitive = string | Function | number | boolean | symbol | undefined | null

export type DeepOmitHelper<T, K extends keyof T> = {
  [P in K]: // extra level of indirection needed to trigger homomorphic behavior
  T[P] extends infer TP ? // distribute over unions
    TP extends Primitive ? TP : // leave primitives and functions alone
      TP extends any[] ? DeepOmitArray<TP, K> : // Array special handling
        DeepOmit<TP, K>
    : never
}

export type DeepOmit<T, K> = T extends Primitive ? T : DeepOmitHelper<T,Exclude<keyof T, K>>

export type DeepOmitArray<T extends any[], K> = {
  [P in keyof T]: DeepOmit<T[P], K>
}

export type Config = {
  graphql?: boolean;
  rest?: boolean;
  debug?: boolean;
  schema?: DocumentNode;
  schemaUrl?: string;
  apolloClient?: ApolloClient;
  stripTypename?: <T>(obj: T) => DeepOmit<T, "__typename">;
}

export type KeyValueString = { [key: string]: string };

export type KeyValueUnknown = { [key: string]: unknown };

export type UrlResolver = (params?: KeyValueString, collection?: boolean) => string;

export type ResolvingRESTOptions = {
  method: string;
  url: string | UrlResolver;
  params: unknown;
}

export type PropertyFunction<T> = () => T;

export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

export type GraphQLErrorType = {
  extensions: {
    errorCode: number,
    message: string,
  },
}

export type GraphQLErrorBag = {
  graphQLErrors: GraphQLErrorType[];
}

export type EventType = {
  type: string;
  target: unknown;
  payload?: unknown;
};

export type EventSubscriber = {
  fired?: boolean;
  immediate: boolean;
  callback: (event: EventType) => void;
};

export type EventListeners = {
  [key: string]: EventSubscriber[];
}

