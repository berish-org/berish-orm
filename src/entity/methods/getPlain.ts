import { Plain } from '../../plain';
import { Entity } from '../entity';

export function getPlain<Src extends Entity = Entity>(entity: Src, plainName: string) {
  const systemName = `plain_src_${plainName}`;
  if (!entity.getSystem(systemName))
    entity.setSystem(
      systemName,
      Plain.create(entity.className, plainName, () => entity.id),
    );
  return entity.getSystem(systemName) as Plain<Src>;
}
