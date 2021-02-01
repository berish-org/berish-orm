import { Entity } from '../entity';

export function getIsFetched(entity: Entity) {
  if (!entity) return false;
  return !!entity.getSystem('isFetched');
}
