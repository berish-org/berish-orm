import { serberFullRaw } from '../../serber';
import { Entity } from '../entity';
import { FileEntity } from '../fileEntity';

export function fromJSON<TEntity extends Entity | FileEntity = Entity>(json: { [key: string]: any }): TEntity {
  return serberFullRaw.deserialize(json);
}
