import { ApolloQueryResult } from 'apollo-client';
import { FetchResult } from 'apollo-link';
import { ObjectTypeDefinitionNode, DocumentNode, IntrospectionQuery, OperationDefinitionNode } from 'graphql';
import { Config, KeyValueUnknown, ResolvingRESTOptions } from './typings';
import { getIntrospectionQuery } from 'graphql';
import Registry from './Registry';
import UnexpectedException from './models/Exceptions/UnexpectedException';
import { apolloClient } from './graphql/apolloClient';
import { QueryManager } from 'apollo-client/core/QueryManager';

export const defaultRESTHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json;charset=UTF-8',
};

export function getApolloManager(): QueryManager<unknown> {
  return apolloClient.queryManager;
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

export function status(res) {
  const response = res.hasOwnProperty('status') ? res : res.response;
  if (response.status && response.status >= 200 && response.status < 300) {
    return Promise.resolve(response);
  } else {
    if (response.data && response.data.errors) {
      const errors = (response.data.errors || []).map((err) => err.defaultMessage).join(', ');
      return Promise.reject(new Error(errors));
    }
    return Promise.reject(new Error(response.data.message));
  }
}

export function json(response) {
  if (response && response.data) {
    return response.data;
  } else {
    return null;
  }
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
  }).then(status).then(json);
}

/**
 * Performs GQL query request
 *
 * @param {object} query
 * @param {object} variables
 * @returns {Promise<any>}
 */
export function performGqlQuery(query, variables) {
  return getApolloManager().query({
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
  return getApolloManager().mutate({
    mutation,
    variables,
  });
}

/**
 * Removes __typename from object recursively
 */
export function stripTypename(obj) {
  return JSON.parse(JSON.stringify(obj, (k, v) => (k === '__typename' ? undefined : v)));
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

  return performGqlMutation(query, stripTypename(variables))
    .then((value: FetchResult<unknown>) => value.data[queryName]);
}

export function registryGet(key: string): unknown {
  return Registry.getInstance().get(key);
}

export function config(): Config {
  return registryGet('Config');
}

export async function getParsedSchema(): Promise<DocumentNode> {
  const schema = await config().schema;

  if (!schema) {
    throw new UnexpectedException('Configuration error: \'schema\' must be passed as a config key, e.g\n\nimport schema from \'raw-loader!@/../schema.graphql\';\n\n//...\n\nVue.use(VueOOP, {\n  //...,\n  schema,\n})\n\n;');
  }

  return schema;
}

export async function getSchemaTypeFields(typeName): Promise<string[]> {
  return ((await getParsedSchema())
    .definitions as ReadonlyArray<ObjectTypeDefinitionNode>)
    .find(def => (def.name || {}).value === typeName)
    .fields
    .map(f => f.name.value);
}

export async function getSchemaMutation(mutationName) {
  return ((await getParsedSchema())
    .definitions as ReadonlyArray<ObjectTypeDefinitionNode>)
    .find(def => (def.name || {}).value === 'Mutation')
    .fields
    .find(def => (def.name || {}).value === mutationName)
}

export async function getSchemaQuery(queryName) {
  return ((await getParsedSchema())
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
  return JSON.parse(JSON.stringify(obj, (k, v) => (k === 'loading' ? undefined : v)));
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
