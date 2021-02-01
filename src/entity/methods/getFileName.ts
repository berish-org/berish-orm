import { FileEntity } from '../fileEntity';

export function getFileName(fileEntity: FileEntity): string {
  return fileEntity && fileEntity.get('name');
}
