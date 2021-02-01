import { FileEntity } from '../fileEntity';

export function setFileName(fileEntity: FileEntity, name: string) {
  if (fileEntity) fileEntity.set('name', name);
}
