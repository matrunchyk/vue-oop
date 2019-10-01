/* global describe, it, before */

import chai from 'chai';
import Vue from 'vue';
//import chaiFetchMock from 'chai-fetch-mock';
//import fetchMock from 'fetch-mock';
import VueModel, {BaseModel as AbstractBaseModel, InvalidArgumentException, Utils} from '../src/index';

Vue.use(VueModel, {});

class BaseModel extends AbstractBaseModel {
}

const expect = chai.expect;

//chai.use(chaiFetchMock);

let lib;

describe('Given an instance of my BaseModel library', () => {
  before(() => {
    lib = new BaseModel();
  });
  describe('when I need the __typename', () => {
    it('should return the __typename', () => {
      expect(lib.__typename).to.be.equal('BaseModel');
    });
  });
});

describe('Given an instance of my Model based on BaseModel', () => {
  before(() => {
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
  before(() => {
    lib = new InvalidArgumentException('This is a message');
  });
  describe('when I need the message', () => {
    it('should return the message', () => {
      expect(lib.message).to.be.equal('This is a message');
    });
  });
});

describe('Given Utils object', () => {
  describe('when I check whether it is a debug mode', () => {
    it('should return undefined', () => {
      expect(Utils.containerGet('debug')).to.be.false;
    });
  });
  /*
   describe('when I pass loader function and path', () => {
   it('should return a GQL document', async () => {
   const obj = {
   a: 1,
   };
   const doc = {fetchPost: obj};
   const loader = () => Promise.resolve(doc);
   const res = await Utils.getGQLDocument(loader, 'posts/queries/fetchPost');

   expect(res).to.be.equal(obj);
   });
   });
   describe('when I pass loader function (which fails) and path', () => {
   it('should return a stubbed GQL document', async () => {
   const loader = () => Promise.reject();
   const res = await Utils.getGQLDocument(loader, 'posts/queries/fetchPost');

   expect(res).to.be.eql({__fake: true});
   });
   });
   */
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

describe('Given VueModel object', () => {
});
