import { serberInstances } from '../../serber';
import type { Entity } from '../entity';
import type { FileEntity } from '../fileEntity';

export function fromJSON<TEntity extends Entity | FileEntity = Entity>(json: { [key: string]: any }): TEntity {
  return serberInstances.serberFullRaw.deserialize(json);
}
