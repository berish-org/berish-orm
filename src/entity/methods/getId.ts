import { Entity } from '../entity';
import { FileEntity } from '../fileEntity';

export function getId(entity: Entity | FileEntity): string {
  return entity && entity.get('id');
}
