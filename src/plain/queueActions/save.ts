import * as crypto from 'crypto-js';
import { QueueAction } from '../../utils';
import { IPlainQueueActionData, IPlainRaw } from '../plain';
import { Query } from '../../query';
import LINQ from '@berish/linq';

interface IPlainLevelSchema {
  id: string;
  level: number;
  parent?: string;
}

export function generateId(src: string, dst: string, parent: string, level: number) {
  const hash = LINQ.from([src, dst, parent, level])
    .notNull()
    .select(m => String(m))
    .join('-');
  return crypto.SHA256(hash).toString();
}

export function generateElement(src: string, dst: string, parent: string, level: number) {
  level = level || 0;
  return {
    id: generateId(src, dst, parent, level),
    src,
    dst,
    level,
    parent,
  } as IPlainRaw;
}

async function save(data: IPlainQueueActionData) {
  const { manager, plain, srcAdded, dstAdded } = data;
  if (srcAdded) {
    // entityId - C
    // любой элемент в srcAdded - E
    const query = new Query(plain.fullPlainName).equalTo('dst', plain.entityId);
    const dbItems = LINQ.from(await query.find(manager, 0));
    const rootIds = dbItems
      .select<IPlainLevelSchema>(m => ({ id: m.get('src'), level: m.get('level') || 0 }))
      .notEmpty();

    if (rootIds.some(m => srcAdded.contains(m.id))) throw new Error('FP-ORM: Recursive elements forbidden.');
    const childsIds = LINQ.from(
      await Promise.all(
        srcAdded.map(async m => {
          const query = new Query(plain.fullPlainName).equalTo('src', m);
          return query.find(manager, 0);
        })
      )
    )
      .selectMany(m => m)
      .select<IPlainLevelSchema>(m => ({ id: m.get('dst'), level: m.get('level') || 0, parent: m.get('parent') }));

    // if (childsIds.some(m => srcAdded.contains(m.id))) throw new Error('FP-ORM: Recursive elements forbidden.');

    // Прямая связь текущего с детьми
    const nearlyItems = srcAdded.map<IPlainRaw>(e => generateElement(plain.entityId, e, plain.entityId, 0));

    // Связь рут элементов от текущего с детьми
    const rootElements = rootIds.selectMany<IPlainRaw>(root =>
      srcAdded.map<IPlainRaw>(e => generateElement(root.id, e, plain.entityId, root.level + 1))
    );

    // Связь текущего элемента с детьми-элементами детей от текущего
    const childsElements = childsIds.map<IPlainRaw>(child =>
      generateElement(plain.entityId, child.id, child.parent, child.level + 1)
    );

    // Связь рут элементов от текущего с детьми-элементами детей от текущего
    const absoluteItems = rootIds.selectMany<IPlainRaw>(root =>
      childsIds.select(child => generateElement(root.id, child.id, child.parent, root.level + child.level + 2))
    );

    const allItems = nearlyItems.concat(rootElements, childsElements, absoluteItems);
    await manager.db.update(plain.fullPlainName, allItems);
  }
}

export const saveAction = new QueueAction('save', save);
