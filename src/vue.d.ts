import Container from './Container';

declare module 'vue/types/vue' {
  interface Vue {
    $container: Container;
  }
}
