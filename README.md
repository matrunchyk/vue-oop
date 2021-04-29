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
* TypeScript 3.9.
* Collect.JS.
* Apollo (if GraphQL activated).

## Installation

`npm i vue-oop -S`

or

`yarn add vue-oop`

## Configuration for GraphQL:

```
// Import the library itself
import VueOOP from 'vue-oop';

// Install the plugin
Vue.use(VueOOP, {
  graphql: true,
  schemaUrl: 'http://127.0.0.1:3000/graphql',
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
     <li v-if="clients.loading">Loading...</li>
     <li v-else-if="clients.error">Loading Failed! Reason: {{ clients.lastError.message }}</li>
     <li v-else v-for="(client, index) in clients.dataset.all()" :key="index">
       <p>Name: {{ client.name }}</p>
       <p>Email: {{ client.email }}</p>
     </li>
  </ul>
</template>

<script>
import ClientRepository from '@/repositories/ClientRepository';

export default {
  data: () => ({
    clients: new ClientRepository(),
  }),

  created() {
    this.clients.many();
  },
}
</script>
```

##### TypeScript
```
<template>
   <ul>
     <li v-if="clients.loading">Loading...</li>
     <li v-else-if="clients.error">Loading Failed! Reason: {{ clients.lastError.message }}</li>
     <li v-else v-for="(client, index) in clients.dataset.all()" :key="index">
       <p>Name: {{ client.name }}</p>
       <p>Email: {{ client.email }}</p>
     </li>
  </ul>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import ClientRepository from '@/repositories/ClientRepository';

@Component
export default class ClientsPage extends Vue {
  clients = new ClientRepository(),

  created() {
    this.clients.many();
  }
}
</script>
```

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

Now when the `userId` variable changed, the `queryParams` are also updated and ready to be called.


## Contribution

Feel free to submit your pull-requests, ideas, proposals and bug reports!
 
### Coming in a next major releases:
- Add dynamic query builder & fields
  - Add default fields to fetch with an ability to customize
- Add decorators
  - `@OneToMany`, `@ManyToMany`, `@ManyToOne`, `@OneToOne` relations between models
  - `@Field` with `castTo`, `castFrom`, `nullable` options
- Add subscriptions & events example
- Add cursor-based pagination
- Write more tests & coverage support
- Add scaffolding support
- Publishing as monorepo with `vue-oop-table`
