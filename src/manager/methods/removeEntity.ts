import LINQ from '@berish/linq';
import { Entity } from '../../entity';
import { Query } from '../../query';
import { Manager } from '../manager';

export async function removeEntity(manager: Manager, items: Entity[]) {
  await Promise.all(
    LINQ.from(items)
      .groupBy((m) => m.className)
      .map((m) => manager.db.delete(new Query(m[0]).ids(m[1].map((k) => k.id)).json)),
  );
}
