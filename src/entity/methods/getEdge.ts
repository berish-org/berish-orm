import { Edge } from '../../edge';
import type { Entity } from '../entity';

export function getEdge<Dst extends Entity = Entity>(
  entity: Entity,
  edgeName: string,
  dstClassName: string | (new () => Dst),
) {
  const systemName = `edge_src_${edgeName}`;

  if (!entity.getSystem(systemName))
    entity.setSystem(
      systemName,
      Edge.create(entity.className, edgeName, dstClassName, () => entity.id),
    );
  return entity.getSystem(systemName) as Edge<Dst>;
}
