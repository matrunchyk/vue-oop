type ExceptionPayload = {
  data: {
    message: string;
  };
};

export default class BaseException extends Error {
  response = {};

  constructor(payload: ExceptionPayload | string = '') {
    super(typeof payload === 'string' ? payload : payload.data.message);

    this.response = payload;

    this.stack = (new Error()).stack;
  }
}
