import { Entity } from '../';

export function Field(target: Entity, key: string): void;
export function Field(
  target: Entity,
  key: string,
  descriptor: TypedPropertyDescriptor<any>,
): TypedPropertyDescriptor<any>;
export function Field(target: Entity, key: string, descriptor?: TypedPropertyDescriptor<any>) {
  if (descriptor) return descriptor;
  descriptor = Object.getOwnPropertyDescriptor(target, key) || {};
  delete target[key];
  descriptor.set = function (value: any) {
    const self = this;
    if (self instanceof Entity) return self.set(key, value);
    return (self['_' + key] = value);
  };
  descriptor.get = function () {
    const self = this;
    if (self instanceof Entity) return self.get(key);
    return self['_' + key];
  };
  Object.defineProperty(target, key, descriptor);

  const staticTarget = target && (target.constructor as typeof Entity);
  if (staticTarget) {
    staticTarget.fields = staticTarget.fields || [];
    if (staticTarget.fields.indexOf(key) === -1) staticTarget.fields.push(key);
  }

  return descriptor;
}
