import { FileEntity } from '../../entity';
import { Manager } from '../manager';

export async function removeFile(
  manager: Manager,
  files: string | string[] | FileEntity | FileEntity[],
): Promise<void> {
  const arr = Array.isArray(files) ? files : [files];
  if (arr.some((m) => !(m instanceof FileEntity) && typeof m !== 'string'))
    throw new Error('ORM: argument to removeFile is not FileEntity or string');
  const ids = arr.map((m) => (m instanceof FileEntity ? m.id : m));
  await manager.file.delete(ids);
}
