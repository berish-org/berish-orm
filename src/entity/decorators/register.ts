import { Entity } from '../';
import { register } from '../../registrator';

export function Register(className: string) {
  return function (target: typeof Entity) {
    target.className = className;
    register(className, target);
    return target;
  } as any;
}
