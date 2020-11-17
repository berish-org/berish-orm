import LINQ from '@berish/linq';

export class QueueAction<Data> {
  private _name: string = null;
  private _cb: (data: Data) => any;

  constructor(name: string, cb: (data: Data) => any) {
    this._name = name;
    this._cb = cb;
  }

  get name() {
    return this._name;
  }

  execute(data: any) {
    const result = this._cb(data);
    if (result instanceof Promise) {
      return result.then((m) => m);
    }
    return result;
  }
}

export class Queue<Data extends { [key: string]: any }> {
  private _need: boolean = false;
  private _actions = LINQ.from<QueueAction<any>>([]);
  private _data: Data = {} as any;

  get need() {
    return this._need;
  }

  action<TData>(action: QueueAction<TData>) {
    this._actions = this._actions.concat(action).distinct((m) => m.name);
    return (this as any) as Queue<Data & TData>;
  }

  data(data: Partial<Data> | ((data: Data) => Partial<Data>)) {
    const realData = typeof data === 'function' ? data(this._data) : data;
    this._data = Object.assign(this._data, realData);
  }

  execute(onError?: (reason: any) => any) {
    const results = [];
    for (const action of this._actions) {
      try {
        const result = action.execute(this._data);
        results.push(result);
      } catch (err) {
        if (onError) onError(err);
      }
    }
    if (results.some((m) => m instanceof Promise))
      return Promise.all(results).finally(() => {
        this._data = {} as any;
      });
    this._data = {} as any;
    return results;
  }
}
