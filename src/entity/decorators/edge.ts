import { Entity } from '../';

export function Edge(target: any, key: string): void;
export function Edge(target: any, key: string, descriptor: TypedPropertyDescriptor<any>): TypedPropertyDescriptor<any>;
export function Edge(target: any, key: string, descriptor?: TypedPropertyDescriptor<any>) {
  if (descriptor) return descriptor;
  descriptor = Object.getOwnPropertyDescriptor(target, key) || {};
  delete target[key];
  descriptor.set = function(value: any) {
    const self = this;
    if (self instanceof Entity) return self.set(key, value);
    return (self['_' + key] = value);
  };
  descriptor.get = function() {
    const self = this;
    if (self instanceof Entity) return self.get(key);
    return self['_' + key];
  };
  Object.defineProperty(target, key, descriptor);
  return descriptor;
}
