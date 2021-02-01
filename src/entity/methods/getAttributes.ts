import { SYMBOL_ATTRIBUTES } from '../../const';
import type { Entity } from '../entity';
import type { FileEntity } from '../fileEntity';

export interface IAttributes {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

export function getAttributes(entity: Entity | FileEntity): IAttributes {
  if (!entity) return null;
  entity[SYMBOL_ATTRIBUTES] = entity[SYMBOL_ATTRIBUTES] || {};
  return entity[SYMBOL_ATTRIBUTES];
}
