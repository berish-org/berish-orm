import { Entity } from '../entity';
import { FileEntity } from '../fileEntity';

export function getCreatedAt(entity: Entity | FileEntity): Date {
  return entity && entity.get('createdAt');
}
