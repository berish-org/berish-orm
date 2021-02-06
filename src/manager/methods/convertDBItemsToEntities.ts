import LINQ from '@berish/linq';
import { Query } from '../..';
import { IBaseDBItem } from '../../baseDBAdapter';
import { Entity, FileEntity } from '../../entity';
import { serberInstances, plugins } from '../../serber';
import { Manager } from '../manager';

const {
  SYMBOL_SERBER_CACHE_ENTITIES,
  SYMBOL_SERBER_CACHE_ENTITIES_IGNORE_IDS,
  SYMBOL_SERBER_CACHE_FILE_ENTITIES,
  SYMBOL_SERBER_ENTITY_CLASSNAME,
  SYMBOL_SERBER_FOR_LOAD_ENTITIES,
  SYMBOL_SERBER_FOR_LOAD_FILE_ENTITIES,
} = plugins;

export async function convertDBItemsToEntities<T extends Entity = Entity>(
  manager: Manager,
  className: string,
  items: IBaseDBItem[],
  deep?: number,
  cacheIgnoreIds?: string[],
) {
  const cacheEntities: Entity[] = [];
  const cacheFiles: FileEntity[] = [];
  let initialEntities: T[] = null;

  const fetch = async (className: string, items: IBaseDBItem[], deep: number) => {
    const forLoadEntities: Entity[] = [];
    const forLoadFiles: FileEntity[] = [];

    const deserialized: Entity[] = serberInstances.serberEntityToDB.deserialize(items, {
      [SYMBOL_SERBER_ENTITY_CLASSNAME]: className,
      [SYMBOL_SERBER_CACHE_ENTITIES]: cacheEntities,
      [SYMBOL_SERBER_CACHE_ENTITIES_IGNORE_IDS]: cacheIgnoreIds,
      [SYMBOL_SERBER_FOR_LOAD_ENTITIES]: forLoadEntities,
      [SYMBOL_SERBER_CACHE_FILE_ENTITIES]: cacheFiles,
      [SYMBOL_SERBER_FOR_LOAD_FILE_ENTITIES]: forLoadFiles,
    });

    if (!initialEntities) initialEntities = deserialized as T[];

    if (deep > 0) {
      const groupBy = LINQ.from(forLoadEntities).groupBy((m) => m.className);

      await Promise.all(
        groupBy.map(async (m) => {
          const className = m[0];
          const entities = m[1];
          const queryData = new Query(className).ids(entities.map((m) => m.id)).json;
          const items = await manager.db.find(queryData);
          await fetch(className, items, deep - 1);
        }),
      );

      await Promise.all(forLoadFiles.map((m) => manager.getFile(m)));
    }
  };

  await fetch(className, items, typeof deep === 'number' ? deep : 1);
  return initialEntities;
}
