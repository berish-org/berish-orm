import { Entity } from '../';
import { register } from '../../registrator';
import { generateId } from '../../utils';

// export function Register(className: string) {
//   return function(target: typeof Entity) {
//     const withClassName = {};
//     target.className = className;
//     withClassName[target.name] = class extends (target as any) {
//       constructor(...args) {
//         super(...args);
//         this.set('id', generateId());
//       }
//     };
//     registrator.register(withClassName[target.name], className);
//     withClassName[target.name]['className'] = className;
//     return withClassName[target.name];
//   } as any;
// }

export function Register(className: string) {
  return function(target: typeof Entity) {
    target.className = className;
    register(className, target);
    return target;
  } as any;
}
