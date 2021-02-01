import { Query } from '../../query';
import { Entity } from '../entity';

export function toQuery(entity: Entity) {
  return entity && new Query(entity.className).ids([entity.id]);
}
