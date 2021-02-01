import { Entity } from '../entity';
import { Edge } from '../../edge';

export function getEdgeDst<Src extends Entity = Entity>(
  entity: Entity,
  edgeName: string,
  srcClassName: string | (new () => Src),
) {
  const systemName = `edge_dst_${edgeName}`;

  if (!entity.getSystem(systemName))
    entity.setSystem(
      systemName,
      Edge.createFromDst(srcClassName, edgeName, entity.className, () => entity.id),
    );
  return entity.getSystem(systemName) as Edge<Src>;
}
