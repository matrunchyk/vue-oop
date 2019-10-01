# Vue Data Models

Universal library which helps to build OOP-driven models for GraphQL and RESTful API for Vue components.
Influenced by Laravel Eloquent Models & Collections.


[![npm](https://img.shields.io/npm/v/vue-oop.svg)](https://www.npmjs.com/package/vue-oop) [![GitHub stars](https://img.shields.io/github/stars/digitalideastudio/vue-oop.svg)](https://github.com/digitalideastudio/vue-oop/stargazers)
![Travis](https://api.travis-ci.org/matrunchyk/vue-oop.svg?branch=master) [![codecov](https://codecov.io/gh/digitalideastudio/vue-oop/branch/master/graph/badge.svg)](https://codecov.io/gh/digitalideastudio/vue-oop) [![GitHub license](https://img.shields.io/github/license/digitalideastudio/vue-oop.svg)](https://github.com/digitalideastudio/vue-oop/blob/master/LICENSE) 

_Note. If you looking for v1 of this library, switch to a [relevant branch](https://github.com/digitalideastudio/vue-graphql-models/tree/v1)._ 


## Features

* `Model` is a class which acts as a base entity for your models extending this class.
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
import VueDataModel from 'vue-oop';

Vue.use(VueDataModel);
```

## Documentation

### Basic Usage
#### 1. Define your model:

```
import { Model, Repository } from 'vue-oop';

export default class Order extends Model {
 // Your additional logic, if needed
 //   ...or just empty class
}
```

#### 2. Use it in your component:

```
<template>
   <ul>
     <li v-if="model.loading">Loading...</li>
     <li v-else-if="model.error">Loading Failed!</li>
     <li v-else v-for="(item, index) in model.results.all()" :key="index">
       <p>Name: {{ item.name }}</p>
       <p>Color: {{ item.color }}</p>
     </li>
  </ul>
</template>

<script>
import Fruit from '@/models/Fruit';

export default {
  data: () => ({
    model: new Fruit(),
  }),

  created() {
    this.model.get();
  },
}
</script>
```

####[Full Documentation](https://matrunchyk.github.io/vue-oop/#/)

## Contribution

Feel free to submit your pull-requests, ideas, proposals and bug reports!
 
### TODOs:
- Add dynamic query/mutation building based on model attributes w/o need to create `.graphql` files at all
- Make collections optional to make library more lightweight 
- Rewrite to TypeScript
- Add subscriptions & events example
- Write more tests & coverage support
- Add model versioning support
- Add a configurable operation confirmation when performing some risky operations. For example, automatically display a delete confirmation component when executing `.delete()` method.
