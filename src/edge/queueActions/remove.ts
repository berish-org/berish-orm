import * as crypto from 'crypto-js';
import { QueueAction } from '../../utils';
import { IEdgeQueueActionData } from '../edge';
import { Query } from '../../query';

async function remove(data: IEdgeQueueActionData) {
  const { manager, edge, srcRemoved, dstRemoved } = data;
  if (srcRemoved) {
    // const query = new Query(edge.fullEdgeName).contains('dst', srcRemoved);
    // await query.remove(db);
    const items = srcRemoved.map((m) => crypto.SHA256(`${edge.entityId}-${m}`).toString());
    await manager.db.delete(new Query(edge.fullEdgeName).ids(items).json);
  }
  if (dstRemoved) {
    // const query = new Query(edge.fullEdgeName).contains('src', dstRemoved);
    // await query.remove(db);
    const items = dstRemoved.map((m) => crypto.SHA256(`${m}-${edge.entityId}`).toString());
    await manager.db.delete(new Query(edge.fullEdgeName).ids(items).json);
  }
}

export const removeAction = new QueueAction('remove', remove);
