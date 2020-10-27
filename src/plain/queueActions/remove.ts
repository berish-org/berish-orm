import LINQ from '@berish/linq';
import { IPlainQueueActionData, IPlainRaw } from '../plain';
import { QueueAction } from '../../utils';
import { Query } from '../../query';
import { generateId } from './save';

async function remove(data: IPlainQueueActionData) {
  const { manager, plain, srcRemoved } = data;
  let deleteItems = LINQ.from<string>([]);
  if (srcRemoved) {
    for (const src of srcRemoved) {
      const rootElements = LINQ.from(
        await new Query(plain.fullPlainName)
          .equalTo('dst', src)
          .equalTo('parent', plain.entityId)
          .find(manager, 0)
      ).select<IPlainRaw>(m => ({
        id: m.id,
        src: m.get('src'),
        dst: m.get('dst'),
        parent: m.get('parent'),
        level: m.get('level'),
      }));

      const childItems = LINQ.from(await new Query(plain.fullPlainName).equalTo('src', src).find(manager, 0)).select<
        IPlainRaw
      >(m => ({ id: m.id, src: m.get('src'), dst: m.get('dst'), parent: m.get('parent'), level: m.get('level') }));

      const absoluteItems = LINQ.from(
        await Promise.all(
          rootElements
            .where(m => m.level > 0)
            .select(root => {
              const query = new Query(plain.fullPlainName).equalTo('src', root.src).equalTo('dst', src);
              return query.find(manager, 0);
            })
        )
      )
        .selectMany(m => m)
        .select<IPlainRaw>(m => ({
          id: m.id,
          src: m.get('src'),
          dst: m.get('dst'),
          parent: m.get('parent'),
          level: m.get('level'),
        }));

      const absoluteItemsWithCount = LINQ.from(absoluteItems.groupBy(m => m.level))
        .where(m => m[1].count() === 1)
        .select(m => m[1][0])
        .selectMany<string>(absolute =>
          childItems.select(child => {
            return generateId(absolute.src, child.dst, child.parent, child.level + absolute.level + 1);
          })
        );

      deleteItems = deleteItems.concat(
        rootElements
          .select(m => m.id)
          .concat(absoluteItemsWithCount)
          .notEmpty()
          .distinct()
      );
    }
    await manager.db.delete(new Query(plain.fullPlainName).ids(deleteItems).json);
  }
}

export const removeAction = new QueueAction('remove', remove);
