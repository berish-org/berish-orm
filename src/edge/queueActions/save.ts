import * as crypto from 'crypto-js';
import { QueueAction } from '../../utils';
import { IEdgeQueueActionData, IEdgeRaw } from '../edge';

async function save(data: IEdgeQueueActionData) {
  const { manager, edge, srcAdded, dstAdded } = data;
  await manager.db.index(edge.fullEdgeName, 'src_dst', ['src', 'dst']);
  if (srcAdded) {
    const items = srcAdded.map<IEdgeRaw>(m => ({
      id: crypto.SHA256(`${edge.entityId}-${m}`).toString(),
      src: edge.entityId,
      dst: m,
    }));
    await manager.db.update(edge.fullEdgeName, items as any);
  }
  if (dstAdded) {
    const items = dstAdded.map<IEdgeRaw>(m => ({
      id: crypto.SHA256(`${m}-${edge.entityId}`).toString(),
      src: m,
      dst: edge.entityId,
    }));
    await manager.db.update(edge.fullEdgeName, items as any);
  }
}

export const saveAction = new QueueAction('save', save);
