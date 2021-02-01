import { EdgeSingle } from '../../edge';
import { Manager } from '../../manager';
import { Entity } from '../entity';

export function getEdgeSingle<Dst extends Entity = Entity>(
  entity: Entity,
  edgeName: string,
  dstClassName: string | (new () => Dst),
): EdgeSingle<Dst> {
  const edge = entity.getEdge(edgeName, dstClassName);

  return async (manager: Manager, deep?: number) => {
    const data = await edge.query.find(manager, deep);
    return data && data[0];
  };
}
