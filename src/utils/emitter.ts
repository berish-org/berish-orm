export class Emitter {
  private _subscribes: { [eventName: string]: ((data: any, unsubscribe: () => void) => void)[] } = {};

  async emit(eventName: string, data: any) {
    if (!this._subscribes[eventName]) this._subscribes[eventName] = [];
    await Promise.all(this._subscribes[eventName].map((emit) => emit(data, () => this.unsubscribe(eventName, emit))));
  }

  emitFirst(eventName: string, data: any) {
    if (!this._subscribes[eventName]) this._subscribes[eventName] = [];
    const emit = this._subscribes[eventName][0];
    if (emit) emit(data, () => this.unsubscribe(eventName, emit));
  }

  hasSubscribe(eventName: string) {
    if (!this._subscribes[eventName]) this._subscribes[eventName] = [];
    return this._subscribes[eventName].length > 0;
  }

  subscribe(eventName: string, callback: (data: any, unsubscribe: () => void) => void) {
    if (!this._subscribes[eventName]) this._subscribes[eventName] = [];
    this._subscribes[eventName].push(callback);
    return () => this.unsubscribe(eventName, callback);
  }

  unsubscribe(eventName: string, callback: (data: any, unsubscribe: () => void) => void) {
    if (!this._subscribes[eventName]) this._subscribes[eventName] = [];
    this._subscribes[eventName] = this._subscribes[eventName].filter((m) => m !== callback);
  }

  cacheCall<T>(eventName: string, isNew: () => T | Promise<T>) {
    return new Promise<T>((resolve, reject) => {
      if (this.hasSubscribe(eventName)) {
        return this.subscribe(eventName, (data, unsubscribe) => {
          resolve(data);
          unsubscribe();
        });
      } else {
        const result = isNew();
        if (result instanceof Promise) {
          return result.then((result) => {
            resolve(result);
            return this.emit(eventName, result);
          });
        } else {
          resolve(result);
          return this.emit(eventName, result);
        }
      }
    });
  }

  cacheSubscribe<T>(
    eventName: string,
    mainSubscribe:
      | ((eventName: string) => () => void | Promise<void>)
      | ((eventName: string) => Promise<() => void | Promise<void>>),
    callback: (data: any) => void,
  ) {
    const callbackHash = `${eventName}_callback`;
    const changeMainHash = `${eventName}_change_main`;

    let mainUnsubscribe = this.hasSubscribe(callbackHash) ? null : mainSubscribe(callbackHash);

    const currentUnsubscribe = this.subscribe(callbackHash, callback);
    const changeMainUnsubscribe = mainUnsubscribe
      ? null
      : this.subscribe(changeMainHash, (data) => {
          mainUnsubscribe = data;
        });
    return () => {
      currentUnsubscribe();
      if (changeMainUnsubscribe) changeMainUnsubscribe();
      if (mainUnsubscribe) {
        if (!this.hasSubscribe(callbackHash)) {
          if (mainUnsubscribe instanceof Promise) mainUnsubscribe.then((unsubscribe) => unsubscribe());
          else mainUnsubscribe();
        } else this.emitFirst(changeMainHash, mainUnsubscribe);
      }
    };
  }
}
