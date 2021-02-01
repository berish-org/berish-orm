import { EdgeSingle } from '../../edge';
import { Manager } from '../../manager';
import { Entity } from '../entity';

export function getEdgeDstSingle<Src extends Entity = Entity>(
  entity: Entity,
  edgeName: string,
  srcClassName: string | (new () => Src),
): EdgeSingle<Src> {
  const edge = entity.getEdgeDst(edgeName, srcClassName);

  return async (manager: Manager, deep?: number) => {
    const data = await edge.query.find(manager, deep);
    return data && data[0];
  };
}
