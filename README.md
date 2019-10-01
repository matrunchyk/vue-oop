# Vue OOP

Universal library which helps to build OOP-driven models for GraphQL and RESTful API for Vue components.
Influenced by Laravel Eloquent Models & Collections.

[![npm](https://img.shields.io/npm/v/vue-oop.svg)](https://www.npmjs.com/package/vue-oop) [![GitHub stars](https://img.shields.io/github/stars/matrunchyk/vue-oop.svg)](https://github.com/matrunchyk/vue-oop/stargazers)
![Travis](https://api.travis-ci.org/matrunchyk/vue-oop.svg?branch=master) [![codecov](https://codecov.io/gh/matrunchyk/vue-oop/branch/master/graph/badge.svg)](https://codecov.io/gh/matrunchyk/vue-oop) [![GitHub license](https://img.shields.io/github/license/matrunchyk/vue-oop.svg)](https://github.com/matrunchyk/vue-oop/blob/master/LICENSE) 

_Note. If you looking for v1 of this library, switch to a [relevant branch](https://github.com/digitalideastudio/vue-graphql-models/tree/v1)._ 


## Features

* `Model` is a class which acts as a base entity for your models extending this class.
* `Repository` is a class which manages Model collections (retrieval one or many)
* `Container` is a IoC container
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

## Configuration

```
import VueOOP from 'vue-oop';

Vue.use(VueOOP);
```

## Documentation

### Basic Usage
#### 1. Define your model:

```
// @/models/Client.js
import { Model } from 'vue-oop';

export default class Client extends Model {
  name = 'John';
  email = 'john@doe.com';
}
```

#### 2. Define your repository:
```
// @/repositories/ClientRepository.js
import { Repository } from 'vue-oop';
import Client from '@/models/Client';

export default class ClientRepository extends Repository {
  model: Client;
}
```

#### 3. Use it in your component:

```
<template>
   <ul>
     <li v-if="repository.loading">Loading...</li>
     <li v-else-if="repository.error">Loading Failed!</li>
     <li v-else v-for="(item, index) in clients.all()" :key="index">
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

  computed: {
    clients() {
      return this.repository.dataset;
    },
  },

  async created() {
    await this.repository.many();
  },
}
</script>
```

####[Full Documentation](https://matrunchyk.github.io/vue-oop/#/)

## Contribution

Feel free to submit your pull-requests, ideas, proposals and bug reports!
 
### TODOs:
- Add dynamic query/mutation building based on model attributes w/o need to create `.graphql` files at all
- Add `@Inject` and `@Provide`
- Make collections optional to make library more lightweight 
- Add subscriptions & events example
- Write more tests & coverage support
- Add model version support
- Add a configurable operation confirmation when performing some risky operations. For example, automatically display a delete confirmation component when executing `.delete()` method.
