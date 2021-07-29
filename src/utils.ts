import ApolloClient, { ApolloQueryResult } from 'apollo-client';
import { FetchResult } from 'apollo-link';
import {
  ObjectTypeDefinitionNode,
  DocumentNode,
  IntrospectionQuery,
  OperationDefinitionNode,
  buildClientSchema,
  printSchema,
  getIntrospectionQuery
} from 'graphql';
import { parse } from 'graphql/language/parser';
import { IVueOOPOptions } from './index';
import { Config, KeyValueUnknown, ResolvingRESTOptions } from './typings';
import omitDeep from 'omit-deep-lodash';
import Registry from './Registry';
import UnexpectedException from './models/Exceptions/UnexpectedException';

export const defaultRESTHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json;charset=UTF-8',
};

export function getApolloClient(providerName = 'default'): ApolloClient<unknown> {
  // eslint-disable-next-line
  const makeApolloClients = require('./graphql/makeApolloClients');

  return config(providerName).apolloClient || makeApolloClients(providerName);
}

export function camelToKebab(input: string): string {
  return input.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

export function queryParams(params, camelToKebabActive = true) {
  const str: string[] = [];
  for (const paramsKey in params)
    if (params.hasOwnProperty(paramsKey) && (params[paramsKey] || params[paramsKey] === 0)) {
      const normalized = camelToKebabActive ? camelToKebab(encodeURIComponent(paramsKey)) : encodeURIComponent(paramsKey);
      str.push(`${normalized}=${encodeURIComponent(params[paramsKey])}`);
    }
  return str.join('&');
}

export async function performSafeRequestREST(url, params = {}, method = 'get', opts: KeyValueUnknown = {}) {
  let fullUrl = url;
  let body = {};

  if (method === 'get') {
    const queryEscaped = queryParams(params);

    if (queryEscaped) {
      fullUrl = `${fullUrl}?${queryEscaped}`;
    }
  } else {
    body = params;
  }

  return fetch(fullUrl, {
    method: method.toLowerCase(),
    headers: defaultRESTHeaders,
    body: JSON.stringify(body),
    ...opts,
  }).then(response => response.json());
}

/**
 * Performs GQL query request
 *
 * @param {object} query
 * @param {object} variables
 * @returns {Promise<any>}
 */
export function performGqlQuery(query, variables) {
  return getApolloClient().query({
    query,
    variables,
  });
}

/**
 * Performs GQL mutation request
 *
 * @param {object} mutation
 * @param {object} variables
 * @returns {Promise<any>}
 */
export function performGqlMutation(mutation, variables) {
  return getApolloClient().mutate({
    mutation,
    variables,
  });
}

/**
 * Perform GQL subscription request
 *
 * @param {object} subscription
 * @param {object} variables
 * @returns {Promise<any>}
 */
export async function performGqlSubscription(subscription, variables) {
  return getApolloClient().subscribe({
    query: subscription,
    variables,
  });
}

/**
 * Removes __typename from object recursively
 */
export function stripTypename<T>(obj: T) {
  return config().stripTypename ? config().stripTypename(obj) : stripTypenameDefault(obj);
}

/**
 * Removes __typename from object recursively
 */
export function stripTypenameDefault<T>(obj: T): Omit<T, "__typename"> {
  return omitDeep(obj, '__typename');
}

/**
 * Performs GQL query or mutation with error handling and loading status
 *
 * @param {object} query
 * @param {object} variables
 * @returns {Promise<*>}
 */
export async function performSafeRequestGraphql(query: DocumentNode, variables = {}) {
  const queryName = query.definitions.map(def => (<OperationDefinitionNode>def).name).find(def => def.kind === 'Name').value;
  const isQuery = (<OperationDefinitionNode>query.definitions.find(def => def.kind === 'OperationDefinition')).operation === 'query';
  if (isQuery) {
    return performGqlQuery(query, stripTypename(variables))
      .then((value: ApolloQueryResult<unknown>) => value.data[queryName]);
  }

  const isSubscription = (<OperationDefinitionNode>query.definitions.find(def => def.kind === 'OperationDefinition')).operation === 'subscription';
  if (isSubscription) {
    return performGqlSubscription(query, stripTypename(variables));
      // .then((value: ApolloQueryResult<unknown>) => value.data[queryName]);
  }

  return performGqlMutation(query, stripTypename(variables))
    .then((value: FetchResult<unknown>) => value.data[queryName]);
}

export function registryGet(key: string): unknown {
  return Registry.getInstance().get(key);
}

export function config(name = 'default'): Config {
  const defaultConfig = registryGet('Config') as IVueOOPOptions;

  if (name === 'default') {
    return defaultConfig;
  }

  return defaultConfig.providers.find(config => config.name === name);
}

export async function getParsedSchema(configName = 'default'): Promise<DocumentNode> {
  const configSchema = config(configName).schema;
  const configSchemaUrl = config(configName).schemaUrl;
  let schema = Registry.getInstance().get('schema') as DocumentNode | null;

  if (!schema && configSchema) {
    schema = configSchema;
  } else if (!schema && configSchemaUrl) {
    schema = await fetchIntrospectionSchema(configSchemaUrl)
      .then(buildClientSchema.bind(null))
      .then(printSchema.bind(null))
      .then(parse.bind(null));

    Registry.getInstance().set('schema', schema);
  }

  if (!schema) {
    throw new UnexpectedException('Configuration error: \'schema\' must be passed as a config key, e.g\n\nimport schema from \'raw-loader!@/../schema.graphql\';\n\n//...\n\nVue.use(VueOOP, {\n  //...,\n  schema,\n})\n\n;');
  }

  return schema;
}

export async function getSchemaTypeFields(typeName, configName = 'default'): Promise<string[]> {
  return ((await getParsedSchema(configName))
    .definitions as ReadonlyArray<ObjectTypeDefinitionNode>)
    .find(def => (def.name || {}).value === typeName)
    .fields
    .map(f => f.name.value);
}

export async function getSchemaMutation(mutationName, configName = 'default') {
  return ((await getParsedSchema(configName))
    .definitions as ReadonlyArray<ObjectTypeDefinitionNode>)
    .find(def => (def.name || {}).value === 'Mutation')
    .fields
    .find(def => (def.name || {}).value === mutationName)
}

export async function getSchemaQuery(queryName, configName = 'default') {
  return ((await getParsedSchema(configName))
    .definitions as ReadonlyArray<ObjectTypeDefinitionNode>)
    .find(def => (def.name || {}).value === 'Query')
    .fields
    .find(def => (def.name || {}).value === queryName);
}

export async function getUrl(_opts: ResolvingRESTOptions) {
  const { url, params } = _opts;
  let resolvedUrl = url;

  if (typeof url === 'function') {
    resolvedUrl = await url();
  } else {
    resolvedUrl = (resolvedUrl as string).replace(
      /:([^\s\/?&]+)/gi,
      (_, m) => {
        const param = params[m];
        const hasParam = param !== undefined;

        if (hasParam) {
          delete params[m];
          return param;
        }

        return m;
      },
    );
  }

  return resolvedUrl;
}
export function stripObject(obj) {
  return omitDeep(obj, 'loading');
}

export function fetchIntrospectionSchema(url: string): Promise<IntrospectionQuery> {
  const body = JSON.stringify({ query: getIntrospectionQuery() });

  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  })
    .then(res => res.json())
    .then(res => res.data);
}

export const isClass = (fn: CallableFunction): boolean => /^\s*class/.test(fn.toString());

export const isSubscription = (data) => data._subscriber;
