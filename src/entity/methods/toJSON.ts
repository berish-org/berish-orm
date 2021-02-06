import { serberInstances } from '../../serber';

import { Entity } from '../entity';
import { FileEntity } from '../fileEntity';

export function toJSON(entity: Entity | FileEntity) {
  return serberInstances.serberFullRaw.serialize(entity);
}
