import LINQ from '@berish/linq';

import { IBaseDBItem } from '../../baseDBAdapter';
import { Entity } from '../../entity';
import { serberInstances } from '../../serber';
import { Manager } from '../manager';

export async function saveEntity(manager: Manager, items: Entity[]) {
  await Promise.all(
    LINQ.from(items)
      .groupBy((m) => m.className)
      .map(async (m) => {
        const serialized: IBaseDBItem[] = serberInstances.serberEntityToDB.serialize(m[1]);
        await manager.db.update(m[0], serialized);
      }),
  );
}
