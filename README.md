# Vue OOP

Universal library which helps to build OOP-driven models for GraphQL and RESTful API for Vue components.
Influenced by Laravel Eloquent Models & Collections.

[![npm](https://img.shields.io/npm/v/vue-oop.svg)](https://www.npmjs.com/package/vue-oop) [![GitHub stars](https://img.shields.io/github/stars/matrunchyk/vue-oop.svg)](https://github.com/matrunchyk/vue-oop/stargazers)
![Travis](https://api.travis-ci.org/matrunchyk/vue-oop.svg?branch=master) [![codecov](https://codecov.io/gh/matrunchyk/vue-oop/branch/master/graph/badge.svg)](https://codecov.io/gh/matrunchyk/vue-oop) [![GitHub license](https://img.shields.io/github/license/matrunchyk/vue-oop.svg)](https://github.com/matrunchyk/vue-oop/blob/master/LICENSE) 

_Note. If you looking for v1 of this library, switch to a [relevant branch](https://github.com/digitalideastudio/vue-graphql-models/tree/v1)._ 


## Features

* `Model` is a class which acts as a base entity for your models extending this class.
* `Repository` is a class which manages Model collections (retrieval one or many)
* `Registry` is a Registry storage
* `Collection` is a Proxy based on collect.js package.
* Full encapsulation of GraphQL queries & mutations. No need to call them manually, all you need is to call you Model's methods.
* All arrays retrieved from GraphQL will be hydrated with respectful collections of models.
* Supports lazy-loading of GraphQL documents.
* Supports events & hooks for customization.

###### Internally:  
* TypeScript 3.6.
* Collect.JS.
* Vue-Apollo (if GraphQL activated).

## Installation

`npm i vue-oop -S`

or

`yarn add vue-oop`

## Configuration for GraphQL:

```
// Import the library itself
import VueOOP from 'vue-oop';

// Import your schema.graphql file (OPTIONAL, used for smart resolution of Input Types properties)
import schema from 'raw-loader!@/../schema.graphql';

// Install the plugin
Vue.use(VueOOP, {
  graphql: true,
  schema,
});
```

## Configuration for REST:

```
// Import the library itself
import VueOOP from 'vue-oop';

// Install the plugin
Vue.use(VueOOP);
```

## Documentation

### Basic Usage
#### Step 1. Define your model:

```
// @/models/Client.js
import { Model } from 'vue-oop';

export default class Client extends Model {
  name = 'John';
  email = 'john@doe.com';
}
```

#### Step 2. Define your repository:
```
// @/repositories/ClientRepository.js
import { Repository } from 'vue-oop';
import Client from '@/models/Client';

export default class ClientRepository extends Repository {
  model = Client;
  
  // For REST
  // queryMany = '/api/v1/clients';

  // For GraphQL
  // queryMany: () => import('@/gql/clients/queries/fetchClients.gql');
}
```

#### Step 3. Use it in your component:

##### JavaScript
```
<template>
   <ul>
     <li v-if="repository.loading">Loading...</li>
     <li v-else-if="repository.error">Loading Failed! Reason: {{ repository.lastError.message }}</li>
     <li v-else v-for="(item, index) in repository.dataset.all()" :key="index">
       <p>Name: {{ item.name }}</p>
       <p>Email: {{ item.email }}</p>
     </li>
  </ul>
</template>

<script>
import ClientRepository from '@/repositories/ClientRepository';

export default {
  data: () => ({
    repository: new ClientRepository(),
  }),

  created() {
    this.repository.many();
  },
}
</script>
```

##### TypeScript
```
<template>
   <ul>
     <li v-if="repository.loading">Loading...</li>
     <li v-else-if="repository.error">Loading Failed! Reason: {{ repository.lastError.message }}</li>
     <li v-else v-for="(item, index) in repository.dataset.all()" :key="index">
       <p>Name: {{ item.name }}</p>
       <p>Email: {{ item.email }}</p>
     </li>
  </ul>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import ClientRepository from '@/repositories/ClientRepository';

@Component
export default class ClientsPage extends Vue {
  repository = new ClientRepository(),

  created() {
    this.repository.many();
  }
}
</script>
```


#### Notes for GraphQL
In order to generate schema use [fetch-graphql-schema](https://github.com/yoctol/fetch-graphql-schema#fetch-graphql-schema) package with the following command `npx fetch-graphql-schema http://your.api.server/graphql -o schema.graphql -r` 

If your're using Laravel Lighthouse, use the following command `php artisan lighthouse:print-schema > schema.graphql`.

Then put your `schema.graphql` file inside of the root folder of your frontend project.


This file is also needed if you use GraphQL plugins for your IDE (such as [JS GraphQL](https://plugins.jetbrains.com/plugin/8097-js-graphql)).

In future, the library will be automatically fetching the schema from your backend (optionally) for convenience.


### Advanced Usage

#### Dynamic Repository Query Params

Sometimes we need to be able to pass params NOT in `.many()` or `.one()`. It happens, for example, when `.many()` is called not by you (i.e. 3rd party library or just other component).

To achieve this, you can use the following syntax:

```
<template>
  <div>
    <button v-if="userId" @click="repository.many()">Fetch</button>
  </div>
</template>

<script>
// ...
data: () => ({
  repository: new MyRepository(),
}),

watch: {
  userId(id) {
    this.repository.queryParams = { id };
  },
},
// ...
</script>
```

Now when the `userId` variable is changed, the `queryParams` are also updated and ready to be called.


## Contribution

Feel free to submit your pull-requests, ideas, proposals and bug reports!
 
### TODOs:
- Add optional dynamic .graphql document generation based on model attributes and schema
- Add optional IntrospectionQuery execution so that you don't need to specify `schema.graphql` manually.
- Add `@Inject` and `@Provide`
- Add subscriptions & events example
- Write more tests & coverage support
- Add a configurable operation confirmation when performing some risky operations. For example, automatically display a delete confirmation component when executing `.delete()` method.
