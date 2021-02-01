import { SYMBOL_SYSTEM_ATTRIBUTES } from '../../const';
import { Entity } from '../entity';

export interface ISystemAttributes {
  [key: string]: any;
}

export function getSystemAttributes(entity: Entity): ISystemAttributes {
  if (!entity) return null;
  entity[SYMBOL_SYSTEM_ATTRIBUTES] = entity[SYMBOL_SYSTEM_ATTRIBUTES] || {};
  return entity[SYMBOL_SYSTEM_ATTRIBUTES];
}
