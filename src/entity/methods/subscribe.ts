import type { Entity } from '../entity';
import type { Manager } from '../../manager';
import { Query } from '../../query';

export function subscribe(
  entity: Entity,
  manager: Manager,
  callback: (oldValue: Entity, newValue: Entity) => any,
  deep?: number,
) {
  if (!entity) return null;

  return new Query(entity.className).ids([entity.id]).subscribe(manager, callback, deep);
}
