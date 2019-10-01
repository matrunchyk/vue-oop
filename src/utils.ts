import axios from 'axios';
import {parse, ObjectTypeDefinitionNode, DocumentNode} from 'graphql';
import {Config, ResolvingRESTOptions} from '@/typings';
import {DollarApollo} from 'vue-apollo/types/vue-apollo';
import {Vue} from 'vue/types/vue';
import Container from '@/Container';
import UnexpectedException from '@/models/Exceptions/UnexpectedException';

export function getApollo(): DollarApollo<Vue> {
  //@ts-ignore
  return Container.getInstance().get('Vue').$apollo;
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
export function performGqlQuery(query, variables, queryName, subscribeToMore?) {
  return new Promise((result, error) => getApollo().addSmartQuery(queryName, {
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
  return new Promise((resolve, reject) => getApollo().mutate({
    update(_cache, result) {
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
 * @param subscriptions
 * @returns {Promise<*>}
 */
export async function performSafeRequestGraphql(query: DocumentNode, variables = {}, subscriptions: unknown[] = []) {
  //@ts-ignore
  const queryName: string = query.definitions.map((def => def.name).find(def => def.kind === 'Name')).value;
  //@ts-ignore
  const operation = query.definitions.find(def => def.kind === 'OperationDefinition').operation === 'query'
    ? performGqlQuery.bind(null, query, stripTypename(variables), queryName, subscriptions)
    : performGqlMutation.bind(null, query, stripTypename(variables));

  //@ts-ignore
  return operation().then(({data}) => data[queryName]);
}

export function containerGet(key: string) {
  return Container.getInstance().get(key);
}

export function config() {
  return containerGet('Config') as Config;
}

export function getParsedSchema() {
  const schema = Container.getInstance().get('schema') as string;
  // import schema from 'raw-loader!@/../schema.graphql';

  if (!schema) {
    throw new UnexpectedException('Configuration error: \'schema\' must be passed as a config key, e.g\n\nimport schema from \'raw-loader!@/../schema.graphql\';\n\n//...\n\nVue.use(VueModel, {\n  //...,\n  schema,\n})\n\n;');
  }

  return parse(schema);
}

export function getSchemaTypeFields(typeName) {
  return (getParsedSchema()
    .definitions as ReadonlyArray<ObjectTypeDefinitionNode>)
    .find(def => def.name.value === typeName)
    .fields
    .map(f => f.name.value);
}

export function getSchemaMutation(mutationName) {
  return (getParsedSchema()
    .definitions as ReadonlyArray<ObjectTypeDefinitionNode>)
    .find(def => def.name.value === 'Mutation')
    .fields
    .find(def => def.name.value === mutationName);
}

export function getSchemaQuery(queryName) {
  return (getParsedSchema()
    .definitions as ReadonlyArray<ObjectTypeDefinitionNode>)
    .find(def => def.name.value === 'Query')
    .fields
    .find(def => def.name.value === queryName);
}

export default async function getUrl(_opts: ResolvingRESTOptions) {
  const {url, params} = _opts;
  let resolvedUrl = url;

  if (typeof url === 'function') {
    resolvedUrl = await url();
  } else {
    resolvedUrl = (resolvedUrl as string).replace(
      /:([^\s\/]+)/gi,
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
