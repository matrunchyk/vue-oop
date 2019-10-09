import Registry from './Registry';

declare module 'vue/types/vue' {
  interface Vue {
    $registry: Registry;
  }
}
