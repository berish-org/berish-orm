import { Entity } from '../entity';

export function getUpdatedAt(entity: Entity): Date {
  return entity && entity.get('updatedAt');
}
