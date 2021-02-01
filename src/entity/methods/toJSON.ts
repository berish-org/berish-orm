import { serberFullRaw } from '../../serber';

import { Entity } from '../entity';
import { FileEntity } from '../fileEntity';

export function toJSON(entity: Entity | FileEntity) {
  return serberFullRaw.serialize(entity);
}
