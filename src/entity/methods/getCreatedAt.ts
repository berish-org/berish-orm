import type { Entity } from '../entity';
import type { FileEntity } from '../fileEntity';

export function getCreatedAt(entity: Entity | FileEntity): Date {
  return entity && entity.get('createdAt');
}
