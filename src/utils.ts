import axios from 'axios';
import {parse} from 'graphql';
import Container from '@/Container';
import {Config} from '@/typings';

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

export async function performSafeRequestREST(url, params = {}, method = 'get') {
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

  return axios[method.toLowerCase()](fullUrl, body).then(status).then(json);
}

/**
 * Performs GQL query request
 *
 * @param {object} query
 * @param {object} variables
 * @param {string} queryName
 * @param {array} subscribeToMore
 * @returns {Promise<any>}
 */
export function performGqlQuery(query, variables, queryName, subscribeToMore) {
  return new Promise((result, error) => containerGet('Vue').$apollo.addSmartQuery(queryName, {
    manual: true,
    query,
    subscribeToMore,
    variables,
    result,
    error,
  }));
}

/**
 * Performs GQL mutation request
 *
 * @param {object} mutation
 * @param {object} variables
 * @returns {Promise<any>}
 */
export function performGqlMutation(mutation, variables) {
  return new Promise((resolve, reject) => vm.$apollo.mutate({
    update(cache, result) {
      return resolve(result);
    },
    // optimisticResponse: {],
    // refetchQueries: [{}],
    mutation,
    variables,
  }).catch(reject));
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
export async function performSafeRequestGraphql(query, variables = {}) {
  const queryName = query.definitions.map(def => def.name).find(def => def.kind === 'Name').value;
  const operation = query.definitions.find(def => def.kind === 'OperationDefinition').operation === 'query'
    ? performGqlQuery
    : performGqlMutation;

  return operation(query, stripTypename(variables), queryName).then(({data}) => data[queryName]);
}

export function containerGet(key: string) {
  return Container.getInstance().get(key);
}

export function config() {
  return containerGet('Config') as Config;
}

export function getParsedSchema() {
  return parse(schema);
}

export function getSchemaTypeFields(typeName) {
  return getParsedSchema()
    .definitions
    .find(def => def.name.value === typeName)
    .fields
    .map(f => f.name.value);
}

export function getSchemaMutation(mutationName) {
  return getParsedSchema()
    .definitions
    .find(def => def.name.value === 'Mutation')
    .fields
    .find(def => def.name.value === mutationName);
}

export function getSchemaQuery(queryName) {
  return getParsedSchema()
    .definitions
    .find(def => def.name.value === 'Query')
    .fields
    .find(def => def.name.value === queryName);
}
