import Vue from 'vue';
import VueOOP, {Model, InvalidArgumentException, Utils} from '../../src';
import Registry from '../../src/Registry';

Vue.use(VueOOP);

class BaseModel extends Model {
}

let lib;

describe('Given an instance of the Registry', () => {
  describe('when I try to instantiate the class directly', () => {
    let reg1: Registry;
    it('should return the singleton', () => {
      //@ts-ignore
      reg1 = new Registry();
      //@ts-ignore
      reg1.test = 123;
      //@ts-ignore
      const reg2 = new Registry();
      expect(reg1).toBe(reg2);
      expect(reg2.test).toBe(123);
    });

    afterAll(() => {
      // We need this for the next test
      reg1.__jest__destroyInstance();
    });
  });

  describe('when I try to an getInstance of the class', () => {
    it('should return the singleton', () => {
      const reg1 = Registry.getInstance();
      const reg2 = Registry.getInstance();
      expect(reg1).toBe(reg2);
      //@ts-ignore
      expect(reg1.test).not.toBe(123);
    });
  });

  describe('when I try to store a value', () => {
    it('should return the value back', () => {
      const reg = Registry.getInstance();
      const presets = {
        'some-string': 'this is a string',
        'some-number': 123,
        'some-array': [2, 3, 4],
        'some-object': {a: 1, b: 2},
        'some-function': (a) => a,
      };
      reg.set('some-string', presets['some-string']);
      reg.set('some-number', presets['some-number']);
      reg.set('some-array', presets['some-array']);
      reg.set('some-object', presets['some-object']);
      reg.set('some-function', presets['some-function']);
      expect(reg.get('some-string')).toBe(presets['some-string']);
      expect(reg.get('some-number')).toBe(presets['some-number']);
      expect(reg.get('some-array')).toBe(presets['some-array']);
      expect(reg.get('some-object')).toBe(presets['some-object']);
      expect(reg.get('some-function')).toBe(presets['some-function']);
    });

    // @depends-on 'should return the value back'
    it('should indicate that the value is exists', () => {
      const reg = Registry.getInstance();
      expect(reg.has('some-string')).toBeTruthy();
      expect(reg.has('some-number')).toBeTruthy();
      expect(reg.has('some-array')).toBeTruthy();
      expect(reg.has('some-object')).toBeTruthy();
      expect(reg.has('some-function')).toBeTruthy();
    });
  });

  describe('when I try to store multiple values', () => {
    it('should return the values back', () => {
      const reg = Registry.getInstance();
      const presets = [
        {'another-string': 'this is a string'},
        {'someArray': ['this is an array', 123]},
      ];
      reg.set(presets);
      expect(reg.get('another-string')).toBe(presets[0]['another-string']);
      expect(reg.get('someArray')).toBe(presets[1].someArray);
    });
  });

  describe('when I try to get a deleted key', () => {
    it('should throw an error', () => {
      const reg = Registry.getInstance();
      reg.set('will-be-deleted', 123);
      expect(reg.get('will-be-deleted')).toBe(123);
      reg.delete('will-be-deleted');
      const t = () => {
        reg.get('will-be-deleted');
      };
      expect(t).toThrow('Registry Error: will-be-deleted is not available in the registry.');
    });
  });

  describe('when I clear the registry', () => {
    it('should show the size as 0', () => {
      const reg = Registry.getInstance();
      reg.set('test-123', 123);
      expect(reg.size).toBeGreaterThan(0);
      reg.clear();
      expect(reg.size).toBe(0);
    });
  });
});

describe('Given an instance of my Model library', () => {
  beforeEach(() => {
    lib = new BaseModel();
  });
  describe('when I need the __typename', () => {
    it('should return the __typename', () => {
      expect(lib.__typename).toBeUndefined();
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
      expect(lib.__typename).toBe('MyModel');
    });
  });
});

