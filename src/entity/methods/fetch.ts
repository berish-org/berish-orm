import type { Entity } from '../entity';
import type { Manager } from '../../manager';
import { Query } from '../../query';
import { setIsFetched } from './setIsFetched';

export async function fetch(entity: Entity, manager: Manager, deep?: number): Promise<void> {
  if (!entity) return void 0;
  const dbEntity = await new Query(entity.className).get(entity.id, manager, deep);
  if (!dbEntity) return void 0;

  Object.entries(dbEntity.attributes).forEach(([key, value]) => entity.set(key, value));
  setIsFetched(entity, true);
}
