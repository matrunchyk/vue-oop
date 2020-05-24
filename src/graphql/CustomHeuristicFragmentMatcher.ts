import { HeuristicFragmentMatcher } from 'apollo-cache-inmemory';

let haveWarned = false;

export default class CustomHeuristicFragmentMatcher extends HeuristicFragmentMatcher {
  match(idValue: any, typeCondition: any, context: any) {
    const obj = context.store.get(idValue.id);

    if (!obj) {
      return false;
    }

    if (!obj.__typename) {
      if (!haveWarned) {
        console.warn(`You're using fragments in your queries, but either don't have the addTypename:
  true option set in Apollo Client, or you are trying to write a fragment to the store without the __typename.
   Please turn on the addTypename option and include __typename when writing fragments so that Apollo Client
   can accurately match fragments.`);
        console.warn(
          'Could not find __typename on Fragment ',
          typeCondition,
          obj,
        );
        console.warn(`DEPRECATION WARNING: using fragments without __typename is
          unsupported behavior and will be removed in future versions of Apollo client.
          You should fix this and set addTypename to true now.`);
      }

      haveWarned = true;

      return false;
    }

    return obj.__typename === typeCondition;
  }
}
