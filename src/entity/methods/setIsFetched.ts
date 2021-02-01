import { Entity } from '../entity';

export function setIsFetched(entity: Entity, isFetched: boolean) {
  if (entity) entity.setSystem('isFetched', !!isFetched);
}
