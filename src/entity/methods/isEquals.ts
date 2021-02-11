import type { Entity } from '../entity';
import type { FileEntity } from '../fileEntity';

export function isEquals(entity1: Entity | FileEntity, entity2: Entity | FileEntity) {
  return (entity1 && entity1.id) === (entity2 && entity2.id);
}
