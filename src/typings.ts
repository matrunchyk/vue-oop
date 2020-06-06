import { DocumentNode } from "graphql";

export type Config = {
  graphql?: boolean;
  rest?: boolean;
  debug?: boolean;
  schema?: DocumentNode;
  schemaUrl?: string;
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

