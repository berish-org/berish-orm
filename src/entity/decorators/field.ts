import { Entity } from '../';

export function Field(target: Entity, key: string): void;
export function Field(
  target: Entity,
  key: string,
  descriptor: TypedPropertyDescriptor<any>,
): TypedPropertyDescriptor<any>;
export function Field(target: Entity, key: string, descriptor?: TypedPropertyDescriptor<any>) {
  descriptor = descriptor || Object.getOwnPropertyDescriptor(target, key);

  if (!descriptor || (!descriptor.get && !descriptor.set)) {
    const descriptorValue = descriptor && descriptor.value;
    const descriptorInitializer = descriptor && descriptor['initializer'];

    const ACCESSORS_SYMBOL = Symbol(key);
    let isInitialized = false;

    delete target[key];

    const initialize = function () {
      const self = this;

      if (descriptorInitializer) {
        const value = descriptorInitializer.call(self);
        setter.call(self, value);
      } else if (descriptorValue) {
        setter.call(self, descriptorValue);
      }
    };

    const setter = function (value: any) {
      const self = this;
      if (self instanceof Entity) self.set(key, value);
      else self[ACCESSORS_SYMBOL] = value;
    };

    const getter = function () {
      const self = this;

      if (!isInitialized) {
        initialize.call(self);
        isInitialized = true;
      }

      if (self instanceof Entity) return self.get(key);
      return self[ACCESSORS_SYMBOL];
    };

    const newDescriptor: TypedPropertyDescriptor<any> = {
      enumerable: true,
      configurable: true,
      get: getter,
      set: setter,
    };

    Object.defineProperty(target, key, newDescriptor);

    const staticTarget = target && (target.constructor as typeof Entity);
    if (staticTarget) {
      staticTarget.fields = staticTarget.fields || [];
      if (staticTarget.fields.indexOf(key) === -1) staticTarget.fields.push(key);
    }

    return newDescriptor;
  }

  return descriptor;
}