describe('Given instances of BaseException', () => {
  describe('when I pass the message to InvalidArgumentException', () => {
    it('should return the message', () => {
      const message = 'This is a message';
      try {
        //noinspection ExceptionCaughtLocallyJS
        throw new InvalidArgumentException(message);
      } catch (e) {
        expect(e.message).toBe(message);
      }
    });
  });

  describe('when I pass the response-like payload to InvalidArgumentException', () => {
    it('should return a message in the object', () => {
      const payload = {
        data: {
          message: 'This is a message from the server',
        },
      };
      try {
        //noinspection ExceptionCaughtLocallyJS
        throw new InvalidArgumentException(payload);
      } catch (e) {
        expect(e.message).toBe(payload.data.message);
      }
    });
  });

  describe('when I do NOT pass the message to InvalidArgumentException', () => {
    it('should return NO message', () => {
      try {
        //noinspection ExceptionCaughtLocallyJS
        throw new InvalidArgumentException();
      } catch (e) {
        expect(e.message).toBe('');
      }
    });
  });
});

describe('Given Utils object', () => {
  beforeEach(() => {
    const fakeVue = {
      prototype: {
        $registry: null,
      },
      mixin: jest.fn(),
    };
    //@ts-ignore
    VueOOP(fakeVue);
  });

  describe('when try to get a non-config nonexistent key', () => {
    it('should throw an error', () => {
      const t = () => {
        Utils.registryGet('totally_nonexistent');
      };
      expect(t).toThrow('Registry Error: totally_nonexistent is not available in the registry.');
    });
  });

  describe('when try to get a config nonexistent key', () => {
    const t = () => {
      return Utils.registryGet('Config');
    };

    it('should NOT throw an error', () => {
      expect(t).not.toThrow();
    });

    it('should return undefined', () => {
      //@ts-ignore
      expect(t().nonExistent).toBeUndefined();
    });
  });

  describe('when try to get a default config key', () => {
    it('should throw an error', () => {
      //@ts-ignore
      expect(Utils.registryGet('Config').rest).toBeTruthy();
    });
  });

  describe('when I check whether it is a debug mode', () => {
    it('should return undefined', () => {
      //@ts-ignore
      expect(Utils.registryGet('Config').debug).toBeFalsy();
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

      expect(cloned).not.toEqual(original);
      expect(cloned).not.toEqual(original);
      expect(cloned.a).toEqual(original.a);
      expect(cloned.__typename).toBeUndefined();
      expect(cloned.b).toEqual(original.b);
      expect(cloned.c.d).toEqual(original.c.d);
      expect(cloned.c.__typename).toBeUndefined();
      expect(cloned.e[0]).toEqual(original.e[0]);
      expect(cloned.e[1]).toEqual(original.e[1]);
      //@ts-ignore
      expect(cloned.e[2].h).toEqual(original.e[2].h);
      expect(cloned.e[2].__typename).toBeUndefined();
    });
  });
});

describe('Given VueOOP object', () => {
  describe('when a Vue create() hook is executed', () => {
    it('should contain its instance', () => {
      const fakeVue = {
        test: 123,
        prototype: {
          $registry: null,
        },
        mixin: jest.fn(),
      };
      //@ts-ignore
      VueOOP(fakeVue);
      const reg = Registry.getInstance();
      expect(fakeVue.mixin.mock.calls.length).toBe(1);
      fakeVue.mixin.mock.calls[0][0].created.call(fakeVue);
      //@ts-ignore
      expect(reg.get('Vue')).toBe(fakeVue);
    });
  });

  describe('when a Vue create() hook is executed again', () => {
    it('should contain its stored instance', () => {
      const fakeVue = {
        prototype: {
          $registry: null,
        },
        mixin: jest.fn(),
      };
      //@ts-ignore
      VueOOP(fakeVue);
      const reg = Registry.getInstance();
      reg.set('Vue', 444);
      expect(fakeVue.mixin.mock.calls.length).toBe(1);
      fakeVue.mixin.mock.calls[0][0].created.call(fakeVue);
      //@ts-ignore
      expect(reg.get('Vue')).toBe(444);
    });
  });
});
