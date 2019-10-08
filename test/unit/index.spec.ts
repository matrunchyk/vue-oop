/* global describe, it, beforeEach */

import chai from 'chai';
import Vue from 'vue';
//import chaiFetchMock from 'chai-fetch-mock';
//import fetchMock from 'fetch-mock';
import VueOOP, {Model, InvalidArgumentException, Utils} from '../../src';

Vue.use(VueOOP);

class BaseModel extends Model {
}

const expect = chai.expect;

//chai.use(chaiFetchMock);

let lib;

describe('Given an instance of my Model library', () => {
  beforeEach(() => {
    lib = new BaseModel();
  });
  describe('when I need the __typename', () => {
    it('should return the __typename', () => {
      expect(lib.__typename).to.be.equal(undefined);
    });
  });
});

describe('Given an instance of my Model based on Model', () => {
  beforeEach(() => {
    class MyModel extends BaseModel {
      __typename = 'MyModel';
    }

    lib = new MyModel();
  });
  describe('when I override with the __typename', () => {
    it('should return the overridden __typename', () => {
      expect(lib.__typename).to.be.equal('MyModel');
    });
  });
});

describe('Given an instance of my InvalidArgumentException library', () => {
  describe('when I need the message', () => {
    it('should return the message', () => {
      const message = 'This is a message';
      try {
        throw new InvalidArgumentException(message);
      } catch (e) {
        expect(e.message).to.be.eq(message);
      }
    });
  });
});

describe('Given Utils object', () => {
  beforeEach(() => {
    const fakeVue = {
      prototype: {
        $container: null,
      },
      mixin: jest.fn(),
    };
    //@ts-ignore
    VueOOP(fakeVue);
  });

  describe('when try to get a non-config nonexistent key', () => {
    it('should throw an error', () => {
      const t = () => {
        Utils.containerGet('totally_nonexistent');
      };
      expect(t).to.throw('Registry Error: totally_nonexistent is not available in the registry.');
    });
  });

  describe('when try to get a config nonexistent key', () => {
    const t = () => {
      Utils.containerGet('Config');
    };

    it('should NOT throw an error', () => {
      expect(t).to.not.throw();
    });

    it('should return undefined', () => {
      expect(t()).to.be.undefined;
    });
  });

  describe('when try to get a default config key', () => {
    it('should throw an error', () => {
      //@ts-ignore
      expect(Utils.containerGet('Config').rest).to.be.true;
    });
  });

  describe('when I check whether it is a debug mode', () => {
    it('should return undefined', () => {
      //@ts-ignore
      expect(Utils.containerGet('Config').debug).to.be.false;
    });
  });

  describe('when I pass some original object with __typename', () => {
    it('should return a new cloned object without __typename', () => {
      const original = {
        __typename: 'TypeA',
        a: 1,
        b: 2,
        c: {
          __typename: 'TypeB',
          d: '1',
        },
        e: ['f', 'g', {h: 1, __typename: 'TypeC'}],
      };
      const cloned = Utils.stripTypename(original);

      expect(cloned).to.be.not.eql(original);
      expect(cloned).to.be.not.equal(original);
      expect(cloned.a).to.be.equal(original.a);
      expect(cloned.__typename).to.be.equal(undefined);
      expect(cloned.b).to.be.equal(original.b);
      expect(cloned.c.d).to.be.equal(original.c.d);
      expect(cloned.c.__typename).to.be.equal(undefined);
      expect(cloned.e[0]).to.be.equal(original.e[0]);
      expect(cloned.e[1]).to.be.equal(original.e[1]);
      //@ts-ignore
      expect(cloned.e[2].h).to.be.equal(original.e[2].h);
      expect(cloned.e[2].__typename).to.be.equal(undefined);
    });
  });

  // getGQLDocumentName
  /*
   describe('when I pass GQL document and calling class', () => {
   it('should return a document name of GraphQL document', () => {
   const fakeGQLDoc = {
   definitions: [
   {kind: 'SomethingElse', name: {value: 'SomethingElse'}},
   {kind: 'OperationDefinition', name: {value: 'FakeDefinition'}},
   {kind: 'SomethingElse', name: {value: 'SomethingElse'}},
   ],
   };

   expect(Utils.getGQLDocumentName(fakeGQLDoc)).to.be.equal('FakeDefinition');
   });
   it('should throw an exception if wrong document', () => {
   const fakeGQLDoc = {
   definitions: [
   {kind: 'SomethingElse', name: {value: 'SomethingElse'}},
   {kind: 'OperationDefinition', name: {value: 'FakeDefinition'}},
   {kind: 'SomethingElse', name: {value: 'SomethingElse'}},
   ],
   };

   expect(Utils.getGQLDocumentName(fakeGQLDoc)).to.be.equal('FakeDefinition');
   });
   });
   */
});

describe('Given VueOOP object', () => {
});
